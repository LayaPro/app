"use client";

import { UserPlus, Camera, Share2, CheckCircle } from "lucide-react";
import { useEffect, useRef } from "react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Sign Up & Setup",
    description:
      "Create your account in seconds. No credit card required. Set up your studio profile and branding in minutes.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Camera,
    number: "02",
    title: "Create Events",
    description:
      "Add your shoots, weddings, or projects. Set dates, assign team members, and configure workflows.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Share2,
    number: "03",
    title: "Upload & Organize",
    description:
      "Upload photos directly or from your camera. AI-powered tagging and smart albums make organization effortless.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "Share & Deliver",
    description:
      "Send beautiful galleries to clients. Track views, collect selections, and deliver final products seamlessly.",
    color: "from-orange-500 to-red-500",
  },
];

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div ref={ref} className={`relative animate-on-scroll delay-${index * 100 + 100}`}>
      <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover-lift">
        {/* Number Badge */}
        <div className="absolute -top-6 -left-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {step.number}
        </div>

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 ml-12 hover-rotate`}
        >
          <step.icon className="w-8 h-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
        <p className="text-gray-600 leading-relaxed">{step.description}</p>
      </div>

      {/* Connecting Line (except for last item) */}
      {index < steps.length - 1 && (
        <div className="hidden lg:block absolute top-1/2 -right-8 w-16 h-1 bg-gradient-to-r from-purple-300 to-pink-300" />
      )}
    </div>
  );
}

export function HowItWorks() {
  const headerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
          }
        });
      },
      { threshold: 0.1 }
    );

    [headerRef, ctaRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      [headerRef, ctaRef].forEach((ref) => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-32 bg-gradient-to-b from-purple-50/30 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="animate-on-scroll text-center mb-20">
          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Get Started in
            <br />
            <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From setup to delivery, our intuitive platform guides you every step
            of the way. No complex training required.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 relative">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div ref={ctaRef} className="animate-on-scroll delay-400 text-center mt-20">
          <p className="text-gray-600 mb-6 text-lg">
            Ready to streamline your photography workflow?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover-scale transition-all"
          >
            <span>Start Your Free Trial</span>
          </a>
        </div>
      </div>
    </section>
  );
}
