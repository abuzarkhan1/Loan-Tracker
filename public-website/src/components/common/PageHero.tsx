import { motion } from "framer-motion";
import { Section } from "./Section";

export const PageHero = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) => (
  <Section className="pb-6 pt-10 lg:pb-8 lg:pt-12">
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="premium-card mx-auto max-w-3xl rounded-xl p-5 text-center sm:rounded-2xl sm:p-8"
    >
      <p className="text-xs font-extrabold uppercase text-primary">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-dark sm:text-5xl lg:text-[3.25rem]">{title}</h1>
      <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-muted lg:text-[17px]">{description}</p>
    </motion.div>
  </Section>
);
