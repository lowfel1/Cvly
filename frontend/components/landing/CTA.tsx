import Link from "next/link"

export default function CTA() {
  return (
    <section className="bg-[#0D1F1A] py-24 px-6 lg:px-10">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">

        {/* Stars */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-amber-400 text-lg">★</span>
          ))}
          <span className="text-white/70 text-sm ml-2">4.9/5</span>
        </div>

        {/* Avatars */}
        <div className="flex items-center mb-3">
          {[
            { bg: "bg-green-600", letter: "S" },
            { bg: "bg-violet-600", letter: "K" },
            { bg: "bg-amber-500", letter: "M" },
            { bg: "bg-red-500", letter: "A" },
          ].map((av, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-full border-2 border-[#0D1F1A] flex items-center justify-center text-white text-sm font-bold ${av.bg} ${i > 0 ? "-ml-2" : ""}`}
            >
              {av.letter}
            </div>
          ))}
          <div className="w-9 h-9 rounded-full border-2 border-[#0D1F1A] bg-white/15 -ml-2 flex items-center justify-center text-white text-[10px] font-medium">
            10K+
          </div>
        </div>

        <p className="text-white/50 text-sm mb-10">
          Over 10,000+ job seekers already hired with Cvly
        </p>

        {/* Title */}
        <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
          Empowering Your<br />
          <span className="text-green-400">Career Freedom</span>
        </h2>

        {/* Subtitle */}
        <p className="text-white/60 text-sm lg:text-base max-w-xl leading-relaxed mb-10">
          Trust Cvly to deliver cutting-edge AI tools, transparency,
          and personalized results, all designed to help you land
          your dream job faster.
        </p>

        {/* Button */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-full transition-colors text-sm"
        >
          Get Started now →
        </Link>

      </div>
    </section>
  )
}