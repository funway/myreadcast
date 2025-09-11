import { Task, TaskService } from "../db/task";
import { logger } from "../logger";

export abstract class TaskHandler { 
  protected task: Task;

  constructor(task: Task) { 
    this.task = task;
  }

  protected async updateTaskStatus(status: Task['status'], result?: string) { 
    logger.debug('Update task status:', { status, result, taskId: this.task.id });
    this.task.status = status;
    this.task.result = result ?? this.task.result;
    
    switch (status) { 
      case 'running':
        this.task.startedAt = new Date();
        await TaskService.updateTask({
          id: this.task.id,
          status: this.task.status,
          startedAt: this.task.startedAt,
        });
        break;
      
      case 'completed':
        this.task.completedAt = new Date();
        await TaskService.updateTask({
          id: this.task.id,
          status: this.task.status,
          result: this.task.result,
          completedAt: this.task.completedAt,
        });
        break;
      
      case 'failed':
        await TaskService.updateTask({
          id: this.task.id,
          status: this.task.status,
          result: this.task.result,
        });
        break;
      
      default:
        logger.warn('Why you update a task status to pending❓');
    }
  }

  public abstract run(): Promise<void>
}