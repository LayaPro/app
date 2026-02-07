"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export function Hero() {
  useEffect(() => {
    // Trigger animations on mount with a slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const animatedElements = document.querySelectorAll('.scale-in, .animate-on-scroll, .fade-in');
      animatedElements.forEach((el) => {
        el.classList.add('animated');
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-300/20 to-violet-300/20 rounded-full blur-3xl float-animation" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-violet-300/20 to-purple-300/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
        <div className="space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg scale-in delay-100">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">
              The Complete Photography Business Solution
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight animate-on-scroll delay-200">
            Manage Your Photography
            <br />
            <span className="gradient-text">Business with Ease</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed animate-on-scroll delay-300">
            From booking to delivery, streamline your entire workflow. Focus on
            capturing moments while we handle the rest.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 scale-in delay-400">
            <Link
              href="/signup"
              className="group inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover-scale transition-all"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center space-x-2 bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover-scale transition-all border border-gray-200"
            >
              <span>See How it Works</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
