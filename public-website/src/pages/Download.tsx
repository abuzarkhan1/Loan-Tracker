import { AlertCircle, ShieldCheck } from "lucide-react";
import { Card } from "../components/common/Card";
import { PageHero } from "../components/common/PageHero";
import { SEO } from "../components/common/SEO";
import { Section } from "../components/common/Section";
import { DownloadSection } from "../components/sections/DownloadSection";
import { FAQSection } from "../components/sections/FAQSection";

export const Download = () => (
  <>
    <SEO
      title="Download Android APK"
      description="Download the Loan Tracker Android APK and review version, size, compatibility, installation guidance, and safety notes."
    />
    <PageHero
      eyebrow="Download"
      title="Download the Android APK when the build is ready."
      description="This page is ready for your Expo APK link. Update one config value and every CTA on the website will point to the final download."
    />
    <DownloadSection full />
    <Section className="pt-2">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl p-6">
          <ShieldCheck className="text-success" size={30} />
          <h2 className="mt-5 text-xl font-extrabold text-dark">Safety note</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted">
            Download the APK only from the official link shared on this website. The current app does not include payment proof images, file uploads, PDF exports, Excel exports, or WhatsApp sharing.
          </p>
        </Card>
        <Card className="rounded-2xl p-6">
          <AlertCircle className="text-primary" size={30} />
          <h2 className="mt-5 text-xl font-extrabold text-dark">Before installing</h2>
          <p className="mt-4 text-sm font-medium leading-7 text-muted">
            Android may ask you to allow installation from your browser. This is normal for APK files downloaded outside the Play Store.
          </p>
        </Card>
      </div>
    </Section>
    <FAQSection />
  </>
);
