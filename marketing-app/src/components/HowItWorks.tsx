"use client";

const steps = [
  {
    num: "01",
    title: "Sign Up",
    description: "Create your account in seconds. Free for 14 days, no credit card needed.",
  },
  {
    num: "02",
    title: "Create Events",
    description: "Add shoots and projects. Set dates, assign team members, configure workflows.",
  },
  {
    num: "03",
    title: "Upload Photos",
    description: "Drag-and-drop uploads. AI tagging and smart albums organize everything.",
  },
  {
    num: "04",
    title: "Deliver & Grow",
    description: "Share galleries, get approvals, collect payments, and watch your business grow.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-[140px] relative" id="how-it-works">
      {/* Mesh bg */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[400px] h-[400px] bg-[rgba(99,102,241,0.04)] top-[20%] -left-[10%]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-[2]">
        <div className="text-center">
          <div className="text-[13px] font-semibold uppercase tracking-[4px] text-[var(--accent)] mb-5 anim fade-up">
            How It Works
          </div>
          <div className="font-heading text-[clamp(36px,5vw,60px)] font-normal tracking-[-0.5px] leading-[1.1] mb-5 mx-auto anim fade-up d1">
            Get started in <span className="gradient-word">4 steps</span>
          </div>
          <p className="text-lg text-[var(--text-muted)] max-w-[500px] leading-[1.7] mx-auto anim fade-up d2">
            No complex training. Our platform guides you from setup to delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-[60px] relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20" />

          {steps.map((step, i) => (
            <div
              key={i}
              className={`text-center p-10 px-6 rounded-[20px] transition-all duration-400 relative group hover:bg-[rgba(99,102,241,0.03)] anim fade-up d${i + 1}`}
            >
              <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 font-heading font-normal text-xl text-[var(--accent)] transition-all duration-400 relative z-[2] group-hover:bg-gradient-to-br group-hover:from-[var(--accent)] group-hover:to-[var(--accent-bright)] group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_4px_20px_rgba(99,102,241,0.25)]">
                {step.num}
              </div>
              <h3 className="font-heading text-lg font-normal mb-2.5">{step.title}</h3>
              <p className="text-sm text-[var(--text-dim)] leading-[1.7]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}