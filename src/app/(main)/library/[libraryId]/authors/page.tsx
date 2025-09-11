import AuthorsPanel from '@/ui/library/AuthorsPanel';
import { BookService } from '@/lib/server/db/book';

type PageParams = {
  params: Promise<{ libraryId: string; }>;
};

export default async function AuthorsPage({ params }: PageParams) {
  const { libraryId } = await params;
  const auhtorsWithBooksCount = await BookService.getAllAuthorsWithBooksCount(libraryId);
  
  return (
    <AuthorsPanel initAuthors={auhtorsWithBooksCount} />
  );
}