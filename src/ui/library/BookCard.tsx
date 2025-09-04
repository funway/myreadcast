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
    <div className={`card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${className}`}>
      <figure className="aspect-[3/4] bg-gray-200">
        {book.coverPath ? (
          <img 
            src={book.coverPath} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </figure>
      {(showTitle || showAuthor) && (
        <div className="card-body p-3">
          {showTitle && (
            <h3 className="card-title text-sm font-medium line-clamp-2">
              {book.title}
            </h3>
          )}
          {showAuthor && (
            <p className="text-xs text-gray-600 line-clamp-1">
              {book.author}
            </p>
          )}
        </div>
      )}
    </div>
  );
}