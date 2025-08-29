'use client';
import Link from "next/link";
import { useParams } from "next/navigation";
import MyIcon, { IconName } from "@/ui/MyIcon";
import { useClientStatesStore } from "@/ui/contexts/StoreContext";

export default function LibrarySelector() {
  const libraries = useClientStatesStore(state => state.libraries);
  
  // 获取当前 libraryId
  const params = useParams(); 
  const currentLibraryId = params.id as string;
  const currentLibrary = libraries.find(lib => lib.id === currentLibraryId);
  console.log('[LibrarySelector] total:', libraries.length,
    'currentLibraryId:', currentLibraryId,
    'currentLibrary:', currentLibrary?.name);

  return (
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn flex items-center gap-2 min-w-32 max-w-64">
        {currentLibrary ? (
          <>
            <MyIcon iconName={currentLibrary.icon as IconName} />
            <span className="flex-1 text-left truncate">{currentLibrary.name}</span>
          </>
        ) : (
          <span>Library</span>
        )}
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-1 mt-1 w-52 p-2 shadow">
        {libraries.map(library => (
          <li key={library.id}>
            <Link href={`/library/${library.id}`}>
              <div className="flex items-center gap-2">
                <MyIcon iconName={library.icon as IconName} />
                <span className="flex-1">{library.name}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div >
  );
}
