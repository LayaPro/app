"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl float-animation" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-300/20 to-purple-300/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
        <div className="space-y-8 animate-on-scroll animated">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg scale-in animated delay-200">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">
              The Complete Photography Business Solution
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
            Manage Your Photography
            <br />
            <span className="gradient-text">Business with Ease</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From booking to delivery, streamline your entire workflow. Focus on
            capturing moments while we handle the rest.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="group inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover-scale transition-all"
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

          {/* Trust indicators */}
          <div className="pt-12 flex flex-col items-center space-y-4 fade-in animated delay-400">
            <p className="text-sm text-gray-500 font-medium">
              Trusted by professional photographers worldwide
            </p>
            <div className="flex items-center space-x-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-purple-600">500+</span>
                <span className="text-sm">Active Studios</span>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-purple-600">10K+</span>
                <span className="text-sm">Events Managed</span>
              </div>
              <div className="w-px h-8 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-purple-600">50K+</span>
                <span className="text-sm">Happy Clients</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image/Animation */}
        <div className="mt-16 relative animate-on-scroll animated delay-400">
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="bg-gray-800 px-4 py-3 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-12 h-12 text-purple-600" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">
                    Dashboard Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
