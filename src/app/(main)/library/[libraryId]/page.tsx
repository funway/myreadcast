import React from 'react';
import BookCard from '@/ui/library/BookCard';

// Mock 数据
const mockBooks = {
  recentlyRead: [
    { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', cover: '/api/placeholder/200/300' },
    { id: '2', title: '1984', author: 'George Orwell', cover: '/api/placeholder/200/300' },
    { id: '3', title: 'To Kill a Mockingbird', author: 'Harper Lee', cover: '/api/placeholder/200/300' },
    { id: '4', title: 'Pride and Prejudice', author: 'Jane Austen', cover: '/api/placeholder/200/300' },
    { id: '5', title: 'The Catcher in the Rye', author: 'J.D. Salinger', cover: '/api/placeholder/200/300' }
  ],
  recentlyAdded: [
    { id: '6', title: 'Dune', author: 'Frank Herbert', cover: '/api/placeholder/200/300' },
    { id: '7', title: 'The Hobbit', author: 'J.R.R. Tolkien', cover: '/api/placeholder/200/300' },
    { id: '8', title: 'Fahrenheit 451', author: 'Ray Bradbury', cover: '/api/placeholder/200/300' },
    { id: '9', title: 'Brave New World', author: 'Aldous Huxley', cover: '/api/placeholder/200/300' },
    { id: '10', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', cover: '/api/placeholder/200/300' }
  ],
  discovery: [
    { id: '11', title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', cover: '/api/placeholder/200/300' },
    { id: '12', title: 'The Kite Runner', author: 'Khaled Hosseini', cover: '/api/placeholder/200/300' },
    { id: '13', title: 'Life of Pi', author: 'Yann Martel', cover: '/api/placeholder/200/300' },
    { id: '14', title: 'The Book Thief', author: 'Markus Zusak', cover: '/api/placeholder/200/300' },
    { id: '15', title: 'The Alchemist', author: 'Paulo Coelho', cover: '/api/placeholder/200/300' }
  ]
};

export default function LibraryPage() {
  const sections = [
    { title: 'Recently Read', books: mockBooks.recentlyRead },
    { title: 'Recently Added', books: mockBooks.recentlyAdded },
    { title: 'Discovery', books: mockBooks.discovery }
  ];

  return (
    <div className="p-6 space-y-8">
      {sections.map((section, index) => (
        <div key={index} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-base-content">{section.title}</h2>
            <button className="btn btn-ghost btn-sm">
              View All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {section.books.map((book) => (
              // <BookCard key={book.id} book={book} />
              book.id
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}