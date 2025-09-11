"use client";
import { useState, useMemo } from "react";
import AuthorCard from "./AuthorCard";
import MyIcon from "../MyIcon";
import { toast } from "react-toastify";

type AuthorWithBooksCount = {
  author: string;
  books_count: number;
};

type Props = {
  initAuthors: AuthorWithBooksCount[];
};

export default function AuthorsPanel({ initAuthors }: Props) {
  const [sortBy, setSortBy] = useState<"name" | "book-count">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isMatching, setIsMatching] = useState(false);

  // 本地排序逻辑
  const sortedAuthors = useMemo(() => {
    const authorsCopy = [...initAuthors];

    authorsCopy.sort((a, b) => {
      let cmp = 0;

      if (sortBy === "name") {
        cmp = a.author.localeCompare(b.author);
      } else if (sortBy === "book-count") {
        cmp = a.books_count - b.books_count;
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });

    return authorsCopy;
  }, [initAuthors, sortBy, sortDirection]);

  const handleMatchAuthors = async () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      toast.info("Authors info matching completed!");
    }, 2000);
  };

  return (
    <div className="p-6">
      {/* Filter Bar */}
      <div className="w-full mb-6 bg-base-100 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-base-content min-w-24">
              <span className="font-semibold">{initAuthors.length}</span> authors
            </div>

            <div className="divider divider-horizontal"></div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <select
                className="select select-sm select-bordered"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "book-count")
                }
              >
                <option value="name">Name</option>
                <option value="book-count">Book Count</option>
              </select>

              <button
                className="btn btn-sm btn-square btn-ghost"
                onClick={() =>
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
                title={`Sort ${sortDirection === "asc" ? "Descending" : "Ascending"}`}
              >
                {sortDirection === "asc" ? <MyIcon iconName='sortAsc'/> : <MyIcon iconName='sortDesc'/>}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`btn btn-sm btn-primary ${isMatching ? "loading" : ""}`}
              onClick={handleMatchAuthors}
              disabled={isMatching}
            >
              {isMatching ? "Matching..." : "Match Authors Info"}
            </button>
          </div>
        </div>
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedAuthors.map((au) => {
          const author = {
            name: au.author,
            bookCount: au.books_count,
          };
          return <AuthorCard key={author.name} author={author} />;
        })}
      </div>
    </div>
  );
}
