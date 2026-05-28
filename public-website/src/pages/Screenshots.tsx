import { PageHero } from "../components/common/PageHero";
import { SEO } from "../components/common/SEO";
import { Section } from "../components/common/Section";
import { AppPreviewSection } from "../components/sections/AppPreviewSection";
import { PhoneMockup } from "../components/mockups/PhoneMockup";

export const Screenshots = () => (
  <>
    <SEO
      title="App Preview"
      description="Preview Loan Tracker app screens including dashboard, loans list, loan detail, add payment, and reports."
    />
    <PageHero
      eyebrow="Screenshots"
      title="A warm fintech app experience, previewed screen by screen."
      description="Real APK screenshots can replace these CSS mockups later. For now, the page shows the final UI direction with the same theme language."
    />
    <AppPreviewSection />
    <Section className="pt-0 lg:py-12">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="premium-card rounded-2xl p-5 sm:p-7">
          <p className="text-xs font-extrabold uppercase text-primary">Light Preview</p>
          <h2 className="mt-3 text-2xl font-extrabold text-dark sm:text-3xl">Peach, white cards, soft warmth.</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-muted">The light theme follows the mobile app background, card, border, and coral action tokens.</p>
          <div className="mt-6">
            <PhoneMockup screen="dashboard" compact />
          </div>
        </div>
        <div className="dark rounded-2xl border border-border bg-background p-5 text-dark shadow-elevated sm:p-7">
          <p className="text-xs font-extrabold uppercase text-primary">Dark Preview</p>
          <h2 className="mt-3 text-2xl font-extrabold text-dark sm:text-3xl">Plum surfaces, coral actions, clear contrast.</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-muted">The dark preview uses the exact app palette without extra decorative colors.</p>
          <div className="mt-6 dark">
            <PhoneMockup screen="reports" compact />
          </div>
        </div>
      </div>
    </Section>
  </>
);
