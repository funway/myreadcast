import { NextRequest, NextResponse } from 'next/server';
import { BookService, BookQueryOptions } from '@/lib/server/db/book'; 
import { logger } from '@/lib/server/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ libraryId: string }> }
) {
  try {
    const { libraryId } = await params;

    if (!libraryId) {
      return NextResponse.json(
        { success: false, message: 'Library ID is required' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // 从查询参数构建 BookQueryOptions 对象
    const options: BookQueryOptions = {
      libraryId,
    };
    
    // 处理字符串类型的参数
    const type = searchParams.get('type');
    if (type) options.type = type as BookQueryOptions['type'];

    const author = searchParams.get('author');
    if (author) options.author = author;

    const narrator = searchParams.get('narrator');
    if (narrator) options.narrator = narrator;

    const search = searchParams.get('search');
    if (search) options.search = search;
    
    // 处理数组类型的参数 (逗号分隔)
    const genre = searchParams.get('genre');
    if (genre) options.genre = genre.split(',').map(g => g.trim());

    const tags = searchParams.get('tags');
    if (tags) options.tags = tags.split(',').map(tag => tag.trim());
    
    // 处理排序参数
    const orderBy = searchParams.get('orderBy');
    if (orderBy) options.orderBy = orderBy as BookQueryOptions['orderBy'];

    const orderDirection = searchParams.get('orderDirection');
    if (orderDirection) options.orderDirection = orderDirection as BookQueryOptions['orderDirection'];

    // 处理分页参数
    const limit = searchParams.get('limit');
    if (limit) options.limit = parseInt(limit, 10);

    const offset = searchParams.get('offset');
    if (offset) options.offset = parseInt(offset, 10);
    
    // 调用服务层方法
    const books = await BookService.queryBooks(options);
    logger.debug(`[API] Query books: ${books.length} books`);

    return NextResponse.json({
      success: true,
      data: books,
    });

  } catch (error) {
    logger.error('Query books error', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}