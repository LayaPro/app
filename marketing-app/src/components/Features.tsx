"use client";

import {
  Calendar,
  Users,
  FileText,
  Image,
  Bell,
  Cloud,
  Zap,
  Shield,
  TrendingUp,
  Heart,
  Clock,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Event Management",
    description:
      "Schedule shoots, track milestones, and never miss a deadline. Automated reminders keep you on top of every event.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Client Portal",
    description:
      "Give clients a beautiful branded space to view galleries, approve photos, and track their project progress in real-time.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: FileText,
    title: "Quotations & Proposals",
    description:
      "Create stunning proposals in minutes. Professional templates, e-signatures, and instant approvals to close deals faster.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Image,
    title: "Gallery Management",
    description:
      "Upload, organize, and share high-resolution photos effortlessly. Beautiful galleries that wow your clients every time.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Stay connected with instant updates on client actions, payment statuses, and project milestones.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Cloud,
    title: "Secure Cloud Storage",
    description:
      "Unlimited storage with enterprise-grade security. Your photos are safe, backed up, and accessible anywhere.",
    color: "from-teal-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized performance means you spend less time waiting and more time creating. Upload hundreds of photos in seconds.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level encryption, automatic backups, and role-based access control to protect your business and client data.",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Business Analytics",
    description:
      "Track revenue, monitor project progress, and gain insights to grow your photography business with data-driven decisions.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: Heart,
    title: "Client Favorites",
    description:
      "Let clients mark their favorite photos, making selection and album creation a breeze for everyone involved.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "Monitor time spent on each project, optimize your workflow, and ensure profitability across all your shoots.",
    color: "from-cyan-500 to-teal-500",
  },
  {
    icon: CheckCircle,
    title: "Approval Workflow",
    description:
      "Streamlined approval process with version control. Track edits, get client feedback, and finalize with confidence.",
    color: "from-lime-500 to-green-500",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  return (
    <div className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
      <div className="flex flex-col h-full">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <feature.icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">
          {feature.title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
      </div>

      {/* Hover effect gradient border */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}
      />
    </div>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-gradient-to-b from-white to-purple-50/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need to
            <br />
            <span className="gradient-text">Run Your Studio</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A complete suite of tools designed specifically for professional
            photographers. From first contact to final delivery, we&apos;ve got you
            covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            And many more features to help you grow your business
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <span>See Pricing Plans</span>
          </a>
        </div>
      </div>
    </section>
  );
}
