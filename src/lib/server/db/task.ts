import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/server/db"
import { TaskTable } from "@/lib/server/db/schema";
import { generateId } from "@/lib/server/helpers";

export type Task = typeof TaskTable.$inferSelect;
type TaskInsert = typeof TaskTable.$inferInsert;
export type TaskNew = Omit<TaskInsert, "id" | "updatedAt" | "createdAt">;
export type TaskUpdate = {
  id: string;
} & Partial<TaskNew>;
  
export const TaskService = {
  
  createTask: async (newTask: TaskNew): Promise<Task> => { 
    return await db.transaction(async (tx) => {
      // 在事务中查询现有任务
      const existingTask = await tx
        .select()
        .from(TaskTable)
        .where(
          and(
            eq(TaskTable.type, newTask.type),
            eq(TaskTable.targetId, newTask.targetId)
          )
        )
        .orderBy(desc(TaskTable.createdAt))
        .limit(1);

      // 如果存在任务且状态为 pending 或 running，则不创建新任务
      if (existingTask.length > 0) {
        const task = existingTask[0];
        if (task.status === 'pending' || task.status === 'running') {
          throw new Error(`Task with type "${newTask.type}" and target "${newTask.targetId}" is already ${task.status}`);
        }
      }

      // 创建新任务
      const id = generateId();
      const [task] = await tx
        .insert(TaskTable)
        .values({
          id,
          ...newTask,
        })
        .returning();

      return task;
    });
  },

  getTaskById: async (taskId: string): Promise<Task | undefined> => { 
    return await db.query.TaskTable.findFirst({
      where: eq(TaskTable.id, taskId),
    });
  },

  updateTask: async (taskUpdates: TaskUpdate): Promise<Task> => { 
    const { id, ...updates } = taskUpdates;
    const [task] = await db
      .update(TaskTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(TaskTable.id, id))
      .returning();
    
    return task;
  }
}