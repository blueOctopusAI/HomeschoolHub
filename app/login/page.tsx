import { LoginForm } from "@/components/login-form"

export const metadata = {
  title: "Login | Homeschool Hub",
  description: "Log in to your Homeschool Hub account",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sage-700">Homeschool Hub</h1>
          <p className="text-sage-600 mt-2">Your all-in-one homeschool management solution</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
