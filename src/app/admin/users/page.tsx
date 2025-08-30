import { getUsers } from '@/lib/server/db/user';
import UsersPanel from '@/ui/admin/UsersPanel';

export default async function AdminUsersPage() {
  const users = await getUsers();
  console.log('[AdminUsersPage] get all users:', users.length);
  
  return (
    <UsersPanel initUsers={users} />
  );
}