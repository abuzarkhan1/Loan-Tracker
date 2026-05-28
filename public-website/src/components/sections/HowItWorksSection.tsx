import { motion } from "framer-motion";
import { howItWorksSteps } from "../../content/site.content";
import { Card } from "../common/Card";
import { IconBadge } from "../common/IconBadge";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";

export const HowItWorksSection = () => (
  <Section id="how-it-works">
    <SectionHeader
      eyebrow="How it works"
      title="Four simple steps from contact to complete ledger."
      description="The workflow is intentionally straightforward, so daily personal finance tracking stays calm."
    />

    <div className="relative mt-8 grid gap-5 lg:grid-cols-4">
      <div className="absolute left-0 right-0 top-12 hidden h-px bg-border lg:block" />
      {howItWorksSteps.map((step, index) => (
        <motion.div
          key={step.step}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.42, ease: "easeOut", delay: index * 0.06 }}
          className="relative"
        >
          <Card className="h-full p-6" interactive>
            <div className="flex items-center justify-between">
              <IconBadge icon={step.icon} />
              <span className="text-4xl font-extrabold text-peach">{step.step}</span>
            </div>
            <h3 className="mt-7 text-xl font-extrabold text-dark">{step.title}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-muted">{step.description}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </Section>
);
