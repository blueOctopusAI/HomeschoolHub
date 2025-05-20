"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { signup } from "@/app/auth/actions"

// Submit Button component with loading state
function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="w-full bg-sage-500 hover:bg-sage-600" disabled={pending}>
      {pending ? "Creating account..." : "Sign Up"}
    </Button>
  )
}

export function SignupForm() {
  // Use the server action with useActionState
  const [state, formAction] = useActionState(signup, undefined)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Fill out the form below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (optional)</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              required
            />
            {state?.errors?.email && (
              <p className="text-sm text-red-500 mt-1">{state.errors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
            {state?.errors?.password && (
              <p className="text-sm text-red-500 mt-1">{state.errors.password[0]}</p>
            )}
          </div>
          
          {/* Display general success or error messages */}
          {state?.message && (
            <div className={`text-sm mt-2 ${state.success ? 'text-green-600' : 'text-red-500'}`}>
              {state.message}
            </div>
          )}
          
          <SubmitButton />
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-sage-600 hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
