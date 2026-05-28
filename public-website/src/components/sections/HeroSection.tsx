import { ArrowRight, Download, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { motion } from "framer-motion";
import { APP_CONFIG } from "../../config/app.config";
import { ButtonLink } from "../common/ButtonLink";
import { Section } from "../common/Section";
import { AppMockupCluster } from "../mockups/AppMockupCluster";

const trustBadges = [
  { label: "Clear balances", icon: WalletCards },
  { label: "Partial payments", icon: Sparkles },
  { label: "Personal records", icon: ShieldCheck },
];

export const HeroSection = () => (
  <Section className="pb-8 pt-6 sm:pb-10 sm:pt-8 lg:pb-12 lg:pt-10">
    <div className="grid items-center gap-9 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-extrabold uppercase text-primary shadow-soft">
          <Sparkles size={15} />
          Premium personal finance clarity
        </div>
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] text-dark sm:mt-6 sm:text-6xl lg:text-[4rem]">
          Track Every Loan, Repayment, and Remaining Balance — Clearly.
        </h1>
        <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-muted sm:text-lg">
          Loan Tracker helps you manage money you gave, money you borrowed, partial repayments, due amounts, and financial summaries in one simple app.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={APP_CONFIG.apkDownloadUrl} icon={Download} size="lg" className="w-full sm:w-auto">
            Download Android APK
          </ButtonLink>
          <ButtonLink to="/features" trailingIcon={ArrowRight} variant="secondary" size="lg" className="w-full sm:w-auto">
            Explore Features
          </ButtonLink>
        </div>

        <div className="mt-8 grid gap-3 min-[460px]:grid-cols-3 sm:flex sm:flex-wrap">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-extrabold text-dark shadow-soft">
              <badge.icon className="text-primary" size={17} />
              {badge.label}
            </div>
          ))}
        </div>
      </motion.div>

      <AppMockupCluster />
    </div>
  </Section>
);
