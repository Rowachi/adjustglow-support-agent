"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ChatText, ListChecks, Star } from "@phosphor-icons/react/dist/ssr";

const SERVICES = [
  {
    icon: ChatText,
    title: "Livechatt & e-post",
    body: "Utbildade agenter svarar i er varumärkesröst, med era makron och kunskapsbas alltid uppdaterade.",
  },
  {
    icon: ListChecks,
    title: "Helpdesk & ärendehantering",
    body: "Vi arbetar i den helpdesk ni redan har, eller sätter upp en. Fullständig logg för varje konversation.",
  },
  {
    icon: Star,
    title: "Recensionsinsamling & synk",
    body: "Varje löst ärende utlöser en recensionsförfrågan, eller låt kunden trycka direkt på ett NFC/QR-kort i butik.",
  },
];

export function Services() {
  return (
    <section id="services" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="text-[1.7rem] leading-tight font-semibold text-ink md:text-[2rem]">
            Support som känns som en del av teamet, fast vi sköter allt.
          </h2>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-ink-soft">
            Välj de kanaler era kunder faktiskt använder. Vi bemannar dem, skriver manus efter ert varumärke och
            håller allt uppdaterat.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-line-bright lg:row-span-2 lg:min-h-[420px]"
          >
            <Image
              src="/images/hero-owner.jpg"
              alt="Företagare läser en ny femstjärnig recension på sin telefon bakom disken i sin butik"
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-transparent" />
            <div className="relative p-6">
              <h3 className="text-[1.05rem] font-semibold text-ink">Telefonsupport</h3>
              <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-ink-soft">
                En egen linje eller extra kapacitet för ert befintliga nummer, med inspelade samtal och
                kvalitetsgranskning.
              </p>
            </div>
          </motion.div>

          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: "easeOut" }}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent-bright">
                <service.icon size={20} weight="bold" />
              </span>
              <h3 className="mt-4 text-[1.05rem] font-semibold text-ink">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{service.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
