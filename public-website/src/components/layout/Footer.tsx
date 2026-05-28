import { Mail, MapPin, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/app.config";
import { navLinks } from "../../content/site.content";
import { BrandMark } from "../common/BrandMark";
import { DownloadApkButton } from "../common/DownloadApkButton";

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export const Footer = () => (
  <footer className="px-5 pb-6 pt-12 sm:px-6">
    <div className="mx-auto max-w-7xl rounded-2xl border border-border bg-[#2b2631] p-6 text-[#f5f0eb] shadow-elevated dark:bg-[#15121a] sm:p-8 lg:p-10">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
        <div>
          <BrandMark className="text-[#f5f0eb] [&_span_span:first-child]:text-[#f5f0eb] [&_span_span:last-child]:text-[#a89fb0]" />
          <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-[#a89fb0]">
            A premium personal loan tracker for contacts, repayments, remaining balances, and clean financial summaries.
          </p>
          <DownloadApkButton className="mt-6">
            Download APK
          </DownloadApkButton>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase text-[#ffe4d3]">Quick Links</h3>
          <div className="mt-4 grid gap-3">
            {navLinks.slice(0, 5).map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-bold text-[#a89fb0] transition hover:text-[#f5f0eb]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase text-[#ffe4d3]">Legal</h3>
          <div className="mt-4 grid gap-3">
            {legalLinks.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-bold text-[#a89fb0] transition hover:text-[#f5f0eb]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold uppercase text-[#ffe4d3]">Contact</h3>
          <div className="mt-4 grid gap-3 text-sm font-bold text-[#a89fb0]">
            <a href={APP_CONFIG.supportEmailHref} className="inline-flex items-center gap-2 transition hover:text-[#f5f0eb]">
              <Mail size={17} />
              {APP_CONFIG.supportEmail}
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin size={17} />
              {APP_CONFIG.companyLocation}
            </span>
            <span className="inline-flex items-center gap-2">
              <Smartphone size={17} />
              Android APK
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-bold text-[#a89fb0] sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {APP_CONFIG.appName}. All rights reserved.</p>
        <p>Built for clear personal finance records.</p>
      </div>
    </div>
  </footer>
);
