import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export function CtaBand() {
  return (
    <section id="contact" className="border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-24">
        <div className="flex flex-col items-start gap-8 rounded-3xl border border-line-bright bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-14">
          <h2 className="max-w-[20ch] text-[1.7rem] leading-tight font-semibold text-ink md:text-[2.1rem]">
            Redo att göra bra service omöjlig att missa?
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/livedemo"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line-bright px-6 py-3.5 text-[0.95rem] font-semibold text-ink transition-colors hover:border-ink-faint"
            >
              Prova den levande AI-demon
            </Link>
            <a
              href="mailto:hello@adjustglow.com"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3.5 text-[0.95rem] font-semibold text-accent-ink shadow-[0_1px_2px_rgba(0,0,0,0.45),0_20px_44px_-18px_rgba(232,172,46,0.4)] transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
            >
              Boka en demo
              <ArrowRight size={17} weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
