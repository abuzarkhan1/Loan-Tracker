import { Card } from "../components/common/Card";
import { PageHero } from "../components/common/PageHero";
import { SEO } from "../components/common/SEO";
import { Section } from "../components/common/Section";
import { APP_CONFIG } from "../config/app.config";
import { legalUpdated } from "../content/site.content";

const terms = [
  {
    title: "Use of the app",
    body: "Loan Tracker is provided to help users maintain personal records of given loans, borrowed loans, repayments, balances, contacts, and summaries.",
  },
  {
    title: "Personal finance disclaimer",
    body: "The app is a record-keeping tool and does not provide legal, accounting, tax, lending, or financial advice.",
  },
  {
    title: "User-entered data",
    body: "You are responsible for the accuracy of contacts, loan amounts, payment amounts, dates, notes, and all other information you enter.",
  },
  {
    title: "APK installation",
    body: "If you install the APK manually, you are responsible for downloading it from the official link and keeping your device secure.",
  },
  {
    title: "Changes",
    body: "These terms may be updated as the app evolves. Continued use means you accept the latest version.",
  },
];

export const Terms = () => (
  <>
    <SEO
      title="Terms & Conditions"
      description="Read the Loan Tracker terms for app use, personal finance record disclaimers, and user responsibility for entered data."
    />
    <PageHero
      eyebrow="Terms"
      title="Terms & Conditions"
      description={`Last updated: ${legalUpdated}. Please read these terms before using ${APP_CONFIG.appName}.`}
    />
    <Section className="pt-4">
      <div className="mx-auto grid max-w-4xl gap-4">
        {terms.map((item) => (
          <Card key={item.title} className="rounded-xl p-6">
            <h2 className="text-2xl font-extrabold text-dark">{item.title}</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-muted">{item.body}</p>
          </Card>
        ))}
      </div>
    </Section>
  </>
);
