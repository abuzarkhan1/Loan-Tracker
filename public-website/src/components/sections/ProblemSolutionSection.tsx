import { CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { painPoints, solutions } from "../../content/site.content";
import { Card } from "../common/Card";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";

export const ProblemSolutionSection = () => (
  <Section id="problem">
    <SectionHeader
      eyebrow="Why it matters"
      title="Personal loans get messy when the history lives in memory."
      description="Loan Tracker brings every contact, payment, due date, and remaining balance into one clear place."
    />

    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <Card className="h-full rounded-2xl p-6 sm:p-8">
          <div className="mb-6 inline-flex rounded-full bg-peach px-4 py-2 text-sm font-extrabold text-primary-dark">Common problems</div>
          <div className="grid gap-4">
            {painPoints.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-border bg-background-soft p-4">
                <XCircle className="mt-0.5 shrink-0 text-primary-dark" size={20} />
                <p className="text-sm font-bold leading-7 text-dark">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
        <Card className="h-full rounded-2xl p-6 sm:p-8">
          <div className="mb-6 inline-flex rounded-full bg-mint px-4 py-2 text-sm font-extrabold text-success">Loan Tracker solution</div>
          <div className="grid gap-4">
            {solutions.map((item) => (
              <div key={item} className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                <CheckCircle2 className="mt-0.5 shrink-0 text-success" size={20} />
                <p className="text-sm font-bold leading-7 text-dark">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  </Section>
);
