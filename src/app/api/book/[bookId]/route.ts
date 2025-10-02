import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/server/api-response";
import { BookService } from "@/lib/server/db/book";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params; 
  
  const book = await BookService.getBookById(bookId);
  if (!book) {
    return ApiResponse.fail('File not found', 404);
  }

  return ApiResponse.success(book);
}
