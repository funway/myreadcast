import LibrariesPanel from "@/ui/admin/LibrariesPanel";
import LibraryEdit from "@/ui/admin/LibraryEdit";
import ServerFolderSelector from "@/ui/admin/ServerFolderSelector";
import TestUI from "@/ui/test/TestUI";
import MyIcon from "@/ui/MyIcon";
import UserEdit from "@/ui/admin/UserEdit";
import { AudioBookReader } from "@/ui/audiobook-reader/AudioBookReader";
import { reader } from "@/lib/client/audiobook-reader";


export default async function TestPage() {

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4 bg-base-300">
      <AudioBookReader />
      <div className="divider" />
      <TestUI></TestUI>
    </div>
  );
}
