import { initializeDatabase } from "@/lib/server/db/init";
import { getAdmins } from "@/lib/server/db/user";
import { CreateRootForm } from "@/ui/user/CreateForm";
import LoginForm from "@/ui/user/LoginForm";
import { BookOpenIcon, CircleStackIcon, ExclamationTriangleIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { DB_FILE } from '@/lib/server/constants';

export default async function HomePage() {
  // 1. 初始化数据库
  initializeDatabase();
  const admins = await getAdmins();
  const hasAdmin = admins.length > 0;

	return (
    <main className="flex min-h-screen items-center justify-center bg-base-300 p-4">
      {/* "Book" Container: holds the two cards */}
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl md:flex-row">
        
        {/* Left Card: Setup Status */}
        <div className="card w-full rounded-none bg-base-100 p-8 md:w-1/2">
          <div className="card-body">
            <h1 className="card-title mb-6 text-3xl font-bold">
              Server Setup
            </h1>
            <ul className="steps steps-vertical">
              
              {/* Step 1: Database Status */}
              <li data-content="1" className="step step-primary">
                <div className="flex w-full items-start text-left">
                  <CircleStackIcon className="mr-3 h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-semibold">Database Initialized</p>
                    <p className="text-xs">
                      Located at:
                      <code className="bg-base-300 px-1 py-0.5 rounded text-xs break-all font-mono">{DB_FILE}</code>
                    </p>
                  </div>
                </div>
              </li>

              {/* Step 2: Admin User Status (Conditional) */}
              {hasAdmin ? (
                <li data-content="2" className="step step-primary">
                  <div className="flex w-full items-start text-left">
                    <UserGroupIcon className="mr-3 h-6 w-6 shrink-0" />
                    <div>
                      <p className="font-semibold">Admin User Found</p>
                      <p className="text-xs">
                        {admins.map((admin) => admin.username).join(", ")}
                      </p>
                    </div>
                  </div>
                </li>
              ) : (
                <li data-content="2" className="step step-warning">
                  <div className="flex w-full items-start text-left">
                    <ExclamationTriangleIcon className="mr-3 h-6 w-6 shrink-0" />
                    <div>
                      <p className="font-semibold">No Admin User</p>
                      <p className="text-xs">
                        Please create a root user to proceed.
                      </p>
                    </div>
                  </div>
                </li>
              )}

              {/* Step 3: Library Setup */}
              <li data-content="3" className="step">
                <div className="flex w-full items-start text-left">
                  <BookOpenIcon className="mr-3 h-6 w-6 shrink-0" />
                  <div>
                    <p className="font-semibold">Create a Library</p>
                    <p className="text-xs">
                      After logging in, you can set up media libraries.
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Card: Action Form (Conditional) */}
        <div className="card w-full rounded-none bg-base-200 p-8 md:w-1/2">
          <div className="card-body">
            {hasAdmin ? (
              <LoginForm caption="Admin Login" />
            ) : (
              <CreateRootForm />
              )}
          </div>
        </div>
      
      </div>
    </main>
	);
}
