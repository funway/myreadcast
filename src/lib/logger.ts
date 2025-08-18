import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { LOG_DIR, LOG_MAX_FILES, LOG_MAX_FILE_SIZE, LOG_LEVEL } from './constants';

// 定义日志级别
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 映射日志级别的优先级
const LogLevelPriority = {
  [LogLevel.DEBUG]: 20,
  [LogLevel.INFO]: 30,
  [LogLevel.WARN]: 40,
  [LogLevel.ERROR]: 50,
}

// 日志条目的接口
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  extraData?: object | null;
}

// 队列项的接口
interface QueueItem {
  filePath: string;
  content: string;
  retries: number;
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
    
    console.log('Logger initialized with config:', {
      logDir: this.logDir,
      maxFileSize: this.maxFileSize,
      maxFiles: this.maxFiles,
      batchSize: this.batchSize,
      maxRetries: this.maxRetries,
      minLevel: this.minLevel,
    });
  }

  // 确保日志目录存在
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 格式化日志条目
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, extraData } = entry;
    let logLine = `[${timestamp}] ${level}: ${message}`;
    
    if (extraData) {
      logLine += ` | ExtraData: ${JSON.stringify(extraData)}`;
    }
    
    return logLine + '\n';
  }

  // 获取日志文件名
  private getLogFileName(type: 'app' | 'error' | 'access' = 'app'): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  // 将日志添加到队列
  private writeLog(entry: LogEntry, logType: 'app' | 'error' | 'access' = 'app') {
    if (LogLevelPriority[entry.level] < LogLevelPriority[this.minLevel]) {
      return;  // 日志等级低于最小等级，直接忽略
    }
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
      } catch {
        // 如果文件不存在，忽略错误
      }

      // 从后往前重命名文件
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        try {
          await fsPromises.rename(`${filePath}.${i}`, `${filePath}.${i + 1}`);
        } catch {
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
  public debug(message: string, extraData?: object | null) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      extraData
    });
  }

  public info(message: string, extraData?: object | null) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      extraData
    });
  }

  public warn(message: string, extraData?: object | null) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      extraData
    });
  }

  // 修正 error 方法，优化 Error 对象处理和数据合并逻辑
  public error(message: string, error?: unknown, extraData?: object | null) {
    let finalExtraData = extraData;

    // 如果有 Error 对象，将其信息合并到 extraData 中
    if (error) {
      let errorData: object | null;
      if (error instanceof Error) {
        // Error 类型, 展开详细信息
        errorData = {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        };
      } else { 
        // 非 Error 类型 (JavaScript 中 throw 出来的异常，可以是任意数据类型。。。)
        try { 
          errorData = { error: JSON.stringify(error) };
        } catch {
          errorData = { error: String(error) };
        }
      }
      
      // 将 error 信息和 extraData 合并
      finalExtraData = extraData ? { ...extraData, ...errorData } : errorData;
    }

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      extraData: finalExtraData
    }, 'error');
  }

  // 访问日志 - 添加 extraData 参数
  public access(
    method: string, 
    url: string, 
    statusCode: number, 
    responseTime: number, 
    extraData?: object | null
  ) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `${method} ${url} ${statusCode} ${responseTime}ms`,
      extraData
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
  minLevel: (LOG_LEVEL as LogLevel) ?? LogLevel.INFO,
});