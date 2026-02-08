"use client";

import Link from "next/link";
import { useAuthModal } from "./AuthModal";

const CheckSvg = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function CTA() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="py-[140px] text-center relative overflow-hidden" id="cta">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(99,102,241,0.04)_0%,transparent_60%)] rounded-full" />

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="anim scale-up relative z-[2] bg-gradient-to-b from-[rgba(99,102,241,0.04)] to-[rgba(139,92,246,0.02)] border border-[rgba(99,102,241,0.1)] rounded-[32px] py-20 px-[60px] max-w-[900px] mx-auto">
          <h2 className="font-heading text-[clamp(36px,5vw,56px)] font-normal tracking-[-0.5px] leading-[1.1] mb-5">
            Ready to <span className="gradient-word">transform</span> your business?
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-[500px] mx-auto mb-10 leading-[1.7]">
            Join hundreds of photographers saving time, delighting clients, and growing with Laya Pro.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[14px] text-base font-semibold bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white shadow-[0_4px_20px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-all duration-400 cursor-pointer"
            >
              Start Free Trial
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[14px] text-base font-semibold no-underline bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:text-[var(--text)] hover:border-black/[0.12] hover:bg-[var(--bg-elevated)] transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-dim)]">
              <span className="text-[var(--accent)]"><CheckSvg /></span>
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-dim)]">
              <span className="text-[var(--accent)]"><CheckSvg /></span>
              No credit card
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[var(--text-dim)]">
              <span className="text-[var(--accent)]"><CheckSvg /></span>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}