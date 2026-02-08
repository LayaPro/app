"use client";

import Link from "next/link";
import { useAuthModal } from "./AuthModal";

export function Hero() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="min-h-screen flex flex-col justify-center items-center text-center relative pt-40 pb-20 px-6 overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[600px] h-[600px] bg-[rgba(99,102,241,0.08)] -top-[10%] -right-[10%]" />
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[500px] h-[500px] bg-[rgba(168,85,247,0.06)] -bottom-[15%] -left-[10%]" />
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[300px] h-[300px] bg-[rgba(59,130,246,0.05)] top-[40%] left-[50%]" />
      </div>

      {/* Badge */}
      <div className="anim fade-up relative z-10 inline-flex items-center gap-2 py-1.5 pl-4 pr-1.5 rounded-full border border-[var(--border)] bg-white/70 backdrop-blur-sm text-sm text-[var(--text-muted)] mb-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <div className="absolute -inset-1 rounded-full border-2 border-green-500/30 animate-[pulse-ring_2s_ease-out_infinite]" />
        </div>
        Now available worldwide
        <span className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white px-3.5 py-1 rounded-full font-semibold text-xs">
          New
        </span>
      </div>

      {/* Headline */}
      <h1 className="anim fade-up d1 relative z-10 font-heading text-[clamp(48px,8vw,96px)] font-normal leading-[1.1] tracking-[-1px] mb-8 max-w-[900px]">
        <span className="block">Your Photography</span>
        <span className="block">
          <span className="gradient-word">Business, Perfected</span>
        </span>
      </h1>

      {/* Subtitle */}
      <p className="anim fade-up d2 relative z-10 text-[clamp(17px,2vw,20px)] text-[var(--text-muted)] max-w-[560px] leading-[1.7] mb-12">
        From booking to delivery. One platform to manage events, galleries, clients and finances. Built for photographers who mean business.
      </p>

      {/* CTAs */}
      <div className="anim fade-up d3 relative z-10 flex items-center gap-4 flex-wrap justify-center">
        <button
          onClick={openAuthModal}
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[14px] text-base font-semibold transition-all duration-400 relative overflow-hidden bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white shadow-[0_4px_20px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 cursor-pointer"
        >
          Start Free Trial
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
        <Link
          href="#features"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[14px] text-base font-semibold no-underline transition-all duration-300 bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:text-[var(--text)] hover:border-black/[0.12] hover:bg-[var(--bg-elevated)]"
        >
          See Features
        </Link>
      </div>
    </section>
  );
}