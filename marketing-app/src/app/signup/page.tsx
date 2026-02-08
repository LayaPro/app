"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    studioName: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [error, setError] = useState("");

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    
    // Redirect to Google OAuth
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const scope = "email profile";
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    
    window.location.href = googleAuthUrl;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Call your API to create tenant and user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantName: formData.studioName,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      // Store token, user, and tenant info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("tenantId", data.tenant.id);
      
      // Redirect to admin dashboard
      window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5173";
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[600px] h-[600px] bg-[rgba(99,102,241,0.08)] -top-[10%] -right-[10%]" />
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[500px] h-[500px] bg-[rgba(168,85,247,0.06)] -bottom-[15%] -left-[10%]" />
        <div className="absolute rounded-full blur-[120px] opacity-40 w-[300px] h-[300px] bg-[rgba(59,130,246,0.05)] top-[40%] left-[50%]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div className="bg-[var(--bg-card)] rounded-[24px] border border-[var(--border)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Header gradient accent */}
          <div className="h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)]" />
          
          <div className="p-8 pt-7">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="font-heading text-[28px] font-normal text-[var(--text)] mb-2">
                Start Your Free Trial
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                No credit card required • 14 days free
              </p>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-elevated)] transition-all font-semibold text-[15px] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-[var(--bg-card)] text-[var(--text-dim)]">Or sign up with email</span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleEmailSignup} className="space-y-3.5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="studioName" className="block text-[13px] font-medium text-[var(--text)] mb-1.5">
                  Studio Name
                </label>
                <input
                  id="studioName"
                  type="text"
                  required
                  value={formData.studioName}
                  onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text)] transition-all outline-none text-[15px]"
                  placeholder="Your Photography Studio"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block text-[13px] font-medium text-[var(--text)] mb-1.5">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text)] transition-all outline-none text-[15px]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-[var(--text)] mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text)] transition-all outline-none text-[15px]"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[13px] font-medium text-[var(--text)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text)] transition-all outline-none text-[15px]"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-[var(--text)] mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--text)] transition-all outline-none text-[15px]"
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] text-white py-3 rounded-xl font-semibold text-[15px] shadow-[0_4px_20px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="text-center text-xs text-[var(--text-dim)] mt-5">
              By signing up, you agree to our{" "}
              <a href="#" className="text-[var(--accent)] hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[var(--accent)] hover:underline">
                Privacy Policy
              </a>
            </p>

            {/* Login Link */}
            <p className="text-center text-sm text-[var(--text-muted)] mt-4 pt-5 border-t border-[var(--border)]">
              Already have an account?{" "}
              <Link href="/" className="text-[var(--accent)] hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
