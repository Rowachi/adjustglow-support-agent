"use client";

import { motion } from "motion/react";
import { X, Check, ArrowRight } from "@phosphor-icons/react/dist/ssr";

const BEFORE = [
  "Svarstid på timmar, ibland dagar",
  "Recensioner samlas sällan, om alls",
  "Manuell copy-paste till Google & Trustpilot, om det görs",
  "Ni rekryterar, utbildar och schemalägger själva",
];

const AFTER = [
  "Under 2 minuter i målsatt svarstid",
  "Varje löst ärende ger en fråga om ett omdöme",
  "Kunden delar till Google & Trustpilot med ett tryck",
  "Vi bemannar, utbildar och håller kvaliteten uppe",
];

export function Impact() {
  return (
    <section id="impact" className="border-b border-line bg-bg-raise">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="text-[1.7rem] leading-tight font-semibold text-ink md:text-[2rem]">
            Livet före och efter Adjustglow.
          </h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-soft">
            Ingen ny plattform att lära er. Bara ärenden som löses snabbare och recensioner som faktiskt kommer
            in.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-12 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]"
        >
          <div className="rounded-2xl border border-line bg-surface p-7">
            <div className="text-sm font-semibold text-ink-faint">Utan Adjustglow</div>
            <ul className="mt-4 flex flex-col gap-3">
              {BEFORE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-surface-2 text-ink-faint">
                    <X size={11} weight="bold" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden text-ink-faint md:flex md:justify-center">
            <ArrowRight size={24} weight="regular" />
          </div>

          <div className="rounded-2xl border border-line-bright bg-surface-2 p-7 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_24px_50px_-24px_rgba(232,172,46,0.18)]">
            <div className="text-sm font-semibold text-accent-bright">Med Adjustglow</div>
            <ul className="mt-4 flex flex-col gap-3">
              {AFTER.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-dim text-accent-bright">
                    <Check size={11} weight="bold" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
