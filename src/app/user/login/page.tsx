import LoginForm from "@/ui/user/LoginForm"

export default async function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="card bg-base-200 w-full max-w-sm shrink-0 shadow-2xl">
        <div className="card-body">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}