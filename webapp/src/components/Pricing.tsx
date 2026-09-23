"use client";

import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react/dist/ssr";

const STARTER = [
  "1 företag",
  "Livechatt- & e-postsupport",
  "1–2 NFC/QR-kort",
  "Delning till Google & Trustpilot",
  "Routning till sociala medier",
  "Privat feedback",
  "Enkel dashboard",
  "Grundläggande analys",
];

const GROWTH = [
  "Flera kort",
  "Allt i Starter",
  "Telefonsupport",
  "AI-driven routning",
  "Intelligent kundfeedback",
  "Mer avancerad analys",
  "Kunduppföljning",
  "Automatisering",
  "Fler användare/teammedlemmar",
];

const CARD_TIERS = [
  { amount: "199–299 kr", label: "1 kort" },
  { amount: "399–499 kr", label: "3 kort" },
  { amount: "799–999 kr", label: "10 kort" },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-[46ch]">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-bright">Priser</span>
          <h2 className="mt-3 text-[1.7rem] leading-tight font-semibold text-ink md:text-[2rem]">
            Enkla planer, prissatta per företag.
          </h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-soft">
            Båda planerna inkluderar recensionsinsamling och delning till Google och Trustpilot. Fysiska NFC/QR-kort
            beställs separat, se priser nedan.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex flex-col rounded-2xl border border-line bg-surface p-8"
          >
            <h3 className="text-[1.05rem] font-semibold text-ink">Starter</h3>
            <div className="mt-3 font-mono text-[2rem] font-semibold text-ink">
              249 kr<span className="text-base font-sans font-medium text-ink-faint">/mån</span>
            </div>
            <p className="mt-2 text-sm text-ink-faint">
              För ett företag som vill komma igång med kort och recensionsinsamling.
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {STARTER.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check size={14} weight="bold" className="mt-0.5 flex-none text-ink-faint" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="mt-8 rounded-full border border-line-bright px-5 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-ink-faint"
            >
              Prata med oss
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
            className="relative flex flex-col rounded-2xl border border-accent-dim bg-surface-2 p-8 shadow-[0_1px_2px_rgba(0,0,0,0.45),0_28px_60px_-24px_rgba(232,172,46,0.28)]"
          >
            <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
              Mest valda
            </span>
            <h3 className="text-[1.05rem] font-semibold text-ink">Growth</h3>
            <div className="mt-3 font-mono text-[2rem] font-semibold text-ink">
              649 kr<span className="text-base font-sans font-medium text-ink-faint">/mån</span>
            </div>
            <p className="mt-2 text-sm text-ink-faint">
              För företag med flera kort och fler medarbetare som behöver djupare insikter.
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {GROWTH.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                  <Check size={14} weight="bold" className="mt-0.5 flex-none text-accent-bright" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="mt-8 rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
            >
              Boka en demo
            </a>
          </motion.div>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-8">
          <h3 className="text-[1.05rem] font-semibold text-ink">Fysiska NFC/QR-kort</h3>
          <p className="mt-1.5 text-sm text-ink-faint">Beställs separat utöver planen, engångskostnad per kort.</p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CARD_TIERS.map((tier) => (
              <div key={tier.label} className="rounded-xl border border-line bg-surface-sunk p-5 text-center">
                <div className="font-mono text-[1.15rem] font-semibold text-ink">{tier.amount}</div>
                <div className="mt-1 text-xs text-ink-faint">{tier.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink-faint">
          Priserna är preliminära uppskattningar och fastställs tillsammans med er innan uppstart.
        </p>
      </div>
    </section>
  );
}
