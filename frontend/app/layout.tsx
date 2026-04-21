import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    template: "%s | Cvly",
    default: "Cvly - Automate Your Job Applications with AI",
  },
  description:
    "Cvly analyzes your resume, generates personalized cover letters, and prepares you for interviews using Claude AI. Start for free today.",
  keywords: [
    "job application",
    "resume optimizer",
    "ATS score",
    "cover letter generator",
    "interview preparation",
    "AI job search",
  ],
  authors: [{ name: "Cvly" }],
  openGraph: {
    title: "Cvly - Automate Your Job Applications with AI",
    description:
      "AI-powered job application automation. Land your dream job faster.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        {children}
      </body>
    </html>
  )
}