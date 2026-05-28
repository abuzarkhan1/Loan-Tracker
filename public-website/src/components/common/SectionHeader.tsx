import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export const SectionHeader = ({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.45, ease: "easeOut" }}
    className={cn("mx-auto max-w-3xl", align === "center" ? "text-center" : "text-left", className)}
  >
    {eyebrow ? (
      <p className="mb-3 text-xs font-extrabold uppercase text-primary">{eyebrow}</p>
    ) : null}
    <h2 className="text-[2rem] font-extrabold leading-tight text-dark sm:text-4xl lg:text-[2.65rem]">{title}</h2>
    {description ? <p className="mt-4 text-base font-medium leading-8 text-muted lg:text-[17px]">{description}</p> : null}
  </motion.div>
);
