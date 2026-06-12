"use client"

import { useEffect, useState } from "react"
import {
  Search, MapPin, Briefcase, Coins, Building,
  Bookmark, BookmarkCheck, ExternalLink, Send,
  Target, Clock, Sparkles, X, Check,
  RefreshCw
} from "lucide-react"

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary_min?: number
  salary_max?: number
  contract_type?: string
  external_url: string
  posted_date?: string
  match_score: number
  matched_keywords: string[]
  missing_keywords: string[]
}

const CONTRACT_TYPES = [
  { value: "", label: "All types" },
  { value: "internship", label: "Internship" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
]

const QUICK_FILTERS = [
  "Remote",
  "Internship",
  "Junior level",
  "React",
  "Last 7 days",
]

function getMatchColor(score: number): string {
  if (score >= 80) return "from-teal-600 to-teal-800 text-white"
  if (score >= 50) return "bg-amber-50 text-amber-900 border border-amber-200"
  return "bg-rose-50 text-rose-700 border border-rose-200"
}

function getCompanyInitials(name: string): string {
  if (!name) return "??"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getDaysAgo(dateStr?: string): string {
  if (!dateStr) return ""
  try {
    const date = new Date(dateStr)
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "1 day ago"
    if (days < 30) return `${days} days ago`
    return `${Math.floor(days / 30)} month ago`
  } catch {
    return ""
  }
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return ""
  if (min && max) return `${min}-${max} MAD`
  if (min) return `From ${min} MAD`
  return `Up to ${max} MAD`
}

export default function JobsPage() {
  const [query, setQuery] = useState("Développeur Web Junior")
  const [location, setLocation] = useState("Casablanca")
  const [contractType, setContractType] = useState("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const [jobs, setJobs] = useState<Job[]>([])
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const searchJobs = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem("cvly_token")

    if (!token) {
      setError("Please log in first")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${baseUrl}/jobs/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          location,
          contract_type: contractType || null,
          page: 1,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to search jobs")
      }

      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedJobs = async () => {
    const token = localStorage.getItem("cvly_token")
    if (!token) return

    try {
      const res = await fetch(`${baseUrl}/jobs/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const ids = new Set<string>(data.map((j: { job_id: string }) => j.job_id))
        setSavedJobIds(ids)
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    void fetchSavedJobs()
    void searchJobs()
  }, [])

  const toggleSaveJob = async (job: Job) => {
    const token = localStorage.getItem("cvly_token")
    if (!token) return

    const isSaved = savedJobIds.has(job.id)

    try {
      if (isSaved) {
        await fetch(`${baseUrl}/jobs/saved/${job.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
        setSavedJobIds(prev => {
          const next = new Set(prev)
          next.delete(job.id)
          return next
        })
      } else {
        await fetch(`${baseUrl}/jobs/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            contract_type: job.contract_type,
            external_url: job.external_url,
            match_score: job.match_score,
            matched_keywords: job.matched_keywords,
            missing_keywords: job.missing_keywords,
            posted_date: job.posted_date,
          }),
        })
        setSavedJobIds(prev => new Set(prev).add(job.id))
      }
    } catch {
      // Silent fail
    }
  }

  const toggleQuickFilter = (filter: string) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const displayedJobs = showFavoritesOnly
    ? jobs.filter(j => savedJobIds.has(j.id))
    : jobs

  return (
    <div className="mx-auto max-w-6xl space-y-4">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Find Your Next Job</h2>
            <span className="bg-gradient-to-r from-teal-600 to-teal-400 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              AI MATCHED
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Search jobs and see how well they match your CV
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              showFavoritesOnly
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            My favorites ({savedJobIds.size})
          </button>
          <button
            onClick={() => void searchJobs()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Recommended
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_auto] gap-3 rounded-xl border border-teal-200 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchJobs()}
            placeholder="Job title, keywords, or company..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchJobs()}
            placeholder="Location"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>
        <select
          value={contractType}
          onChange={(e) => setContractType(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:border-teal-500 focus:outline-none bg-white"
        >
          {CONTRACT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={() => void searchJobs()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search
            </>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(filter => {
          const isActive = activeFilters.includes(filter)
          return (
            <button
              key={filter}
              onClick={() => toggleQuickFilter(filter)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-teal-50 text-teal-800 border border-teal-300"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {filter}
              {isActive && <X className="h-3 w-3" />}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-medium text-slate-700">
          <span className="text-teal-700">{displayedJobs.length} jobs</span> matching your search
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-10 w-10 rounded bg-slate-200" />
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-slate-200 rounded mb-3" />
              <div className="h-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && displayedJobs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">No jobs found</p>
          <p className="text-xs text-slate-500 mt-1">Try different keywords or remove filters</p>
        </div>
      )}

      {!loading && displayedJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedJobs.map(job => {
            const isSaved = savedJobIds.has(job.id)
            const isHigh = job.match_score >= 80
            const matchClass = getMatchColor(job.match_score)

            return (
              <div
                key={job.id}
                className="relative overflow-hidden rounded-xl border border-teal-200 bg-white p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full opacity-60 pointer-events-none" />

                <div className="flex items-start justify-between mb-2 relative z-10">
                  <div className="h-10 w-10 rounded-md bg-gradient-to-br from-teal-100 to-teal-300 flex items-center justify-center font-medium text-teal-900 text-sm">
                    {getCompanyInitials(job.company)}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    isHigh ? "bg-gradient-to-r from-teal-600 to-teal-800 text-white" : matchClass
                  }`}>
                    <Target className="h-3 w-3" />
                    {job.match_score}% match
                  </div>
                </div>

                <h3 className="text-sm font-medium text-slate-900 leading-snug mb-1">
                  {job.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <Building className="h-3 w-3" />
                  {job.company}
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {job.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-600 bg-slate-50 border border-slate-200">
                      <MapPin className="h-2.5 w-2.5" />
                      {job.location}
                    </span>
                  )}
                  {job.contract_type && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-600 bg-slate-50 border border-slate-200">
                      <Briefcase className="h-2.5 w-2.5" />
                      {job.contract_type}
                    </span>
                  )}
                  {(job.salary_min || job.salary_max) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-600 bg-slate-50 border border-slate-200">
                      <Coins className="h-2.5 w-2.5" />
                      {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                  {job.description}
                </p>

                {(job.matched_keywords.length > 0 || job.missing_keywords.length > 0) && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {job.matched_keywords.slice(0, 4).map(kw => (
                      <span key={kw} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium bg-teal-50 text-teal-800 border border-teal-200">
                        <Check className="h-2 w-2" />
                        {kw}
                      </span>
                    ))}
                    {job.missing_keywords.slice(0, 3).map(kw => (
                      <span key={kw} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-2.5 w-2.5" />
                    {getDaysAgo(job.posted_date) || "Recently"}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void toggleSaveJob(job)}
                      className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${
                        isSaved
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      }`}
                      aria-label="Save"
                    >
                      {isSaved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                    </button>
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 w-6 rounded-md flex items-center justify-center bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                      aria-label="External link"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-teal-700 text-white px-2.5 py-1 rounded-md text-[10px] font-medium hover:bg-teal-800"
                    >
                      <Send className="h-2.5 w-2.5" />
                      Apply
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}