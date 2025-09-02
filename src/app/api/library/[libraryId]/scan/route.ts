import { TaskService } from '@/lib/server/db/task';
import { logger } from '@/lib/server/logger';
import { TaskFactory } from '@/lib/server/task/factory';
import { LibraryScanHandler } from '@/lib/server/task/library-scan.handler';
import { NextRequest, NextResponse } from 'next/server';
import { success } from 'zod';
// import { scanLibrary } from '@/lib/server/task/factory';

interface Params {
  params: Promise<{ libraryId: string; }>;
}

export async function GET(request: Request, { params }: Params) {
  const { libraryId } = await params;
  if (!libraryId) {
    return NextResponse.json({ success: false, message: 'Library ID is required' }, { status: 400 });
  }
  logger.debug(`Scan library: ${libraryId}`);

  try {
    // 1. 新建 task
    const task = await TaskService.createTask({
      type: 'library_scan',
      targetId: libraryId,
    });

    // 2. 启动异步的 task handler，但不要 await 它
    const taskHandler = TaskFactory.createHandler(task) as LibraryScanHandler;
    taskHandler.run();  // do not await for handler running

    // 3. 立即返回 task ID 给客户端
    return NextResponse.json({
      success: true,
      data: task,
    }, {
      status: 202,
    });
  } catch (error) {
    logger.error(`[API] Failed to create scan task for library ${libraryId}`, error);
    return NextResponse.json({ success: false, message: 'Failed to create scan task' }, { status: 500 });
  }
}