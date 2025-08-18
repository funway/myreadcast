import LoginForm from "@/ui/LoginForm"
import { UserTable } from "@/lib/db/schema"
import { db } from "@/lib/db/init"
import { eq } from "drizzle-orm"

export default async function Page() {
  // const existingUser = db.select().from(UserTable).where(eq(UserTable.username, 'funway')).all();
  // console.log("xxxxx", existingUser);

  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <LoginForm />
      </div>
    </main>
  )
}