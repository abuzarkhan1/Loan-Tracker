import { motion } from "framer-motion";
import { previewScreens } from "../../content/site.content";
import { Section } from "../common/Section";
import { SectionHeader } from "../common/SectionHeader";
import { PhoneMockup, type ScreenId } from "../mockups/PhoneMockup";

export const AppPreviewSection = () => (
  <Section id="preview" className="lg:py-14">
    <SectionHeader
      eyebrow="App Preview"
      title="Mobile screens that feel focused, warm, and easy to scan."
      description="These CSS mockups mirror the app style while real store screenshots can be dropped in later."
    />

    <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {previewScreens.map((screen, index) => (
        <motion.div
          key={screen.id}
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42, ease: "easeOut", delay: index * 0.04 }}
          className="xl:[&_.phone-shadow]:max-w-[218px]"
        >
          <PhoneMockup screen={screen.id as ScreenId} compact />
          <div className="mx-auto mt-4 max-w-[250px] text-center">
            <h3 className="text-base font-extrabold text-dark">{screen.title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-muted">{screen.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </Section>
);
