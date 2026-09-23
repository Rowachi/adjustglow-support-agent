import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Se AI-supportagenten i praktiken: Adjustglow",
  description: "En riktig, fungerande AI-supportagent som svarar som en fiktiv cykelbutik, så ni kan se hela upplevelsen innan ni bokar en demo.",
  alternates: {
    canonical: "/livedemo",
  },
};

export default function LiveDemoPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          Tillbaka till sajten
        </Link>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 py-12 md:px-8">
        <h1 className="text-[1.9rem] font-semibold leading-tight text-ink md:text-[2.3rem]">
          Se AI-supportagenten i praktiken.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[1.02rem] leading-relaxed text-ink-soft">
          Det här är en riktig, fungerande agent, av samma typ som Adjustglow bygger åt kunder, som svarar som{" "}
          <strong className="text-ink">Lumen Cycles</strong>, en fiktiv cykelbutik, så ni kan se hela upplevelsen:
          inga mänskliga agenter, svar grundade i ett riktigt policydokument, och automatisk flaggning så fort
          något behöver en specialist.
        </p>
        <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-line-bright bg-surface px-3.5 py-1.5 text-sm text-ink-soft">
          Föreställer Lumen Cycles: cykel- och elcykelbutik online
        </span>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 md:px-8">
        <div className="overflow-hidden rounded-2xl border border-line-bright bg-surface" style={{ height: "min(640px, 70vh)" }}>
          <iframe
            src="https://adjustglow-support-agent.onrender.com/agent.html"
            title="Levande Lumen Cycles-supportagent"
            loading="lazy"
            className="h-full w-full"
          />
        </div>
        <p className="mt-4 max-w-[62ch] text-sm leading-relaxed text-ink-faint">
          Körs på egen server, svarar med riktig AI, inte ett skript. Första meddelandet efter en stunds
          inaktivitet kan ta upp till en minut medan gratisinstansen vaknar.
        </p>

        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-line-bright bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
            Vill du ha en AI-agent som denna, grundad i era egna policyer och med eskaleringsregler ni bestämmer,
            som svarar era kunder?
          </p>
          <a
            href="mailto:hello@adjustglow.com"
            className="inline-flex flex-none items-center justify-center whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
          >
            Boka en demo
          </a>
        </div>
      </div>
    </div>
  );
}
