import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/server/db/task';
import { logger } from '@/lib/server/logger';
import { ApiResponse } from '@/lib/server/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    
    if (!taskId?.trim()) {
      return ApiResponse.fail('Invalid task ID', 400);
    }

    const task = await TaskService.getTaskById(taskId);

    if (!task) {
      logger.debug('Task not found:', { taskId });
      return ApiResponse.fail('Task not found', 400);
    }
    return ApiResponse.success(task);
    
  } catch (error) {
    logger.error('Error fetching task:', error);
    return ApiResponse.fail('Internal server error', 500);
  }
}