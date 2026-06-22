"use client"

import { useEffect, useState } from "react"
import {
  DragDropContext, Droppable, Draggable, DropResult
} from "@hello-pangea/dnd"
import {
  Briefcase, Plus, Building, MapPin, Calendar,
  Trash2, ExternalLink, TrendingUp, Send, Clock,
  Award, X, Users
} from "lucide-react"
import { toast } from "@/lib/toast"

interface Application {
  id: string
  job_title: string
  company: string
  location?: string
  external_url?: string
  contract_type?: string
  salary_min?: number
  salary_max?: number
  status: string
  applied_date?: string
  interview_date?: string
  notes?: string
  next_step?: string
  position: number
}

interface Stats {
  total: number
  applied: number
  review: number
  interview: number
  offer: number
  rejected: number
  response_rate: number
}

const COLUMNS = [
  { id: "applied", label: "Applied", color: "blue", icon: Send },
  { id: "review", label: "In Review", color: "amber", icon: Clock },
  { id: "interview", label: "Interview", color: "violet", icon: Users },
  { id: "offer", label: "Offer", color: "teal", icon: Award },
  { id: "rejected", label: "Rejected", color: "rose", icon: X },
]

const STATUS_OPTIONS = [
  { value: "applied", label: "📤 Applied (just sent)" },
  { value: "review", label: "👀 In Review (recruiter saw it)" },
  { value: "interview", label: "💬 Interview scheduled" },
  { value: "offer", label: "🎉 Offer received" },
  { value: "rejected", label: "❌ Rejected" },
]

const INITIAL_NEW_APP = {
  job_title: "",
  company: "",
  location: "",
  contract_type: "",
  status: "applied",
  salary_min: "",
  salary_max: "",
  external_url: "",
  notes: "",
}

function getColumnClasses(color: string) {
  const map: Record<string, { bg: string; border: string; text: string; ring: string }> = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", ring: "ring-blue-300" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", ring: "ring-amber-300" },
    violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", ring: "ring-violet-300" },
    teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", ring: "ring-teal-300" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", ring: "ring-rose-300" },
  }
  return map[color] || map.blue
}

function getCompanyInitials(name: string): string {
  if (!name) return "??"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newApp, setNewApp] = useState(INITIAL_NEW_APP)

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const fetchApplications = async () => {
    const token = localStorage.getItem("cvly_token")
    if (!token) return

    try {
      const [appsRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/applications/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/applications/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (appsRes.ok) {
        const data = await appsRes.json()
        setApplications(data)
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch {
      toast.error("Failed to load applications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchApplications()
  }, [])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceStatus = result.source.droppableId
    const destStatus = result.destination.droppableId

    if (sourceStatus === destStatus) return

    const appId = result.draggableId
    const token = localStorage.getItem("cvly_token")

    setApplications(prev =>
      prev.map(a => a.id === appId ? { ...a, status: destStatus } : a)
    )

    try {
      await fetch(`${baseUrl}/applications/${appId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: destStatus }),
      })
      toast.success(`Moved to ${destStatus}`)
      void fetchApplications()
    } catch {
      toast.error("Failed to update")
      void fetchApplications()
    }
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("cvly_token")
    setApplications(prev => prev.filter(a => a.id !== id))

    try {
      await fetch(`${baseUrl}/applications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("Application deleted")
      void fetchApplications()
    } catch {
      toast.error("Failed to delete")
      void fetchApplications()
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setNewApp(INITIAL_NEW_APP)
  }

  const handleAdd = async () => {
    if (!newApp.job_title || !newApp.company) {
      toast.error("Job title and company are required")
      return
    }

    const token = localStorage.getItem("cvly_token")

    // Build payload: convert empty strings to null for optional fields,
    // convert salary strings to numbers
    const payload = {
      job_title: newApp.job_title,
      company: newApp.company,
      location: newApp.location || null,
      contract_type: newApp.contract_type || null,
      status: newApp.status,
      salary_min: newApp.salary_min ? Number(newApp.salary_min) : null,
      salary_max: newApp.salary_max ? Number(newApp.salary_max) : null,
      external_url: newApp.external_url || null,
      notes: newApp.notes || null,
    }

    try {
      const res = await fetch(`${baseUrl}/applications/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === newApp.status)?.label ?? newApp.status
        toast.success(`Application added in ${statusLabel}`)
        handleCloseModal()
        void fetchApplications()
      } else {
        toast.error("Failed to add application")
      }
    } catch {
      toast.error("Failed to add application")
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
      </div>
    )
  }

  const appsByStatus = (status: string) => applications.filter(a => a.status === status)

  return (
    <div className="mx-auto max-w-7xl space-y-4">

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between animate-fade-down">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-800 px-3 py-1 rounded-full text-[10px] font-medium mb-2 uppercase tracking-widest">
            <Briefcase className="h-3 w-3" />
            Track your applications
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Applications</h2>
          <p className="text-sm text-slate-500 mt-1">
            Drag and drop to update status of your job applications
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-2 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-200"
        >
          <Plus className="h-4 w-4" />
          Add Application
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-teal-100 to-teal-300 flex items-center justify-center mb-2">
              <Briefcase className="h-4 w-4 text-teal-800" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{stats.total}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total applications</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-amber-100 to-amber-300 flex items-center justify-center mb-2">
              <TrendingUp className="h-4 w-4 text-amber-800" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{stats.response_rate}%</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Response rate</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-violet-100 to-violet-300 flex items-center justify-center mb-2">
              <Users className="h-4 w-4 text-violet-800" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{stats.interview}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Interviews</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-teal-100 to-teal-300 flex items-center justify-center mb-2">
              <Award className="h-4 w-4 text-teal-800" />
            </div>
            <div className="text-2xl font-semibold text-slate-900">{stats.offer}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Offers</div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {COLUMNS.map((column) => {
            const colorClasses = getColumnClasses(column.color)
            const Icon = column.icon
            const columnApps = appsByStatus(column.id)

            return (
              <div key={column.id} className="flex flex-col">
                <div className={`rounded-t-xl border-t border-l border-r ${colorClasses.border} ${colorClasses.bg} px-3 py-2.5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${colorClasses.text}`} />
                      <span className={`text-xs font-medium ${colorClasses.text}`}>{column.label}</span>
                    </div>
                    <span className={`bg-white ${colorClasses.text} text-[10px] px-2 py-0.5 rounded-full font-medium border ${colorClasses.border}`}>
                      {columnApps.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[400px] rounded-b-xl border ${colorClasses.border} ${
                        snapshot.isDraggingOver
                          ? `${colorClasses.bg} ring-2 ${colorClasses.ring}`
                          : "bg-slate-50/50"
                      } p-2 space-y-2 transition-colors`}
                    >
                      {columnApps.length === 0 && (
                        <div className="text-center py-8 text-xs text-slate-400 italic">
                          Drop here
                        </div>
                      )}

                      {columnApps.map((app, index) => (
                        <Draggable key={app.id} draggableId={app.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`group rounded-lg border border-slate-200 bg-white p-3 transition-all ${
                                snapshot.isDragging
                                  ? "shadow-2xl rotate-2 scale-105"
                                  : "shadow-sm hover:shadow-md hover:-translate-y-0.5"
                              }`}
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center font-medium text-teal-800 text-[10px] shrink-0">
                                  {getCompanyInitials(app.company)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium text-slate-900 leading-snug line-clamp-2">
                                    {app.job_title}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                    <Building className="h-2.5 w-2.5 shrink-0" />
                                    {app.company}
                                  </p>
                                </div>
                              </div>

                              {app.location && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-1 truncate">
                                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                                  {app.location}
                                </div>
                              )}

                              {app.applied_date && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-2">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {formatDate(app.applied_date)}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                {app.external_url ? (
                                 <a  
                                    href={app.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-teal-700 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    View
                                  </a>
                                ) : <span />}
                                <button
                                  onClick={() => handleDelete(app.id)}
                                  className="text-rose-500 hover:bg-rose-50 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Add Application</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Job title *</label>
                <input
                  type="text"
                  value={newApp.job_title}
                  onChange={(e) => setNewApp({ ...newApp, job_title: e.target.value })}
                  placeholder="e.g. Frontend Developer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Company *</label>
                <input
                  type="text"
                  value={newApp.company}
                  onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                  placeholder="e.g. Google"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Location</label>
                <input
                  type="text"
                  value={newApp.location}
                  onChange={(e) => setNewApp({ ...newApp, location: e.target.value })}
                  placeholder="e.g. Casablanca, Maroc"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                />
              </div>

              {/* ⭐ NOUVEAU : Choix du statut initial */}
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Current status</label>
                <select
                  value={newApp.status}
                  onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-teal-500 focus:outline-none"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select where this application currently is in the process
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Contract type</label>
                <select
                  value={newApp.contract_type}
                  onChange={(e) => setNewApp({ ...newApp, contract_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Select...</option>
                  <option value="internship">Internship</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Salary min (MAD)</label>
                  <input
                    type="number"
                    value={newApp.salary_min}
                    onChange={(e) => setNewApp({ ...newApp, salary_min: e.target.value })}
                    placeholder="3000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Salary max (MAD)</label>
                  <input
                    type="number"
                    value={newApp.salary_max}
                    onChange={(e) => setNewApp({ ...newApp, salary_max: e.target.value })}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Job URL (optional)</label>
                <input
                  type="url"
                  value={newApp.external_url}
                  onChange={(e) => setNewApp({ ...newApp, external_url: e.target.value })}
                  placeholder="https://example.com/job-offer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Notes</label>
                <textarea
                  value={newApp.notes}
                  onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleAdd()}
                className="flex-1 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 px-4 py-2 text-sm font-medium text-white hover:scale-105 transition-transform shadow-md"
              >
                Add to Kanban
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-down { animation: fade-down 0.5s ease; }
        .animate-fade-up { animation: fade-up 0.5s ease backwards; }
        .animate-fade-in { animation: fade-in 0.3s ease; }
        .animate-scale-in { animation: scale-in 0.4s ease; }
      `}</style>

    </div>
  )
}