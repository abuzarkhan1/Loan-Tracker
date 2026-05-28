import { motion } from "framer-motion";
import { featureHighlights } from "../../content/site.content";
import { Card } from "../common/Card";
import { IconBadge, type Tone } from "../common/IconBadge";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";

export const FeatureHighlightsSection = ({ compact = false }: { compact?: boolean }) => (
  <Section id="features">
    <SectionHeader
      eyebrow="Features"
      title="Everything needed for clean personal loan tracking."
      description="From given and taken loans to reports and statuses, each workflow is built around clarity."
    />

    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {featureHighlights.slice(0, compact ? 6 : featureHighlights.length).map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.38, ease: "easeOut", delay: index * 0.025 }}
        >
          <Card className="h-full p-6" interactive>
            <IconBadge icon={feature.icon} tone={feature.tone as Tone} />
            <h3 className="mt-5 text-xl font-extrabold text-dark">{feature.title}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-muted">{feature.description}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </Section>
);
