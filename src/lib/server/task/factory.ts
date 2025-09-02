import { Task } from '../db/task';
import { TaskHandler } from './handler';
import { BookMatchHandler } from './book-match.handler';
import { LibraryScanHandler } from './library-scan.handler';


// 定义任务类型和对应的 Handler 类的映射关系
// 使用 'typeof TaskHandler' 来确保所有注册的类都继承自 TaskHandler
const handlerMap = new Map<string, new (task: Task) => TaskHandler>([
  ['library_scan', LibraryScanHandler],
  ['book_match', BookMatchHandler],
]);

export class TaskFactory {
  /**
   * 根据任务对象创建对应的处理器实例
   * @param task 从数据库中查询出的任务对象
   * @returns 一个 TaskHandler 的实例
   */
  static createHandler(task: Task): TaskHandler {
    const HandlerClass = handlerMap.get(task.type);

    if (!HandlerClass) {
      throw new Error(`No handler found for task type: ${task.type}`);
    }

    return new HandlerClass(task);
  }
}