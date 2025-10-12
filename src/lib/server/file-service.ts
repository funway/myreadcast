import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fsp } from 'fs';
import fs from 'fs';
import { lookup } from 'mime-types';
import etag from 'etag';
import zlib from 'zlib';
import { ApiResponse } from "./api-response";
import { logger } from "./logger";
import { Readable } from "stream";
import { promisify } from "util";

const FORBIDDEN_PATHS = [
  '/etc/',
  '/bin/',
  '/sbin/',
  '/usr/bin/',
  '/usr/sbin/',
  '/sbin/',
  '/proc/',
  '/sys/',
  '/dev/',
];

const ALLOWED_EXTENSIONS = [
  '.opf', '.ncx', '.smil',
  '.mp3', '.m4a', '.wav', '.aac', '.flac',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
  '.ttf', '.otf', '.woff', '.woff2',
  '.xml', '.xhtml', '.html', '.htm',
  '.json', '.js', '.css', 
  '.txt', '.pdf', '.md', '.mobi', '.azw', '.azw3', '.epub', '.epub3', '.cbz', '.cbr',
  '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.br',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
];

// 需要压缩的文件类型（文本类型）
const COMPRESSIBLE_TYPES = [
  '.opf', '.ncx', '.smil',
  '.xml', '.xhtml', '.html', '.htm',
  '.json', '.js', '.css', 
  '.txt',
];

// 文本类型超过 2MB 时才压缩
const COMPRESSION_THRESHOLD = 2 * 1024 * 1024;  // 2MB

/**
 * 验证文件路径安全性
 */
function validateFilePath(filePath: string): { valid: boolean; error?: string } {
  // 1. 检查是否为绝对路径
  if (!path.isAbsolute(filePath)) {
    return {
      valid: false,
      error: 'Only absolute paths are allowed',
    };
  }

  // 2. 规范化路径并解析
  const resolvedPath = path.resolve(path.normalize(filePath));

  // 3. 检查是否访问敏感目录
  for (const forbiddenPath of FORBIDDEN_PATHS) {
    if (resolvedPath.startsWith(forbiddenPath)) {
      return {
        valid: false,
        error: `Access to [${forbiddenPath}] is forbidden`,
      };
    }
  }

  // 4. 检查文件扩展名
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type [${ext}] is not allowed`,
    };
  }

  // 5. 额外检查：确保规范化后路径中不包含 '..'（双重保险）
  if (resolvedPath.includes('..')) {
    return {
      valid: false,
      error: 'Invalid path components detected',
    };
  }

  return { valid: true };
}

/**
 * 判断是否需要压缩
 * @param filePath 文件路径
 * @param fileSize 文件大小
 * @param acceptEncoding 请求头中的 Accept-Encoding 值
 * @returns 
 */
function shouldCompress(
  filePath: string,
  fileSize: number,
  acceptEncoding: string | null
): boolean {
  // 客户端不支持 gzip
  if (!acceptEncoding || !acceptEncoding.includes('gzip')) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();

  // 文本类型 且 文件大小超过阈值才压缩
  if (COMPRESSIBLE_TYPES.includes(ext) && fileSize > COMPRESSION_THRESHOLD) {
    return true;
  }

  return false;
}

// gzip 的异步版本
const gzipAsync = promisify(zlib.gzip);

// 压缩任务锁：防止同一文件被多个请求同时压缩
const compressionLocks = new Map<string, Promise<string>>();

/**
 *  获取压缩文件路径 (缓存压缩文件)
 */
async function getCompressedFile(filePath: string): Promise<string> { 
  // 如果已经有正在进行的压缩任务，直接返回该 Promise
  if (compressionLocks.has(filePath)) {
    logger.debug(`[Compression] Waiting for existing compression task: ${filePath}`);
    return compressionLocks.get(filePath)!;
  }

  // 创建压缩任务并立即执行
  const task = (async (): Promise<string> => { 
    try {
      const ext = '.gz';
      const compressedPath = filePath + ext;

      let needCompress = false;
      try {
        const [srcStats, compStats] = await Promise.all([
          fsp.stat(filePath),
          fsp.stat(compressedPath)
        ]);
        if (srcStats.mtime > compStats.mtime) {
          needCompress = true;
        }
      } catch (error) {
        needCompress = true;
      }

      if (needCompress) { 
        logger.info(`[Compression] Start compressing: ${filePath}`);
        const content = await fsp.readFile(filePath);
        const compressed = await gzipAsync(content, { level: 6 });
        await fsp.writeFile(compressedPath, compressed);
        logger.info(`[Compression] Completed: ${compressedPath} `);
      } else {
        logger.debug(`[Compression] Using cached compressed file: ${compressedPath}`);
      }
      return compressedPath;
    } finally {
      // 无论成功失败，都要清理锁
      compressionLocks.delete(filePath);
    }
  })();

  // 将任务存入 Map，其他请求可以复用
  compressionLocks.set(filePath, task);
  return task;
}

interface FileServiceOptions {
  enableRange?: boolean;        // 是否启用 Range 请求支持，默认启用
  enableCompression?: boolean;  // 是否启用压缩，默认启用
  cacheControl?: string;        // Cache-Control 头，默认 'public, max-age=31536000, immutable'
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export async function serveFile(filePath: string, request: NextRequest, options: FileServiceOptions = {}) {
  const {
    enableRange = true,
    enableCompression = true,
    cacheControl = DEFAULT_CACHE_CONTROL
  } = options;
  logger.debug(`[FileService] serveFile: ${filePath}`, { options });

  // 1. 验证路径安全性
  const validation = validateFilePath(filePath);
  if (!validation.valid) {
    logger.warn(`[FileService] Invalid file path: [${filePath}]. Reason: ${validation.error}`);
    return ApiResponse.fail('Access denied', 403);
  }

  // 2. 检查文件是否存在
  let stats;
  try {
    stats = fs.statSync(filePath);
  } catch (error) { 
    logger.warn(`[FileService] File not found: ${filePath}`);
    return ApiResponse.fail('File not found', 404);
  }

  // 3. 确保是文件而不是目录
  if (!stats.isFile()) {
    logger.warn(`[FileService] Not a file: ${filePath}`);
    return ApiResponse.fail('Not a file', 400);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = lookup(ext) || 'application/octet-stream';
  const fileEtag = etag(stats, { weak: false });
  const mtime = stats.mtime.toUTCString();

  // 4. 304 Not Modified 支持
  if (request.headers.get('If-None-Match') === fileEtag || request.headers.get('If-Modified-Since') === mtime) { 
    return new NextResponse(null, { status: 304 });
  }

  // 5. Range 请求支持
  const isMediaFile = ['.mp3', '.m4a', '.wav', '.aac', '.flac', '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext);
  const rangeHeader = request.headers.get('Range');
  if (enableRange && isMediaFile && rangeHeader) { 
    const fileSize = stats.size;
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
    let start = startStr ? parseInt(startStr, 10) : 0;
    start = Math.max(0, start);
    let end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    end = Math.min(end, fileSize - 1);
    
    // 边界检查
    if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
      return new NextResponse('Requested Range Not Satisfiable', {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`,
        },
      });
    }

    const chunkSize = (end - start) + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    return new NextResponse(Readable.toWeb(fileStream) as ReadableStream<Uint8Array>, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize.toString(),
        'Content-Type': mimeType,
        'ETag': fileEtag,
        'Last-Modified': mtime,
        'Cache-Control': cacheControl,
      },
    });
  }

  // 6. 压缩支持
  const acceptEncoding = request.headers.get('Accept-Encoding');
  let compressedPath: string | null = null;
  if (shouldCompress(filePath, stats.size, acceptEncoding) && enableCompression) { 
    compressedPath = await getCompressedFile(filePath);
  }

  // 7. 返回文件响应
  const finalPath = compressedPath || filePath;
  const finalStats = await fsp.stat(finalPath);
  const finalStream = fs.createReadStream(finalPath);
  
  /**
   * TODO
   * 这里如果用户在文件传输到一半的时候关闭页面, 后端会报一个异常 
   *    TypeError: Invalid state: Controller is already closed
   *    code: 'ERR_INVALID_STATE'
   */
  return new NextResponse(Readable.toWeb(finalStream) as ReadableStream<Uint8Array>, {
    status: 200,
    headers: {
      'Content-Length': finalStats.size.toString(),
      'Content-Type': mimeType,
      ...(compressedPath ? { 'Content-Encoding': 'gzip' } : {}),
      'ETag': fileEtag,
      'Last-Modified': mtime,
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Encoding',
    },
  });
}