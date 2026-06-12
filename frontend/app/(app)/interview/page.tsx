"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Mic, Square, Play, Edit, ArrowLeft, ArrowRight,
  RefreshCw, Sparkles, Check, AlertTriangle,
  Code, User, Lightbulb, Clock, Star, Bolt,
  CheckCircle, Award
} from "lucide-react"
import { toast } from "@/lib/toast"

interface Question {
  index: number
  text: string
  category: "technical" | "behavioral" | "situational"
  mode: "written" | "voice"
  difficulty: "easy" | "medium" | "hard"
  hint?: string
}

interface Evaluation {
  technical_score: number
  skills_score: number
  confidence_score: number
  overall_score: number
  pace_analysis?: string
  tone_analysis?: string
  stress_level?: string
  strengths: string[]
  improvements: string[]
}

interface Session {
  id: string
  questions: Question[]
  status: string
  avg_score: number
  answered_count: number
}

export default function InterviewPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [writtenAnswer, setWrittenAnswer] = useState("")

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)

  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({})

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const generateSession = async () => {
    const cvId = localStorage.getItem("cvly_cv_id")
    const analysisId = localStorage.getItem("cvly_analysis_id")
    const token = localStorage.getItem("cvly_token")

    if (!cvId || !token) {
      setError("No CV found. Please analyze your CV first.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${baseUrl}/interview/generate`, {
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
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to generate questions")
      }

      const data = await res.json() as Session
      setSession(data)
      localStorage.setItem("cvly_interview_session_id", data.id)
      toast.success("Questions generated", "10 personalized questions ready")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setError(msg)
      toast.error("Failed to generate questions", msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void generateSession()
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      toast.info("Recording started", "Speak clearly into your microphone")

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            stopRecording()
            return 120
          }
          return prev + 1
        })
      }, 1000)

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "fr-FR"

        let finalTranscript = ""
        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript + " "
            }
          }
          setTranscript(finalTranscript.trim())
        }

        recognition.start()
        recognitionRef.current = recognition
      }
    } catch (err) {
      setError("Could not access microphone. Please allow microphone access.")
      toast.error("Microphone error", "Please allow microphone access")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) recognitionRef.current.stop()
      toast.success("Recording complete", "Click Evaluate to get AI feedback")
    }
  }

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const evaluateAnswer = async () => {
    if (!session) return
    const question = session.questions[currentIndex]
    const token = localStorage.getItem("cvly_token")

    if (question.mode === "written" && writtenAnswer.trim().length < 10) {
      setError("Please write a more detailed answer")
      toast.error("Answer too short", "Please provide a more detailed response")
      return
    }
    if (question.mode === "voice" && (!transcript || transcript.trim().length < 10)) {
      setError("Please record a longer voice answer")
      toast.error("Recording too short", "Please record a longer answer")
      return
    }

    setEvaluating(true)
    setError(null)
    const loadingId = toast.loading("Claude AI is evaluating your answer...")

    try {
      const res = await fetch(`${baseUrl}/interview/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: session.id,
          question_index: currentIndex,
          question_text: question.text,
          question_category: question.category,
          answer_mode: question.mode,
          written_answer: question.mode === "written" ? writtenAnswer : null,
          audio_transcript: question.mode === "voice" ? transcript : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Evaluation failed")
      }

      const data = await res.json() as Evaluation
      setEvaluation(data)
      setEvaluations(prev => ({ ...prev, [currentIndex]: data }))
      toast.dismiss(loadingId)
      toast.success("Evaluation complete", `Score: ${data.overall_score.toFixed(1)} / 10`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setError(msg)
      toast.dismiss(loadingId)
      toast.error("Evaluation failed", msg)
    } finally {
      setEvaluating(false)
    }
  }

  const goToQuestion = (index: number) => {
    setCurrentIndex(index)
    setWrittenAnswer("")
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscript("")
    setEvaluation(evaluations[index] || null)
    setRecordingTime(0)
    setError(null)
  }

  const nextQuestion = () => {
    if (session && currentIndex < session.questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-4 py-20 animate-fade-in">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
            <Mic className="absolute inset-0 m-auto h-6 w-6 text-teal-600 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-slate-700">Claude AI is preparing your interview questions...</p>
            <p className="text-xs text-slate-500 mt-1">5 written + 5 voice questions personalized to your CV</p>
          </div>
          <style jsx>{`
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-fade-in { animation: fade-in 0.4s ease; }
          `}</style>
        </div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-medium text-red-700 mb-4">{error}</p>
          <Link href="/analyze" className="rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-2.5 text-sm font-medium text-white hover:scale-105 transition-transform inline-flex">
            Analyze CV first
          </Link>
        </div>
      </div>
    )
  }

  if (!session) return null

  const question = session.questions[currentIndex]
  const answered = Object.keys(evaluations).length
  const avgScore = Object.values(evaluations).reduce((sum, e) => sum + e.overall_score, 0) / (answered || 1)
  const avgConfidence = Object.values(evaluations).reduce((sum, e) => sum + e.confidence_score, 0) / (answered || 1)
  const writtenCount = session.questions.filter(q => q.mode === "written").length
  const voiceCount = session.questions.filter(q => q.mode === "voice").length

  return (
    <div className="mx-auto max-w-5xl space-y-4">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between animate-fade-down">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 px-3 py-1 rounded-full text-[10px] font-medium mb-2 uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Interview Preparation</h2>
          <p className="text-sm text-slate-500 mt-1">
            Practice with 10 questions tailored to your CV and the job offer
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setLoading(true); void generateSession() }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:scale-105 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            New questions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up">
        <div className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.05s" }}>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-teal-100 to-teal-300 flex items-center justify-center mb-2">
            <Check className="h-4 w-4 text-teal-800" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{answered} / 10</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Answered</div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-amber-100 to-amber-300 flex items-center justify-center mb-2">
            <Star className="h-4 w-4 text-amber-800" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{avgScore.toFixed(1)}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg score</div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-rose-100 to-rose-300 flex items-center justify-center mb-2">
            <Bolt className="h-4 w-4 text-rose-800" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{avgConfidence.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Confidence</div>
        </div>
        <div className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-violet-100 to-violet-300 flex items-center justify-center mb-2">
            <Clock className="h-4 w-4 text-violet-800" />
          </div>
          <div className="text-xl font-semibold text-slate-900">{currentIndex + 1} / 10</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Current</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: "0.25s" }}>
        <div className={`rounded-xl border bg-white p-3 flex items-center gap-3 transition-all hover:shadow-md ${
          question.mode === "written"
            ? "border-violet-300 border-2 bg-gradient-to-br from-violet-50 to-white shadow-md"
            : "border-slate-200"
        }`}>
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-violet-100 to-violet-300 flex items-center justify-center">
            <Edit className="h-5 w-5 text-violet-700" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">Written Questions</div>
            <div className="text-xs text-slate-500">Type your answers</div>
          </div>
          <span className="bg-gradient-to-br from-teal-600 to-teal-800 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{writtenCount}</span>
        </div>
        <div className={`rounded-xl border bg-white p-3 flex items-center gap-3 transition-all hover:shadow-md ${
          question.mode === "voice"
            ? "border-amber-300 border-2 bg-gradient-to-br from-amber-50 to-white shadow-md"
            : "border-slate-200"
        }`}>
          <div className="h-10 w-10 rounded-md bg-gradient-to-br from-amber-100 to-amber-300 flex items-center justify-center">
            <Mic className="h-5 w-5 text-amber-800" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">Voice Questions</div>
            <div className="text-xs text-slate-500">Record with tone analysis</div>
          </div>
          <span className="bg-gradient-to-br from-teal-600 to-teal-800 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">{voiceCount}</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-teal-200 bg-white p-5 shadow-lg animate-fade-up" style={{ animationDelay: "0.3s" }}>
        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full opacity-70 pointer-events-none" />

        <div className="relative z-10 flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 text-white flex items-center justify-center font-semibold text-base shadow-lg shadow-teal-200">
            {question.index + 1}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                question.category === "technical" ? "bg-blue-50 text-blue-700" :
                question.category === "behavioral" ? "bg-amber-50 text-amber-800" :
                "bg-violet-50 text-violet-700"
              }`}>
                {question.category === "technical" ? <Code className="h-2.5 w-2.5" /> :
                 question.category === "behavioral" ? <User className="h-2.5 w-2.5" /> :
                 <Lightbulb className="h-2.5 w-2.5" />}
                {question.category}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700">
                {question.mode === "voice" ? <Mic className="h-2.5 w-2.5" /> : <Edit className="h-2.5 w-2.5" />}
                {question.mode} required
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                {question.difficulty}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">{question.text}</p>
            {question.hint && (
              <p className="text-xs text-slate-500 italic mt-2 flex items-center gap-1.5">
                <Lightbulb className="h-3 w-3 text-amber-500" />
                {question.hint}
              </p>
            )}
          </div>
        </div>

        {question.mode === "written" ? (
          <div className="relative z-10">
            <textarea
              value={writtenAnswer}
              onChange={(e) => setWrittenAnswer(e.target.value)}
              placeholder="Type your detailed answer here..."
              className="w-full min-h-[120px] p-3 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none resize-y transition-all"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-slate-500">
                {writtenAnswer.split(/\s+/).filter(Boolean).length} words
              </span>
              <button
                onClick={() => void evaluateAnswer()}
                disabled={evaluating || writtenAnswer.length < 10}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-2 text-sm font-medium text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-teal-200"
              >
                {evaluating ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />Evaluating...</>
                ) : (
                  <><Sparkles className="h-4 w-4" />Evaluate</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative z-10 rounded-xl border-2 border-dashed border-rose-300 bg-gradient-to-b from-rose-50 to-white p-6 text-center">
            <button
              onClick={isRecording ? stopRecording : () => void startRecording()}
              className={`relative inline-flex h-24 w-24 items-center justify-center rounded-full text-white shadow-2xl ${
                isRecording
                  ? "bg-gradient-to-br from-red-500 to-red-700 animate-pulse"
                  : "bg-gradient-to-br from-red-500 to-red-700 hover:scale-110 transition-transform"
              }`}
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
              )}
              {isRecording ? <Square className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
            </button>
            <div className="mt-4 text-sm font-medium text-rose-900">
              {isRecording ? "Recording..." : audioBlob ? "Recording complete" : "Click to start recording"}
            </div>
            <div className="text-xs font-mono text-slate-600 mt-1">
              {String(Math.floor(recordingTime / 60)).padStart(2, "0")}:{String(recordingTime % 60).padStart(2, "0")} / 02:00
            </div>

            {isRecording && (
              <div className="flex items-center justify-center gap-1 mt-3 h-8">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-b from-red-500 to-teal-400 rounded animate-wave"
                    style={{
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {audioBlob && !isRecording && (
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={playRecording}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 hover:bg-slate-50 hover:scale-105 transition-all"
                >
                  <Play className="h-3 w-3" />
                  Listen
                </button>
                <button
                  onClick={() => void evaluateAnswer()}
                  disabled={evaluating || !transcript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-md text-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-md"
                >
                  {evaluating ? (
                    <><RefreshCw className="h-3 w-3 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="h-3 w-3" />Evaluate</>
                  )}
                </button>
              </div>
            )}

            {transcript && (
              <div className="mt-3 p-2 bg-white border border-slate-200 rounded text-left animate-fade-up">
                <div className="text-[10px] font-medium text-slate-500 uppercase mb-1">Transcript</div>
                <p className="text-xs text-slate-700 italic">{transcript}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-up">
            {error}
          </div>
        )}

        {evaluation && (
          <div className="relative z-10 mt-4 rounded-xl border border-teal-200 bg-gradient-to-b from-teal-50 to-white p-4 shadow-md animate-scale-in">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-teal-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <span className="text-sm font-medium text-teal-900">Claude AI Analysis</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-teal-700 to-teal-900 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                <Award className="h-3.5 w-3.5" />
                {evaluation.overall_score.toFixed(1)} / 10
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Technical", value: evaluation.technical_score, color: "blue", Icon: Code },
                { label: "Skills", value: evaluation.skills_score, color: "teal", Icon: Lightbulb },
                { label: "Confidence", value: evaluation.confidence_score, color: "amber", Icon: Bolt },
              ].map((m, i) => (
                <div
                  key={m.label}
                  className="bg-white rounded-md p-2.5 text-center border border-slate-100 hover:shadow-md transition-shadow animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`mx-auto h-7 w-7 rounded-full bg-${m.color}-100 flex items-center justify-center mb-1`}>
                    <m.Icon className={`h-3.5 w-3.5 text-${m.color}-700`} />
                  </div>
                  <div className="text-lg font-semibold text-slate-900">{m.value}%</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">{m.label}</div>
                  <div className="h-1 bg-slate-100 rounded mt-1.5 overflow-hidden">
                    <div className={`h-full bg-${m.color}-500 rounded transition-all duration-1000`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {question.mode === "voice" && evaluation.pace_analysis && (
              <div className="bg-gradient-to-b from-amber-50 to-white border-l-4 border-amber-400 rounded p-3 mb-3 animate-fade-up">
                <div className="text-xs font-medium text-amber-900 mb-2 flex items-center gap-1">
                  🎤 Voice & emotion analysis
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded p-2 text-center hover:shadow-sm transition-shadow">
                    <div className="text-base">🎯</div>
                    <div className="text-[11px] font-medium text-amber-900">{evaluation.pace_analysis}</div>
                    <div className="text-[8px] text-amber-700 uppercase">Pace</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center hover:shadow-sm transition-shadow">
                    <div className="text-base">💪</div>
                    <div className="text-[11px] font-medium text-amber-900">{evaluation.tone_analysis}</div>
                    <div className="text-[8px] text-amber-700 uppercase">Tone</div>
                  </div>
                  <div className="bg-white rounded p-2 text-center hover:shadow-sm transition-shadow">
                    <div className="text-base">😌</div>
                    <div className="text-[11px] font-medium text-amber-900">{evaluation.stress_level}</div>
                    <div className="text-[8px] text-amber-700 uppercase">Stress</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-2">
              <div className="text-[10px] font-medium text-teal-700 uppercase mb-1 flex items-center gap-1">
                <CheckCircle className="h-2.5 w-2.5" />Strengths
              </div>
              <ul className="text-xs text-slate-700 space-y-0.5">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>• {s}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[10px] font-medium text-rose-700 uppercase mb-1 flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />Areas to improve
              </div>
              <ul className="text-xs text-slate-700 space-y-0.5">
                {evaluation.improvements.map((s, i) => (
                  <li key={i} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={nextQuestion}
          disabled={currentIndex >= session.questions.length - 1}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-2.5 text-sm font-medium text-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-lg shadow-teal-200"
        >
          Next question
          <ArrowRight className="h-4 w-4" />
        </button>
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
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes wave {
          0%, 100% { opacity: 0.4; transform: scaleY(0.5); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        .animate-fade-down { animation: fade-down 0.5s ease; }
        .animate-fade-up { animation: fade-up 0.5s ease backwards; }
        .animate-scale-in { animation: scale-in 0.4s ease; }
        .animate-wave { animation: wave 1s ease-in-out infinite; }
      `}</style>

    </div>
  )
}