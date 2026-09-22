import Image from "next/image";
import { ArrowRight, Timer } from "@phosphor-icons/react/dist/ssr";

export function Hero() {
  return (
    <section id="top" className="border-b border-line pt-16 md:pt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 md:grid-cols-2 md:gap-10 md:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-line-bright bg-surface px-3.5 py-1.5 text-[0.8rem] font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-orange" />
            Kundservice och recensionsmotor, i ett
          </span>

          <h1 className="mt-6 text-[2.15rem] leading-[1.15] font-semibold text-ink md:max-w-[18ch] md:text-[3rem] md:leading-[1.1]">
            Varje löst ärende är en recension som väntar.
          </h1>

          <p className="mt-5 max-w-[42ch] text-[1.05rem] leading-relaxed text-ink-soft">
            Vi sköter er kundservice och förvandlar lösta ärenden till recensioner på Google och Trustpilot.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3.5 text-[0.95rem] font-semibold text-accent-ink shadow-[0_1px_2px_rgba(0,0,0,0.45),0_20px_44px_-18px_rgba(232,172,46,0.4)] transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
            >
              Boka en demo
              <ArrowRight size={17} weight="bold" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center whitespace-nowrap rounded-full border border-line-bright px-6 py-3.5 text-[0.95rem] font-semibold text-ink transition-colors hover:border-ink-faint"
            >
              Se hur det funkar
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[420px] md:max-w-none">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-line-bright bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.5),0_36px_70px_-28px_rgba(0,0,0,0.75)]">
            <Image
              src="/images/hero-owner.jpg"
              alt="Företagare läser en ny femstjärnig recension på sin telefon bakom disken i sin butik"
              fill
              sizes="(min-width: 768px) 420px, 90vw"
              className="object-cover"
              priority
            />
          </div>

          <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-line-bright bg-surface-2/95 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.5),0_20px_40px_-16px_rgba(0,0,0,0.7)] backdrop-blur">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-dim text-accent-bright">
              <Timer size={18} weight="bold" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink">Under 2 min</div>
              <div className="text-xs text-ink-faint">målsatt svarstid</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
