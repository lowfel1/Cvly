"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { getToken } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_JOB_OFFER_LENGTH = 5000;

const JOB_PLACEHOLDER = `Example: We are looking for a Software Engineer with 3+ years of experience in React, TypeScript, and Node.js. You will build scalable web applications, collaborate with cross-functional teams, and contribute to our product roadmap...`;

const STEPS = [
  { id: 1, label: "Upload CV" },
  { id: 2, label: "Add job description" },
  { id: 3, label: "Get ATS score" },
] as const;

interface UploadCvResponse {
  id?: string;
  cv_id?: string;
}

interface AtsAnalyzeResponse {
  id?: string;
  analysis_id?: string;
  cv_id: string;
  overall_score: number;
  predicted_score: number;
  analyzed_at: string;
  scores: {
    keywords_match: number;
    format_structure: number;
    skills_match: number;
    experience_match: number;
    education_match: number;
    overall_score: number;
  };
  keywords_found: string[];
  keywords_missing: string[];
  improvements: string[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validatePdfFile(file: File): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File size must not exceed 5MB.";
  }
  return null;
}

function getActiveStep(file: File | null, jobOffer: string): number {
  if (!file) return 1;
  if (!jobOffer.trim()) return 2;
  return 3;
}

function ProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const isComplete = activeStep > step.id;
        const isActive = activeStep === step.id;

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  isComplete
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-[#0F766E] text-white"
                    : "bg-gray-100 text-gray-400",
                ].join(" ")}
              >
                {isComplete ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={[
                  "text-sm font-medium",
                  isComplete || isActive ? "text-[#0F766E]" : "text-gray-400",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={[
                  "hidden h-px w-8 sm:block sm:w-16",
                  isComplete ? "bg-[#0F766E]" : "bg-gray-200",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [jobOffer, setJobOffer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const activeStep = getActiveStep(file, jobOffer);
  const canAnalyze = Boolean(file && jobOffer.trim()) && !isLoading;

  const applyFile = useCallback((selected: File) => {
    const validationError = validatePdfFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFile(selected);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) applyFile(selected);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) applyFile(dropped);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  const handleJobOfferChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_JOB_OFFER_LENGTH) setJobOffer(value);
  };

  const handleAnalyze = async () => {
    if (!file || !jobOffer.trim()) return;

    const token = getToken();

    if (!token) {
      setError("You must be logged in to analyze your CV.");
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // STEP 1 — Upload CV
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${BASE_URL}/cvs/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadResponse.ok) {
        let message = "Failed to upload CV.";
        try {
          const errData = (await uploadResponse.json()) as { detail?: string };
          if (errData.detail) message = errData.detail;
        } catch {
          message = uploadResponse.statusText || message;
        }
        throw new Error(message);
      }

      const uploadData = (await uploadResponse.json()) as UploadCvResponse;
      const cvId = uploadData.cv_id ?? uploadData.id;

      if (!cvId) {
        throw new Error("Upload succeeded but no CV id was returned.");
      }

      // Save cv_id and job_offer
      localStorage.setItem("cv_id", cvId);
      localStorage.setItem("cvly_cv_id", cvId);
      localStorage.setItem("job_offer", jobOffer.trim());

      // STEP 2 — Analyze CV
      const analyzeResponse = await fetch(`${BASE_URL}/ats/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_id: cvId,
          job_description: jobOffer.trim(),
        }),
      });

      if (!analyzeResponse.ok) {
        let message = "ATS analysis failed.";
        try {
          const errData = (await analyzeResponse.json()) as { detail?: string };
          if (errData.detail) message = errData.detail;
        } catch {
          message = analyzeResponse.statusText || message;
        }
        throw new Error(message);
      }

      const analysis = (await analyzeResponse.json()) as AtsAnalyzeResponse;
      const { cv_id: _cvId, ...analysisPayload } = analysis;

      // Save analysis results AFTER receiving response
      localStorage.setItem("cvly_analysis", JSON.stringify(analysisPayload));
      localStorage.setItem(
        "cvly_analysis_id",
        analysis.id ?? analysis.analysis_id ?? ""
      );

      router.push("/results");

    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Analyze your CV</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload your CV and paste a job description to get your ATS score
        </p>
      </div>

      <ProgressBar activeStep={activeStep} />

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-[#E1F5EE] bg-[#F0FDF9] px-6 py-4">
          <svg
            className="h-5 w-5 animate-spin text-[#0F766E]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm font-medium text-[#0F766E]">
            Analyzing your CV with Claude AI...
          </span>
        </div>
      )}

      {/* Two columns */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Left — Upload CV */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-gray-900">Upload your CV</h3>
          <p className="mb-4 text-xs text-gray-500">PDF only, max 5MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-[#E1F5EE] bg-[#F0FDF9] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F766E]">
                <FileText size={20} className="text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                aria-label="Remove file"
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-red-500"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={[
                "flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                isDragOver
                  ? "border-[#0F766E] bg-[#E1F5EE]"
                  : "border-[#0F766E]/50 bg-[#F0FDF9]",
              ].join(" ")}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0F766E]">
                <Upload size={22} className="text-white" strokeWidth={2} />
              </div>
              <p className="text-sm font-medium text-gray-900">Drop your CV here</p>
              <p className="mt-1 text-xs text-gray-500">or click to browse</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-lg border border-[#0F766E] bg-white px-4 py-2 text-sm font-medium text-[#0F766E] transition-colors hover:bg-[#E1F5EE]"
              >
                Browse files
              </button>
            </div>
          )}
        </div>

        {/* Right — Job description */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-gray-900">Job description</h3>
          <p className="mb-4 text-xs text-gray-500">Paste the full job posting</p>

          <textarea
            value={jobOffer}
            onChange={handleJobOfferChange}
            placeholder={JOB_PLACEHOLDER}
            className="h-[200px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
          />

          <div className="mt-1.5 flex justify-end">
            <span className="text-xs text-gray-400">
              {jobOffer.length} / {MAX_JOB_OFFER_LENGTH}
            </span>
          </div>

          <ul className="mt-3 space-y-1.5">
            <li className="flex items-start gap-2 text-xs text-gray-500">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0F766E]" />
              Include the full job description for better accuracy
            </li>
            <li className="flex items-start gap-2 text-xs text-gray-500">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#0F766E]" />
              More details = more accurate ATS score
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom analyze section */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row">
        <div>
          <p className="text-sm font-semibold text-gray-900">Ready to analyze</p>
          <p className="text-xs text-gray-500">
            Your CV will be analyzed using Claude AI
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={!canAnalyze}
          className="w-full rounded-lg bg-[#0F766E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d6b63] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isLoading ? "Analyzing..." : "Start Analysis"}
        </button>
      </div>

    </div>
  );
}