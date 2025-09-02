import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/server/db/task';
import { logger } from '@/lib/server/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    if (!taskId?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Invalid task ID' }, 
        { status: 400 }
      );
    }

    const task = await TaskService.getTaskById(taskId);

    if (!task) {
      logger.debug('Task not found:', { taskId });
      return NextResponse.json(
        { success: false, message: 'Task not found' }, 
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: task });
    
  } catch (error) {
    logger.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}