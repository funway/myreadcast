import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/server/api-response";
import { BookService } from "@/lib/server/db/book";
import { serveFile } from "@/lib/server/file-service";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string, relPath: string[] }> }
) {
  const { bookId, relPath } = await params; 
  
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
