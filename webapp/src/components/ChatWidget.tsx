"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChatCircleText, X, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";

const AGENT_API = "https://adjustglow-support-agent.onrender.com/api/chat";

const CHIPS = [
  "Vad ingår i Growth?",
  "Hur fungerar recensionssynken?",
  "Hur snabbt kan vi komma igång?",
];

type Message = { role: "user" | "bot"; text: string; thinking?: boolean };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hej, jag är Adjustglow-assistenten. Fråga mig om våra supportplaner, priser, eller hur recensionssynk till Google & Trustpilot fungerar.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const conversationId = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    setShowChips(false);
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    const thinkingIndex = { current: -1 };
    setMessages((m) => {
      thinkingIndex.current = m.length;
      return [...m, { role: "bot", text: "Tänker…", thinking: true }];
    });

    const wakeupTimer = setTimeout(() => {
      setMessages((m) => {
        const next = [...m];
        if (next[thinkingIndex.current]) {
          next[thinkingIndex.current] = {
            role: "bot",
            text: "Väcker assistenten. Den vilar när ingen använt den på ett tag. Svarar inom kort…",
            thinking: true,
          };
        }
        return next;
      });
    }, 4000);

    const ctl = new AbortController();
    controllerRef.current = ctl;

    try {
      const res = await fetch(AGENT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctl.signal,
        body: JSON.stringify({
          message: text,
          conversationId: conversationId.current,
          persona: "adjustglow",
        }),
      });
      if (!res.ok) throw new Error("http_" + res.status);
      const data = await res.json();
      clearTimeout(wakeupTimer);
      conversationId.current = data.conversationId || conversationId.current;
      setMessages((m) => {
        const next = [...m];
        next[thinkingIndex.current] = {
          role: "bot",
          text: data.reply || "Tack för att du hör av dig. Kan du berätta lite mer om vad du behöver hjälp med?",
        };
        return next;
      });
    } catch {
      clearTimeout(wakeupTimer);
      setMessages((m) => {
        const next = [...m];
        next[thinkingIndex.current] = {
          role: "bot",
          text: "Något gick fel just nu. Mejla oss gärna på hello@adjustglow.com så hjälper vi dig direkt.",
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Stäng chatt" : "Chatta med Adjustglow-assistenten"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_1px_2px_rgba(0,0,0,0.5),0_20px_40px_-16px_rgba(232,172,46,0.55)] transition-transform hover:-translate-y-0.5 active:scale-95 md:bottom-7 md:right-7"
      >
        {open ? <X size={22} weight="bold" /> : <ChatCircleText size={24} weight="fill" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Chatt med Adjustglow-assistenten"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-24 right-5 z-50 flex h-[min(560px,70vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line-bright bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.5),0_36px_70px_-24px_rgba(0,0,0,0.8)] md:bottom-28 md:right-7"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Logo className="pointer-events-none" />
              <div className="ml-auto text-right leading-tight">
                <div className="text-xs text-ink-faint">AI-driven</div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "ml-auto bg-accent text-accent-ink"
                      : `bg-surface-2 text-ink-soft ${m.thinking ? "opacity-70" : ""}`
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {showChips && (
              <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    className="rounded-full border border-line-bright px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Fråga om planer, priser, recensioner…"
                autoComplete="off"
                aria-label="Meddelande"
                className="flex-1 rounded-full border border-line-bright bg-surface-sunk px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Skicka"
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
              >
                <PaperPlaneRight size={16} weight="fill" />
              </button>
            </form>
            <p className="px-4 pb-3 text-[0.7rem] leading-relaxed text-ink-faint">
              AI-genererade svar. För avtal eller anpassade offerter, mejla{" "}
              <a href="mailto:hello@adjustglow.com" className="underline">
                hello@adjustglow.com
              </a>
              .
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
