import { BookService } from '@/lib/server/db/book';
import React from 'react';

type PageParams = {
  params: Promise<{ libraryId: string; }>;
};

export default async function LibraryPage({ params }: PageParams) {
  const { libraryId } = await params;

  const books = BookService.queryBooks({
    libraryId: libraryId,
  });

  // Mock data - 替换为你的实际数据
  const stats = {
    totalBooks: 248,
    epub: 150,
    audibleEpub: 60,
    audio: 38,
    audioDuration: 342,
    authors: 86
  };

  const currentlyReading = [
    { id: 1, title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling', cover: '#8b5cf6' },
    { id: 2, title: 'Harry Potter and the Goblet of Fire', author: 'J.K. Rowling', cover: '#ec4899' },
    { id: 3, title: 'The Old Man and the Sea', author: 'Ernest Hemingway', cover: '#f59e0b' },
    { id: 4, title: 'Moby Dick', author: 'Herman Melville', cover: '#10b981' },
    { id: 5, title: '受戒', author: '汪曾祺', cover: '#3b82f6' }
  ];

  const recentlyAdded = [
    { id: 6, title: 'Book 6', author: 'Author 6', cover: '#6366f1' },
    { id: 7, title: 'Book 7', author: 'Author 7', cover: '#8b5cf6' },
    { id: 8, title: 'Book 8', author: 'Author 8', cover: '#d946ef' },
    { id: 9, title: 'Book 9', author: 'Author 9', cover: '#06b6d4' },
    { id: 10, title: 'Book 10', author: 'Author 10', cover: '#14b8a6' }
  ];

  const randomPicks = [
    { id: 11, title: 'Book 11', author: 'Author 11', cover: '#ef4444' },
    { id: 12, title: 'Book 12', author: 'Author 12', cover: '#f97316' },
    { id: 13, title: 'Book 13', author: 'Author 13', cover: '#84cc16' },
    { id: 14, title: 'Book 14', author: 'Author 14', cover: '#22c55e' },
    { id: 15, title: 'Book 15', author: 'Author 15', cover: '#0ea5e9' }
  ];

  const BookCard = ({ book }) => (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
      <figure className="px-3 pt-3">
        <div 
          className="w-full h-64 rounded-lg flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: book.cover }}
        >
          {book.title.substring(0, 2)}
        </div>
      </figure>
      <div className="card-body p-3">
        <h3 className="card-title text-sm line-clamp-2">{book.title}</h3>
        <p className="text-xs text-base-content/60">{book.author}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full p-6">

      {/* Statistics Section */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-base-content/70 mb-4">Statistics</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Books Breakdown Card */}
          <div className="card bg-base-100 shadow-lg lg:col-span-1">
            <div className="card-body">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold">{stats.totalBooks}</span>
              </div>
              <p className="text-sm font-medium text-base-content/60 mb-4">TOTAL BOOKS</p>
              
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📖</span>
                  <span className="text-xl font-semibold text-blue-500">{stats.epub}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎧</span>
                  <span className="text-xl font-semibold text-purple-500">{stats.audibleEpub}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔊</span>
                  <span className="text-xl font-semibold text-pink-500">{stats.audio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Duration Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <span className="text-3xl mb-2">⏱️</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{stats.audioDuration}</span>
                <span className="text-2xl font-semibold text-base-content/60">hours</span>
              </div>
              <p className="text-sm text-base-content/60">Audio Duration</p>
            </div>
          </div>

          {/* Authors Card */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <span className="text-3xl mb-2">✍️</span>
              <span className="text-4xl font-bold">{stats.authors}</span>
              <p className="text-sm text-base-content/60">Authors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Currently Reading Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-base-content/70">Currently Reading</h2>
          <a href="#" className="text-sm text-primary hover:underline">View All →</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentlyReading.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      {/* Recently Added Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-base-content/70">Recently Added</h2>
          <a href="#" className="text-sm text-primary hover:underline">View All →</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recentlyAdded.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      {/* Random Picks Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-base-content/70">Random Picks</h2>
          <button className="btn btn-sm btn-ghost text-primary">
            🔄 Shuffle
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {randomPicks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
};