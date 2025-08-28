import { getLibrariesData } from '@/lib/server/actions/library';
import LibrariesPanel from '@/ui/admin/LibrariesPanel';

export default async function AdminLibrariesPage() {
  const libraries = await getLibrariesData();
  console.log('[AdminLibrariesPage] get all libraries:', libraries);
  
  return (
    <LibrariesPanel initLibraries={ libraries } />
  );
}
