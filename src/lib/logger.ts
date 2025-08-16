import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { LOG_DIR, LOG_MAX_FILES, LOG_MAX_FILE_SIZE } from './constants';

// 定义日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 映射日志级别的优先级
const LogLevelPriority = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
}

// 日志条目的接口
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
  userId?: number;
  ip?: string;
}

// 队列项的接口
interface QueueItem {
  filePath: string;
  content: string;
  retries: number; // 添加重试次数
}

// Logger 类的配置接口
interface LoggerConfig {
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  batchSize?: number;
  maxRetries?: number;
  minLevel?: LogLevel;
}

class Logger {
  private logDir: string;
  private maxFileSize: number;
  private maxFiles: number;
  private writeQueue: QueueItem[] = [];
  private isProcessingQueue = false;
  private batchSize: number;
  private maxRetries: number;
  private minLevel: LogLevel;

  constructor(config: LoggerConfig = {}) {
    // 使用默认值或传入的配置
    this.logDir = config.logDir ?? './logs';
    this.maxFileSize = config.maxFileSize ?? 10 * 1024 * 1024; // 10MB
    this.maxFiles = config.maxFiles ?? 5;
    this.batchSize = config.batchSize ?? 20;
    this.maxRetries = config.maxRetries ?? 3;
    this.minLevel = config.minLevel ?? LogLevel.INFO;
    
    this.ensureLogDirectory();
  }

  // 确保日志目录存在
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 格式化日志条目
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, metadata, userId, ip } = entry;
    let logLine = `[${timestamp}] ${level}: ${message}`;
    
    if (userId) logLine += ` | UserId: ${userId}`;
    if (ip) logLine += ` | IP: ${ip}`;
    if (metadata) logLine += ` | Data: ${JSON.stringify(metadata)}`;
    
    return logLine + '\n';
  }

  // 获取日志文件名
  private getLogFileName(type: 'app' | 'error' | 'access' = 'app'): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  // 将日志添加到队列
  private writeLog(entry: LogEntry, logType: 'app' | 'error' | 'access' = 'app') {
    const filePath = this.getLogFileName(logType);
    const logLine = this.formatLogEntry(entry);
    
    this.writeQueue.push({ filePath, content: logLine, retries: 0 });
    
    this.processWriteQueue();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(logLine.trim());
    }
  }

  // 异步处理日志写入队列
  private async processWriteQueue() {
    if (this.isProcessingQueue || this.writeQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    // 使用临时数组来存储当前批次，而不是直接 splice 队列
    const currentBatch: QueueItem[] = [];
    const numToProcess = Math.min(this.writeQueue.length, this.batchSize);
    for (let i = 0; i < numToProcess; i++) {
        currentBatch.push(this.writeQueue.shift() as QueueItem);
    }
    
    try {
      // 按文件路径分组
      const fileGroups: { [filePath: string]: QueueItem[] } = {};
      
      for (const item of currentBatch) {
        if (!fileGroups[item.filePath]) {
          fileGroups[item.filePath] = [];
        }
        fileGroups[item.filePath].push(item);
      }

      await Promise.all(
        Object.entries(fileGroups).map(async ([filePath, items]) => {
          try {
            await this.rotateLogFileAsync(filePath);
            
            const combinedContent = items.map(item => item.content).join('');
            await fsPromises.appendFile(filePath, combinedContent, 'utf8');
          } catch (error) {
            console.error(`Failed to write to ${filePath}:`, error);
            // 将失败的日志项重新推回队列头部，并增加重试计数
            items.forEach(item => {
              if (item.retries < this.maxRetries) {
                item.retries++;
                this.writeQueue.unshift(item); // 推回队列
              } else {
                console.error(`Max retries for log entry exceeded. Dropping log: ${item.content}`);
              }
            });
          }
        })
      );
    } catch (error) {
      console.error('Batch log processing failed:', error);
    } finally {
      this.isProcessingQueue = false;
      
      if (this.writeQueue.length > 0) {
        setImmediate(() => this.processWriteQueue());
      }
    }
  }

  // 异步日志文件轮转
  private async rotateLogFileAsync(filePath: string) {
    try {
      const stats = await fsPromises.stat(filePath).catch(() => null);
      if (!stats || stats.size < this.maxFileSize) return;

      // 删除最旧的文件
      try {
        await fsPromises.unlink(`${filePath}.${this.maxFiles}`);
      } catch (e) {
        // 如果文件不存在，忽略错误
      }

      // 从后往前重命名文件
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        try {
          await fsPromises.rename(`${filePath}.${i}`, `${filePath}.${i + 1}`);
        } catch (e) {
          // 如果文件不存在，忽略错误
        }
      }
      
      // 当前文件重命名为 .1
      await fsPromises.rename(filePath, `${filePath}.1`);
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }
  
  // 公共日志方法
  public debug(message: string, metadata?: any, userId?: number, ip?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      metadata,
      userId,
      ip
    });
  }

  public info(message: string, metadata?: any, userId?: number, ip?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      metadata,
      userId,
      ip
    });
  }

  public warn(message: string, metadata?: any, userId?: number, ip?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      metadata,
      userId,
      ip
    });
  }

  public error(message: string, error?: Error, metadata?: any, userId?: number, ip?: string) {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...metadata
    } : metadata;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      metadata: errorData,
      userId,
      ip
    }, 'error');
  }

  // 访问日志
  public access(method: string, url: string, statusCode: number, responseTime: number, userId?: number, ip?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `${method} ${url} ${statusCode} ${responseTime}ms`,
      userId,
      ip
    }, 'access');
  }

  // 优雅关闭 - 确保所有日志都写入完成
  public async flush(): Promise<void> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        if (this.writeQueue.length === 0 && !this.isProcessingQueue) {
          resolve();
        } else {
          setTimeout(checkQueue, 10);
        }
      };
      checkQueue();
    });
  }
}

// 导出单例，使用默认配置
export const logger = new Logger({
  logDir: LOG_DIR,
  maxFileSize: LOG_MAX_FILE_SIZE,
  maxFiles: LOG_MAX_FILES,
  minLevel: (process.env.LOG_LEVEL as LogLevel) ?? LogLevel.INFO,
});
