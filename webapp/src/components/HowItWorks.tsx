"use client";

import { motion } from "motion/react";

const STEPS = [
  {
    n: "1",
    title: "Kunden hör av sig",
    body: "Chatt, e-post eller telefon, vidarebefordras till en Adjustglow-agent insatt i er produkt.",
  },
  {
    n: "2",
    title: "Vi löser det",
    body: "Agenten arbetar ärendet till avslut, loggat med lösningsanteckningar i er helpdesk.",
  },
  {
    n: "3",
    title: "Vi frågar om feedback",
    body: "En kort fråga i er ton ber kunden betygsätta konversationen.",
  },
  {
    n: "4",
    title: "Recensionen publiceras",
    body: "Positiva recensioner går live på er varumärkta recensionssida direkt.",
  },
  {
    n: "5",
    title: "Den synkas överallt",
    body: "Adjustglow skickar samma recension vidare till Google-företagsprofil och Trustpilot.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-line bg-bg-raise">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="text-[1.7rem] leading-tight font-semibold text-ink md:text-[2rem]">
            Från &quot;ärende öppnat&quot; till &quot;recension publicerad&quot;, i ett och samma flöde.
          </h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-soft">
            Inget separat recensionsverktyg att hantera. Det är inbyggt i samma konversation som er agent redan för.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
            >
              <span className="font-mono text-sm font-semibold text-orange-bright">{step.n}</span>
              <h3 className="mt-3 text-[1.05rem] font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </motion.div>
          ))}
        </div>

        <p className="mt-12 max-w-[62ch] border-t border-line pt-6 text-sm leading-relaxed text-ink-faint">
          Har ni fysiska NFC/QR-kort i butik? Kunden kan trycka direkt och lämna feedback utan att vänta på ett
          löst ärende. Resten av flödet är detsamma.
        </p>
      </div>
    </section>
  );
}
