"use client";

export function Marquee() {
  const items = [
    "Event Management",
    "Client Portal",
    "Gallery Delivery",
    "Proposals & Quotes",
    "Cloud Storage",
    "Analytics",
    "Team Collaboration",
    "Approval Workflow",
  ];

  // Double the items for seamless loop
  const allItems = [...items, ...items];

  return (
    <section className="py-[60px] border-t border-b border-[rgba(99,102,241,0.08)] overflow-hidden bg-gradient-to-r from-[rgba(99,102,241,0.04)] via-[rgba(99,102,241,0.07)] to-[rgba(99,102,241,0.04)]">
      <div
        className="flex w-max"
        style={{ animation: "marquee 30s linear infinite" }}
      >
        {allItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-10 whitespace-nowrap font-heading text-base font-normal text-[var(--text-dim)]"
          >
            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
