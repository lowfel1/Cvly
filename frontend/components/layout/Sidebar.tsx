"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analyze CV", href: "/analyze", icon: Search },
  { label: "My CVs", href: "/cvs", icon: FileText },
  { label: "CV Optimizer", href: "/cv-optimizer", icon: Wand2 },
];

const toolsNavItems: NavItem[] = [
  { label: "Cover Letters", href: "/cover-letter", icon: Mail },
  { label: "Interview Prep", href: "/interview", icon: Mic },
  { label: "Job Offers", href: "/jobs", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: Columns2 },
];

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarLinkProps {
  item: NavItem;
  pathname: string;
}

function SidebarLink({ item, pathname }: SidebarLinkProps) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-2.5 rounded-lg px-[10px] py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-[#E1F5EE] text-[#0F766E]"
          : "text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      <Icon
        size={18}
        strokeWidth={active ? 2.25 : 2}
        className={active ? "text-[#0F766E]" : "text-gray-500"}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="shrink-0 px-4 pb-4 pt-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
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
          <span className="text-lg font-bold text-gray-900">Cvly</span>
        </Link>
      </div>

      {/* User profile */}
      <div className="shrink-0 border-b border-gray-100 px-4 pb-4">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
              <div className="h-2.5 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E1F5EE] text-sm font-semibold text-[#0F766E]">
              {user ? getInitials(user.full_name) : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.full_name ?? "Guest"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {mainNavItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* Tools section */}
        <div className="pt-4">
          <p className="px-[10px] pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Tools
          </p>
          <div className="space-y-1">
            {toolsNavItems.map((item) => (
              <SidebarLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="shrink-0 space-y-1 border-t border-gray-100 px-3 py-3">
        <SidebarLink
          item={{ label: "Settings", href: "/settings", icon: Settings }}
          pathname={pathname}
        />

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-[10px] py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0d6b63]"
        >
          <Crown size={16} strokeWidth={2} />
          <span>Upgrade to Pro</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-2.5 rounded-lg px-[10px] py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
        >
          <LogOut
            size={18}
            strokeWidth={2}
            className="text-gray-500 transition-colors group-hover:text-red-600"
          />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
