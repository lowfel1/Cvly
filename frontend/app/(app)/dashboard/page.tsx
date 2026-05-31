"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Mail,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";

type Tab = "resumes" | "cover-letters";

interface MockCV {
  id: string;
  name: string;
  updatedAt: string;
  atsScore: number;
}

// Temporary mock data — replace with API response later.
const mockCVs: MockCV[] = [
  {
    id: "1",
    name: "Software Engineer CV",
    updatedAt: "28 April, 2026",
    atsScore: 94,
  },
  {
    id: "2",
    name: "Data Analyst CV",
    updatedAt: "25 April, 2026",
    atsScore: 67,
  },
];

function getAtsBadgeClasses(score: number): string {
  if (score > 80) {
    return "bg-green-50 text-green-700";
  }

  if (score >= 60) {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-red-50 text-red-700";
}

function EmptyState({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onAction,
}: {
  icon: typeof Upload;
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F5EE]">
        <Icon size={24} className="text-[#0F766E]" strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0d6b63]"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function CvCard({ cv, router }: { cv: MockCV; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* CV preview placeholder */}
      <div className="flex h-40 items-center justify-center bg-gray-50">
        <FileText size={32} className="text-gray-300" strokeWidth={1.5} />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-gray-900">
                {cv.name}
              </h3>
              <button
                type="button"
                aria-label="Edit CV name"
                className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-[#0F766E]"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">Updated {cv.updatedAt}</p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getAtsBadgeClasses(cv.atsScore)}`}
          >
            ATS {cv.atsScore}%
          </span>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 pt-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => router.push("/analyze")}
            className="text-[#0F766E] transition-colors hover:text-[#0d6b63]"
          >
            Analyze
          </button>
          <span className="text-gray-200">|</span>
          <button
            type="button"
            onClick={() => router.push("/cv-optimizer")}
            className="text-[#0F766E] transition-colors hover:text-[#0d6b63]"
          >
            Optimize
          </button>
          <span className="text-gray-200">|</span>
          <button
            type="button"
            className="text-gray-500 transition-colors hover:text-gray-700"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

function NewResumeCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white transition-colors hover:border-[#0F766E] hover:bg-[#E1F5EE]/30"
    >
      <Plus size={28} className="mb-2 text-[#0F766E]" strokeWidth={2} />
      <span className="text-sm font-medium text-[#0F766E]">New Resume</span>
    </button>
  );
}

function ResumesTab({ router }: { router: ReturnType<typeof useRouter> }) {
  if (mockCVs.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="Upload your first CV"
        description="Start by uploading your CV to get your ATS score"
        buttonLabel="Upload CV"
        onAction={() => router.push("/analyze")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mockCVs.map((cv) => (
        <CvCard key={cv.id} cv={cv} router={router} />
      ))}
      <NewResumeCard onClick={() => router.push("/analyze")} />
    </div>
  );
}

function CoverLettersTab({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <EmptyState
      icon={Mail}
      title="Generate your first cover letter"
      description="Create tailored cover letters for your job applications in seconds"
      buttonLabel="Generate Cover Letter"
      onAction={() => router.push("/cover-letter")}
    />
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("resumes");

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          My CVs & Cover Letters
        </h2>

        <button
          type="button"
          onClick={() => router.push("/analyze")}
          className="flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0d6b63]"
        >
          <Plus size={16} strokeWidth={2.5} />
          Upload CV
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("resumes")}
            className={[
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              activeTab === "resumes"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            Resumes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cover-letters")}
            className={[
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              activeTab === "cover-letters"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            Cover Letters
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "resumes" ? (
        <ResumesTab router={router} />
      ) : (
        <CoverLettersTab router={router} />
      )}
    </div>
  );
}
