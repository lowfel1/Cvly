"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Download, Wand2, Mail, CheckCircle, Edit3,
  TrendingUp, FileText, Sparkles
} from "lucide-react"
import { toast } from "@/lib/toast"

interface Change {
  section: string
  type: "added" | "improved" | "removed"
  description: string
}

interface Optimization {
  id?: string
  original_text: string
  optimized_text: string
  changes: Change[]
  predicted_score: number
}

function DiffView({ original, optimized }: { original: string; optimized: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-orange-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-up">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-orange-700" />
          </div>
          <span className="text-sm font-medium text-orange-700">Original CV</span>
          <span className="ml-auto rounded-full bg-gradient-to-r from-orange-100 to-orange-200 px-2.5 py-0.5 text-xs font-medium text-orange-700">Before</span>
        </div>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600 font-sans">{original}</pre>
      </div>

      <div className="rounded-xl border border-teal-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
            <Wand2 className="h-3.5 w-3.5 text-teal-700" />
          </div>
          <span className="text-sm font-medium text-teal-700">Optimized CV</span>
          <span className="ml-auto rounded-full bg-gradient-to-r from-teal-100 to-teal-200 px-2.5 py-0.5 text-xs font-medium text-teal-700">After</span>
        </div>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-sans">{optimized}</pre>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s ease backwards; }
      `}</style>
    </div>
  )
}

function ChangesList({ changes }: { changes: Change[] }) {
  return (
    <div className="space-y-3">
      {changes.map((change, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-md animate-fade-up ${
            change.type === "added"
              ? "border-teal-200 bg-gradient-to-r from-teal-50 to-white hover:border-teal-300"
              : change.type === "improved"
              ? "border-blue-200 bg-gradient-to-r from-blue-50 to-white hover:border-blue-300"
              : "border-red-200 bg-gradient-to-r from-red-50 to-white hover:border-red-300"
          }`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
            change.type === "added" ? "bg-gradient-to-br from-teal-100 to-teal-200" :
            change.type === "improved" ? "bg-gradient-to-br from-blue-100 to-blue-200" :
            "bg-gradient-to-br from-red-100 to-red-200"
          }`}>
            {change.type === "added" ? (
              <CheckCircle className="h-4 w-4 text-teal-700" />
            ) : (
              <Edit3 className="h-4 w-4 text-blue-700" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-slate-700">{change.section}</span>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{change.description}</p>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.5s ease backwards; }
      `}</style>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
      <div className="relative">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
        <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-teal-600 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">Claude AI is optimizing your CV...</p>
        <p className="text-xs text-slate-500 mt-1">This may take 15-30 seconds</p>
      </div>
      <div className="w-64 h-1.5 rounded-full bg-teal-100 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 to-teal-700 rounded-full animate-progress" />
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 95%; }
        }
        .animate-fade-in { animation: fade-in 0.4s ease; }
        .animate-progress { animation: progress 30s ease-out forwards; }
      `}</style>
    </div>
  )
}

export default function CvOptimizerPage() {
  const router = useRouter()
  const [optimization, setOptimization] = useState<Optimization | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"diff" | "changes">("diff")
  const [originalScore, setOriginalScore] = useState<number>(0)

  useEffect(() => {
    const runOptimization = async () => {
      try {
        const cvId = localStorage.getItem("cvly_cv_id")
        const analysisId = localStorage.getItem("cvly_analysis_id")
        const analysis = localStorage.getItem("cvly_analysis")
        const token = localStorage.getItem("cvly_token")
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

        if (!cvId || !token) {
          setError("No analysis found. Please analyze your CV first.")
          setLoading(false)
          return
        }

        if (analysis) {
          const parsed = JSON.parse(analysis)
          setOriginalScore(parsed.overall_score ?? 0)
        }

        const res = await fetch(`${baseUrl}/optimizer/optimize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cv_id: cvId,
            analysis_id: analysisId || null,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.detail || "Failed to optimize CV")
        }

        const data = await res.json() as Optimization
        setOptimization(data)
        toast.success("CV optimized successfully", `New score: ${data.predicted_score}%`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An error occurred"
        setError(msg)
        toast.error("Optimization failed", msg)
      } finally {
        setLoading(false)
      }
    }

    void runOptimization()
  }, [])

  const handleDownload = async () => {
    if (!optimization) return

    const optimizationId = optimization.id

    // If no optimization ID, fallback to text download
    if (!optimizationId) {
      const blob = new Blob([optimization.optimized_text], {
        type: "text/plain;charset=utf-8"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cvly-optimized-cv-${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Downloaded as text", "Optimization ID not available")
      return
    }

    const token = localStorage.getItem("cvly_token")
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

    setDownloading(true)

    try {
      toast.info("Generating PDF...", "Your optimized CV is being created")

      const res = await fetch(
        `${baseUrl}/optimizer/download-pdf/${optimizationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || "PDF generation failed")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cv-optimized-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Download complete!", "Your optimized CV PDF is ready")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      toast.error("PDF generation failed", "Downloading as text instead")

      // Fallback to text download
      const blob = new Blob([optimization.optimized_text], {
        type: "text/plain;charset=utf-8"
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cvly-optimized-cv-${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <LoadingState />
      </div>
    )
  }

  if (error || !optimization) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700 mb-4">{error ?? "No optimization available"}</p>
          <Link href="/results" className="rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-2.5 text-sm font-medium text-white hover:scale-105 transition-transform inline-flex">
            Back to Results
          </Link>
        </div>
      </div>
    )
  }

  const gain = optimization.predicted_score - originalScore

  return (
    <div className="mx-auto max-w-5xl">

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-fade-down">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 px-3 py-1 rounded-full text-[10px] font-medium mb-2 uppercase tracking-widest">
            <Wand2 className="h-3 w-3" />
            Powered by Claude AI
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">CV Optimizer</h2>
          <p className="text-sm text-slate-500 mt-1">
            Claude AI has optimized your CV to maximize your ATS score
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:scale-105 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Link>
          <button
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-2 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:hover:scale-100"
          >
            <Download className={`h-4 w-4 ${downloading ? "animate-bounce" : ""}`} />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-teal-50 p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            Score improvement
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-700 px-3 py-1 text-xs font-medium text-white shadow-md animate-pulse">
            <TrendingUp className="h-3.5 w-3.5" />
            +{gain}% improvement
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">{originalScore}%</div>
            <div className="text-xs text-slate-500 mt-0.5">Before</div>
          </div>
          <div className="text-slate-300 text-lg">→</div>
          <div className="text-center">
            <div className="text-3xl font-bold bg-gradient-to-br from-teal-600 to-teal-800 bg-clip-text text-transparent">
              {optimization.predicted_score}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">After optimization</div>
          </div>
          <div className="flex-1">
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-700 transition-all duration-1500 ease-out shadow-inner"
                style={{ width: `${optimization.predicted_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {(["diff", "changes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm border-b-2 transition-all ${
              activeTab === tab
                ? "border-teal-600 text-teal-700 font-medium"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "diff" ? "Side by side" : "Changes summary"}
          </button>
        ))}
      </div>

      {activeTab === "diff" ? (
        <div className="mb-6">
          <DiffView original={optimization.original_text} optimized={optimization.optimized_text} />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-4">Changes applied by Claude AI</h3>
          <ChangesList changes={optimization.changes} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <button
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 py-3 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:hover:scale-100"
        >
          <Download className={`h-4 w-4 ${downloading ? "animate-bounce" : ""}`} />
          {downloading ? "Generating PDF..." : "Download optimized CV (PDF)"}
        </button>
        <Link
          href="/cover-letter"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:scale-105 transition-all"
        >
          <Mail className="h-4 w-4" />
          Generate cover letter
        </Link>
      </div>

      <style jsx>{`
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-down { animation: fade-down 0.5s ease; }
        .animate-fade-up { animation: fade-up 0.5s ease backwards; }
      `}</style>

    </div>
  )
}