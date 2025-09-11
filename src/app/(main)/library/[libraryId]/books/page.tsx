import { BookService } from "@/lib/server/db/book";
import { logger } from "@/lib/server/logger";
import BooksPanel from "@/ui/library/BooksPanel";

type PageParams = {
  params: Promise<{ libraryId: string; }>;
};

export default async function BooksPage({ params }: PageParams) {
  const { libraryId } = await params;

  const genres = await BookService.getAllGenres(libraryId);
  const languages = await BookService.getAllLanguages(libraryId);
  logger.debug('[BooksPage]', { genres, languages });

  return (
    <BooksPanel allGenres={ genres } allLanguages={ languages }  />
  );
}
