"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Download, RefreshCw, Copy,
  Mic, Edit3, Check, ArrowLeft,
  Mail, Send, User, Calendar,
  Phone, Sparkles, Clock, Type,
  Palette, Ruler, Eye, History,
  Link2
} from "lucide-react"

interface CoverLetter {
  id?: string
  content: string
  tone: string
  length: string
  created_at?: string
}

interface UserInfo {
  full_name: string
  email: string
  initials: string
}

type Tone = "professional" | "friendly" | "creative"
type Length = "short" | "medium" | "long"
type Tab = "preview" | "edit" | "history"

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "creative", label: "Creative" },
]

const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
]

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function readingTime(text: string): string {
  const words = wordCount(text)
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `~${minutes} min`
}

function getInitials(name: string): string {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function extractCompanyName(content: string): string {
  // Try to find company name in letter (basic extraction)
  const lines = content.split("\n").slice(0, 10)
  for (const line of lines) {
    if (line.toUpperCase() === line && line.length > 3 && line.length < 50 && !line.includes("MADAME")) {
      return line.trim()
    }
  }
  return "Recruiting Team"
}

function cleanLetterBody(content: string): string {
  // Remove the header lines (name, contact, date, etc.) from the main body
  const lines = content.split("\n")
  let bodyStartIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes("madame") || lines[i].toLowerCase().includes("monsieur")) {
      bodyStartIndex = i
      break
    }
  }
  return lines.slice(bodyStartIndex).join("\n").trim()
}

function highlightKeywords(text: string): React.ReactNode[] {
  const keywords = [
    "Génie Logiciel", "Next.js", "Express.js", "MySQL", "React",
    "Node.js", "TypeScript", "API REST", "Flutter", "Firebase",
    "JavaScript", "HTML", "CSS", "PHP", "Java", "Développeur Web Junior",
    "Développeur Full Stack", "Bachelor", "Stage"
  ]
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi")
  const parts = text.split(pattern)
  return parts.map((part, i) => {
    if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
      return <strong key={i} className="font-medium text-teal-700">{part}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export default function CoverLetterPage() {
  const [letter, setLetter] = useState<CoverLetter | null>(null)
  const [history, setHistory] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tone, setTone] = useState<Tone>("professional")
  const [length, setLength] = useState<Length>("medium")
  const [activeTab, setActiveTab] = useState<Tab>("preview")
  const [editContent, setEditContent] = useState("")
  const [copied, setCopied] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    full_name: "Laasri Yassine",
    email: "laasri.yassine2006@gmail.com",
    initials: "LY"
  })

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const fetchUserInfo = async () => {
    const token = localStorage.getItem("cvly_token")
    if (!token) return

    try {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const name = data.full_name || data.name || "User"
        setUserInfo({
          full_name: name,
          email: data.email || "",
          initials: getInitials(name)
        })
      }
    } catch {
      // Use defaults
    }
  }

  const generate = async (selectedTone: Tone, selectedLength: Length) => {
    const cvId = localStorage.getItem("cvly_cv_id")
    const analysisId = localStorage.getItem("cvly_analysis_id")
    const token = localStorage.getItem("cvly_token")

    if (!cvId || !token) {
      setError("No CV found. Please analyze your CV first.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${baseUrl}/cover-letter/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cv_id: cvId,
          analysis_id: analysisId || null,
          tone: selectedTone,
          length: selectedLength,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || "Failed to generate cover letter")
      }

      const data = await res.json() as CoverLetter
      setLetter(data)
      setEditContent(data.content)
      await fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  const fetchHistory = async () => {
    const token = localStorage.getItem("cvly_token")
    if (!token) return

    try {
      const res = await fetch(`${baseUrl}/cover-letter/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as CoverLetter[]
        setHistory(data)
      }
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await fetchUserInfo()
      await generate(tone, length)
      setLoading(false)
    }
    void init()
  }, [])

  const handleRegenerate = async () => {
    setRegenerating(true)
    setError(null)
    await generate(tone, length)
    setRegenerating(false)
  }

  const handleToneChange = async (newTone: Tone) => {
    setTone(newTone)
    setRegenerating(true)
    setError(null)
    await generate(newTone, length)
    setRegenerating(false)
  }

  const handleLengthChange = async (newLength: Length) => {
    setLength(newLength)
    setRegenerating(true)
    setError(null)
    await generate(tone, newLength)
    setRegenerating(false)
  }

  const handleCopy = async () => {
    if (!letter) return
    await navigator.clipboard.writeText(letter.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!letter) return
    const blob = new Blob([letter.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cvly-cover-letter-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadFromHistory = (item: CoverLetter) => {
    setLetter(item)
    setEditContent(item.content)
    setActiveTab("preview")
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
          <div className="text-center">
            <p className="text-base font-medium text-slate-700">
              Claude AI is writing your cover letter...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Creating a personalized letter just for you
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !letter) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700 mb-4">{error}</p>
          <Link
            href="/analyze"
            className="rounded-lg bg-teal-700 px-6 py-2.5 text-sm font-medium text-white"
          >
            Analyze CV first
          </Link>
        </div>
      </div>
    )
  }

  if (!letter) return null

  const companyName = extractCompanyName(letter.content)
  const letterBody = cleanLetterBody(letter.content)
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  })

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Cover Letter Generator</h2>
          <p className="text-sm text-slate-500 mt-1">
            Premium design · Personalized by Claude AI
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/cv-optimizer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-teal-200 bg-white p-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            <Palette className="h-3 w-3" />
            Tone
          </label>
          <div className="flex gap-2 flex-wrap">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => void handleToneChange(opt.value)}
                disabled={regenerating}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  tone === opt.value
                    ? "bg-teal-50 text-teal-800 border border-teal-300 shadow-sm"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            <Ruler className="h-3 w-3" />
            Length
          </label>
          <div className="flex gap-2 flex-wrap">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => void handleLengthChange(opt.value)}
                disabled={regenerating}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                  length === opt.value
                    ? "bg-teal-50 text-teal-800 border border-teal-300 shadow-sm"
                    : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg border border-teal-200 bg-white p-1">
        {([
          { value: "preview" as Tab, label: "Preview", icon: Eye },
          { value: "edit" as Tab, label: "Edit", icon: Edit3 },
          { value: "history" as Tab, label: "History", icon: History },
        ]).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-md transition-all ${
                activeTab === tab.value
                  ? "bg-teal-700 text-white font-medium shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Preview tab */}
      {activeTab === "preview" && (
        <div className="mb-4">
          {regenerating ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-teal-200 bg-white py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-100 border-t-teal-600" />
              <p className="text-sm text-slate-500">Claude AI is regenerating...</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] min-h-[600px]">

                {/* Sidebar */}
                <div className="relative bg-gradient-to-b from-teal-950 via-teal-800 to-teal-700 text-white p-6">

                  {/* Avatar */}
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-medium text-teal-700 border-4 border-teal-400 shadow-lg">
                    {userInfo.initials}
                  </div>

                  {/* TO */}
                  <div className="mb-5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-teal-200 mb-1.5">
                      <Send className="h-2.5 w-2.5" />
                      To
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-medium text-teal-200">{companyName}</p>
                      <p>HR Department</p>
                      <p>Casablanca, Maroc</p>
                    </div>
                  </div>

                  <div className="my-4 h-px bg-teal-400/30" />

                  {/* FROM */}
                  <div className="mb-5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-teal-200 mb-1.5">
                      <User className="h-2.5 w-2.5" />
                      From
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-medium text-teal-200">{userInfo.full_name}</p>
                      <p>Computer Science Student</p>
                      <p>Agadir, Maroc</p>
                    </div>
                  </div>

                  <div className="my-4 h-px bg-teal-400/30" />

                  {/* DATE */}
                  <div className="mb-5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-teal-200 mb-1.5">
                      <Calendar className="h-2.5 w-2.5" />
                      Date
                    </div>
                    <div className="text-xs">{today}</div>
                  </div>

                  <div className="my-4 h-px bg-teal-400/30" />

                  {/* CONTACT */}
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-teal-200 mb-1.5">
                      <Link2 className="h-2.5 w-2.5" />
                      Contact
                    </div>
                    <div className="text-[10px] leading-relaxed space-y-1">
                      <div className="flex items-start gap-1.5">
                        <Mail className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                        <span className="break-all">{userInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-2.5 w-2.5 shrink-0" />
                        <span>+212 624 78 20 56</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main letter */}
                <div className="relative p-8 lg:p-10 bg-white">

                  {/* Decorations */}
                  <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full opacity-70 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 h-20 w-20 bg-gradient-to-tr from-teal-50 to-transparent rounded-tr-full opacity-50 pointer-events-none" />

                  {/* Name block */}
                  <div className="relative mb-6 pb-4 border-b-2 border-teal-700">
                    <h1 className="text-3xl font-medium text-teal-950 tracking-wider leading-none">
                      {userInfo.full_name.toUpperCase()}
                    </h1>
                    <p className="text-[10px] text-teal-700 tracking-widest uppercase mt-1.5 font-medium">
                      Computer Science Student · Web Developer
                    </p>
                  </div>

                  {/* Cover Letter badge */}
                  <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-900 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-widest mb-5">
                    <Mail className="h-2.5 w-2.5" />
                    Cover Letter
                  </div>

                  {/* Letter body */}
                  <div className="relative z-10 text-sm leading-relaxed text-slate-800 space-y-3">
                    {letterBody.split("\n\n").filter(Boolean).map((paragraph, i) => (
                      <p key={i}>{highlightKeywords(paragraph)}</p>
                    ))}
                  </div>

                  {/* Signature */}
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-end justify-between">
                    <p className="text-lg text-teal-950 font-medium italic">
                      {userInfo.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Agadir, le {today}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit tab */}
      {activeTab === "edit" && (
        <div className="mb-4">
          <div className="rounded-xl border border-teal-200 bg-white p-5">
            <p className="text-xs text-slate-500 mb-3">
              Edit the letter directly. Changes are local only.
            </p>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-4 text-sm leading-relaxed text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              rows={20}
            />
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {wordCount(editContent)} words
              </span>
              <button
                onClick={() => {
                  setLetter({ ...letter, content: editContent })
                  setActiveTab("preview")
                }}
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="mb-4">
          {history.length === 0 ? (
            <div className="rounded-xl border border-teal-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">
                      <span className="inline-flex items-center gap-1.5 mr-2">
                        <Palette className="h-3 w-3 text-teal-600" />
                        {item.tone}
                      </span>
                      ·
                      <span className="inline-flex items-center gap-1.5 ml-2">
                        <Ruler className="h-3 w-3 text-teal-600" />
                        {item.length}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoadFromHistory(item)}
                    className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-white px-4 py-3">
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" />
            <strong className="text-teal-900">{wordCount(letter.content)}</strong> words
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <strong className="text-teal-900">{readingTime(letter.content)}</strong> read
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <strong className="text-teal-900">AI</strong> generated
          </span>
        </div>
        <button
          onClick={() => setActiveTab("edit")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit letter
        </button>
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 text-sm font-medium text-white hover:bg-teal-800 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
        <button
          onClick={() => void handleCopy()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-teal-200 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 transition-colors"
        >
          {copied ? (
            <><Check className="h-4 w-4 text-teal-600" />Copied!</>
          ) : (
            <><Copy className="h-4 w-4" />Copy to clipboard</>
          )}
        </button>
        <Link
          href="/interview"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-teal-200 bg-white py-3 text-sm font-medium text-slate-700 hover:bg-teal-50 transition-colors"
        >
          <Mic className="h-4 w-4" />
          Interview Prep
        </Link>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>

    </div>
  )
}