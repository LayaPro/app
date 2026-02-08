"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, Menu, X } from "lucide-react";
import { useAuthModal } from "./AuthModal";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Reviews" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${
        isScrolled
          ? "py-3 bg-white/85 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
          : "py-5 bg-transparent"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="#" className="flex items-center gap-3 no-underline group">
            <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] rounded-[10px] flex items-center justify-center transition-transform duration-400 group-hover:rotate-[10deg] group-hover:scale-110"
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <Camera className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-heading text-[26px] text-[var(--text)]">
              Laya Pro
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="no-underline text-[var(--text-muted)] text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:text-[var(--text)] hover:bg-black/[0.04]"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={openAuthModal}
              className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white font-semibold text-sm px-6 py-2.5 rounded-[10px] shadow-[0_2px_12px_rgba(99,102,241,0.2)] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:-translate-y-px ml-2 cursor-pointer"
            >
              Start Free →
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-black/[0.04] transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-[var(--text)]" />
            ) : (
              <Menu className="w-6 h-6 text-[var(--text)]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-6">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="no-underline text-[var(--text-muted)] text-sm font-medium px-4 py-3 rounded-lg transition-colors hover:text-[var(--text)] hover:bg-black/[0.04]"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setIsMobileMenuOpen(false); openAuthModal(); }}
                className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white font-semibold text-sm px-6 py-3 rounded-[10px] text-center mt-2 cursor-pointer"
              >
                Start Free →
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}