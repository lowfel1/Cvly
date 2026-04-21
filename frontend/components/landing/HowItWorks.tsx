import Link from "next/link"
import { Upload, Zap, FileText, Rocket } from "lucide-react"

const steps = [
  {
    icon: Upload,
    title: "Upload your CV in PDF or Word",
  },
  {
    icon: Zap,
    title: "AI analyzes and scores instantly",
  },
  {
    icon: FileText,
    title: "Get optimized CV + cover letter",
  },
  {
    icon: Rocket,
    title: "Apply and track applications",
  },
]

const scores = [
  { label: "ATS Score", value: 94, color: "bg-green-500" },
  { label: "Keywords", value: 88, color: "bg-green-500" },
  { label: "Format", value: 92, color: "bg-green-500" },
  { label: "Skills", value: 76, color: "bg-amber-500" },
]

const stats = [
  { num: "10x", label: "Faster than manual applications", highlighted: false },
  { num: "95%", label: "CV to job offer match rate", highlighted: true },
  { num: "6", label: "Detailed ATS scores per CV", highlighted: false },
  { num: "24h", label: "Average CV optimization time", highlighted: false },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24 px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">

        {/* Top split layout */}
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-20">

          {/* Left — CV mock */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-sm mx-auto lg:mx-0">
              <h3 className="text-slate-900 font-bold text-sm mb-5">
                CV Optimization Result
              </h3>
              <div className="flex flex-col gap-3">
                {scores.map((score) => (
                  <div key={score.label} className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs w-20 shrink-0">
                      {score.label}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-2 rounded-full ${score.color}`}
                        style={{ width: `${score.value}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-bold w-8 text-right ${
                        score.color === "bg-amber-500"
                          ? "text-amber-500"
                          : "text-green-600"
                      }`}
                    >
                      {score.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — content */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-1.5 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 text-sm font-medium">
                How It Works
              </span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Optimizing your CV<br />
              has never been easier.
            </h2>

            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Our AI-powered system ensures your CV stands out to
              every ATS and recruiter, making your job search more
              efficient and effective.
            </p>

            {/* Steps grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <div
                    key={step.title}
                    className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon
                        className="text-green-600"
                        width={14}
                        height={14}
                      />
                    </div>
                    <span className="text-slate-700 text-xs leading-relaxed">
                      {step.title}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* CTA button */}
            <Link
              href="/register"
              className="inline-flex items-center gap-2 border border-slate-200 text-slate-900 hover:bg-gray-50 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Get Started now →
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.num}
              className={`rounded-2xl p-6 text-center ${
                stat.highlighted
                  ? "bg-green-600"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <p
                className={`text-3xl font-extrabold mb-2 ${
                  stat.highlighted ? "text-white" : "text-slate-900"
                }`}
              >
                {stat.num}
              </p>
              <p
                className={`text-xs leading-relaxed ${
                  stat.highlighted ? "text-green-100" : "text-slate-500"
                }`}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}