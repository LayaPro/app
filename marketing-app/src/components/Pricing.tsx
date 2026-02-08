"use client";

import Link from "next/link";
import { useAuthModal } from "./AuthModal";

const CheckSvg = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const plans = [
  {
    name: "Starter",
    description: "For solo photographers",
    price: "$29",
    featured: false,
    features: [
      "5 events/month",
      "10GB storage",
      "Client portal",
      "Basic galleries",
      "Email support",
    ],
  },
  {
    name: "Professional",
    description: "For growing studios",
    price: "$79",
    featured: true,
    features: [
      "Unlimited events",
      "100GB storage",
      "Advanced portal",
      "Proposals & quotes",
      "Priority support",
      "Custom branding",
      "Analytics dashboard",
    ],
  },
  {
    name: "Enterprise",
    description: "For studios & agencies",
    price: "$199",
    featured: false,
    features: [
      "Unlimited everything",
      "500GB storage",
      "White-label",
      "Dedicated manager",
      "API access",
      "SLA guarantee",
    ],
  },
];

export function Pricing() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="py-[140px]" id="pricing">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-[13px] font-semibold uppercase tracking-[4px] text-[var(--accent)] mb-5 anim fade-up">
            Pricing
          </div>
          <div className="font-heading text-[clamp(36px,5vw,60px)] font-normal tracking-[-0.5px] leading-[1.1] mb-5 anim fade-up d1">
            Simple, transparent<br /><span className="gradient-word">pricing</span>
          </div>
          <p className="text-lg text-[var(--text-muted)] max-w-[500px] leading-[1.7] mx-auto anim fade-up d2">
            14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-[60px] max-w-[1100px] mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-[24px] p-10 px-8 transition-all duration-500 relative anim fade-up d${i + 1} hover:-translate-y-1 ${
                plan.featured
                  ? "bg-gradient-to-b from-[rgba(99,102,241,0.04)] to-[var(--bg-card)] border border-[rgba(99,102,241,0.2)] shadow-[0_4px_30px_rgba(99,102,241,0.08)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.12),0_20px_40px_-10px_rgba(0,0,0,0.06)]"
                  : "bg-[var(--bg-card)] border border-[var(--border)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white py-1.5 px-5 rounded-full text-xs font-bold tracking-[1px] uppercase">
                  Most Popular
                </div>
              )}

              <h3 className="font-heading text-[22px] font-bold mb-2">{plan.name}</h3>
              <p className="text-[var(--text-dim)] text-sm mb-6">{plan.description}</p>

              <div className="font-heading text-[56px] font-normal leading-none mb-1">
                {plan.price}
                <span className="text-base font-medium text-[var(--text-dim)]">/mo</span>
              </div>

              <button
                onClick={openAuthModal}
                className={`block w-full text-center py-3.5 rounded-xl font-semibold text-[15px] my-6 transition-all duration-300 cursor-pointer ${
                  plan.featured
                    ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white shadow-[0_3px_14px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_24px_rgba(99,102,241,0.3)]"
                    : "bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] hover:bg-[#e4e4e7] hover:border-black/10"
                }`}
              >
                Start Free Trial
              </button>

              <ul className="list-none space-y-0">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-2.5 py-2 text-sm text-[var(--text-muted)]">
                    <span className="text-[var(--accent)] flex-shrink-0">
                      <CheckSvg />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}