import {
    BarChart3,
    Mail,
    FileEdit,
    Target,
    Briefcase,
    LayoutDashboard,
  } from "lucide-react"
  
  const features = [
    {
      icon: BarChart3,
      title: "Complete ATS Analysis",
      description:
        "Get 6 detailed scores and fix your CV instantly to pass any ATS system.",
    },
    {
      icon: Mail,
      title: "AI Cover Letter",
      description:
        "Personalized for each company and position using Claude AI in seconds.",
    },
    {
      icon: FileEdit,
      title: "CV Optimization",
      description:
        "Rewrite in STAR format with keywords naturally integrated.",
    },
    {
      icon: Target,
      title: "Interview Preparation",
      description:
        "10 probable questions with detailed AI feedback and simulation.",
    },
    {
      icon: Briefcase,
      title: "Job Offer Matching",
      description:
        "Auto-match your CV with real job offers via Adzuna API.",
    },
    {
      icon: LayoutDashboard,
      title: "Application Dashboard",
      description:
        "Track all your applications in one Kanban dashboard.",
    },
  ]
  
  export default function Features() {
    return (
      <section
        id="features"
        className="bg-gray-50 py-24 px-6 lg:px-10"
      >
        <div className="max-w-6xl mx-auto">
  
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 text-sm font-medium">
                Features
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
              Job Search Reimagined<br />
              for Your Career
            </h2>
            <p className="text-slate-500 text-base max-w-xl leading-relaxed">
              Trust Cvly to deliver cutting-edge AI tools, transparency,
              and personalized results, all designed to help you land
              your dream job faster.
            </p>
          </div>
  
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-green-100 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
                    <Icon
                      className="text-green-600"
                      width={22}
                      height={22}
                    />
                  </div>
                  <h3 className="text-slate-900 font-bold text-base mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
  
          {/* Bottom arrow */}
          <div className="flex justify-center mt-12">
            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </div>
          </div>
  
        </div>
      </section>
    )
  }