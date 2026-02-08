"use client";

import Link from "next/link";
import { Camera } from "lucide-react";

export function Footer() {
  return (
    <footer className="pt-20 pb-10 border-t border-[var(--border)]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-[60px] mb-[60px]">
          {/* Brand */}
          <div>
            <Link href="#" className="flex items-center gap-3 no-underline mb-0">
              <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-bright)] rounded-[10px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="font-heading text-[26px] text-[var(--text)]">
                Laya Pro
              </span>
            </Link>
            <p className="text-[var(--text-dim)] text-sm leading-[1.8] mt-4 max-w-[300px]">
              The complete photography business platform. Manage everything in one beautiful app.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-[2px] text-[var(--text-muted)] mb-5">
              Product
            </h4>
            <ul className="list-none space-y-3">
              <li><Link href="#features" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Integrations</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-[2px] text-[var(--text-muted)] mb-5">
              Company
            </h4>
            <ul className="list-none space-y-3">
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">About</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-[2px] text-[var(--text-muted)] mb-5">
              Legal
            </h4>
            <ul className="list-none space-y-3">
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Privacy</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Terms</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">Cookies</Link></li>
              <li><Link href="#" className="text-[var(--text-dim)] no-underline text-sm hover:text-[var(--text)] transition-colors">GDPR</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--border)] pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[13px] text-[var(--text-dim)]">
          <span>© 2026 Laya Pro. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="#" className="text-[var(--text-dim)] no-underline hover:text-[var(--text)] transition-colors">Twitter</Link>
            <Link href="#" className="text-[var(--text-dim)] no-underline hover:text-[var(--text)] transition-colors">LinkedIn</Link>
            <Link href="#" className="text-[var(--text-dim)] no-underline hover:text-[var(--text)] transition-colors">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}