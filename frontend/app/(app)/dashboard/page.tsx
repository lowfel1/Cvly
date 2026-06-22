"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Briefcase, Target, Users, Award, TrendingUp,
  Send, Calendar, Sparkles, Upload, Search,
  Mail, Mic, Lightbulb, ArrowUpRight, Flame
} from "lucide-react"

interface Stats {
  applications: number
  applicationsTrend: number
  avgAtsScore: number
  scoreTrend: number
  interviews: number
  offers: number
  offerCompany?: string
  offerSalary?: number
}

interface PipelineData {
  applied: number
  review: number
  interview: number
  offer: number
  rejected: number
}

interface Interview {
  id: string
  day: number
  month: string
  company: string
  position: string
  time: string
  daysUntil?: number
}

interface ActivityItem {
  id: string
  type: "applied" | "score" | "letter" | "interview"
  title: string
  detail: string
  time: string
  badge: string
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("there")
  const [currentTime, setCurrentTime] = useState("")
  const [stats, setStats] = useState<Stats>({
    applications: 12,
    applicationsTrend: 2,
    avgAtsScore: 78,
    scoreTrend: 5,
    interviews: 3,
    offers: 1,
    offerCompany: "TechCorp",
    offerSalary: 12000,
  })

  const [pipeline] = useState<PipelineData>({
    applied: 5,
    review: 3,
    interview: 3,
    offer: 1,
    rejected: 0,
  })

  const [upcomingInterviews] = useState<Interview[]>([
    { id: "1", day: 15, month: "JUN", company: "TechCorp", position: "Frontend Dev", time: "14:00", daysUntil: 2 },
    { id: "2", day: 18, month: "JUN", company: "Atlas Mobile", position: "Flutter Stage", time: "10:00" },
  ])

  const [activities] = useState<ActivityItem[]>([
    {
      id: "1",
      type: "applied",
      title: "Applied to TechCorp · Frontend Developer",
      detail: "Application automatically added to your pipeline board",
      time: "2h ago",
      badge: "tracked",
    },
    {
      id: "2",
      type: "score",
      title: "CV analyzed against new job description",
      detail: "Strong match on React, TypeScript and Next.js keywords",
      time: "5h ago",
      badge: "82%",
    },
    {
      id: "3",
      type: "letter",
      title: "Cover letter generated for DevMaroc Agency",
      detail: "Professional tone · medium length · 287 words",
      time: "Yest.",
      badge: "claude AI",
    },
    {
      id: "4",
      type: "interview",
      title: "Practiced 5 interview questions",
      detail: "Voice analysis: confident tone, steady pace, low stress",
      time: "2d ago",
      badge: "7.8/10",
    },
  ])

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    const token = localStorage.getItem("cvly_token")

    if (token) {
      fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.full_name) {
            setUserName(data.full_name.split(" ")[0])
          }
        })
        .catch(() => {})

      fetch(`${baseUrl}/applications/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(data => {
          setStats(prev => ({
            ...prev,
            applications: data.total ?? prev.applications,
            interviews: data.interview ?? prev.interviews,
            offers: data.offer ?? prev.offers,
          }))
        })
        .catch(() => {})
    }

    const updateTime = () => {
      const now = new Date()
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      setCurrentTime(time)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const today = new Date()
  const dateString = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const dotColors: Record<string, string> = {
    applied: "#1fbfb8",
    score: "#05716c",
    letter: "#3D4E94",
    interview: "#1978a5",
  }

  const tagClasses: Record<string, string> = {
    applied: "bg-[#EBF3F9] text-[#1978a5]",
    score: "bg-[#E8F8F7] text-[#05716c]",
    letter: "bg-[#3D4E94] text-[#1fbfb8]",
    interview: "bg-[#1fbfb8] text-white",
  }

  return (
    <div className="mx-auto max-w-7xl" style={{ background: "#F5F8FB" }}>

      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b border-[#D5DDE8] pb-5 animate-fade-down">
        <div className="flex-1">
          <div className="text-[11px] text-[#1978a5] uppercase tracking-[1.8px] font-semibold mb-1.5">
            Dashboard / Overview
          </div>
          <h1
            className="text-[34px] font-bold text-[#2A3A7A] leading-none mb-2"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Hello, <em className="italic text-[#1fbfb8] font-normal">{userName}</em>
          </h1>
          <p className="text-sm text-[#1978a5] max-w-md">
            You're crushing it this week. {upcomingInterviews.length} interviews lined up and your CV score is climbing fast.
          </p>
        </div>
        <div
          className="text-right bg-[#3D4E94] text-[#1fbfb8] px-4 py-2.5 rounded-md font-mono"
        >
          <div className="text-lg font-semibold tracking-wider text-white">{currentTime}</div>
          <div className="text-[9px] text-[#1fbfb8] uppercase tracking-widest mt-0.5">{dateString}</div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-6 auto-rows-[90px] gap-3.5 mb-6">

        {/* Big Applications Card */}
        <div className="col-span-2 row-span-2 rounded-xl p-4 relative overflow-hidden text-white animate-fade-up hover:-translate-y-1 transition-transform"
          style={{ background: "linear-gradient(135deg, #05716c 0%, #3D4E94 100%)", animationDelay: "0.05s" }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: "rgba(31,191,184,0.15)" }} />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full" style={{ background: "rgba(31,191,184,0.08)" }} />

          <span className="absolute top-3.5 right-3.5 bg-[#1fbfb8]/25 text-[#1fbfb8] text-[9px] px-2 py-1 rounded-full font-semibold tracking-wider">
            +{stats.applicationsTrend} this week
          </span>
          <div className="relative z-10">
            <div className="text-[10px] uppercase tracking-[2px] text-[#1fbfb8] font-semibold">Applications</div>
            <div className="text-6xl font-bold leading-none my-2 text-white" style={{ fontFamily: "Georgia, serif" }}>
              {stats.applications}
            </div>
            <div className="text-xs text-[#A8E5E1]">Total submitted so far</div>
          </div>
        </div>

        {/* ATS Score Card */}
        <div className="col-span-2 rounded-xl p-4 bg-[#E8F8F7] border border-[#1fbfb8] relative overflow-hidden animate-fade-up hover:-translate-y-1 transition-transform"
          style={{ animationDelay: "0.1s" }}>
          <div className="flex items-baseline">
            <span className="text-[38px] font-bold text-[#05716c] leading-none" style={{ fontFamily: "Georgia, serif" }}>
              {stats.avgAtsScore}
            </span>
            <span className="text-lg text-[#1fbfb8] font-normal">%</span>
          </div>
          <div className="text-[11px] text-[#05716c] font-semibold uppercase tracking-wider mt-1">Avg ATS Score</div>
          <div className="text-[11px] text-[#05716c] font-semibold mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3" />
            Up {stats.scoreTrend}% from last analysis
          </div>
          <span className="absolute bottom-2.5 right-2.5 text-[9px] text-[#1978a5] font-mono">6 analyses</span>
        </div>

        {/* Interviews Hot Card */}
        <div className="col-span-2 rounded-xl p-4 bg-[#3D4E94] text-white flex flex-col justify-between animate-fade-up hover:-translate-y-1 transition-transform"
          style={{ animationDelay: "0.15s" }}>
          <div>
            <div className="flex justify-between items-start">
              <div className="text-[10px] text-[#1fbfb8] uppercase tracking-wider font-semibold">Interviews</div>
              <span className="bg-[#1fbfb8] text-[#2A3A7A] text-[9px] px-2 py-0.5 rounded-full font-semibold tracking-wider inline-flex items-center gap-1">
                <Flame className="h-2.5 w-2.5" />
                HOT
              </span>
            </div>
            <div className="text-[42px] font-bold leading-none my-2 text-white" style={{ fontFamily: "Georgia, serif" }}>
              {stats.interviews}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#1fbfb8] mb-1">Pipeline progress</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-md"
                  style={{
                    background: i <= stats.interviews
                      ? "linear-gradient(90deg, #1fbfb8, #A8E5E1)"
                      : "rgba(31,191,184,0.2)"
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Card */}
        <div className="col-span-3 row-span-2 rounded-xl p-4 bg-[#EBF3F9] border border-dashed border-[#5B9CD3] relative animate-fade-up hover:-translate-y-1 transition-transform"
          style={{ animationDelay: "0.2s" }}>
          <div className="text-[10px] text-[#1978a5] uppercase tracking-wider font-semibold mb-2.5">Coming up next</div>
          <div className="text-[15px] font-semibold text-[#2A3A7A] mb-3">
            {upcomingInterviews.length} interviews scheduled this week
          </div>
          <div className="flex flex-col gap-2">
            {upcomingInterviews.map(intv => (
              <div key={intv.id} className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg">
                <div className="w-9 h-9 bg-[#3D4E94] text-white rounded-lg flex flex-col items-center justify-center">
                  <strong className="text-sm leading-none font-bold">{intv.day}</strong>
                  <small className="text-[7px] tracking-wide text-[#1fbfb8] mt-0.5">{intv.month}</small>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#2A3A7A] leading-tight">{intv.company}</div>
                  <div className="text-[10px] text-[#1978a5] mt-0.5">{intv.position} · {intv.time}</div>
                </div>
                {intv.daysUntil && (
                  <span className="text-[9px] text-white font-semibold bg-[#1fbfb8] px-1.5 py-0.5 rounded">
                    in {intv.daysUntil}d
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Offer Card */}
        <div className="col-span-3 rounded-xl p-4 flex items-center gap-3.5 animate-fade-up hover:-translate-y-1 transition-transform"
          style={{ background: "linear-gradient(135deg, #E8F8F7, #F5F8FB)", border: "1px solid #1fbfb8", animationDelay: "0.25s" }}>
          <div className="w-12 h-12 bg-[#3D4E94] text-[#1fbfb8] rounded-full flex items-center justify-center font-bold text-lg"
            style={{ fontFamily: "Georgia, serif" }}>
            {stats.offerCompany?.substring(0, 2).toUpperCase() || "TC"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-[#05716c] uppercase tracking-wider font-semibold mb-0.5">
              YOU HAVE AN OFFER
            </div>
            <div className="text-sm font-semibold text-[#2A3A7A] leading-tight">
              {stats.offerCompany} · {stats.offerSalary?.toLocaleString()} MAD/month
            </div>
            <div className="text-[11px] text-[#1978a5] mt-0.5">Frontend Developer · Full-time</div>
          </div>
          <button className="bg-[#3D4E94] text-white border-none px-3.5 py-2 rounded-md text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 hover:scale-105 transition-transform">
            Review
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Pipeline Section */}
      <div className="bg-white rounded-xl p-5 mb-3.5 border border-[#D5DDE8] animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex justify-between items-end mb-3.5 pb-2.5 border-b border-[#EBF3F9]">
          <div className="text-lg font-semibold text-[#2A3A7A] flex items-center gap-2" style={{ fontFamily: "Georgia, serif" }}>
            Application <em className="italic text-[#1fbfb8] font-normal">pipeline</em>
          </div>
          <Link href="/applications" className="text-[11px] text-[#1978a5] flex items-center gap-1 uppercase tracking-wider font-semibold hover:text-[#1fbfb8] transition-colors">
            Open board <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {[
            { num: pipeline.applied, lbl: "Applied", bg: "#EBF3F9", color: "#1978a5", width: "100%" },
            { num: pipeline.review, lbl: "In Review", bg: "#E8F8F7", color: "#05716c", width: "60%" },
            { num: pipeline.interview, lbl: "Interview", bg: "#3D4E94", color: "white", width: "60%" },
            { num: pipeline.offer, lbl: "Offer", bg: "linear-gradient(135deg, #1fbfb8, #05716c)", color: "white", width: "20%" },
            { num: pipeline.rejected, lbl: "Rejected", bg: "#F5F8FB", color: "#1978a5", width: "0%" },
          ].map((step, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl relative overflow-hidden"
              style={{ background: step.bg, color: step.color }}
            >
              <div className="text-[32px] font-bold leading-none" style={{ fontFamily: "Georgia, serif" }}>{step.num}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold mt-1.5">{step.lbl}</div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                <div className="h-full opacity-50" style={{ background: "currentColor", width: step.width }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div className="bg-white rounded-xl p-5 mb-3.5 border border-[#D5DDE8] animate-fade-up" style={{ animationDelay: "0.35s" }}>
        <div className="flex justify-between items-end mb-3.5 pb-2.5 border-b border-[#EBF3F9]">
          <div className="text-lg font-semibold text-[#2A3A7A] flex items-center gap-2" style={{ fontFamily: "Georgia, serif" }}>
            Recent <em className="italic text-[#1fbfb8] font-normal">activity</em>
          </div>
          <a className="text-[11px] text-[#1978a5] flex items-center gap-1 uppercase tracking-wider font-semibold cursor-pointer hover:text-[#1fbfb8] transition-colors">
            View all <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
        <div className="flex flex-col">
          {activities.map((act, idx) => (
            <div
              key={act.id}
              className={`flex gap-3.5 py-3 ${idx !== activities.length - 1 ? "border-b border-[#EBF3F9]" : ""} relative animate-fade-up`}
              style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
            >
              <div className="text-[10px] text-[#1978a5] uppercase tracking-wider font-semibold w-[60px] flex-shrink-0 pt-1">
                {act.time}
              </div>
              <div className="relative">
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ background: dotColors[act.type] }}
                />
                {idx !== activities.length - 1 && (
                  <div className="absolute left-1/2 top-4 w-px h-8 -translate-x-1/2 bg-[#D5DDE8]" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-[#2A3A7A] font-medium leading-snug">
                  {act.title}
                  <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wider ml-2 ${tagClasses[act.type]}`}>
                    {act.badge}
                  </span>
                </div>
                <div className="text-[11px] text-[#1978a5] mt-0.5">{act.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 2 Cols */}
      <div className="grid grid-cols-2 gap-3.5 animate-fade-up" style={{ animationDelay: "0.5s" }}>
        <div className="bg-white rounded-xl p-5 border border-[#D5DDE8]">
          <div className="text-base font-semibold text-[#2A3A7A] flex items-center gap-2 mb-3.5 pb-2.5 border-b border-[#EBF3F9]" style={{ fontFamily: "Georgia, serif" }}>
            Quick <em className="italic text-[#1fbfb8] font-normal">actions</em>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Upload, title: "Upload CV", sub: "Analyze new", href: "/analyze" },
              { icon: Search, title: "Find jobs", sub: "12 today", href: "/jobs" },
              { icon: Mail, title: "Cover letter", sub: "AI write", href: "/cover-letter" },
              { icon: Mic, title: "Practice", sub: "Mock prep", href: "/interview" },
            ].map((qa, i) => {
              const Icon = qa.icon
              return (
                <Link
                  key={i}
                  href={qa.href}
                  className="group bg-white rounded-xl p-3.5 border border-[#D5DDE8] cursor-pointer transition-all hover:border-[#1fbfb8] hover:-translate-y-0.5 relative overflow-hidden"
                >
                  <Icon className="text-[22px] text-[#3D4E94] mb-2 h-5 w-5" />
                  <div className="text-xs font-semibold text-[#2A3A7A]">{qa.title}</div>
                  <div className="text-[10px] text-[#1978a5] mt-0.5 uppercase tracking-wide font-semibold">{qa.sub}</div>
                  <span className="absolute top-3.5 right-3.5 text-[#1fbfb8] opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-[#3D4E94] text-white rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -top-5 right-3.5 text-[120px]" style={{ fontFamily: "Georgia, serif", color: "rgba(31,191,184,0.18)", lineHeight: 1 }}>"</div>
          <div className="text-[9px] text-[#1fbfb8] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" />
            Tip of the day
          </div>
          <div className="text-sm leading-relaxed italic relative z-10 text-white" style={{ fontFamily: "Georgia, serif" }}>
            Adding action verbs like 'developed', 'led', 'shipped' to your CV bullets can boost your ATS score by up to 15%.
          </div>
          <div className="text-[10px] text-[#1fbfb8] mt-2.5 uppercase tracking-widest font-semibold">— Claude AI</div>
        </div>
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