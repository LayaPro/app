"use client";

import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ScrollAnimator } from "@/components/ScrollAnimator";
import { CursorGlow } from "@/components/CursorGlow";
import { AuthModalProvider } from "@/components/AuthModal";
import { usePathname } from "next/navigation";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const hideNavbar = pathname === '/signup';

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} ${dmSans.className}`}>
        <AuthModalProvider>
          <CursorGlow />
          {!hideNavbar && <Navbar />}
          <ScrollAnimator />
          {children}
        </AuthModalProvider>
      </body>
    </html>
  );
}
