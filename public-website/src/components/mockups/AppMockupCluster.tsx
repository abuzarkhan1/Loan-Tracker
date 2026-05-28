import { motion } from "framer-motion";
import { PhoneMockup } from "./PhoneMockup";

export const AppMockupCluster = () => (
  <div className="relative min-h-[530px] sm:min-h-[590px]">
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -6 }}
      transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
      className="absolute left-0 top-12 hidden w-[39%] lg:block"
    >
      <PhoneMockup screen="loans" compact />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative z-10 mx-auto w-full max-w-[286px] sm:w-[72%] sm:max-w-[310px]"
    >
      <PhoneMockup screen="dashboard" />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 4 }}
      animate={{ opacity: 1, y: 0, rotate: 6 }}
      transition={{ duration: 0.65, ease: "easeOut", delay: 0.18 }}
      className="absolute right-0 top-16 hidden w-[39%] lg:block"
    >
      <PhoneMockup screen="detail" compact />
    </motion.div>
  </div>
);
