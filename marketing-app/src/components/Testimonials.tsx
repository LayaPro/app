"use client";

const StarSvg = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const testimonials = [
  {
    text: "\u201CLaya Pro completely transformed how I run my wedding photography business. The client portal is a game-changer \u2014 my clients love it.\u201D",
    initials: "SJ",
    name: "Sarah Johnson",
    role: "Wedding Photographer",
  },
  {
    text: "\u201CManaging multiple photographers was a nightmare before. Now everything is organized, automated, and professional. We closed 3 more bookings in month one.\u201D",
    initials: "MC",
    name: "Michael Chen",
    role: "Studio Owner",
  },
  {
    text: "\u201CI was skeptical about switching platforms, but Laya Pro made it so easy. My clients constantly compliment the beautiful galleries. It\u2019s like having a full-time assistant!\u201D",
    initials: "ER",
    name: "Emily Rodriguez",
    role: "Portrait Photographer",
  },
];

const stats = [
  { value: "500+", label: "Active Studios" },
  { value: "98%", label: "Satisfaction" },
  { value: "4.9", label: "Average Rating" },
  { value: "10M+", label: "Photos Delivered" },
];

export function Testimonials() {
  return (
    <section className="py-[140px]" id="testimonials">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-[13px] font-semibold uppercase tracking-[4px] text-[var(--accent)] mb-5 anim fade-up">
            Testimonials
          </div>
          <div className="font-heading text-[clamp(36px,5vw,60px)] font-normal tracking-[-0.5px] leading-[1.1] mb-5 anim fade-up d1">
            Loved by <span className="gradient-word">photographers</span>
          </div>
          <p className="text-lg text-[var(--text-muted)] max-w-[500px] leading-[1.7] mx-auto anim fade-up d2">
            Real stories from real studios around the world.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-[60px]">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] p-8 transition-all duration-400 anim fade-up d${i + 1} hover:border-[rgba(99,102,241,0.12)] hover:-translate-y-1 hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.08)]`}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4 text-amber-500">
                {[...Array(5)].map((_, j) => (
                  <StarSvg key={j} />
                ))}
              </div>

              <p className="text-[15px] text-[var(--text-muted)] leading-[1.8] mb-6">{t.text}</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] flex items-center justify-center text-white font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{t.name}</h4>
                  <p className="text-xs text-[var(--text-dim)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-[60px]">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`text-center p-10 px-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-[20px] transition-all duration-400 anim fade-up d${i + 1} hover:border-[rgba(99,102,241,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)]`}
            >
              <div className="font-heading text-5xl font-normal bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-[var(--text-dim)] text-sm mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}