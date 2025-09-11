"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import BookCard from '@/ui/library/BookCard';
import type { Book, BookType } from '@/lib/server/db/book';
import { toast } from 'react-toastify';
import { useParams } from 'next/navigation';
import MyIcon from '../MyIcon';

const PAGE_SIZE = 18;

const BookTypeLabels: Record<BookType, string> = {
  epub: 'EPUB',
  audible_epub: 'Audible EPUB',
  audios: 'Audios',
};

type FilterOptions = {
  type: BookType | "all";
  genre: string;
  language: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'AbortError';
};

type BooksPanelProps = {
  allGenres: string[],
  allLanguages: string[],
}

export default function BooksPanel({ allGenres, allLanguages }: BooksPanelProps) {
  const { libraryId } = useParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    genre: 'all',
    language: 'all',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });

  console.log("[BooksPanel]", libraryId, allGenres, allLanguages, filters, { totalCount, books: books.length, page, isLoading, hasMore });

  const abortRef = useRef(new AbortController());
  const observerRef = useRef<IntersectionObserver>(null);

  const loaderRef = useCallback(
    (node: HTMLDivElement) => {
      console.log("[BooksPanel] useCallback > loaderRef rebuild:", node);
      
      if (observerRef.current) { 
        observerRef.current.disconnect();
      }

      if (node) { 
        observerRef.current = new IntersectionObserver(entries => {
          console.log("[BooksPanel] calls IntersectionObserver 🔍");

          if (entries[0].isIntersecting && hasMore && !isLoading) {
            console.log("[BooksPanel] calls IntersectionObserver 🔍 add page");
            setPage(prevPage => prevPage + 1);
          }
        });

        observerRef.current.observe(node);
      }
    },
    [isLoading]
  );

  const buildQueryString = (currentFilters: FilterOptions, forCount: boolean = false) => {
    const queryParams = new URLSearchParams();
    if (currentFilters.type !== 'all') queryParams.append('type', currentFilters.type);
    if (currentFilters.genre !== 'all') queryParams.append('genre', currentFilters.genre);
    if (currentFilters.language !== 'all') queryParams.append('language', currentFilters.language);
    
    if (!forCount) {
      queryParams.append('orderBy', currentFilters.sortBy);
      queryParams.append('orderDirection', currentFilters.sortDirection);
    }
    return queryParams.toString();
  };

  const loadMore = async () => { 
    console.log("[BooksPanel] loadMore", { filters, page });

    if (isLoading) {
      console.log("[BooksPanel] loadMore giveup (isLoading)");
      return;
    }

    setIsLoading(true);
    
    const queryString = buildQueryString(filters);
    const offset = (page - 1) * PAGE_SIZE;
    try {
      const response = await fetch(`/api/library/${libraryId}/books?${queryString}&limit=${PAGE_SIZE}&offset=${offset}`, {
        signal: abortRef.current.signal
      });
      const result = await response.json();
      const newBooks: Book[] = result.data || [];
      
      if (newBooks.length > 0) {
        setHasMore(totalCount > books.length + newBooks.length);
        setBooks(preBooks => [...preBooks, ...newBooks]);
      }
    } catch (error) {
      if (isAbortError(error)) {
        console.log("[BooksPanel] loadMore abort");
      } else {
        toast.error(`Failed to load more books: ${error}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const initLoad = async () => { 
    console.log("[BooksPanel] initLoad start", filters);
    setIsLoading(true);

    const countQueryString = buildQueryString(filters, true);
    const queryString = buildQueryString(filters);

    try {
      const [countResponse, booksResponse] = await Promise.all([
        fetch(`/api/library/${libraryId}/books/count?${countQueryString}`,
          { signal: abortRef.current.signal }
        ),
        fetch(`/api/library/${libraryId}/books?${queryString}&limit=${PAGE_SIZE}&offset=0`,
          { signal: abortRef.current.signal }
        ),
      ]);

      const countResult = await countResponse.json();
      const booksResult = await booksResponse.json();
      const newTotalCount = countResult.data || 0;
      const newBooks = booksResult.data || [];
      
      setTotalCount(newTotalCount);
      setBooks(newBooks);
      setPage(1);
      setHasMore(newBooks.length < newTotalCount);
      console.log("[BooksPanel] initLoad end", filters);
    } catch (error) {
      if (isAbortError(error)) {
        console.log("[BooksPanel] initLoad abort");
      } else {
        toast.error(`Failed to initLoad: ${error}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // 当筛选条件改变时，重置并重新获取数据
  useEffect(() => {
    console.log("[BooksPanel] calls useEffect @ filters");
    abortRef.current = new AbortController();
    
    initLoad();
    
    // return cleanup function
    return () => {
      console.log("[BooksPanel] calls useEffect cleanup @ filters");
      abortRef.current.abort("Filters changed");
    };
  }, [filters]);

  // 当页码改变时 (滚动到底部)，加载更多书籍
  useEffect(() => {
    console.log("[BooksPanel] calls useEffect @ page");

    if (page === 1) {
      console.log("[BooksPanel] calls useEffect @ page, page===1, do nothing");
      return;
    }

    if (!hasMore) {
      return;
    }

    loadMore();

  }, [page]);

  // 更新过滤条件的函数
  const updateFilter = (key: keyof FilterOptions, value: string) => {
    console.log('[BooksPanel] updateFilter:', key, value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleMatchBooks = async () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      toast.info("Books info matching completed!");
    }, 2000);
  };

  return (
    <div className="w-full p-6">
      {/* Filter Bar */}
      <div className="w-full mb-6 bg-base-100 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-base-content min-w-24">
              <span className="font-semibold">{totalCount}</span> Books
            </div>
            
            <div className="divider divider-horizontal"></div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <select 
                className="select select-sm select-bordered"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value as BookType | "all")}
              >
                <option value="all">All Types</option>
                {(Object.keys(BookTypeLabels) as BookType[]).map((type) => (
                  <option key={type} value={type}>
                    {BookTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Genre Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Genre:</span>
              <select 
                className="select select-sm select-bordered"
                value={filters.genre}
                onChange={(e) => updateFilter('genre', e.target.value)}
              >
                <option value="all">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Language:</span>
              <select 
                className="select select-sm select-bordered"
                value={filters.language}
                onChange={(e) => updateFilter('language', e.target.value)}
              >
                <option value="all">All Languages</option>
                {allLanguages.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              
              {/* orderBy */}
              <select 
                className="select select-sm select-bordered"
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
              >
                <option value="createdAt">Date Added</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="size">File Size</option>
                <option value="type">Type</option>
              </select>
              
              {/* orderDirection */}
              <button
                className={`btn btn-sm btn-square btn-ghost`}
                onClick={() => updateFilter('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
                title={`Sort ${filters.sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {filters.sortDirection === 'asc' ? <MyIcon iconName='sortAsc'/> : <MyIcon iconName='sortDesc'/>}
              </button>
            </div>

          </div>
          
          <div className="flex items-center gap-2">
            <button
              className={`btn btn-sm btn-primary ${isMatching ? "loading" : ""}`}
              onClick={handleMatchBooks}
              disabled={isMatching}
            >
              {isMatching ? "Matching..." : "Match Books Info"}
            </button>
          </div>

        </div>
      </div>

      {/* Books Grid View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-8">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Loader for Infinite Scroll */}
      <div ref={loaderRef} className="flex justify-center items-center py-10">
        {isLoading && <span className="loading loading-spinner"></span>}
        
        {!isLoading && !hasMore && totalCount > 0 && (
          <p className="text-base-content/60">No more books.</p>
        )}
        
        {!isLoading && !hasMore && totalCount === 0 && (
          <p className="text-base-content/60">No books found.</p>
        )}
      </div>
    </div>
  );
}