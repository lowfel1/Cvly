"use client"

import { Search, Bell, Settings } from "lucide-react"
import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analyze": "Analyze CV",
  "/my-cvs": "My CVs",
  "/cv-optimizer": "CV Optimizer",
  "/cover-letter": "Cover Letter",
  "/interview": "Interview Prep",
  "/jobs": "Find Jobs",
  "/results": "ATS Results",
}

export default function TopBar() {
  const pathname = usePathname()
  const currentTitle = PAGE_TITLES[pathname || ""] || "Cvly"

  return (
    <div className="flex justify-between items-center px-5 py-3 bg-white rounded-xl border border-teal-100 mb-4 shadow-sm animate-fade-down">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Home</span>
        </div>
        <div className="text-base font-medium text-teal-950">{currentTitle}</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all hover:scale-105"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all hover:scale-105 relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 border border-white" />
        </button>
        <button
          className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-all hover:scale-105"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-down {
          animation: fade-down 0.5s ease;
        }
      `}</style>
    </div>
  )
}