import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // Split-screen shell: form (left) + marketing panel (right, lg+).
    <div className="flex min-h-screen flex-row">
      {/* Left column: auth form */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          {/* Brand row: teal rounded icon + wordmark (SoftQA-style) */}
          <div className="mb-10 flex items-center">
            <div
              className="rounded-lg bg-teal-700 p-1.5 text-white"
              aria-hidden="true"
            >
              <span className="block font-mono text-sm font-semibold leading-none">
                {"{}"}
              </span>
            </div>
            <span className="ml-2 font-semibold text-slate-900">Cvly</span>
          </div>

          {children}
        </div>
      </div>

      {/* Right column: marketing (desktop only) */}
      <div className="hidden min-h-screen flex-col justify-between bg-linear-to-br from-teal-900 to-teal-700 p-12 lg:flex lg:w-1/2">
        <div>
          <h2 className="text-4xl font-bold leading-tight text-white">
            Land Your Dream Job
            <br />
            10x Faster with AI
          </h2>

          {/* Testimonial card */}
          <div className="mt-8 rounded-2xl bg-white/10 p-6 backdrop-blur">
            <p className="text-6xl leading-none text-white/40">&ldquo;</p>
            <p className="text-lg italic text-white">
              Cvly helped me optimize my resume and land my dream job at Google in just 2
              weeks!
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                SM
              </div>
              <div>
                <p className="font-medium text-white">Sarah Mansouri</p>
                <p className="text-sm text-white/70">Web Developer</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-4 text-xs font-medium tracking-widest text-white/60">
            JOIN 10K+ JOB SEEKERS
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-white">10x</p>
              <p className="text-xs text-white/70">Faster applications</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">95%</p>
              <p className="text-xs text-white/70">CV match rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">6</p>
              <p className="text-xs text-white/70">ATS scores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
