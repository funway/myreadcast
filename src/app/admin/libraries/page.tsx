import { getLibrariesData } from '@/lib/server/actions/library';
import LibrariesPanel from '@/ui/admin/LibrariesPanel';

export default async function AdminLibrariesPage() {
  console.log('[AdminLibrariesPage]');
  
  return (
    <LibrariesPanel />
  );
}
