const testimonials = [
    {
      name: "Sarah Mansouri",
      role: "Web Developer",
      company: "Hired at Google",
      text: "Cvly helped me score 94% on ATS. I landed my dream job at Google in just 2 weeks! The AI optimization is absolutely incredible.",
      stars: 5,
      initials: "SM",
      color: "bg-green-600",
    },
    {
      name: "Karim Benali",
      role: "Data Analyst",
      company: "Hired at Amazon",
      text: "The cover letters were perfectly tailored to each offer. I saved hours of work and got 3x more interview callbacks.",
      stars: 5,
      initials: "KB",
      color: "bg-blue-600",
    },
    {
      name: "Marie Laurent",
      role: "Project Manager",
      company: "Hired at Microsoft",
      text: "Interview preparation gave me incredible confidence. The AI asked exactly the right questions. I highly recommend Cvly!",
      stars: 5,
      initials: "ML",
      color: "bg-violet-600",
    },
    {
      name: "Ahmed Khalil",
      role: "Software Engineer",
      company: "Hired at Meta",
      text: "My CV went from 45% to 92% ATS score in minutes. I was hired at Meta within a month. Best investment for my career!",
      stars: 5,
      initials: "AK",
      color: "bg-amber-500",
    },
  ]
  
  export default function Testimonials() {
    return (
      <section
        id="testimonials"
        className="bg-white py-24 px-6 lg:px-10"
      >
        <div className="max-w-6xl mx-auto">
  
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 text-sm font-medium">
                Testimonials
              </span>
            </div>
  
            <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
              Real Results from Real Job Seekers
            </h2>
  
            <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
              Discover what real candidates have to say about how Cvly
              helped them land their dream jobs faster.
            </p>
          </div>
  
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                {/* Name + role */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-slate-900 font-bold text-sm">
                      {t.name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
  
                {/* Text */}
                <p className="text-slate-600 text-sm leading-relaxed italic mb-4">
                &ldquo;{t.text}&rdquo;
                </p>
  
                {/* Stars */}
                <div className="flex gap-1">
                  {[...Array(t.stars)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
  
        </div>
      </section>
    )
  }