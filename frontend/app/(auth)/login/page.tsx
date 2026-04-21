import type { Metadata } from "next"
import LoginForm from "@/components/auth/LoginForm"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Cvly account and continue automating your job applications.",
}

export default function LoginPage() {
  return <LoginForm />
}