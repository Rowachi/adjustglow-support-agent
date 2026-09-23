"use client";

import { motion } from "motion/react";

const STATS = [
  { value: "2 min", label: "Målsatt svarstid på nya ärenden" },
  { value: "24/5", label: "Bemannad kanaltäckning" },
  { value: "1 tryck", label: "Från omdöme till Google eller Trustpilot" },
  { value: "7 dagar", label: "Till live drift, från signering" },
];

export function ProofStats() {
  return (
    <section id="stats" className="border-b border-line bg-bg-raise">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-12 md:grid-cols-4 md:px-8 md:py-14">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
          >
            <div className="font-mono text-[2rem] font-semibold tabular-nums text-ink md:text-[2.3rem]">
              {stat.value}
            </div>
            <div className="mt-1.5 max-w-[20ch] text-sm text-ink-faint">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
