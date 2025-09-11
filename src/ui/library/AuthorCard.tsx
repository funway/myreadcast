import React from 'react';
import MyIcon from '../MyIcon';

interface AuthorCardProps {
  author: {
    name: string;
    bookCount: number;
    avatar?: string;
  };
  className?: string;
}

export default function AuthorCard({ author, className = "" }: AuthorCardProps) {
  return (
    <div className={`card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${className}`}>
      <figure className="aspect-square bg-gray-200">
        <img 
          src={author.avatar ?? "/image/avatar_placeholder.png"} 
          alt={author.name}
          className="w-full h-full object-fill"
        />
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