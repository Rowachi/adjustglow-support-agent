"use client";

import { motion } from "motion/react";
import { Check } from "@phosphor-icons/react/dist/ssr";

const POINTS = [
  "Recensioner skickas vidare först efter en löst, verifierad supportkontakt",
  "Ni godkänner recensionspolicyn: vad som kvalificerar, vad som hålls för uppföljning",
  "Inskick till Google-företagsprofil och Trustpilot sköts åt er",
  "En instrumentpanel visar varje recension, oavsett var den hamnade",
];

export function ReviewSync() {
  return (
    <section id="reviews" className="border-b border-line">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-orange-bright">
            Recensionssynk
          </span>
          <h2 className="mt-3 max-w-[16ch] text-[1.7rem] leading-tight font-semibold text-ink md:text-[2rem]">
            En recension, publicerad där köpare faktiskt tittar.
          </h2>
          <p className="mt-4 max-w-[48ch] text-[1.02rem] leading-relaxed text-ink-soft">
            De flesta recensionsverktyg stannar vid att samla in ett betyg. Adjustglows synkmotor går längre:
            samma verifierade recension formateras och skickas till plattformarna som avgör om någon väljer er.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[0.95rem] text-ink-soft">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent-dim text-accent-bright">
                  <Check size={12} weight="bold" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-3xl border border-line bg-surface p-6 md:p-10"
        >
          <svg
            viewBox="0 0 520 220"
            role="img"
            aria-label="Flödesschema: din recensionssida matar Adjustglows synkmotor, som skickar till Google Recensioner och Trustpilot"
            className="w-full"
          >
            <defs>
              <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L8,4 L0,8 z" fill="var(--color-ink-faint)" />
              </marker>
            </defs>
            <g fontFamily="var(--font-sans), sans-serif" fontSize="12" fill="var(--color-ink-soft)">
              <rect x="16" y="88" width="140" height="52" rx="8" fill="var(--color-surface-2)" stroke="var(--color-line-bright)" />
              <text x="86" y="110" textAnchor="middle" fill="var(--color-ink)" fontWeight="600" fontSize="13">
                Din recensions-
              </text>
              <text x="86" y="127" textAnchor="middle" fontSize="13" fill="var(--color-ink)">
                sida
              </text>

              <line x1="156" y1="114" x2="206" y2="114" stroke="var(--color-ink-faint)" strokeWidth="1.5" markerEnd="url(#arrow)" />

              <rect x="208" y="78" width="150" height="72" rx="8" fill="var(--color-orange-soft)" stroke="var(--color-orange)" />
              <text x="283" y="106" textAnchor="middle" fill="var(--color-orange-bright)" fontWeight="700" fontSize="13">
                Adjustglow
              </text>
              <text x="283" y="124" textAnchor="middle" fill="var(--color-orange-bright)" fontSize="13">
                synkmotor
              </text>
              <text x="283" y="141" textAnchor="middle" fontSize="9.5" letterSpacing="0.05em" fill="var(--color-ink-faint)">
                VERIFIERAD · FORMATERAD
              </text>

              <line x1="358" y1="98" x2="404" y2="60" stroke="var(--color-ink-faint)" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <line x1="358" y1="130" x2="404" y2="168" stroke="var(--color-ink-faint)" strokeWidth="1.5" markerEnd="url(#arrow)" />

              <rect x="406" y="30" width="98" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-line)" />
              <text x="455" y="52" textAnchor="middle" fill="var(--color-ink)" fontWeight="600" fontSize="12.5">
                Google
              </text>
              <text x="455" y="68" textAnchor="middle" fill="var(--color-ink)" fontSize="12.5">
                Recensioner
              </text>

              <rect x="406" y="140" width="98" height="52" rx="8" fill="var(--color-surface)" stroke="var(--color-line)" />
              <text x="455" y="162" textAnchor="middle" fill="var(--color-ink)" fontWeight="600" fontSize="12.5">
                Trustpilot
              </text>
              <text x="455" y="178" textAnchor="middle" fill="var(--color-accent)" fontSize="11">
                ★★★★★
              </text>
            </g>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
