"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import AppNavbar from "@/components/layout/AppNavbar"
import { useAuth } from "@/hooks/useAuth"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { loading, isAuth } = useAuth()

  useEffect(() => {
    if (!loading && !isAuth) {
      router.push("/login")
    }
  }, [loading, isAuth, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
          <p className="text-sm font-medium text-teal-700 animate-pulse">Loading Cvly...</p>
        </div>
      </div>
    )
  }

  if (!isAuth) {
    return null
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="ml-[240px] flex h-screen flex-1 flex-col overflow-y-auto">
        <AppNavbar />

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-teal-50 p-6">
          <div className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease;
        }
      `}</style>
    </div>
  )
}