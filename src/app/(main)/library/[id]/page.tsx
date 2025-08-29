import LibrariesPanel from "@/ui/admin/LibrariesPanel";
import LibraryEdit from "@/ui/admin/LibraryEdit";
import ServerFolderSelector from "@/ui/admin/ServerFolderSelector";
import TestUI from "@/ui/test/TestUI";
import MyIcon from "@/ui/MyIcon";


export default async function TestPage() {

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4">
      <TestUI />
      <div className="divider" />
    </div>
  );
}
