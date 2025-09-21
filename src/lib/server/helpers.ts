import { createId } from '@paralleldrive/cuid2';
import { randomBytes } from 'crypto';
import * as mm from 'music-metadata';
import { AudioFileInfo } from '../shared/types';

/**
 * 生成数据的唯一 ID  
 * 我们使用 CUID
 * @returns 
 */
export function generateId(): string { 
  return createId();
}

/**
 * 生成随机 token，用于 Refresh Token 或 API Key
 *
 * - 生成 32 字节（256 位）随机值
 * - 返回 16 进制字符串，长度 64 个字符
 * - 使用 Node.js 内置 crypto 模块，安全不可预测
 *
 * @returns {string} 64 字符的随机 hex 字符串
 */
export function generateRandomToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getAudioFileInfo(filePath: string): Promise<AudioFileInfo> {
  const metadata = await mm.parseFile(filePath, { duration: true });
  const common = metadata.common;
  const format = metadata.format;

  // 转换封面图为 base64
  let coverImageBase64: string | undefined;
  if (common.picture && common.picture.length > 0) {
    const pic = common.picture[0];
    coverImageBase64 =  Buffer.from(pic.data).toString("base64");
  }
  
  const info: AudioFileInfo = {
    filePath,
    duration: format.duration || 0,
    bitrate: format.bitrate,
    sampleRate: format.sampleRate,
    codec: format.codec,
    meta: {
      title: common.title,
      artist: common.artist,
      album: common.album,
      albumArtist: common.albumartist,
      year: common.year,
      coverImageBase64
    }
  };

  return info;
}

/**
 * Parse time in SMIL par to seconds in float
 * @param {string} timeStr - Time string (e.g., "01:02:03.456", "12.5s", "200ms"). 
 * @returns {number} Time in seconds (fractional part represents milliseconds)
 * 
 * The following are examples of allowed clock values:   
  5:34:31.396 = 5 hours, 34 minutes, 31 seconds, and 396 milliseconds

  124:59:36 = 124 hours, 59 minutes, and 36 seconds

  0:05:01.2 = 5 minutes, 1 second, and 200 milliseconds

  0:00:04 = 4 seconds

  09:58 = 9 minutes and 58 seconds

  00:56.78 = 56 seconds and 780 milliseconds

  76.2s = 76.2 seconds = 76 seconds and 200 milliseconds

  7.75h = 7.75 hours = 7 hours and 45 minutes

  13min = 13 minutes

  2345ms = 2345 milliseconds

  12.345 = 12 seconds and 345 milliseconds
 */
export function smilTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;

  if (timeStr.endsWith('ms')) {
    return parseFloat(timeStr.replace(/ms$/, '')) / 1000;
  }

  if (timeStr.endsWith('min')) {
    return parseFloat(timeStr.replace(/min$/, '')) * 60;
  }

  if (timeStr.endsWith('h')) {
    return parseFloat(timeStr.replace(/h$/, '')) * 3600;
  }
  
  // 移除可能的单位后缀
  const time = timeStr.replace(/s$/, '');
  
  // 如果包含冒号，说明是 mm:ss.fff 或 hh:mm:ss.fff 格式
  if (time.includes(':')) {
    const parts = time.split(':');
    let seconds = 0;
    
    if (parts.length === 2) {
      // mm:ss.fff 格式
      const minutes = parseInt(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      seconds = minutes * 60 + secs;
    } else if (parts.length === 3) {
      // hh:mm:ss.fff 格式
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const secs = parseFloat(parts[2]) || 0;
      seconds = hours * 3600 + minutes * 60 + secs;
    }
    
    return seconds;
  }
  
  // 直接是秒数格式
  return parseFloat(time) || 0;
}