"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, FileText, Upload, X, Sparkles, ArrowRight } from "lucide-react"
import { getToken } from "@/lib/auth"
import { toast } from "@/lib/toast"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_JOB_OFFER_LENGTH = 5000

const JOB_PLACEHOLDER = `Example: We are looking for a Software Engineer with 3+ years of experience in React, TypeScript, and Node.js. You will build scalable web applications, collaborate with cross-functional teams, and contribute to our product roadmap...`

const STEPS = [
  { id: 1, label: "Upload CV", icon: Upload },
  { id: 2, label: "Add job description", icon: FileText },
  { id: 3, label: "Get ATS score", icon: Sparkles },
] as const

interface UploadCvResponse {
  id?: string
  cv_id?: string
}

interface AtsAnalyzeResponse {
  id?: string
  analysis_id?: string
  cv_id: string
  overall_score: number
  predicted_score: number
  analyzed_at: string
  scores: {
    keywords_match: number
    format_structure: number
    skills_match: number
    experience_match: number
    education_match: number
    overall_score: number
  }
  keywords_found: string[]
  keywords_missing: string[]
  improvements: string[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validatePdfFile(file: File): string | null {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Only PDF files are allowed."
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "File size must not exceed 5MB."
  }
  return null
}

function getActiveStep(file: File | null, jobOffer: string): number {
  if (!file) return 1
  if (!jobOffer.trim()) return 2
  return 3
}

function ProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4 animate-fade-in">
      {STEPS.map((step, index) => {
        const isComplete = activeStep > step.id
        const isActive = activeStep === step.id
        const Icon = step.icon

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-500 ${
                  isComplete
                    ? "bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-200"
                    : isActive
                    ? "bg-gradient-to-br from-teal-600 to-teal-800 text-white scale-110 shadow-lg shadow-teal-300 ring-4 ring-teal-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isComplete ? (
                  <Check size={16} strokeWidth={2.5} className="animate-scale-in" />
                ) : (
                  <Icon size={15} strokeWidth={2} />
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isComplete || isActive ? "text-teal-700" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={`hidden h-px w-8 sm:block sm:w-16 transition-all duration-500 ${
                  isComplete ? "bg-gradient-to-r from-teal-500 to-teal-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        )
      })}

      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease;
        }
      `}</style>
    </div>
  )
}

export default function AnalyzePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [jobOffer, setJobOffer] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const activeStep = getActiveStep(file, jobOffer)
  const canAnalyze = Boolean(file && jobOffer.trim()) && !isLoading

  const applyFile = useCallback((selected: File) => {
    const validationError = validatePdfFile(selected)
    if (validationError) {
      setError(validationError)
      toast.error("Invalid file", validationError)
      return
    }
    setError(null)
    setFile(selected)
    toast.success("CV uploaded successfully", `${selected.name} is ready to analyze`)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) applyFile(selected)
    e.target.value = ""
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) applyFile(dropped)
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    toast.info("File removed", "Upload a new CV to continue")
  }

  const handleJobOfferChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= MAX_JOB_OFFER_LENGTH) setJobOffer(value)
  }

  const handleAnalyze = async () => {
    if (!file || !jobOffer.trim()) return

    const token = getToken()

    if (!token) {
      setError("You must be logged in to analyze your CV.")
      toast.error("Authentication required", "Please log in first")
      router.push("/login")
      return
    }

    setIsLoading(true)
    setError(null)
    const loadingId = toast.loading("Analyzing with Claude AI...", "This may take 15-30 seconds")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch(`${BASE_URL}/cvs/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadResponse.ok) {
        let message = "Failed to upload CV."
        try {
          const errData = (await uploadResponse.json()) as { detail?: string }
          if (errData.detail) message = errData.detail
        } catch {
          message = uploadResponse.statusText || message
        }
        throw new Error(message)
      }

      const uploadData = (await uploadResponse.json()) as UploadCvResponse
      const cvId = uploadData.cv_id ?? uploadData.id

      if (!cvId) {
        throw new Error("Upload succeeded but no CV id was returned.")
      }

      localStorage.setItem("cv_id", cvId)
      localStorage.setItem("cvly_cv_id", cvId)
      localStorage.setItem("job_offer", jobOffer.trim())

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
      })

      if (!analyzeResponse.ok) {
        let message = "ATS analysis failed."
        try {
          const errData = (await analyzeResponse.json()) as { detail?: string }
          if (errData.detail) message = errData.detail
        } catch {
          message = analyzeResponse.statusText || message
        }
        throw new Error(message)
      }

      const analysis = (await analyzeResponse.json()) as AtsAnalyzeResponse
      const { cv_id: _cvId, ...analysisPayload } = analysis

      localStorage.setItem("cvly_analysis", JSON.stringify(analysisPayload))
      localStorage.setItem(
        "cvly_analysis_id",
        analysis.id ?? analysis.analysis_id ?? ""
      )

      toast.dismiss(loadingId)
      toast.success("Analysis complete", `Your CV scored ${analysis.overall_score}%`)
      router.push("/results")

    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred."
      setError(message)
      toast.dismiss(loadingId)
      toast.error("Analysis failed", message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">

      <div className="mb-6 text-center animate-fade-down">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 px-3 py-1 rounded-full text-[10px] font-medium mb-2 uppercase tracking-widest">
          <Sparkles className="h-3 w-3" />
          Powered by Claude AI
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Analyze your CV</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload your CV and paste a job description to get your ATS score
        </p>
      </div>

      <ProgressBar activeStep={activeStep} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-fade-up">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-white px-6 py-4 animate-fade-up">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
          <span className="text-sm font-medium text-teal-700">
            Claude AI is analyzing your CV...
          </span>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div
          className="rounded-xl border border-gray-200 bg-white p-5 animate-fade-up hover:shadow-lg transition-shadow"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
              <Upload className="h-3.5 w-3.5 text-teal-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Upload your CV</h3>
          </div>
          <p className="mb-4 text-xs text-gray-500">PDF only, max 5MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-gradient-to-r from-teal-50 to-white p-4 animate-scale-in">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 shadow-lg shadow-teal-200">
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
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 hover:scale-110"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ${
                isDragOver
                  ? "border-teal-700 bg-teal-100 scale-[1.02]"
                  : "border-teal-300 bg-gradient-to-b from-teal-50 to-white hover:border-teal-500 hover:bg-teal-50"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-800 shadow-lg shadow-teal-300 animate-bounce-soft">
                <Upload size={24} className="text-white" strokeWidth={2} />
              </div>
              <p className="text-sm font-medium text-gray-900">Drop your CV here</p>
              <p className="mt-1 text-xs text-gray-500">or click to browse</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-lg border border-teal-700 bg-white px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:bg-teal-50 hover:scale-105 active:scale-95"
              >
                Browse files
              </button>
            </div>
          )}
        </div>

        <div
          className="rounded-xl border border-gray-200 bg-white p-5 animate-fade-up hover:shadow-lg transition-shadow"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-amber-700" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Job description</h3>
          </div>
          <p className="mb-4 text-xs text-gray-500">Paste the full job posting</p>

          <textarea
            value={jobOffer}
            onChange={handleJobOfferChange}
            placeholder={JOB_PLACEHOLDER}
            className="h-[200px] w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />

          <div className="mt-1.5 flex justify-end">
            <span className={`text-xs transition-colors ${
              jobOffer.length > MAX_JOB_OFFER_LENGTH * 0.9
                ? "text-amber-600 font-medium"
                : "text-gray-400"
            }`}>
              {jobOffer.length} / {MAX_JOB_OFFER_LENGTH}
            </span>
          </div>

          <ul className="mt-3 space-y-1.5">
            <li className="flex items-start gap-2 text-xs text-gray-500">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-600" />
              Include the full job description for better accuracy
            </li>
            <li className="flex items-start gap-2 text-xs text-gray-500">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-600" />
              More details = more accurate ATS score
            </li>
          </ul>
        </div>
      </div>

      <div
        className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-teal-50 p-5 sm:flex-row animate-fade-up"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center shadow-lg shadow-teal-200">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Ready to analyze</p>
            <p className="text-xs text-gray-500">
              Your CV will be analyzed using Claude AI
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={!canAnalyze}
          className="group inline-flex items-center gap-2 w-full rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto shadow-lg shadow-teal-200"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing...
            </>
          ) : (
            <>
              Start Analysis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
        .animate-fade-down {
          animation: fade-down 0.5s ease;
        }
        .animate-fade-up {
          animation: fade-up 0.5s ease backwards;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease;
        }
        .animate-bounce-soft {
          animation: bounce-soft 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}