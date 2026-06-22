"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Briefcase,
  Columns2,
  Crown,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Mic,
  Search,
  Settings,
  Wand2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analyze CV", href: "/analyze", icon: Search },
  { label: "CV Optimizer", href: "/cv-optimizer", icon: Wand2 },
]

const toolsNavItems: NavItem[] = [
  { label: "Cover Letters", href: "/cover-letter", icon: Mail },
  { label: "Interview Prep", href: "/interview", icon: Mic },
  { label: "Job Offers", href: "/jobs", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: Columns2 },
]

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface SidebarLinkProps {
  item: NavItem
  pathname: string
  delay?: number
}

function SidebarLink({ item, pathname, delay = 0 }: SidebarLinkProps) {
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-2.5 rounded-lg px-[10px] py-2 text-[13px] font-medium transition-all duration-200 animate-slide-in-left ${
        active
          ? "bg-gradient-to-r from-teal-400/20 to-transparent text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1"
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-[60%] w-[3px] rounded-r bg-teal-400 shadow-[0_0_8px_#5DCAA5]" />
      )}
      <Icon
        size={16}
        strokeWidth={active ? 2.25 : 2}
        className={active ? "text-teal-200" : "text-white/60 group-hover:text-white"}
      />
      <span>{item.label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col bg-gradient-to-b from-teal-950 via-teal-700 to-teal-900 relative">

      <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-teal-400 to-transparent" />

      <div className="shrink-0 px-4 pb-4 pt-5 animate-fade-in-left">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-200">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#04342C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-white tracking-wide">Cvly</div>
            <div className="text-[9px] tracking-widest uppercase text-teal-200">AI Career</div>
          </div>
        </Link>
      </div>

      <div className="shrink-0 px-3 pb-3 animate-fade-in-left-delayed">
        {loading ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-2.5">
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/20" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-white/20" />
              <div className="h-2.5 w-32 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm p-2.5 border border-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-200 text-sm font-semibold text-teal-950 border-2 border-white/30">
              {user ? getInitials(user.full_name) : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-white">
                {user?.full_name ?? "Guest"}
              </p>
              <p className="truncate text-[10px] text-teal-200">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 scrollbar-thin">

        <p className="px-[10px] pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-teal-200">
          Main
        </p>
        {mainNavItems.map((item, i) => (
          <SidebarLink
            key={item.href}
            item={item}
            pathname={pathname}
            delay={0.1 + i * 0.05}
          />
        ))}

        <div className="pt-4">
          <p className="px-[10px] pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-teal-200">
            Tools
          </p>
          <div className="space-y-0.5">
            {toolsNavItems.map((item, i) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                delay={0.3 + i * 0.05}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-white/10 px-3 py-3 animate-fade-in-up">
        <SidebarLink
          item={{ label: "Settings", href: "/settings", icon: Settings }}
          pathname={pathname}
          delay={0.5}
        />

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-teal-400 to-teal-700 px-[10px] py-2.5 text-[12px] font-medium text-white transition-all hover:scale-[1.02] animate-pulse-soft shadow-lg"
        >
          <Crown size={14} strokeWidth={2} />
          <span>Upgrade to Pro</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-lg px-[10px] py-2 text-[12px] font-medium text-white/70 transition-all hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut
            size={16}
            strokeWidth={2}
            className="text-white/60 transition-colors group-hover:text-red-300"
          />
          <span>Logout</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in-left {
          from { opacity: 0; transform: translateX(-15px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { box-shadow: 0 4px 12px rgba(93, 202, 165, 0.3); }
          50% { box-shadow: 0 8px 24px rgba(93, 202, 165, 0.5); }
        }
        .animate-fade-in-left {
          animation: fade-in-left 0.5s ease;
        }
        .animate-fade-in-left-delayed {
          animation: fade-in-left 0.6s ease;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease backwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease;
        }
        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
      `}</style>
    </aside>
  )
}