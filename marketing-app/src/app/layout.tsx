import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ScrollAnimator } from "@/components/ScrollAnimator";
import { CursorGlow } from "@/components/CursorGlow";
import { AuthModalProvider } from "@/components/AuthModal";

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

export const metadata: Metadata = {
  title: "Laya Pro — Photography Redefined",
  description: "From booking to delivery. One platform to manage events, galleries, clients and finances. Built for photographers who mean business.",
  keywords: "photography management, photography business, event management, client portal, photo gallery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} ${dmSans.className}`}>
        <AuthModalProvider>
          <CursorGlow />
          <Navbar />
          <ScrollAnimator />
          {children}
        </AuthModalProvider>
      </body>
    </html>
  );
}
