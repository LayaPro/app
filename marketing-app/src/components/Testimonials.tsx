"use client";

import { Star, Quote } from "lucide-react";
import { useEffect, useRef } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Wedding Photographer",
    company: "Sarah J Photography",
    image: "SJ",
    content:
      "Laya Pro completely transformed how I run my wedding photography business. The client portal is a game-changer - my clients love being able to view and select their favorites instantly. I've saved countless hours on administrative work!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Studio Owner",
    company: "Chen Studios",
    image: "MC",
    content:
      "Managing multiple photographers and dozens of events was a nightmare before Laya Pro. Now everything is organized, automated, and professional. The ROI was immediate - we closed 3 more bookings in the first month just from the proposal feature.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Portrait Photographer",
    company: "ER Portraits",
    image: "ER",
    content:
      "I was skeptical about switching platforms, but Laya Pro made it so easy. The customer support is amazing, and my clients constantly compliment the beautiful galleries. It's like having a full-time assistant!",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Event Photographer",
    company: "DK Events",
    image: "DK",
    content:
      "The automation features are incredible. From booking to delivery, everything flows smoothly. I can focus on shooting while Laya Pro handles the business side. My client satisfaction scores have never been higher!",
    rating: 5,
  },
  {
    name: "Lisa Martinez",
    role: "Commercial Photographer",
    company: "Martinez Media",
    image: "LM",
    content:
      "As someone who shoots for both corporate clients and individuals, I needed flexibility. Laya Pro delivers perfectly. The custom branding and white-label options make me look incredibly professional.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Photography Studio",
    company: "Wilson & Co.",
    image: "JW",
    content:
      "We've tried 5 different platforms over the years. Laya Pro is by far the best. The team collaboration features are excellent, and the analytics help us make better business decisions. Highly recommend!",
    rating: 5,
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
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

  const delayClass =
    index % 3 === 0 ? "delay-100" : index % 3 === 1 ? "delay-200" : "delay-300";

  return (
    <div
      ref={ref}
      className={`animate-on-scroll ${delayClass} bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative hover-lift`}
    >
      {/* Quote Icon */}
      <Quote className="absolute top-6 right-6 w-8 h-8 text-purple-200" />

      {/* Stars */}
      <div className="flex space-x-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Content */}
      <p className="text-gray-600 mb-6 leading-relaxed">
        &quot;{testimonial.content}&quot;
      </p>

      {/* Author */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
          {testimonial.image}
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
          <p className="text-sm text-gray-600">
            {testimonial.role} • {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

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

    [headerRef, statsRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      [headerRef, statsRef].forEach((ref) => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  return (
    <section
      id="testimonials"
      className="py-20 md:py-32 bg-gradient-to-b from-purple-50/30 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="animate-on-scroll text-center mb-16">
          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Loved by Photographers
            <br />
            <span className="gradient-text">Worldwide</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don&apos;t just take our word for it. Here&apos;s what professional
            photographers say about Laya Pro.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Stats Section */}
        <div
          ref={statsRef}
          className="animate-on-scroll delay-300 mt-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="scale-in delay-100">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-purple-100">Customer Satisfaction</div>
            </div>
            <div className="scale-in delay-200">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9/5</div>
              <div className="text-purple-100">Average Rating</div>
            </div>
            <div className="scale-in delay-300">
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-purple-100">Active Studios</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
