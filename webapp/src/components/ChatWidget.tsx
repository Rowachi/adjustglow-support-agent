"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChatCircleText,
  X,
  PaperPlaneRight,
  ThumbsUp,
  ThumbsDown,
  EnvelopeSimple,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./Logo";

const AGENT_STREAM_API = "https://adjustglow-support-agent.onrender.com/api/chat/stream";
const FEEDBACK_API = "https://adjustglow-support-agent.onrender.com/api/feedback";
const SUPPORT_EMAIL = "hello@adjustglow.com";
const STORAGE_KEY = "adjustglow-chat-v1";

const INITIAL_CHIPS = [
  "Vad ingår i Growth?",
  "Hur fungerar recensionssynken?",
  "Hur snabbt kan vi komma igång?",
];

const GREETING =
  "Hej, jag är Adjustglow-assistenten. Fråga mig om våra supportplaner, priser, eller hur recensionssynk till Google & Trustpilot fungerar.";

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  streaming?: boolean;
  /** Transient status shown while text is still empty: a "typing" dot
   *  animation, or "waking" once the free-tier backend's cold-start delay
   *  (~4s+) kicks in. Cleared the moment real text starts arriving. */
  placeholder?: "typing" | "waking";
  suggestions?: string[];
  /** Only real API replies are rateable — not the canned greeting. */
  rateable?: boolean;
  feedback?: "up" | "down" | null;
};

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function initialMessages(): Message[] {
  return [{ id: newId(), role: "bot", text: GREETING, suggestions: INITIAL_CHIPS }];
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const restored = useRef(false);

  // Restore the conversation from this tab's session (survives a page
  // reload, clears when the tab closes) so refreshing mid-conversation
  // doesn't throw away context — a small but real trust-building detail
  // most "just a widget" chat bots skip.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { conversationId: string | null; messages: Message[] };
      if (Array.isArray(saved.messages) && saved.messages.length) {
        setMessages(saved.messages.map((m) => ({ ...m, streaming: false, placeholder: undefined })));
        conversationId.current = saved.conversationId || null;
      }
    } catch {
      // Corrupt or old-shape data — ignore and start fresh rather than crash.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ conversationId: conversationId.current, messages })
      );
    } catch {
      // Private browsing / storage disabled: conversation just won't
      // survive a reload. Not worth bothering the visitor about.
    }
  }, [messages]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;

    setMessages((m) => [...m, { id: newId(), role: "user", text }]);
    setInput("");
    setBusy(true);

    const botId = newId();
    setMessages((m) => [...m, { id: botId, role: "bot", text: "", streaming: true, placeholder: "typing" }]);

    const wakeupTimer = setTimeout(() => {
      setMessages((m) =>
        m.map((msg) => (msg.id === botId && !msg.text ? { ...msg, placeholder: "waking" } : msg))
      );
    }, 4000);

    const ctl = new AbortController();
    controllerRef.current = ctl;

    const fail = (fallback?: string) => {
      clearTimeout(wakeupTimer);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === botId
            ? {
                ...msg,
                streaming: false,
                placeholder: undefined,
                text: msg.text || fallback || `Något gick fel just nu. Mejla oss gärna på ${SUPPORT_EMAIL} så hjälper vi dig direkt.`,
              }
            : msg
        )
      );
    };

    try {
      const res = await fetch(AGENT_STREAM_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctl.signal,
        body: JSON.stringify({
          message: text,
          conversationId: conversationId.current,
          persona: "adjustglow",
        }),
      });
      if (!res.ok || !res.body) throw new Error("http_" + res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotFirstDelta = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          let eventType = "message";
          let dataLine = "";
          for (const line of rawEvent.split("\n")) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }

          if (dataLine) {
            let payload: Record<string, unknown> | undefined;
            try {
              payload = JSON.parse(dataLine);
            } catch {
              payload = undefined;
            }

            if (payload) {
              if (eventType === "open" && typeof payload.conversationId === "string") {
                conversationId.current = payload.conversationId;
              } else if (eventType === "delta" && typeof payload.text === "string") {
                if (!gotFirstDelta) {
                  gotFirstDelta = true;
                  clearTimeout(wakeupTimer);
                }
                const delta = payload.text;
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === botId ? { ...msg, text: msg.text + delta, placeholder: undefined } : msg
                  )
                );
              } else if (eventType === "done") {
                clearTimeout(wakeupTimer);
                if (typeof payload.conversationId === "string") conversationId.current = payload.conversationId;
                const suggestions = Array.isArray(payload.suggestions)
                  ? (payload.suggestions.filter((s) => typeof s === "string") as string[])
                  : [];
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === botId
                      ? {
                          ...msg,
                          streaming: false,
                          placeholder: undefined,
                          rateable: true,
                          feedback: null,
                          suggestions,
                          text:
                            msg.text ||
                            "Tack för att du hör av dig. Kan du berätta lite mer om vad du behöver hjälp med?",
                        }
                      : msg
                  )
                );
              } else if (eventType === "error") {
                fail();
              }
            }
          }

          boundary = buffer.indexOf("\n\n");
        }
      }
    } catch {
      fail();
    } finally {
      setBusy(false);
    }
  }

  function sendFeedback(message: Message, rating: "up" | "down") {
    if (message.feedback === rating) return;
    setMessages((m) => m.map((msg) => (msg.id === message.id ? { ...msg, feedback: rating } : msg)));
    fetch(FEEDBACK_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversationId.current,
        rating,
        messageText: message.text.slice(0, 500),
        persona: "adjustglow",
      }),
    }).catch(() => {
      // Best-effort signal — a failed POST here shouldn't interrupt anything
      // the visitor is doing.
    });
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
            className="fixed bottom-24 right-5 z-50 flex h-[min(600px,72vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-line-bright bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.5),0_36px_70px_-24px_rgba(0,0,0,0.8)] md:bottom-28 md:right-7"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Logo className="pointer-events-none" />
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right leading-tight">
                  <div className="text-xs text-ink-faint">AI-driven</div>
                </div>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  aria-label="Maila supporten direkt"
                  title="Maila supporten direkt"
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line-bright text-ink-faint transition-colors hover:border-ink-faint hover:text-ink"
                >
                  <EnvelopeSimple size={15} weight="bold" />
                </a>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "ml-auto bg-accent text-accent-ink" : "bg-surface-2 text-ink-soft"
                    }`}
                  >
                    {m.role === "bot" && !m.text && m.placeholder ? (
                      <TypingIndicator waking={m.placeholder === "waking"} />
                    ) : (
                      m.text
                    )}
                  </div>

                  {m.role === "bot" && m.rateable && !m.streaming && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => sendFeedback(m, "up")}
                        aria-label="Bra svar"
                        aria-pressed={m.feedback === "up"}
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                          m.feedback === "up" ? "text-accent-bright" : "text-ink-faint hover:text-ink-soft"
                        }`}
                      >
                        <ThumbsUp size={13} weight={m.feedback === "up" ? "fill" : "regular"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => sendFeedback(m, "down")}
                        aria-label="Dåligt svar"
                        aria-pressed={m.feedback === "down"}
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                          m.feedback === "down" ? "text-orange" : "text-ink-faint hover:text-ink-soft"
                        }`}
                      >
                        <ThumbsDown size={13} weight={m.feedback === "down" ? "fill" : "regular"} />
                      </button>
                    </div>
                  )}

                  {m.role === "bot" && !m.streaming && !!m.suggestions?.length && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.suggestions.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => sendMessage(chip)}
                          disabled={busy}
                          className="rounded-full border border-line-bright px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink disabled:opacity-40"
                        >
                          {chip}
                        </button>
                      ))}
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="rounded-full border border-line-bright px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                      >
                        Prata med en människa
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

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
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function TypingIndicator({ waking }: { waking: boolean }) {
  if (waking) {
    return (
      <span className="text-ink-faint">
        Väcker assistenten. Den vilar när ingen använt den på ett tag. Svarar inom kort…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      <Dot delay={0} />
      <Dot delay={0.12} />
      <Dot delay={0.24} />
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="h-1.5 w-1.5 rounded-full bg-ink-faint"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}
