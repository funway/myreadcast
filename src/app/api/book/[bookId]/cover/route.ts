import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/server/api-response";
import { BookService } from "@/lib/server/db/book";
import { serveFile } from "@/lib/server/file-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params; 
  
  const book = await BookService.getBookById(bookId);
  if (!book || !book.coverPath) {
    return ApiResponse.fail('File not found', 404);
  }

  return serveFile(book.coverPath, req);
}
