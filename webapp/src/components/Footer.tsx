import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-bg-raise">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-ink-faint">
              Outsourcad kundservice som förvandlar lösta ärenden till recensioner, publicerade på er sajt, Google
              och Trustpilot.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Produkt</h4>
            <a href="#reviews" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Recensionssynk
            </a>
            <a href="#how-it-works" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Så funkar det
            </a>
            <a href="#services" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Tjänster
            </a>
            <a href="#pricing" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Priser
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Företag</h4>
            <a href="#faq" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Vanliga frågor
            </a>
            <a href="mailto:hello@adjustglow.com" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Kontakt
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Kontakta oss</h4>
            <a href="mailto:hello@adjustglow.com" className="text-sm text-ink-soft transition-colors hover:text-ink">
              hello@adjustglow.com
            </a>
            <a href="#top" className="text-sm text-ink-soft transition-colors hover:text-ink">
              Boka en demo
            </a>
          </div>
        </div>

        <div className="mt-14 border-t border-line pt-6 text-sm text-ink-faint">
          © 2026 Adjustglow. Alla rättigheter förbehållna.
        </div>
      </div>
    </footer>
  );
}
