import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/server/api-response";
import { BookService } from "@/lib/server/db/book";
import { serveFile } from "@/lib/server/file-service";
import path from "path";
import { logger } from "@/lib/server/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string, relPath: string[] }> }
) {
  const { bookId, relPath } = await params;
  // logger.debug('GET book/[bookId]/[...relPath]', { bookId, relPath });
  // Next.js 在解析 dynamic route 参数的时候，会自动做 URL decode
  
  const book = await BookService.getBookById(bookId);
  if (!book) {
    return ApiResponse.fail('File not found', 404);
  }

  const absPath = path.join(book.folderPath, ...relPath);
  if (!absPath.startsWith(book.folderPath)) {
    return ApiResponse.fail('Invalid path', 400);
  }

  return serveFile(absPath, req);
}
