"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvaos-confetti";
import {
  Download,
  GripVertical,
  Lightbulb,
  RotateCcw,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  RadarChart,          git push origin main

  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const STORAGE_ANALYSIS_KEY = "cvly_analysis";
const STORAGE_CV_ID_KEY = "cvly_cv_id";
const EXCELLENT_SCORE_THRESHOLD = 85;

interface AtsScores {
  keywords_match?: number;
  format_structure?: number;
  skills_match?: number;
  experience_match?: number;
  education_match?: number;
  overall_score?: number;
}

interface AtsAnalysisRaw {
  overall_score?: number;
  predicted_score?: number;
  analyzed_at?: string;
  scores?: AtsScores;
  keywords_found?: string[];
  keywords_missing?: string[];
  improvements?: (string | { title?: string; description?: string; text?: string })[];
}

interface AtsAnalysis {
  overallScore: number;
  predictedScore: number;
  analyzedAt: string | null;
  scores: {
    keywordsMatch: number;
    formatStructure: number;
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    overallScore: number;
  };
  keywordsFound: string[];
  keywordsMissing: string[];
  improvements: string[];
}

interface HistoryEntry {
  id: string;
  overall_score: number;
  keywords_score: number;
  format_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  created_at: string;
}

const DETAILED_SCORE_ITEMS: {
  key: keyof AtsAnalysis["scores"];
  label: string;
}[] = [
  { key: "keywordsMatch", label: "Keywords Match" },
  { key: "formatStructure", label: "Format & Structure" },
  { key: "skillsMatch", label: "Skills Match" },
  { key: "experienceMatch", label: "Experience Match" },
  { key: "educationMatch", label: "Education Match" },
  { key: "overallScore", label: "Overall Score" },
];

function getScoreColor(score: number): {
  stroke: string;
  text: string;
  bar: string;
  track: string;
} {
  if (score >= 80) {
    return { stroke: "#22c55e", text: "text-green-600", bar: "bg-green-500", track: "bg-green-100" };
  }
  if (score >= 60) {
    return { stroke: "#f97316", text: "text-orange-600", bar: "bg-orange-500", track: "bg-orange-100" };
  }
  return { stroke: "#ef4444", text: "text-red-600", bar: "bg-red-500", track: "bg-red-100" };
}

function computePredictedScore(overall: number, rawPredicted?: number): number {
  if (rawPredicted !== undefined && !Number.isNaN(Number(rawPredicted))) {
    return Math.min(100, Math.round(Number(rawPredicted)));
  }
  const gap = 100 - overall;
  return Math.min(100, Math.round(overall + Math.max(12, gap * 0.75)));
}

function normalizeAnalysis(raw: AtsAnalysisRaw): AtsAnalysis | null {
  const overall = raw.overall_score ?? raw.scores?.overall_score;
  if (overall === undefined || Number.isNaN(Number(overall))) return null;

  const overallRounded = Math.round(Number(overall));
  const scores = raw.scores ?? {};

  const improvements = (raw.improvements ?? []).map((item) => {
    if (typeof item === "string") return item;
    return item.title ?? item.description ?? item.text ?? "";
  }).filter(Boolean);

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
  };
}

function formatAnalysisDate(isoDate: string | null): string {
  if (!isoDate) return "Analysis date unavailable";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Analysis date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
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
  ];
  return lines.join("\n");
}

function fireConfettiCelebration() {
  const duration = 2800;
  const end = Date.now() + duration;
  const colors = ["#0F766E", "#22c55e", "#fbbf24", "#34d399", "#ccfbf1"];

  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
    confetti({ particleCount: 6, spread: 80, origin: { x: 0.5, y: 0.35 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  confetti({ particleCount: 100, spread: 70, origin: { y: 0.55 }, colors });
  frame();
}

function ScoreCircle({ score }: { score: number }) {
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={colors.stroke} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={offset} className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-4xl font-bold ${colors.text}`}>{score}%</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600">Overall ATS Score</p>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const colors = getScoreColor(score);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`shrink-0 text-sm font-semibold ${colors.text}`}>{score}%</span>
      </div>
      <div className={`h-2.5 w-full overflow-hidden rounded-full ${colors.track}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colors.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

function BeforeAfterSlider({ currentScore, predictedScore }: { currentScore: number; predictedScore: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.min(95, Math.max(5, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const gain = predictedScore - currentScore;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-[#0F766E]" strokeWidth={2} />
        <h3 className="text-base font-semibold text-gray-900">Before & After Optimization</h3>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Drag the slider to compare your current ATS score with the predicted score after CV optimization.
      </p>
      <div
        ref={containerRef}
        className="relative h-56 cursor-ew-resize select-none overflow-hidden rounded-xl sm:h-64"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0F766E] to-[#134e4a] px-6 text-white">
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-[#ccfbf1]">After Optimization</span>
          <span className="text-5xl font-bold sm:text-6xl">{predictedScore}%</span>
          <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">+{gain}% potential gain</span>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 px-6 text-white"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <span className="mb-1 text-xs font-medium uppercase tracking-wider text-orange-100">Current Score</span>
          <span className="text-5xl font-bold sm:text-6xl">{currentScore}%</span>
          <span className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">Your ATS score today</span>
        </div>
        <div
          className="absolute top-0 bottom-0 z-10 flex w-10 -translate-x-1/2 items-center justify-center"
          style={{ left: `${position}%` }}
        >
          <div className="flex h-12 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0F766E] shadow-lg">
            <GripVertical size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-md" />
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/30 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">Before</div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/30 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">After</div>
      </div>
      <div className="mt-4 flex justify-center gap-6 text-center text-sm">
        <div>
          <p className="font-semibold text-orange-600">{currentScore}%</p>
          <p className="text-xs text-gray-500">Current</p>
        </div>
        <div className="text-gray-300">→</div>
        <div>
          <p className="font-semibold text-[#0F766E]">{predictedScore}%</p>
          <p className="text-xs text-gray-500">Predicted</p>
        </div>
      </div>
    </div>
  );
}

// ✅ NOUVEAU — Radar Chart
function RadarChartSection({ scores }: { scores: AtsAnalysis["scores"] }) {
  const data = [
    { subject: "Keywords", score: scores.keywordsMatch },
    { subject: "Format", score: scores.formatStructure },
    { subject: "Skills", score: scores.skillsMatch },
    { subject: "Experience", score: scores.experienceMatch },
    { subject: "Education", score: scores.educationMatch },
    { subject: "Overall", score: scores.overallScore },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        Competency Radar
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Visual overview of your CV strengths across all categories
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "#64748B" }}
          />
          <Radar
            dataKey="score"
            stroke="#0F766E"
            fill="#0F766E"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ✅ NOUVEAU — Score History
function ScoreHistorySection({ cvId }: { cvId: string | null }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cvId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("cvly_token");
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

        const res = await fetch(`${baseUrl}/ats/analyses/${cvId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json() as HistoryEntry[];
          setHistory(data);
        }
      } catch {
        // Silent fail — history is optional
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [cvId]);

  // Formater les données pour le graphe
  const chartData = history.map((entry, index) => ({
    name: `Analysis ${index + 1}`,
    score: entry.overall_score,
    date: new Date(entry.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  })).reverse();

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Score History</h3>
        <div className="flex h-40 items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-[#0F766E]" fill="none" viewBox="0 0 24 24" aria-label="Loading">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  if (chartData.length <= 1) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-2 text-base font-semibold text-gray-900">Score History</h3>
        <p className="text-sm text-gray-500">
          Analyze your CV multiple times to track your progress over time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-1 text-base font-semibold text-gray-900">Score History</h3>
      <p className="mb-5 text-sm text-gray-500">
        Your ATS score progression across analyses
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
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
            strokeWidth={2.5}
            dot={{ r: 5, fill: "#0F766E", strokeWidth: 0 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F5EE]">
        <RotateCcw size={24} className="text-[#0F766E]" strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">No analysis found</h3>
      <p className="mb-6 max-w-md text-sm text-gray-500">
        Run an ATS analysis on your CV to see your score, keyword matches, and improvement suggestions.
      </p>
      <Link href="/analyze" className="rounded-lg bg-[#0F766E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d6b63]">
        Analyze CV
      </Link>
    </div>
  );
}

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null);
  const [cvId, setCvId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    const storedAnalysis = localStorage.getItem(STORAGE_ANALYSIS_KEY);
    const storedCvId = localStorage.getItem(STORAGE_CV_ID_KEY);

    if (storedCvId) setCvId(storedCvId);

    if (storedAnalysis) {
      try {
        const parsed = JSON.parse(storedAnalysis) as AtsAnalysisRaw;
        const normalized = normalizeAnalysis(parsed);
        if (normalized) setAnalysis(normalized);
      } catch {
        // Invalid JSON
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!analysis || analysis.overallScore <= EXCELLENT_SCORE_THRESHOLD || confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    const timer = window.setTimeout(() => { fireConfettiCelebration(); }, 400);
    return () => window.clearTimeout(timer);
  }, [analysis]);

  const handleShare = async () => {
    if (!analysis) return;
    const shareText = `I scored ${analysis.overallScore}% on my ATS analysis with Cvly! Predicted after optimization: ${analysis.predictedScore}%.`;
    const shareData = { title: "Cvly ATS Results", text: shareText, url: typeof window !== "undefined" ? window.location.href : "" };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareFeedback("Shared!");
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url}`);
        setShareFeedback("Copied to clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareData.url}`);
        setShareFeedback("Copied to clipboard!");
      } catch {
        setShareFeedback("Unable to share");
      }
    }
    window.setTimeout(() => setShareFeedback(null), 2500);
  };

  const handleDownload = () => {
    if (!analysis) return;
    const report = buildResultsReport(analysis);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `cvly-ats-results-${dateStamp}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setShareFeedback("Download started!");
    window.setTimeout(() => setShareFeedback(null), 2500);
  };

  const isExcellentMatch = analysis !== null && analysis.overallScore > EXCELLENT_SCORE_THRESHOLD;

  if (!hydrated) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#0F766E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!analysis) {
    return <div className="mx-auto max-w-5xl"><EmptyState /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">ATS Analysis Results</h2>
          <p className="mt-1 text-sm text-gray-500">{formatAnalysisDate(analysis.analyzedAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {shareFeedback && (
            <span className="w-full text-xs font-medium text-[#0F766E] sm:w-auto">{shareFeedback}</span>
          )}
          <button type="button" onClick={() => void handleShare()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#0F766E] hover:text-[#0F766E]">
            <Share2 size={16} strokeWidth={2} />Share Results
          </button>
          <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#0F766E] hover:text-[#0F766E]">
            <Download size={16} strokeWidth={2} />Download Results
          </button>
          <Link href="/analyze" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#0F766E] bg-white px-4 py-2 text-sm font-medium text-[#0F766E] transition-colors hover:bg-[#E1F5EE]">
            <RotateCcw size={16} strokeWidth={2} />Analyze Again
          </Link>
        </div>
      </div>

      {/* Excellent match */}
      {isExcellentMatch && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-[#F0FDF9] px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Sparkles size={20} className="text-green-600" strokeWidth={2} />
          </div>
          <p className="text-base font-semibold text-green-800">Excellent match! 🎉</p>
        </div>
      )}

      {/* Overall score */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white px-6 py-10">
        <ScoreCircle score={analysis.overallScore} />
      </div>

      {/* Before/After slider */}
      <div className="mb-8">
        <BeforeAfterSlider currentScore={analysis.overallScore} predictedScore={analysis.predictedScore} />
      </div>

      {/* Score breakdown */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-5 text-base font-semibold text-gray-900">Score Breakdown</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {DETAILED_SCORE_ITEMS.map((item) => (
            <ScoreBar key={item.key} label={item.label} score={analysis.scores[item.key]} />
          ))}
        </div>
      </div>

      {/* ✅ NOUVEAU — Radar Chart + Score History côte à côte */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RadarChartSection scores={analysis.scores} />
        <ScoreHistorySection cvId={cvId} />
      </div>

      {/* Keywords */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Keywords Found</h3>
          {analysis.keywordsFound.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordsFound.map((keyword) => (
                <span key={keyword} className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">{keyword}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No matching keywords found.</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-gray-900">Keywords Missing</h3>
          {analysis.keywordsMissing.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.keywordsMissing.map((keyword) => (
                <span key={keyword} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{keyword}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No missing keywords detected.</p>
          )}
        </div>
      </div>

      {/* Improvements */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Suggested Improvements</h3>
        {analysis.improvements.length > 0 ? (
          <ul className="space-y-3">
            {analysis.improvements.map((suggestion, index) => (
              <li key={`${index}-${suggestion.slice(0, 24)}`} className="flex gap-3 rounded-lg border border-gray-100 bg-[#F8FAFC] px-4 py-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                  <Lightbulb size={16} className="text-yellow-600" strokeWidth={2} aria-hidden="true" />
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{suggestion}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No improvement suggestions available.</p>
        )}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/cv-optimizer" className="inline-flex items-center justify-center rounded-lg bg-[#0F766E] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0d6b63]">
          Optimize my CV
        </Link>
        <Link href="/cover-letter" className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-[#0F766E] hover:text-[#0F766E]">
          Generate Cover Letter
        </Link>
      </div>

    </div>
  );
}

