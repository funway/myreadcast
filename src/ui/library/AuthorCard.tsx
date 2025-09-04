import React from 'react';

interface AuthorCardProps {
  author: {
    id: string;
    name: string;
    bookCount: number;
    avatar?: string;
  };
  className?: string;
}

export default function AuthorCard({ author, className = "" }: AuthorCardProps) {
  return (
    <div className={`card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${className}`}>
      <figure className="aspect-square bg-gray-200 p-4">
        {author.avatar ? (
          <img 
            src={author.avatar} 
            alt={author.name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {author.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </figure>
      <div className="card-body p-3">
        <h3 className="card-title text-sm font-medium line-clamp-2">
          {author.name}
        </h3>
        <p className="text-xs text-gray-600">
          {author.bookCount} {author.bookCount === 1 ? 'book' : 'books'}
        </p>
      </div>
    </div>
  );
}