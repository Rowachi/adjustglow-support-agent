"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

const FAQS = [
  {
    q: "Vilka recensionsplattformar stödjer ni?",
    a: "Google-företagsprofil och Trustpilot. Kunden skriver sitt omdöme hos er och kan sedan dela samma text på båda med ett tryck: vi kopierar texten och öppnar rätt sida, och kunden publicerar från sitt eget konto. Varken Google eller Trustpilot tillåter att någon annan publicerar i kundens namn, så det gör vi aldrig.",
  },
  {
    q: "Sköts konversationerna av människor eller en bot?",
    a: "Utbildade mänskliga agenter hanterar varje konversation. En bot kan triagera och besvara enkla, återkommande frågor om ni vill det, men det är alltid ni som avgör vilka delar som förblir mänskliga.",
  },
  {
    q: "Vad händer om en kund lämnar en negativ recension?",
    a: "Alla kunder får samma möjlighet att dela sitt omdöme på Google och Trustpilot, oavsett betyg. Det är både ärligt och ett krav från plattformarna. Låga betyg flaggas dessutom till er så att ni kan höra av er och försöka lösa problemet, vid sidan av, aldrig i stället för, de publika knapparna.",
  },
  {
    q: "Kan vi anpassa recensionsförfrågans text och timing?",
    a: "Ja. Formulering, timing efter avslutat ärende, och vilka kanaler som utlöser en förfrågan går att ställa in per företag.",
  },
  {
    q: "Hur snabbt kan vi komma igång?",
    a: "De flesta företag är igång med chatt och e-post inom en vecka. Telefonsupport och recensionsdelning följer vanligtvis vecka två, när länkarna till era sidor på Google och Trustpilot är på plats.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-line bg-bg-raise">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="text-[1.7rem] leading-tight font-semibold text-ink md:text-[2rem]">
            Frågor vi får innan man skriver på.
          </h2>
        </div>

        <div className="mt-10 max-w-3xl divide-y divide-line border-t border-line">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <h3 className="text-[1rem] font-semibold text-ink">{item.q}</h3>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-none text-ink-faint"
                  >
                    <CaretDown size={16} weight="bold" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[62ch] pb-6 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
