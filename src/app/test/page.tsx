import LibrariesPanel from "@/ui/admin/LibrariesPanel";
import LibraryEdit from "@/ui/admin/LibraryEdit";
import ServerFolderSelector from "@/ui/admin/ServerFolderSelector";
import TestUI from "@/ui/test/TestUI";
import MyIcon from "@/ui/MyIcon";


export default async function TestPage() {

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-4 bg-base-300">
      <LibraryEdit className="w-1/2"/>
      <ServerFolderSelector className="w-90" />

      <div role="alert" className="alert alert-info w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-6 w-6 shrink-0 stroke-current">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Hello, we are in <b>{ process.env.NODE_ENV }</b> env.</span>
      </div>
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn m-1">Click</div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
          <li><a>Item 1</a></li>
          <li><a>Item 2</a></li>
        </ul>
      </div>
      <TestUI />
      <div className="divider" />
    </div>
  );
}
