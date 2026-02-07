"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Camera } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Laya Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-purple-600 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signup"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover-scale transition-all font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-6 animate-on-scroll animated">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-700 hover:text-purple-600 transition-colors font-medium px-4 py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/signup"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all font-semibold text-center mx-4"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
