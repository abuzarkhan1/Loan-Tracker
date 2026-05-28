import { Card } from "../components/common/Card";
import { PageHero } from "../components/common/PageHero";
import { SEO } from "../components/common/SEO";
import { Section } from "../components/common/Section";
import { APP_CONFIG } from "../config/app.config";
import { legalUpdated } from "../content/site.content";

const sections = [
  {
    title: "Information we use",
    body: "Loan Tracker uses account information and the loan records you enter so the app can provide contacts, loans, repayments, remaining balances, dashboards, and reports.",
  },
  {
    title: "Loan tracking data",
    body: "The app is designed for personal finance records such as contacts, loan amounts, repayment amounts, methods, dates, notes, and statuses.",
  },
  {
    title: "No unnecessary uploads",
    body: "The current app does not implement S3, Multer, file uploads, payment proof images, PDF export, Excel export, or WhatsApp sharing.",
  },
  {
    title: "How data is used",
    body: "Data is used to power account functionality, calculate paid and remaining balances, show dashboards, and keep user-specific records separate.",
  },
  {
    title: "Your responsibility",
    body: "Please enter accurate records and keep your login details private. Personal finance records should be reviewed by you before relying on them.",
  },
];

export const PrivacyPolicy = () => (
  <>
    <SEO
      title="Privacy Policy"
      description="Read the Loan Tracker privacy policy for account functionality, loan tracking records, and current no-file-upload scope."
    />
    <PageHero
      eyebrow="Privacy"
      title="Privacy Policy"
      description={`Last updated: ${legalUpdated}. This policy explains how ${APP_CONFIG.appName} handles app data for loan tracking functionality.`}
    />
    <Section className="pt-4">
      <div className="mx-auto grid max-w-4xl gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="rounded-xl p-6">
            <h2 className="text-2xl font-extrabold text-dark">{section.title}</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-muted">{section.body}</p>
          </Card>
        ))}
        <Card className="rounded-xl p-6">
          <h2 className="text-2xl font-extrabold text-dark">Contact</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-muted">
            For privacy questions, contact us at <a className="font-extrabold text-primary" href={APP_CONFIG.supportEmailHref}>{APP_CONFIG.supportEmail}</a>.
          </p>
        </Card>
      </div>
    </Section>
  </>
);
