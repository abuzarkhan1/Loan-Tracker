import { motion } from "framer-motion";
import { stats } from "../../content/site.content";
import { Card } from "../common/Card";
import { IconBadge, type Tone } from "../common/IconBadge";
import { Section } from "../common/Section";

export const StatsSection = () => (
  <Section className="py-8 lg:py-10">
    <div className="grid gap-3 min-[430px]:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.04 }}
        >
          <Card className="h-full p-5" interactive>
            <IconBadge icon={stat.icon} tone={stat.tone as Tone} />
            <p className="mt-5 text-xs font-extrabold uppercase text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-dark">{stat.value}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  </Section>
);
