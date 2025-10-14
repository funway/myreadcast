import { ProgressService } from "@/lib/server/db/progress";
import { auth } from "@/lib/auth/server-auth";
import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/server/api-response";
import { ProgressUpdate } from "@/lib/server/db/progress";
import { logger } from "@/lib/server/logger";

export async function GET(req: NextRequest) {
  const sessionUser = await auth();
  if (!sessionUser) return ApiResponse.fail('Unauthorized', 401);

  const searchParams = req.nextUrl.searchParams;
  const libraryId = searchParams.get('libraryId');
  
  if (libraryId) {
    const result = await ProgressService.allProgressByUserInLibrary(sessionUser.id, libraryId);
    return ApiResponse.success(result);
  } else {
    const result = await ProgressService.allProgressByUser(sessionUser.id);
    return ApiResponse.success(result);
  }
}