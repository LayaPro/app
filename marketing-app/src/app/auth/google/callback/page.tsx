"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Google authentication failed. Please try again.");
      setTimeout(() => {
        window.location.href = "/signup";
      }, 3000);
      return;
    }

    if (code) {
      handleGoogleCallback(code);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (code: string) => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Authentication failed");
        }

        const data = await response.json();

        // Success - redirect immediately
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:5173";
        const params = new URLSearchParams({
          token: data.token,
          user: JSON.stringify(data.user),
          tenantId: data.tenant?.id || '',
        });
        
        window.location.href = `${adminUrl}?${params.toString()}`;
        return;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
    }

    // Only show error if all retries failed
    setError(lastError?.message || "Authentication failed. Please try again.");
    setTimeout(() => {
      window.location.href = "/signup";
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
            <p className="text-gray-600">Redirecting you back to signup...</p>
          </div>
        ) : (
          <Loader2 className="w-16 h-16 animate-spin text-[#6366f1]" />
        )}
      </div>
    </div>
  );
}
