import { ProgressService } from "@/lib/server/db/progress";
import { auth } from "@/lib/auth/server-auth";
import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/server/api-response";
import { ProgressUpdate } from "@/lib/server/db/progress";
import { logger } from "@/lib/server/logger";

export async function GET(req: NextRequest, { params }: { params: { bookId: string } }) {
  const sessionUser = await auth();
  if (!sessionUser) return ApiResponse.fail('Unauthorized', 401);

  const result = await ProgressService.getProgress(sessionUser.id, params.bookId);
  if (result) {
    return ApiResponse.success(result);
  } else {
    return ApiResponse.fail('Not found', 404);
  }
}

export async function POST(req: NextRequest, { params }: { params: { bookId: string } }) {
  const sessionUser = await auth();
  if (!sessionUser) return ApiResponse.fail('Unauthorized', 401);

  try {
    const data = await req.json();
    
    const updates: ProgressUpdate = {
      userId: sessionUser.id,
      bookId: params.bookId,
    }

    if ('epubCfi' in data && 'epubProgress' in data) { 
      updates.epubCfi = data.epubCfi;
      updates.epubProgress = data.epubProgress;
    }

    if ('audioIndex' in data && 'audioSeek' in data && 'audioProgress' in data) {
      updates.audioIndex = data.audioIndex;
      updates.audioSeek = data.audioSeek;
      updates.audioProgress = data.audioProgress;
    }

    if (updates.epubProgress === undefined && updates.audioProgress === undefined) {
      return ApiResponse.fail('Missing progress data', 400);
    }

    const result = await ProgressService.updateProgress(updates);
    return ApiResponse.success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return ApiResponse.fail(message, 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { bookId: string } }) {
  const sessionUser = await auth();
  if (!sessionUser) return ApiResponse.fail('Unauthorized', 401);

  try {
    const result = await ProgressService.deleteProgressByUserBook(sessionUser.id, params.bookId);
    return ApiResponse.success(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return ApiResponse.fail(message, 500);
  }
}