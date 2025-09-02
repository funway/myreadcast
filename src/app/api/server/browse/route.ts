import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '@/lib/server/logger';

interface FSItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

/**
 * 
 * @param request 
 * @returns 
 */
/**
 * Handles GET requests to browse the server's file system.
 *
 * This API endpoint allows clients to list the contents of a specified directory,
 * with options to filter by files, folders, and hidden items.
 *
 * @param request - The incoming Next.js request object.
 *   - Query parameters:
 *     - `path`: (string) The directory path to browse. Defaults to root (`/`) if not provided.
 *     - `all`: (string) Whether to include hidden files/folders (those starting with '.'). Accepts 'true' or 'false'. Defaults to 'false'.
 *     - `type`: (string) Filter returned items by type: 'folders', 'files', or 'both'. Defaults to 'both'.
 *
 * @returns A JSON response containing:
 *   - `success`: (boolean) Indicates if the operation was successful.
 *   - `path`: (string) The normalized absolute path of the browsed directory.
 *   - `items`: (FolderItem[]) List of items in the directory, each with:
 *       - `name`: (string) The item's name.
 *       - `path`: (string) The item's absolute path.
 *       - `isDirectory`: (boolean) Whether the item is a directory.
 *   - `error`: (string, optional) Error message if the operation failed.
 *
 * @remarks
 * - Returns status 400 if the path is not a directory.
 * - Returns status 404 if the path does not exist or is inaccessible.
 * - Returns status 500 for internal server errors.
 * - Ignores items that cannot be accessed due to permissions or broken symlinks.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedPath = searchParams.get('path') || '/';
    const showHidden = searchParams.get('all')?.toLowerCase() === 'true';
    const type = searchParams.get('type') || 'both';

    // 规范化路径 - 直接使用系统根目录
    const normalizedPath = path.resolve(requestedPath);

    // 检查路径是否存在
    try {
      const stats = await fs.stat(normalizedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({
          success: false,
          error: '指定路径不是一个目录'
        }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: '路径不存在或无法访问'
      }, { status: 404 });
    }

    // 读取目录内容
    const items = await fs.readdir(normalizedPath, { withFileTypes: true });
    
    // 格式化结果
    const fsItems: FSItem[] = [];
    
    for (const item of items) {
      // 根据 showHidden 参数决定是否跳过隐藏文件/目录
      if (!showHidden && item.name.startsWith('.')) {
        continue;
      }
      
      try {
        const itemPath = path.join(normalizedPath, item.name);
        const stats = await fs.stat(itemPath);
        const isDirectory = stats.isDirectory();
        
        // 根据 type 参数过滤返回类型
        if (type === 'folders' && !isDirectory) {
          continue;
        }
        if (type === 'files' && isDirectory) {
          continue;
        }
        
        fsItems.push({
          name: item.name,
          path: itemPath, // 返回完整的绝对路径
          isDirectory
        });
      } catch (error) {
        // 忽略无法访问的文件/目录（可能是权限问题、符号链接损坏等）
        logger.warn(`无法访问 ${item.name}:, ${error instanceof Error ? error.message : error}`);
        continue;
      }
    }

    // 按类型和名称排序（文件夹优先）
    fsItems.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    return NextResponse.json({
      success: true,
      path: normalizedPath,
      items: fsItems
    });

  } catch (error) {
    logger.error('Browse API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'POST 方法暂未实现'
  }, { status: 405 });
}