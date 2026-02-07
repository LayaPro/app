"use client";

import { Check, Sparkles, Zap, Crown } from "lucide-react";

const plans = [
  {
    name: "Starter",
    icon: Sparkles,
    price: "29",
    description: "Perfect for solo photographers just starting out",
    features: [
      "Up to 5 events per month",
      "10GB storage",
      "Client portal access",
      "Basic gallery features",
      "Email support",
      "Mobile app access",
    ],
    color: "from-blue-500 to-cyan-500",
    popular: false,
  },
  {
    name: "Professional",
    icon: Zap,
    price: "79",
    description: "For growing studios with multiple projects",
    features: [
      "Unlimited events",
      "100GB storage",
      "Advanced client portal",
      "Quotation & proposals",
      "Priority support",
      "Team collaboration (up to 5)",
      "Custom branding",
      "Analytics dashboard",
    ],
    color: "from-purple-500 to-pink-500",
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: "199",
    description: "For established studios and agencies",
    features: [
      "Unlimited everything",
      "500GB storage",
      "White-label solution",
      "Advanced workflows",
      "Dedicated account manager",
      "Unlimited team members",
      "API access",
      "Custom integrations",
      "SLA guarantee",
    ],
    color: "from-orange-500 to-red-500",
    popular: false,
  },
];

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof plans)[0];
  index: number;
}) {
  return (
    <div className={`relative ${plan.popular ? "lg:-mt-4" : ""}`}>
      {plan.popular && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
          Most Popular
        </div>
      )}

      <div
        className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${
          plan.popular
            ? "border-2 border-purple-500 lg:scale-105"
            : "border border-gray-200"
        }`}
      >
        {/* Card Content */}
        <div className="p-8">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}
          >
            <plan.icon className="w-7 h-7 text-white" />
          </div>

          {/* Plan Name */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 mb-6">{plan.description}</p>

          {/* Price */}
          <div className="mb-6">
            <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
            <span className="text-gray-600 ml-2">/month</span>
          </div>

          {/* CTA Button */}
          <a
            href="/signup"
            className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all ${
              plan.popular
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            Start Free Trial
          </a>

          {/* Features List */}
          <ul className="mt-8 space-y-4">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 md:py-32 bg-gradient-to-b from-white to-purple-50/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
            Pricing
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your
            <br />
            <span className="gradient-text">Perfect Plan</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Start with a 14-day free trial. No credit card required. Cancel
            anytime.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-green-500" />
            <span>All plans include 14-day free trial</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} plan={plan} index={index} />
          ))}
        </div>

        {/* FAQ Teaser */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Need a custom plan for your large studio?
          </p>
          <a
            href="#contact"
            className="text-purple-600 hover:text-purple-700 font-semibold underline"
          >
            Contact us for enterprise pricing
          </a>
        </div>
      </div>
    </section>
  );
}
