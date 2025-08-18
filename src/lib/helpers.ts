import { randomBytes } from 'crypto';

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