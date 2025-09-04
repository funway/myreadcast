// app/library/[libraryId]/authors/page.tsx
'use client';

import React, { useState } from 'react';
import AuthorCard from '@/ui/library/AuthorCard';

// Mock 数据
const mockAuthors = [
  { id: '1', name: 'F. Scott Fitzgerald', bookCount: 3, avatar: '/api/placeholder/150/150' },
  { id: '2', name: 'George Orwell', bookCount: 5, avatar: '/api/placeholder/150/150' },
  { id: '3', name: 'Harper Lee', bookCount: 2, avatar: '/api/placeholder/150/150' },
  { id: '4', name: 'Jane Austen', bookCount: 6, avatar: '/api/placeholder/150/150' },
  { id: '5', name: 'J.D. Salinger', bookCount: 4, avatar: '/api/placeholder/150/150' },
  { id: '6', name: 'Frank Herbert', bookCount: 8, avatar: '/api/placeholder/150/150' },
  { id: '7', name: 'J.R.R. Tolkien', bookCount: 12, avatar: '/api/placeholder/150/150' },
  { id: '8', name: 'Ray Bradbury', bookCount: 7, avatar: '/api/placeholder/150/150' },
  { id: '9', name: 'Aldous Huxley', bookCount: 3, avatar: '/api/placeholder/150/150' },
  { id: '10', name: 'Gabriel García Márquez', bookCount: 6, avatar: '/api/placeholder/150/150' },
  { id: '11', name: 'Khaled Hosseini', bookCount: 3, avatar: '/api/placeholder/150/150' },
  { id: '12', name: 'Yann Martel', bookCount: 2, avatar: '/api/placeholder/150/150' },
  { id: '13', name: 'Markus Zusak', bookCount: 4, avatar: '/api/placeholder/150/150' },
  { id: '14', name: 'Paulo Coelho', bookCount: 9, avatar: '/api/placeholder/150/150' },
  { id: '15', name: 'J.K. Rowling', bookCount: 11, avatar: '/api/placeholder/150/150' },
  { id: '16', name: 'Dan Brown', bookCount: 5, avatar: '/api/placeholder/150/150' },
  { id: '17', name: 'Stieg Larsson', bookCount: 3, avatar: '/api/placeholder/150/150' },
  { id: '18', name: 'Gillian Flynn', bookCount: 4, avatar: '/api/placeholder/150/150' }
];

export default function AuthorsPage({ params }: { params: { libraryId: string } }) {
  const [sortBy, setSortBy] = useState('name');
  const [isMatching, setIsMatching] = useState(false);

  const handleMatchAuthors = async () => {
    setIsMatching(true);
    // 模拟 API 调用延迟
    setTimeout(() => {
      setIsMatching(false);
      // 这里应该调用后端 API 来获取作者信息
      alert('Authors info matching completed!');
    }, 2000);
  };

  return (
    <div className="p-6">
      {/* Filter Bar */}
      <div className="mb-6 bg-base-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-base-content">
              <span className="font-semibold">{mockAuthors.length}</span> authors
            </div>
            
            <div className="divider divider-horizontal"></div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <select 
                className="select select-sm select-bordered"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="book-count">Book Count</option>
                <option value="date-added">Date Added</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className={`btn btn-sm btn-primary ${isMatching ? 'loading' : ''}`}
              onClick={handleMatchAuthors}
              disabled={isMatching}
            >
              {isMatching ? 'Matching...' : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Match Authors Info
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mockAuthors.map((author) => (
          <AuthorCard key={author.id} author={author} />
        ))}
      </div>
    </div>
  );
}