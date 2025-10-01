import type { Book } from '@/lib/server/db/book';
import React from 'react';

interface BookCardProps {
  book: Book;
  showTitle?: boolean;
  showAuthor?: boolean;
  className?: string;
}

export default function BookCard({ 
  book, 
  showTitle = true, 
  showAuthor = true, 
  className = "" 
}: BookCardProps) {
  return (
    <div className={`relative rounded-lg overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group ${className}`}>
      {/* 书籍封面 */}
      <div className="aspect-[3/4] bg-gray-200">
        <img 
          src={book.coverPath ?? "/image/book_placeholder.jpg"} 
          // src="/image/book_placeholder.jpg"
          alt={book.title}
          className="w-full h-full object-fill"
        />
      </div>
      
      {/* 重叠的文字信息 */}
      {(showTitle || showAuthor) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral/90 via-neutral/70 to-transparent text-white p-3">
          {showTitle && (
            <h3 className="text-sm font-semibold mb-1 line-clamp-2 leading-tight">
              {book.title}
            </h3>
          )}
          {showAuthor && (
            <p className="text-xs text-gray-200 line-clamp-1 opacity-90">
              {book.author}
            </p>
          )}
        </div>
      )}
      
      {/* 悬停效果 - 可选 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
}