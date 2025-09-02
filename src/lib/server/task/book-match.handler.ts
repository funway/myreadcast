import { TaskService } from "../db/task";
import { logger } from "../logger";
import { TaskHandler } from "./handler";

export class BookMatchHandler extends TaskHandler { 
  public async run(): Promise<void> {
    const bookId = this.task.targetId;
    logger.debug(`Running book match task fro bookId: ${bookId}`);
    
    // 1. 更新 task 为 running
    this.updateTaskStatus('running');

    // 2. 执行操作

    // 3. 更新 task
    this.updateTaskStatus('completed');
  }
}