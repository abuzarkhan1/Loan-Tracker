import { ArrowRight } from "lucide-react";
import { ButtonLink } from "../components/common/ButtonLink";
import { Card } from "../components/common/Card";
import { PageHero } from "../components/common/PageHero";
import { SEO } from "../components/common/SEO";
import { Section } from "../components/common/Section";
import { FeatureHighlightsSection } from "../components/sections/FeatureHighlightsSection";
import { TrustSection } from "../components/sections/TrustSection";
import { APP_CONFIG } from "../config/app.config";

const featureStories = [
  {
    title: "From one payment to complete balance",
    copy: "Every repayment changes paid amount, remaining amount, and loan status without manual calculation.",
  },
  {
    title: "Contact-wise clarity",
    copy: "Open a person and see the full ledger context instead of hunting through chats or notes.",
  },
  {
    title: "Dashboard-first thinking",
    copy: "Receivable, payable, paid back, active, completed, and overdue numbers stay visible from the first screen.",
  },
];

export const Features = () => (
  <>
    <SEO
      title="Features"
      description="Explore Loan Tracker features including given loans, borrowed loans, partial payments, ledgers, dashboards, statuses, charts, and dark mode."
    />
    <PageHero
      eyebrow="Features"
      title="A complete personal loan ledger in your pocket."
      description="Loan Tracker keeps the product simple while covering the details that matter: contacts, loan direction, repayments, balances, dates, statuses, and reports."
    />
    <FeatureHighlightsSection />
    <Section className="pt-2">
      <div className="grid gap-5 lg:grid-cols-3">
        {featureStories.map((story) => (
          <Card key={story.title} className="rounded-2xl p-6">
            <h3 className="text-xl font-extrabold text-dark">{story.title}</h3>
            <p className="mt-4 text-sm font-medium leading-7 text-muted">{story.copy}</p>
          </Card>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <ButtonLink href={APP_CONFIG.apkDownloadUrl} trailingIcon={ArrowRight} size="lg">
          Download Android APK
        </ButtonLink>
      </div>
    </Section>
    <TrustSection />
  </>
);
