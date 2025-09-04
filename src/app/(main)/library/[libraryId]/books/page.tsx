// app/library/[libraryId]/books/page.tsx
'use client';

import React, { useState } from 'react';
import BookCard from '@/ui/library/BookCard';

// Mock 数据
const mockBooks = Array.from({ length: 24 }, (_, i) => ({
  id: `book-${i + 1}`,
  title: [
    'The Great Gatsby', '1984', 'To Kill a Mockingbird', 'Pride and Prejudice',
    'The Catcher in the Rye', 'Dune', 'The Hobbit', 'Fahrenheit 451',
    'Brave New World', 'The Lord of the Rings', 'One Hundred Years of Solitude',
    'The Kite Runner', 'Life of Pi', 'The Book Thief', 'The Alchemist',
    'Harry Potter and the Philosopher\'s Stone', 'The Da Vinci Code',
    'The Girl with the Dragon Tattoo', 'Gone Girl', 'The Hunger Games',
    'Twilight', 'The Fault in Our Stars', 'The Martian', 'Ready Player One'
  ][i],
  author: [
    'F. Scott Fitzgerald', 'George Orwell', 'Harper Lee', 'Jane Austen',
    'J.D. Salinger', 'Frank Herbert', 'J.R.R. Tolkien', 'Ray Bradbury',
    'Aldous Huxley', 'J.R.R. Tolkien', 'Gabriel García Márquez',
    'Khaled Hosseini', 'Yann Martel', 'Markus Zusak', 'Paulo Coelho',
    'J.K. Rowling', 'Dan Brown', 'Stieg Larsson', 'Gillian Flynn',
    'Suzanne Collins', 'Stephenie Meyer', 'John Green', 'Andy Weir', 'Ernest Cline'
  ][i],
  cover: '/api/placeholder/200/300'
}));

export default function BooksPage({ params }: { params: { libraryId: string } }) {
  const [sortBy, setSortBy] = useState('title');
  const [filterBy, setFilterBy] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const filteredBooks = mockBooks.filter(book => {
    if (typeFilter !== 'all' && book.type !== typeFilter) return false;
    if (filterBy === 'read') return Math.random() > 0.5; // Mock read status
    if (filterBy === 'unread') return Math.random() > 0.5; // Mock unread status
    return true;
  });

  return (
    <div className="p-6">
      {/* Filter Bar */}
      <div className="mb-6 bg-base-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-base-content">
              <span className="font-semibold">{filteredBooks.length}</span> books
            </div>
            
            <div className="divider divider-horizontal"></div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <select 
                className="select select-sm select-bordered"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="epub">E-books</option>
                <option value="audios">Audiobooks</option>
                <option value="audible_epub">Audio + E-book</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter:</span>
              <select 
                className="select select-sm select-bordered"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Books</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <select 
                className="select select-sm select-bordered"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="date-added">Date Added</option>
                <option value="size">File Size</option>
                <option value="type">Type</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">View:</span>
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-active' : 'btn-ghost'}`}
                onClick={() => setViewMode('grid')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : 'btn-ghost'}`}
                onClick={() => setViewMode('list')}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
}