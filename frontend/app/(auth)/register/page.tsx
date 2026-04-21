import type { Metadata } from "next"
import RegisterForm from "@/components/auth/RegisterForm"

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your free Cvly account and start automating your job applications with AI.",
}

export default function RegisterPage() {
  return <RegisterForm />
}