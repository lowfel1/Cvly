import Link from "next/link"

export default function Hero() {
  return (
    <section className="bg-[#0D1F1A] pt-32 pb-16 px-6 lg:px-10">
      <div className="max-w-4xl mx-auto flex flex-col items-center text-center">

        
        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-amber-400 text-sm">★</span>
          ))}
          <span className="text-white/70 text-sm ml-1">4.9/5</span>
        </div>

        {/* Avatars */}
        <div className="flex items-center mb-2">
          {[
            { bg: "bg-green-600", letter: "S" },
            { bg: "bg-violet-600", letter: "K" },
            { bg: "bg-amber-500", letter: "M" },
            { bg: "bg-red-500", letter: "A" },
          ].map((av, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full border-2 border-[#0D1F1A] flex items-center justify-center text-white text-xs font-bold ${av.bg} ${i > 0 ? "-ml-2" : ""}`}
            >
              {av.letter}
            </div>
          ))}
          <div className="w-7 h-7 rounded-full border-2 border-[#0D1F1A] bg-white/15 -ml-2 flex items-center justify-center text-white text-[9px]">
            10K+
          </div>
        </div>

        <p className="text-white/50 text-xs mb-6">
          Over 10,000+ job seekers already hired with Cvly
        </p>

        {/* Title */}
        <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
          Land Your Dream Job<br />
          <span className="text-green-400">10x Faster</span> with AI.
        </h1>

        {/* Subtitle */}
        <p className="text-white/60 text-sm lg:text-base max-w-xl leading-relaxed mb-10">
          Cvly analyzes your resume, generates personalized cover letters,
          and prepares you for interviews in minutes using artificial intelligence.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-4 mb-16">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors text-sm"
          >
            Get Started now
            <span className="text-base">→</span>
          </Link>
          <button className="flex items-center gap-3 bg-white text-slate-900 font-medium pl-2.5 pr-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors text-sm">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-8 border-l-white ml-0.5" />
            </div>
            Watch Demo
          </button>
        </div>

        {/* Dashboard Mock */}
        <div className="w-full max-w-2xl">

          {/* Floating cards */}
          <div className="flex justify-between mb-3 px-2">
            <div className="flex items-center gap-3 bg-[#1A3A2E] border border-green-600/20 rounded-xl px-4 py-3">
              <div className="w-9 h-9 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-[10px] mb-0.5">ATS Score</p>
                <p className="text-white font-bold text-sm flex items-center gap-1">
                  94%
                  <span className="text-green-400 bg-green-600/20 text-[9px] px-1.5 py-0.5 rounded-full">
                    +8.5%
                  </span>
                </p>
                <p className="text-white/40 text-[9px]">vs last version</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#1A3A2E] border border-green-600/20 rounded-xl px-4 py-3">
              <div className="w-9 h-9 bg-green-600/20 rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                </svg>
              </div>
              <div>
                <p className="text-white/50 text-[10px] mb-0.5">Jobs Matched</p>
                <p className="text-white font-bold text-sm">124.89K+</p>
                <p className="text-white/40 text-[9px]">Available positions</p>
              </div>
            </div>
          </div>

          {/* Main dashboard card */}
          <div className="bg-[#132B24] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-white font-semibold text-sm">
                CV Analysis Results
              </span>
              <span className="bg-green-600/20 border border-green-600/30 text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                Score: 94%
              </span>
            </div>

            {[
              { label: "Keywords", value: 94, color: "bg-green-500", textColor: "text-green-400" },
              { label: "Format", value: 88, color: "bg-green-500", textColor: "text-green-400" },
              { label: "Skills Match", value: 76, color: "bg-amber-500", textColor: "text-amber-400" },
              { label: "Experience", value: 91, color: "bg-green-500", textColor: "text-green-400" },
              { label: "Education", value: 85, color: "bg-green-500", textColor: "text-green-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 mb-2.5">
                <span className="text-white/60 text-xs w-24 shrink-0">
                  {item.label}
                </span>
                <div className="flex-1 h-1.5 bg-white/8 rounded-full">
                  <div
                    className={`h-1.5 rounded-full ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className={`text-xs font-bold w-9 text-right ${item.textColor}`}>
                  {item.value}%
                </span>
              </div>
            ))}

            {/* Mini stats */}
            <div className="flex gap-2 mt-4">
              {[
                { num: "10x", label: "Faster applications" },
                { num: "95%", label: "Match rate" },
                { num: "24h", label: "Optimization" },
              ].map((stat) => (
                <div
                  key={stat.num}
                  className="flex-1 bg-white/5 border border-white/8 rounded-xl p-3 text-center"
                >
                  <p className="text-green-400 font-extrabold text-lg">{stat.num}</p>
                  <p className="text-white/50 text-[9px] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}