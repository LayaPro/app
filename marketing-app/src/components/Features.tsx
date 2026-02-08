"use client";

import { useEffect } from "react";

const bentoCards = [
  {
    title: "Smart Event Management",
    description: "Schedule shoots, track milestones, and never miss a deadline. Automated reminders keep you on top of every event.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    span2: true,
  },
  {
    title: "Client Portal",
    description: "Beautiful branded spaces for clients to view galleries, approve photos, and track progress in real-time.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Proposals & Quotes",
    description: "Create stunning proposals in minutes. Professional templates and instant approvals.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Gallery Management",
    description: "Upload, organize, and share high-resolution photos effortlessly. Beautiful galleries that wow your clients every time they visit.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    span2: true,
  },
  {
    title: "Notifications",
    description: "Instant updates on client actions, payments, and milestones.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Analytics",
    description: "Track revenue, monitor progress, and gain insights to grow.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: "Enterprise Security",
    description: "Bank-level encryption, automatic backups, and role-based access.",
    icon: (
      <svg width="24" height="24" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const showcaseRows = [
  {
    tag: "Client Experience",
    title: (
      <>
        Galleries that make<br />clients say <span className="gradient-word">wow</span>
      </>
    ),
    description: "Share stunning, password-protected galleries. Clients can favorite, download, and comment — all from a beautiful branded portal.",
    features: [
      "Password-protected sharing",
      "Client favorites & selections",
      "Custom branding & domains",
    ],
    image: "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=800&auto=format&fit=crop",
    imageAlt: "Gallery",
    textAnim: "slide-l",
    visualAnim: "slide-r",
  },
  {
    tag: "Business Growth",
    title: (
      <>
        Proposals that <span className="gradient-word">close deals</span> faster
      </>
    ),
    description: "Create professional quotations with beautiful templates. E-signatures, instant approvals, and payment tracking built right in.",
    features: [
      "Professional templates",
      "E-signatures & approvals",
      "Payment tracking",
    ],
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop",
    imageAlt: "Proposals",
    textAnim: "slide-r",
    visualAnim: "slide-l",
  },
  {
    tag: "Data Insights",
    title: (
      <>
        Analytics to <span className="gradient-word">scale your</span> studio
      </>
    ),
    description: "Track revenue, monitor project profitability, and understand client behavior. Make data-driven decisions to grow your business.",
    features: [
      "Revenue tracking dashboard",
      "Project profitability reports",
      "Client engagement metrics",
    ],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
    imageAlt: "Analytics",
    textAnim: "slide-l",
    visualAnim: "slide-r",
  },
];

const CheckIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function Features() {
  // Bento card glow follow effect
  useEffect(() => {
    const cards = document.querySelectorAll(".bento-card");
    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      const card = mouseEvent.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = ((mouseEvent.clientX - rect.left) / rect.width) * 100;
      const y = ((mouseEvent.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--gx", x + "%");
      card.style.setProperty("--gy", y + "%");
    };
    cards.forEach((card) => card.addEventListener("mousemove", handleMouseMove));
    return () => {
      cards.forEach((card) => card.removeEventListener("mousemove", handleMouseMove));
    };
  }, []);

  return (
    <>
      {/* ═══════ BENTO GRID ═══════ */}
      <section className="py-[140px] relative" id="features">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-[13px] font-semibold uppercase tracking-[4px] text-[var(--accent)] mb-5 anim fade-up">
            Features
          </div>
          <div className="font-heading text-[clamp(36px,5vw,60px)] font-normal tracking-[-0.5px] leading-[1.1] mb-5 anim fade-up d1">
            Built for photographers<br />who <span className="gradient-word">mean business</span>
          </div>
          <p className="text-lg text-[var(--text-muted)] max-w-[500px] leading-[1.7] anim fade-up d2">
            Every tool you need to run your studio — from first contact to final delivery.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-[60px]" style={{ gridAutoRows: "minmax(260px, auto)" }}>
            {bentoCards.map((card, i) => (
              <div
                key={i}
                className={`bento-card bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] p-9 relative overflow-hidden transition-all duration-500 flex flex-col justify-end anim fade-up d${Math.min(i + 1, 7)} ${
                  card.span2 ? "lg:col-span-2" : ""
                } hover:border-[rgba(99,102,241,0.15)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08),0_0_20px_rgba(99,102,241,0.04)]`}
                style={{
                  ["--gx" as string]: "50%",
                  ["--gy" as string]: "50%",
                }}
              >
                {/* Hover glow effect */}
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(99,102,241,0.04) 0%, transparent 60%)",
                  }}
                />

                {/* Icon */}
                <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5 relative">
                  <div className="absolute -inset-0.5 rounded-[16px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] opacity-10" />
                  <div className="relative z-10">{card.icon}</div>
                </div>

                <h3 className="font-heading text-[22px] font-normal mb-2.5 relative">{card.title}</h3>
                <p className="text-[15px] text-[var(--text-muted)] leading-[1.7] relative">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SHOWCASE ROWS ═══════ */}
      <section className="py-10" id="showcase">
        <div className="max-w-[1200px] mx-auto px-6">
          {showcaseRows.map((row, i) => {
            const isEven = i % 2 !== 0;
            return (
              <div
                key={i}
                className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center py-[100px]"
              >
                {/* Text */}
                <div className={`anim ${row.textAnim} ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  <div className="text-xs font-bold uppercase tracking-[3px] text-[var(--accent)] mb-4">
                    {row.tag}
                  </div>
                  <h3 className="font-heading text-[40px] font-normal tracking-[-0.3px] leading-[1.15] mb-5">
                    {row.title}
                  </h3>
                  <p className="text-[17px] text-[var(--text-muted)] leading-[1.8] mb-8">
                    {row.description}
                  </p>
                  <ul className="flex flex-col gap-3.5 list-none">
                    {row.features.map((feat, j) => (
                      <li key={j} className="flex items-center gap-3 text-[15px] text-[var(--text-muted)]">
                        <span className="w-[22px] h-[22px] rounded-md bg-[rgba(99,102,241,0.08)] flex items-center justify-center flex-shrink-0">
                          <span className="text-[var(--accent)]">
                            <CheckIcon />
                          </span>
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual */}
                <div
                  className={`anim ${row.visualAnim} ${isEven ? "lg:order-1" : "lg:order-2"}`}
                  style={{ perspective: "1800px" }}
                >
                  <div
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[16px] overflow-hidden transition-transform duration-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:scale-[1.02]"
                    style={{
                      transform: isEven ? "rotateY(-12deg)" : "rotateY(12deg)",
                      transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = isEven ? "rotateY(-6deg) scale(1.02)" : "rotateY(6deg) scale(1.02)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = isEven ? "rotateY(-12deg)" : "rotateY(12deg)";
                    }}
                  >
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border)]">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28ca42" }} />
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.image}
                      alt={row.imageAlt}
                      className="w-full block h-[320px] object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}