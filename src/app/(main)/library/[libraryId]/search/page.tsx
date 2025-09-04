// app/library/[libraryId]/search/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BookCard from '@/ui/library/BookCard';

type Book = {
  duration: number | null;
  id: string;
  libraryId: string;
  type: "epub" | "audible_epub" | "audios";
  audios: unknown;
  path: string;
  mtime: number;
  size: number;
  title: string;
  author: string | null;
  narrator: string | null;
  isbn: string | null;
  description: string | null;
  coverPath: string | null;
  wordCount: number | null;
  tags: unknown;
  genre: unknown;
  updatedAt: Date;
  createdAt: Date;
};

// Mock 搜索结果数据
const createMockSearchResult = (id: string, title: string, author: string, type: "epub" | "audible_epub" | "audios" = "epub"): Book => ({
  id,
  libraryId: 'lib-1',
  type,
  title,
  author,
  narrator: type === 'audios' ? 'Sample Narrator' : null,
  isbn: null,
  description: null,
  coverPath: `cover-${id}.jpg`,
  wordCount: type === 'epub' ? Math.floor(Math.random() * 100000) + 50000 : null,
  duration: type === 'audios' ? Math.floor(Math.random() * 800) + 300 : null,
  audios: null,
  path: `/books/${title.toLowerCase().replace(/\s+/g, '-')}.${type === 'audios' ? 'mp3' : 'epub'}`,
  mtime: Date.now() - Math.random() * 10000000,
  size: Math.floor(Math.random() * 5000000) + 1000000,
  tags: null,
  genre: null,
  updatedAt: new Date(),
  createdAt: new Date()
});

const mockSearchResults: Book[] = [
  createMockSearchResult('1', 'The Great Gatsby', 'F. Scott Fitzgerald', 'epub'),
  createMockSearchResult('2', 'Great Expectations', 'Charles Dickens', 'audible_epub'),
  createMockSearchResult('3', 'The Great Depression', 'David M. Kennedy', 'epub'),
  createMockSearchResult('4', 'Alexander the Great', 'Robin Lane Fox', 'audios'),
  createMockSearchResult('5', 'The Great War', 'Hew Strachan', 'epub'),
  createMockSearchResult('6', 'Great Ideas in Physics', 'Alan Lightman', 'audible_epub'),
  createMockSearchResult('7', 'The Great Game', 'Peter Hopkirk', 'epub'),
  createMockSearchResult('8', 'Catherine the Great', 'Robert K. Massie', 'audios')
];

export default function SearchPage({ params }: { params: { libraryId: string } }) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    // 模拟搜索延迟
    setTimeout(() => {
      // 这里应该调用真实的搜索 API
      // const results = await fetch(`/api/library/${params.libraryId}/books?search=${query}`);
      setSearchResults(mockSearchResults);
      setIsLoading(false);
    }, 800);
  };

  if (!searchQuery) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-base-content mb-2">No search query</h3>
          <p className="text-gray-600">Enter a search term to find books in your library.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content mb-2">
          Search results for "<span className="text-primary">{searchQuery}</span>"
        </h1>
        
        {!isLoading && (
          <div className="bg-base-200 rounded-lg p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-base-content">
                  <span className="font-semibold">{searchResults.length}</span> books found
                </div>
                
                <div className="divider divider-horizontal"></div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort:</span>
                  <select 
                    className="select select-sm select-bordered"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="title">Title</option>
                    <option value="author">Author</option>
                    <option value="date-added">Date Added</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="btn btn-sm btn-ghost">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Advanced Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-gray-600 mt-4">Searching your library...</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && searchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {searchResults.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && searchResults.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-base-content mb-2">No books found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or check the spelling.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Search tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Try different keywords</li>
              <li>Check for typos</li>
              <li>Use author names or book titles</li>
              <li>Search by ISBN or description</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}