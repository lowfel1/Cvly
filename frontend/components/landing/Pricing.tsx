"use client"

import { useState } from "react"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Free Plan",
    description: "Perfect for job seekers getting started with AI-powered tools",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "3 ATS analyses per month",
      "Basic CV optimization",
      "1 cover letter per month",
      "Job matching (10/month)",
      "Basic dashboard",
    ],
  },
  {
    name: "Pro Plan",
    description: "Ideal for active job seekers who want unlimited AI assistance",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      "Unlimited ATS analyses",
      "Full CV optimization",
      "Unlimited cover letters",
      "Interview preparation",
      "Priority support",
    ],
  },
  {
    name: "Enterprise Plan",
    description: "Perfect for career coaches and large organizations",
    monthlyPrice: 49,
    yearlyPrice: 39,
    features: [
      "Everything in Pro",
      "Team access",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
  },
]

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section
      id="pricing"
      className="bg-[#0D1F1A] py-24 px-6 lg:px-10"
    >
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-600/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-green-400 text-sm font-medium">
              Pricing Plan
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
            Select a plan to accelerate<br />
            your job search
          </h2>

          <p className="text-white/60 text-sm max-w-xl leading-relaxed mb-8">
            Each package includes personalized AI tools to guarantee
            you land your dream job faster.
          </p>

          {/* Toggle Monthly/Yearly */}
          <div className="flex items-center bg-white/10 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                isYearly
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col"
            >
              {/* Plan name */}
              <h3 className="text-white font-bold text-lg mb-2">
                {plan.name}
              </h3>
              <p className="text-white/50 text-xs leading-relaxed mb-6">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-white font-extrabold text-4xl">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-white/50 text-sm ml-1">
                  / per month
                </span>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-white/80 text-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                      <Check width={11} height={11} className="text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button className="w-full text-green-400 hover:text-green-300 text-sm font-medium py-3 border-t border-white/10 transition-colors">
                Select This Plan
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}