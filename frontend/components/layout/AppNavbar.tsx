"use client"

import { usePathname } from "next/navigation"
import { Bell, HelpCircle, Search } from "lucide-react"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analyze": "Analyze CV",
  "/cvs": "My CVs",
  "/cv-optimizer": "CV Optimizer",
  "/cover-letter": "Cover Letters",
  "/interview": "Interview Prep",
  "/jobs": "Job Offers",
  "/applications": "Applications",
  "/results": "Results",
  "/settings": "Settings",
}

const pageSubtitles: Record<string, string> = {
  "/dashboard": "Your AI career assistant",
  "/analyze": "Get instant ATS score with Claude AI",
  "/cvs": "Manage all your CVs",
  "/cv-optimizer": "Improve your CV with AI",
  "/cover-letter": "Personalized cover letters",
  "/interview": "Practice with AI interviewer",
  "/jobs": "Find your next opportunity",
  "/applications": "Track your applications",
  "/results": "See your CV score and improvements",
  "/settings": "Manage your account",
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }
  const matchedEntry = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(`${path}/`)
  )
  return matchedEntry?.[1] ?? "Cvly"
}

function getPageSubtitle(pathname: string): string {
  if (pageSubtitles[pathname]) {
    return pageSubtitles[pathname]
  }
  const matchedEntry = Object.entries(pageSubtitles).find(([path]) =>
    pathname.startsWith(`${path}/`)
  )
  return matchedEntry?.[1] ?? ""
}

export default function AppNavbar() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const pageSubtitle = getPageSubtitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 animate-fade-down">
      <div className="flex items-center gap-3">
        <div className="h-10 w-1 rounded-full bg-gradient-to-b from-teal-400 to-teal-700" />
        <div>
          <h1 className="text-lg font-semibold text-gray-900 leading-tight">{pageTitle}</h1>
          {pageSubtitle && (
            <p className="text-[11px] text-gray-500 leading-tight">{pageSubtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="group flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-teal-50 hover:text-teal-700 hover:scale-105 active:scale-95"
        >
          <Search
            size={18}
            strokeWidth={2}
            className="transition-transform group-hover:scale-110"
          />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-teal-50 hover:text-teal-700 hover:scale-105 active:scale-95"
        >
          <Bell
            size={18}
            strokeWidth={2}
            className="transition-transform group-hover:rotate-12"
          />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-600 border border-white" />
          </span>
        </button>

        <button
          type="button"
          aria-label="Help"
          className="group flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-all hover:bg-teal-50 hover:text-teal-700 hover:scale-105 active:scale-95"
        >
          <HelpCircle
            size={18}
            strokeWidth={2}
            className="transition-transform group-hover:rotate-12"
          />
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
    </header>
  )
}