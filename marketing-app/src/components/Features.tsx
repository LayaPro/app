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
import { useEffect, useRef } from "react";
import { ScreenshotFrame } from "./ScreenshotFrame";

const features = [
  {
    icon: Calendar,
    title: "Smart Event Management",
    description:
      "Schedule shoots, track milestones, and never miss a deadline. Automated reminders keep you on top of every event.",
    color: "from-purple-500 to-pink-500",
    screenshot: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&auto=format&fit=crop",
  },
  {
    icon: Users,
    title: "Client Portal",
    description:
      "Give clients a beautiful branded space to view galleries, approve photos, and track their project progress in real-time.",
    color: "from-blue-500 to-cyan-500",
    screenshot: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
  },
  {
    icon: FileText,
    title: "Quotations & Proposals",
    description:
      "Create stunning proposals in minutes. Professional templates, e-signatures, and instant approvals to close deals faster.",
    color: "from-green-500 to-emerald-500",
    screenshot: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop",
  },
  {
    icon: Image,
    title: "Gallery Management",
    description:
      "Upload, organize, and share high-resolution photos effortlessly. Beautiful galleries that wow your clients every time.",
    color: "from-orange-500 to-red-500",
    screenshot: "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=800&auto=format&fit=crop",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Stay connected with instant updates on client actions, payment statuses, and project milestones.",
    color: "from-violet-500 to-purple-500",
    screenshot: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&auto=format&fit=crop",
  },
  {
    icon: Cloud,
    title: "Secure Cloud Storage",
    description:
      "Unlimited storage with enterprise-grade security. Your photos are safe, backed up, and accessible anywhere.",
    color: "from-teal-500 to-blue-500",
    screenshot: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Optimized performance means you spend less time waiting and more time creating. Upload hundreds of photos in seconds.",
    color: "from-yellow-500 to-orange-500",
    screenshot: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Bank-level encryption, automatic backups, and role-based access control to protect your business and client data.",
    color: "from-red-500 to-pink-500",
    screenshot: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop",
  },
  {
    icon: TrendingUp,
    title: "Business Analytics",
    description:
      "Track revenue, monitor project progress, and gain insights to grow your photography business with data-driven decisions.",
    color: "from-indigo-500 to-blue-500",
    screenshot: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop",
  },
  {
    icon: Heart,
    title: "Client Favorites",
    description:
      "Let clients mark their favorite photos, making selection and album creation a breeze for everyone involved.",
    color: "from-pink-500 to-rose-500",
    screenshot: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description:
      "Monitor time spent on each project, optimize your workflow, and ensure profitability across all your shoots.",
    color: "from-cyan-500 to-teal-500",
    screenshot: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop",
  },
  {
    icon: CheckCircle,
    title: "Approval Workflow",
    description:
      "Streamlined approval process with version control. Track edits, get client feedback, and finalize with confidence.",
    color: "from-lime-500 to-green-500",
    screenshot: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const delayClass = `delay-${Math.min(300 + index * 100, 800)}`;
  const isEven = index % 2 === 0;

  return (
    <div className={`animate-on-scroll ${delayClass}`}>
      <div className="bg-gradient-to-br from-indigo-50/30 via-white to-violet-50/30 py-12">
        <div className="px-8 sm:px-12 lg:px-16">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}>
            {/* Content Side */}
            <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
            </div>

            {/* Screenshot */}
            <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
              <ScreenshotFrame viewFrom={isEven ? 'left' : 'right'}>
                <img 
                  src={feature.screenshot} 
                  alt={feature.title}
                  className="w-full h-full object-cover"
                />
              </ScreenshotFrame>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    const items = document.querySelectorAll('#features .scale-in, #features .animate-on-scroll, #features .fade-in');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-gradient-to-b from-white to-indigo-50/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4 scale-in">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 animate-on-scroll delay-100">
            Everything You Need to
            <br />
            <span className="gradient-text">Run Your Studio</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-on-scroll delay-200">
            A complete suite of tools designed specifically for professional
            photographers. From first contact to final delivery, we&apos;ve got you
            covered.
          </p>
        </div>
      </div>

      <div className="space-y-20">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6 fade-in delay-300">
            And many more features to help you grow your business
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl hover-scale transition-all scale-in delay-400"
          >
            <span>See Pricing Plans</span>
          </a>
        </div>
      </div>
    </section>
  );
}
