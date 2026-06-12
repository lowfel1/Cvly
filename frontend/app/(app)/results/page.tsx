"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import confetti from "canvas-confetti"
import {
  Download, GripVertical, Lightbulb, RotateCcw,
  Share2, Sparkles, TrendingUp, Award
} from "lucide-react"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts"
import { toast } from "@/lib/toast"

const STORAGE_ANALYSIS_KEY = "cvly_analysis"
const STORAGE_CV_ID_KEY = "cvly_cv_id"
const EXCELLENT_SCORE_THRESHOLD = 85

interface AtsScores {
  keywords_match?: number
  format_structure?: number
  skills_match?: number
  experience_match?: number
  education_match?: number
  overall_score?: number
}

interface AtsAnalysisRaw {
  overall_score?: number
  predicted_score?: number
  analyzed_at?: string
  scores?: AtsScores
  keywords_found?: string[]
  keywords_missing?: string[]
  improvements?: (string | { title?: string; description?: string; text?: string })[]
}

interface AtsAnalysis {
  overallScore: number
  predictedScore: number
  analyzedAt: string | null
  scores: {
    keywordsMatch: number
    formatStructure: number
    skillsMatch: number
    experienceMatch: number
    educationMatch: number
    overallScore: number
  }
  keywordsFound: string[]
  keywordsMissing: string[]
  improvements: string[]
}

interface HistoryEntry {
  id: string
  overall_score: number
  keywords_score: number
  format_score: number
  skills_score: number
  experience_score: number
  education_score: number
  created_at: string
}

const DETAILED_SCORE_ITEMS: {
  key: keyof AtsAnalysis["scores"]
  label: string
}[] = [
  { key: "keywordsMatch", label: "Keywords Match" },
  { key: "formatStructure", label: "Format & Structure" },
  { key: "skillsMatch", label: "Skills Match" },
  { key: "experienceMatch", label: "Experience Match" },
  { key: "educationMatch", label: "Education Match" },
  { key: "overallScore", label: "Overall Score" },
]

function getScoreColor(score: number): {
  stroke: string
  text: string
  bar: string
  track: string
  gradient: string
} {
  if (score >= 80) {
    return {
      stroke: "#0F766E",
      text: "text-teal-700",
      bar: "bg-gradient-to-r from-teal-500 to-teal-700",
      track: "bg-teal-50",
      gradient: "from-teal-500 to-teal-700"
    }
  }
  if (score >= 60) {
    return {
      stroke: "#f97316",
      text: "text-orange-600",
      bar: "bg-gradient-to-r from-orange-400 to-orange-600",
      track: "bg-orange-50",
      gradient: "from-orange-400 to-orange-600"
    }
  }
  return {
    stroke: "#ef4444",
    text: "text-red-600",
    bar: "bg-gradient-to-r from-red-400 to-red-600",
    track: "bg-red-50",
    gradient: "from-red-400 to-red-600"
  }
}

function computePredictedScore(overall: number, rawPredicted?: number): number {
  if (rawPredicted !== undefined && !Number.isNaN(Number(rawPredicted))) {
    return Math.min(100, Math.round(Number(rawPredicted)))
  }
  const gap = 100 - overall
  return Math.min(100, Math.round(overall + Math.max(12, gap * 0.75)))
}

function normalizeAnalysis(raw: AtsAnalysisRaw): AtsAnalysis | null {
  const overall = raw.overall_score ?? raw.scores?.overall_score
  if (overall === undefined || Number.isNaN(Number(overall))) return null

  const overallRounded = Math.round(Number(overall))
  const scores = raw.scores ?? {}

  const improvements = (raw.improvements ?? []).map((item) => {
    if (typeof item === "string") return item
    return item.title ?? item.description ?? item.text ?? ""
  }).filter(Boolean)

  return {
    overallScore: overallRounded,
    predictedScore: computePredictedScore(overallRounded, raw.predicted_score),
    analyzedAt: raw.analyzed_at ?? null,
    scores: {
      keywordsMatch: Math.round(Number(scores.keywords_match ?? 0)),
      formatStructure: Math.round(Number(scores.format_structure ?? 0)),
      skillsMatch: Math.round(Number(scores.skills_match ?? 0)),
      experienceMatch: Math.round(Number(scores.experience_match ?? 0)),
      educationMatch: Math.round(Number(scores.education_match ?? 0)),
      overallScore: Math.round(Number(scores.overall_score ?? overall)),
    },
    keywordsFound: raw.keywords_found ?? [],
    keywordsMissing: raw.keywords_missing ?? [],
    improvements,
  }
}

function formatAnalysisDate(isoDate: string | null): string {
  if (!isoDate) return "Analysis date unavailable"
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return "Analysis date unavailable"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date)
}

function buildResultsReport(analysis: AtsAnalysis): string {
  const lines = [
    "CVLY — ATS ANALYSIS RESULTS",
    "==============================",
    "",
    `Overall ATS Score: ${analysis.overallScore}%`,
    `Predicted Score After Optimization: ${analysis.predictedScore}%`,
    `Analysis Date: ${formatAnalysisDate(analysis.analyzedAt)}`,
    "",
    "SCORE BREAKDOWN",
    "---------------",
    ...DETAILED_SCORE_ITEMS.map((item) => `${item.label}: ${analysis.scores[item.key]}%`),
    "",
    "KEYWORDS FOUND",
    "--------------",
    analysis.keywordsFound.length > 0 ? analysis.keywordsFound.join(", ") : "(none)",
    "",
    "KEYWORDS MISSING",
    "----------------",
    analysis.keywordsMissing.length > 0 ? analysis.keywordsMissing.join(", ") : "(none)",
    "",
    "SUGGESTED IMPROVEMENTS",
    "----------------------",
    analysis.improvements.length > 0
      ? analysis.improvements.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : "(none)",
    "",
    "Generated by Cvly — https://cvly.app",
  ]
  return lines.join("\n")
}

function fireConfettiCelebration() {
  const duration = 2800
  const end = Date.now() + duration
  const colors = ["#0F766E", "#22c55e", "#fbbf24", "#34d399", "#ccfbf1"]

  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors })
    confetti({ particleCount: 6, spread: 80, origin: { x: 0.5, y: 0.35 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }

  confetti({ particleCount: 100, spread: 70, origin: { y: 0.55 }, colors })
  frame()
}

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (value - startValue) * eased)
      setDisplayValue(current)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{displayValue}</>
}

function ScoreCircle({ score }: { score: number }) {
  const size = 200
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const colors = getScoreColor(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative animate-scale-in" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="url(#scoreGradient)" strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1500 ease-out"
            style={{ filter: `drop-shadow(0 0 12px ${colors.stroke}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${colors.text}`}>
            <AnimatedNumber value={score} />%
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Your score</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">Overall ATS Score</p>
    </div>
  )
}

function ScoreBar({ label, score, delay = 0 }: { label: string; score: number; delay?: number }) {
  const colors = getScoreColor(score)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), delay)
    return () => clearTimeout(timer)
  }, [score, delay])

  return (
    <div className="space-y-2 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className={`shrink-0 text-sm font-semibold ${colors.text}`}>{score}%</span>
      </div>
      <div className={`h-2.5 w-full overflow-hidden rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-1500 ease-out ${colors.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, width))}%` }}
        />
      </div>
    </div>
  )
}

function BeforeAfterSlider({ currentScore, predictedScore }: { currentScore: number; predictedScore: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.min(95, Math.max(5, (x / rect.width) * 100))
    setPosition(percent)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    updatePosition(e.clientX)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  const gain = predictedScore - currentScore

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center">
          <TrendingUp size={14} className="text-teal-700" strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Before & After Optimization</h3>
      </div>
      <p className="mb-5 text-sm text-slate-500">
        Drag the slider to compare your current ATS score with the predicted score after CV optimization.
      </p>
      <div
        ref={containerRef}
        className="relative h-56 cursor-ew-resize select-none overflow-hidden rounded-xl sm:h-64 shadow-inner"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 px-6 text-white">
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-teal-100">After Optimization</span>
          <span className="text-5xl font-bold sm:text-6xl">{predictedScore}%</span>
          <span className="mt-2 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium animate-pulse">
            +{gain}% potential gain
          </span>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 px-6 text-white"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-orange-100">Current Score</span>
          <span className="text-5xl font-bold sm:text-6xl">{currentScore}%</span>
          <span className="mt-2 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-medium">Your ATS score today</span>
        </div>
        <div
          className="absolute top-0 bottom-0 z-10 flex w-10 -translate-x-1/2 items-center justify-center transition-transform"
          style={{ left: `${position}%` }}
        >
          <div className={`flex h-14 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-teal-600 to-teal-800 shadow-xl transition-transform ${isDragging ? 'scale-110' : ''}`}>
            <GripVertical size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-md" />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 backdrop-blur px-2 py-1 text-xs font-medium text-white">Before</div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/40 backdrop-blur px-2 py-1 text-xs font-medium text-white">After</div>
      </div>
      <div className="mt-4 flex justify-center gap-6 text-center text-sm">
        <div>
          <p className="font-semibold text-orange-600">{currentScore}%</p>
          <p className="text-xs text-slate-500">Current</p>
        </div>
        <div className="text-slate-300">→</div>
        <div>
          <p className="font-semibold text-teal-700">{predictedScore}%</p>
          <p className="text-xs text-slate-500">Predicted</p>
        </div>
      </div>
    </div>
  )
}

function RadarChartSection({ scores }: { scores: AtsAnalysis["scores"] }) {
  const data = [
    { subject: "Keywords", score: scores.keywordsMatch },
    { subject: "Format", score: scores.formatStructure },
    { subject: "Skills", score: scores.skillsMatch },
    { subject: "Experience", score: scores.experienceMatch },
    { subject: "Education", score: scores.educationMatch },
    { subject: "Overall", score: scores.overallScore },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
          <Award size={14} className="text-violet-700" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Competency Radar</h3>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Visual overview of your CV strengths across all categories
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#64748B" }} />
          <Radar
            dataKey="score"
            stroke="#0F766E"
            fill="#0F766E"
            fillOpacity={0.2}
            strokeWidth={2.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ScoreHistorySection({ cvId }: { cvId: string | null }) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cvId) {
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("cvly_token")
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

        const res = await fetch(`${baseUrl}/ats/analyses/${cvId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const data = await res.json() as HistoryEntry[]
          setHistory(data)
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    void fetchHistory()
  }, [cvId])

  const chartData = history.map((entry, index) => ({
    name: `Analysis ${index + 1}`,
    score: entry.overall_score,
    date: new Date(entry.created_at).toLocaleDateString("en-US", {
      month: "short", day: "numeric",
    }),
  })).reverse()

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Score History</h3>
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-100 border-t-teal-600" />
        </div>
      </div>
    )
  }

  if (chartData.length <= 1) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <TrendingUp size={14} className="text-amber-700" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Score History</h3>
        </div>
        <p className="text-sm text-slate-500">
          Analyze your CV multiple times to track your progress over time.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <TrendingUp size={14} className="text-amber-700" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">Score History</h3>
      </div>
      <p className="mb-5 text-sm text-slate-500">Your ATS score progression across analyses</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "ATS Score"]}
            contentStyle={{
              borderRadius: "8px",
              border: "0.5px solid #E2E8F0",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#0F766E"
            strokeWidth={3}
            dot={{ r: 5, fill: "#0F766E", strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#0F766E" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-teal-200 animate-bounce-soft">
        <RotateCcw size={28} className="text-teal-700" strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">No analysis found</h3>
      <p className="mb-6 max-w-md text-sm text-slate-500">
        Run an ATS analysis on your CV to see your score, keyword matches, and improvement suggestions.
      </p>
      <Link href="/analyze" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 shadow-lg shadow-teal-200">
        <Sparkles className="h-4 w-4" />
        Analyze CV
      </Link>
    </div>
  )
}

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null)
  const [cvId, setCvId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const confettiFiredRef = useRef(false)

  useEffect(() => {
    const storedAnalysis = localStorage.getItem(STORAGE_ANALYSIS_KEY)
    const storedCvId = localStorage.getItem(STORAGE_CV_ID_KEY)

    if (storedCvId) setCvId(storedCvId)

    if (storedAnalysis) {
      try {
        const parsed = JSON.parse(storedAnalysis) as AtsAnalysisRaw
        const normalized = normalizeAnalysis(parsed)
        if (normalized) setAnalysis(normalized)
      } catch {
        // Invalid JSON
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!analysis || analysis.overallScore <= EXCELLENT_SCORE_THRESHOLD || confettiFiredRef.current) return
    confettiFiredRef.current = true
    const timer = window.setTimeout(() => {
      fireConfettiCelebration()
      toast.success("Excellent match! 🎉", `Your CV scored ${analysis.overallScore}%`)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [analysis])

  const handleShare = async () => {
    if (!analysis) return
    const shareText = `I scored ${analysis.overallScore}% on my ATS analysis with Cvly!`
    const shareData = { title: "Cvly ATS Results", text: shareText, url: typeof window !== "undefined" ? window.location.href : "" }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast.success("Shared!", "Your results have been shared")
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url}`)
        toast.success("Copied to clipboard", "Share text is ready to paste")
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url}`)
        toast.success("Copied to clipboard")
      } catch {
        toast.error("Unable to share")
      }
    }
  }

  const handleDownload = () => {
    if (!analysis) return
    const report = buildResultsReport(analysis)
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    const dateStamp = new Date().toISOString().slice(0, 10)
    anchor.href = url
    anchor.download = `cvly-ats-results-${dateStamp}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Download started", "Your results report is being downloaded")
  }

  const isExcellentMatch = analysis !== null && analysis.overallScore > EXCELLENT_SCORE_THRESHOLD

  if (!hydrated) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
      </div>
    )
  }

  if (!analysis) {
    return <div className="mx-auto max-w-5xl"><EmptyState /></div>
  }

  return (
    <div className="mx-auto max-w-5xl">

      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between animate-fade-down">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 px-3 py-1 rounded-full text-[10px] font-medium mb-2 uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Powered by Claude AI
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">ATS Analysis Results</h2>
          <p className="mt-1 text-sm text-slate-500">{formatAnalysisDate(analysis.analyzedAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-teal-300 hover:text-teal-700 hover:scale-105"
          >
            <Share2 size={16} strokeWidth={2} />
            Share
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-teal-300 hover:text-teal-700 hover:scale-105"
          >
            <Download size={16} strokeWidth={2} />
            Download
          </button>
          <Link
            href="/analyze"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-700 transition-all hover:bg-teal-50 hover:scale-105"
          >
            <RotateCcw size={16} strokeWidth={2} />
            Analyze Again
          </Link>
        </div>
      </div>

      {isExcellentMatch && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 animate-scale-in shadow-lg shadow-teal-100">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg">
            <Sparkles size={22} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-base font-semibold text-teal-900">Excellent match! 🎉</p>
            <p className="text-xs text-teal-700">Your CV is highly compatible with this job offer</p>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-6 py-10 shadow-sm animate-fade-up">
        <ScoreCircle score={analysis.overallScore} />
      </div>

      <div className="mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <BeforeAfterSlider currentScore={analysis.overallScore} predictedScore={analysis.predictedScore} />
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h3 className="mb-5 text-base font-semibold text-slate-900">Score Breakdown</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {DETAILED_SCORE_ITEMS.map((item, i) => (
            <ScoreBar key={item.key} label={item.label} score={analysis.scores[item.key]} delay={i * 100} />
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <RadarChartSection scores={analysis.scores} />
        <ScoreHistorySection cvId={cvId} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Keywords Found</h3>
          {analysis.keywordsFound.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordsFound.map((keyword, i) => (
                <span
                  key={keyword}
                  className="rounded-full border border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100 px-3 py-1 text-xs font-medium text-teal-800 animate-fade-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No matching keywords found.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Keywords Missing</h3>
          {analysis.keywordsMissing.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordsMissing.map((keyword, i) => (
                <span
                  key={keyword}
                  className="rounded-full border border-red-200 bg-gradient-to-br from-red-50 to-red-100 px-3 py-1 text-xs font-medium text-red-700 animate-fade-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No missing keywords detected.</p>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.5s" }}>
        <h3 className="mb-4 text-base font-semibold text-slate-900">Suggested Improvements</h3>
        {analysis.improvements.length > 0 ? (
          <ul className="space-y-3">
            {analysis.improvements.map((suggestion, index) => (
              <li
                key={`${index}-${suggestion.slice(0, 24)}`}
                className="flex gap-3 rounded-lg border border-slate-100 bg-gradient-to-r from-amber-50/50 to-white px-4 py-3 hover:border-amber-300 hover:shadow-sm transition-all animate-fade-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
                  <Lightbulb size={16} className="text-amber-700" strokeWidth={2} aria-hidden="true" />
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{suggestion}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No improvement suggestions available.</p>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-up" style={{ animationDelay: "0.6s" }}>
        <Link
          href="/cv-optimizer"
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-200"
        >
          <Sparkles className="h-4 w-4" />
          Optimize my CV
        </Link>
        <Link
          href="/cover-letter"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:border-teal-300 hover:text-teal-700 hover:scale-105"
        >
          Generate Cover Letter
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
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fade-down { animation: fade-down 0.5s ease; }
        .animate-fade-up { animation: fade-up 0.5s ease backwards; }
        .animate-scale-in { animation: scale-in 0.6s ease; }
        .animate-bounce-soft { animation: bounce-soft 2s ease-in-out infinite; }
      `}</style>

    </div>
  )
}