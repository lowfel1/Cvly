"use client";

import { usePathname } from "next/navigation";
import { Bell, HelpCircle, Search } from "lucide-react";

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
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  const matchedEntry = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(`${path}/`)
  );

  return matchedEntry?.[1] ?? "Cvly";
}

export default function AppNavbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F766E]"
        >
          <Search size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F766E]"
        >
          <Bell size={18} strokeWidth={2} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
        </button>

        <button
          type="button"
          aria-label="Help"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0F766E]"
        >
          <HelpCircle size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
