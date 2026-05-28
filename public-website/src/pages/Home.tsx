import { SEO } from "../components/common/SEO";
import { AppPreviewSection } from "../components/sections/AppPreviewSection";
import { DashboardChartsSection } from "../components/sections/DashboardChartsSection";
import { DownloadSection } from "../components/sections/DownloadSection";
import { FAQSection } from "../components/sections/FAQSection";
import { FeatureHighlightsSection } from "../components/sections/FeatureHighlightsSection";
import { HeroSection } from "../components/sections/HeroSection";
import { HowItWorksSection } from "../components/sections/HowItWorksSection";
import { ProblemSolutionSection } from "../components/sections/ProblemSolutionSection";
import { StatsSection } from "../components/sections/StatsSection";
import { TrustSection } from "../components/sections/TrustSection";

export const Home = () => (
  <>
    <SEO
      title="Track Every Loan Clearly"
      description="Loan Tracker helps you manage given loans, borrowed loans, partial repayments, due amounts, dashboard summaries, and reports."
    />
    <HeroSection />
    <StatsSection />
    <ProblemSolutionSection />
    <FeatureHighlightsSection compact />
    <AppPreviewSection />
    <HowItWorksSection />
    <DashboardChartsSection />
    <TrustSection />
    <DownloadSection />
    <FAQSection />
  </>
);
