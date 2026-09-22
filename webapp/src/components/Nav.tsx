"use client";

import { useState } from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";

const LINKS = [
  { href: "#reviews", label: "Recensioner" },
  { href: "#how-it-works", label: "Så funkar det" },
  { href: "#services", label: "Tjänster" },
  { href: "#pricing", label: "Priser" },
  { href: "#faq", label: "Vanliga frågor" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/livedemo"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            Livedemo
          </Link>
          <a
            href="#contact"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            Kontakt
          </a>
          <a
            href="#contact"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-[0_1px_2px_rgba(0,0,0,0.45),0_14px_30px_-12px_rgba(232,172,46,0.45)] transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
          >
            Boka en demo
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Stäng meny" : "Öppna meny"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink lg:hidden"
        >
          {open ? <X size={22} weight="regular" /> : <List size={22} weight="regular" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-bg px-5 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/livedemo"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-base font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
            >
              Livedemo
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="rounded-full border border-line-bright px-5 py-3 text-center text-sm font-semibold text-ink"
            >
              Kontakt
            </a>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-accent-ink"
            >
              Boka en demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
