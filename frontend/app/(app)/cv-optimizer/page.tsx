"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Download, Wand2,
  Mail, CheckCircle, Edit3,
  TrendingUp, FileText
} from "lucide-react"

interface Change {
  section: string
  type: "added" | "improved" | "removed"
  description: string
}

interface Optimization {
  original_text: string
  optimized_text: string
  changes: Change[]
  predicted_score: number
}

function DiffView({
  original,
  optimized
}: {
  original: string
  optimized: string
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Original */}
      <div className="rounded-xl border border-orange-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-700">
            Original CV
          </span>
          <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
            Before
          </span>
        </div>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600 font-sans">
          {original}
        </pre>
      </div>

      {/* Optimized */}
      <div className="rounded-xl border border-teal-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-teal-600" />
          <span className="text-sm font-medium text-teal-700">
            Optimized CV
          </span>
          <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600">
            After
          </span>
        </div>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 font-sans">
          {optimized}
        </pre>
      </div>
    </div>
  )
}

function ChangesList({ changes }: { changes: Change[] }) {
  return (
    <div className="space-y-3">
      {changes.map((change, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 rounded-lg border p-3 ${
            change.type === "added"
              ? "border-green-200 bg-green-50"
              : change.type === "improved"
              ? "border-blue-200 bg-blue-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {change.type === "added" ? (
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <Edit3 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          )}
          <div>
            <span className="text-xs font-medium text-slate-700">
              {change.section}
            </span>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {change.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700">
          Claude AI is optimizing your CV...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          This may take 15-30 seconds
        </p>
      </div>
      <div className="w-64 h-1.5 rounded-full bg-teal-100 overflow-hidden">
        <div className="h-full bg-teal-600 rounded-full animate-pulse" style={{ width: "60%" }} />
      </div>
    </div>
  )
}

export default function CvOptimizerPage() {
  const router = useRouter()
  const [optimization, setOptimization] = useState<Optimization | null>(null)
  const [loading, setLoading] = useState(true)
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

        if (!cvId || !analysisId || !token) {
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
            analysis_id: analysisId,
          }),
        })

        if (!res.ok) {
          throw new Error("Failed to optimize CV")
        }

        const data = await res.json() as Optimization
        setOptimization(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    void runOptimization()
  }, [])

  const handleDownload = () => {
    if (!optimization) return
    const blob = new Blob([optimization.optimized_text], {
      type: "text/plain;charset=utf-8"
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cvly-optimized-cv-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
          <p className="text-sm font-medium text-red-700 mb-4">
            {error ?? "No optimization available"}
          </p>
          <Link
            href="/results"
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Back to Results
          </Link>
        </div>
      </div>
    )
  }

  const gain = optimization.predicted_score - originalScore

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">CV Optimizer</h2>
          <p className="text-sm text-slate-500 mt-1">
            Claude AI has optimized your CV to maximize your ATS score
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/results"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Link>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download CV
          </button>
        </div>
      </div>

      {/* Score improvement */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">
            Score improvement
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            <TrendingUp className="h-3.5 w-3.5" />
            +{gain}% improvement
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-orange-500">
              {originalScore}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Before</div>
          </div>
          <div className="text-slate-300 text-lg">→</div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-teal-600">
              {optimization.predicted_score}%
            </div>
            <div className="text-xs text-slate-500 mt-0.5">After optimization</div>
          </div>
          <div className="flex-1">
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-700"
                style={{ width: `${optimization.predicted_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        {(["diff", "changes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? "border-teal-600 text-teal-700 font-medium"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "diff" ? "Side by side" : "Changes summary"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "diff" ? (
        <div className="mb-6">
          <DiffView
            original={optimization.original_text}
            optimized={optimization.optimized_text}
          />
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-medium text-slate-700 mb-4">
            Changes applied by Claude AI
          </h3>
          <ChangesList changes={optimization.changes} />
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download optimized CV (PDF)
        </button>
        <Link
          href="/cover-letter"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Generate cover letter
        </Link>
      </div>

    </div>
  )
}