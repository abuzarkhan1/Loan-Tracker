import { faqItems } from "../../content/site.content";
import { Card } from "../common/Card";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";

export const FAQSection = () => (
  <Section id="faq">
    <SectionHeader
      eyebrow="FAQ"
      title="Answers before you install."
      description="A quick overview of what the app does and how the Android APK download works."
    />

    <div className="mx-auto mt-8 grid max-w-4xl gap-3">
      {faqItems.map((item) => (
        <Card key={item.question} className="p-5">
          <h3 className="text-lg font-extrabold text-dark">{item.question}</h3>
          <p className="mt-3 text-sm font-medium leading-7 text-muted">{item.answer}</p>
        </Card>
      ))}
    </div>
  </Section>
);
