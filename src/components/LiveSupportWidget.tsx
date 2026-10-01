"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ensureUserThread,
  isLiveSupportEnabled,
  sendAgentReply,
  sendUserMessage,
  subscribeLiveSupport,
  type SupportThread,
} from "@/lib/live-support";

function authMeta(): { name: string; email?: string } {
  try {
    const raw = localStorage.getItem("hram_auth_user");
    if (!raw) return { name: "Misafir" };
    const u = JSON.parse(raw) as { name?: string; email?: string };
    return { name: u.name || u.email || "Misafir", email: u.email };
  } catch {
    return { name: "Misafir" };
  }
}

type RecResult = {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
};
type RecEvent = {
  readonly resultIndex: number;
  readonly results: { length: number; [index: number]: RecResult };
};
type RecErrorEvent = { readonly error: string };
type RecInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: RecEvent) => void) | null;
  onerror: ((ev: RecErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecCtor = new () => RecInstance;

const SILENCE_MS = 1800;
const AUTO_REPLY_MS = 2500;
/** Fallback only when CRM agent has not replied recently. */
const AUTO_REPLY_TEXT =
  "Mesajınız HRAM Destek tarafından alındı; ekibimiz en kısa sürede dönüş yapacak.";

function getSpeechRecognitionCtor(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecCtor;
    webkitSpeechRecognition?: RecCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function LiveSupportWidget() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(true);
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [draft, setDraft] = useState("");
  const [listening, setListening] = useState(false);
  const [micStatus, setMicStatus] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<RecInstance | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoReplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalStop = useRef(false);
  const finalBuf = useRef("");
  const draftBaseRef = useRef("");
  const micReady = useRef(false);
  const listeningRef = useRef(false);
  const draftRef = useRef("");

  const isAdmin =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isTrade =
    pathname === "/trade" || pathname.startsWith("/trade/");
  // Keep hidden on landing/auth/onboarding/public/admin — but SHOW on Trade
  const hideFab =
    pathname === "/" ||
    pathname === "" ||
    pathname === "/giris" ||
    pathname.startsWith("/giris/") ||
    pathname === "/kayit" ||
    pathname.startsWith("/kayit/") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/gizlilik" ||
    pathname === "/destek" ||
    pathname === "/agent" ||
    pathname.startsWith("/agent/") ||
    isAdmin;

  draftRef.current = draft;

  function refresh() {
    setEnabled(isLiveSupportEnabled());
    try {
      const id = localStorage.getItem("hram_live_support_my_thread");
      if (!id) {
        setThread(null);
        return;
      }
      const raw = localStorage.getItem("hram_live_support_threads");
      if (!raw) {
        setThread(null);
        return;
      }
      const list = JSON.parse(raw) as SupportThread[];
      setThread(list.find((t) => t.id === id) || null);
    } catch {
      setThread(null);
    }
  }

  function openChat() {
    const meta = authMeta();
    const t = ensureUserThread({
      userName: meta.name,
      userEmail: meta.email,
    });
    setThread(t);
    setOpen(true);
  }

  const clearSilence = useCallback(() => {
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
  }, []);

  const stopRec = useCallback(
    (opts?: { abort?: boolean }) => {
      clearSilence();
      const r = recRef.current;
      if (!r) {
        listeningRef.current = false;
        setListening(false);
        return;
      }
      intentionalStop.current = true;
      try {
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.onstart = null;
        if (opts?.abort) r.abort();
        else r.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
      listeningRef.current = false;
      setListening(false);
      setTimeout(() => {
        intentionalStop.current = false;
      }, 120);
    },
    [clearSilence],
  );

  const scheduleAutoReply = useCallback((threadId: string) => {
    if (autoReplyTimer.current) clearTimeout(autoReplyTimer.current);
    autoReplyTimer.current = setTimeout(() => {
      try {
        const raw = localStorage.getItem("hram_live_support_threads");
        if (!raw) return;
        const list = JSON.parse(raw) as SupportThread[];
        const t = list.find((x) => x.id === threadId);
        if (!t) return;
        const last = t.messages[t.messages.length - 1];
        // Only stub if last message is still from user (no agent reply yet)
        if (!last || last.sender !== "user") return;
        const hasRecentAgent = t.messages.some(
          (m) =>
            m.sender === "agent" &&
            Date.now() - new Date(m.at).getTime() < 60_000,
        );
        if (hasRecentAgent) return;
        const next = sendAgentReply(threadId, AUTO_REPLY_TEXT);
        if (next) setThread(next);
      } catch {
        /* ignore */
      }
    }, AUTO_REPLY_MS);
  }, []);

  const commitSpoken = useCallback(
    (text: string, autoSend: boolean) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setMicStatus(null);
        return;
      }
      if (autoSend) {
        const next = sendUserMessage(trimmed);
        if (next) {
          setThread(next);
          setDraft("");
          scheduleAutoReply(next.id);
        }
        setMicStatus(null);
      } else {
        setDraft(trimmed);
        setMicStatus(null);
      }
    },
    [scheduleAutoReply],
  );

  const finishListening = useCallback(() => {
    const spoken = `${draftBaseRef.current} ${finalBuf.current}`.trim();
    stopRec();
    // Auto-send spoken text as a chat message (ChatGPT-style when done)
    commitSpoken(spoken, true);
    finalBuf.current = "";
    draftBaseRef.current = "";
  }, [commitSpoken, stopRec]);

  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (micReady.current) return true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        micReady.current = true;
        return true;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      await new Promise((r) => setTimeout(r, 120));
      stream.getTracks().forEach((t) => t.stop());
      micReady.current = true;
      return true;
    } catch {
      setMicStatus("Mikrofon izni gerekli. Ayarlardan izin verip tekrar deneyin.");
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setMicStatus("Bu tarayıcı ses tanımayı desteklemiyor (Chrome/Safari deneyin).");
      return;
    }
    const ok = await ensureMic();
    if (!ok) return;

    // Soft-stop any previous instance
    if (recRef.current) {
      try {
        intentionalStop.current = true;
        recRef.current.onend = null;
        recRef.current.onerror = null;
        recRef.current.onresult = null;
        recRef.current.stop();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    }

    finalBuf.current = "";
    draftBaseRef.current = draftRef.current.trim();
    intentionalStop.current = false;

    const rec = new Ctor();
    rec.lang = "tr-TR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      listeningRef.current = true;
      setListening(true);
      setMicStatus("Dinliyorum… tekrar dokunun veya konuşmayı bitirin");
    };

    rec.onresult = (ev: RecEvent) => {
      let finalPiece = "";
      let interimPiece = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const alt = ev.results[i][0]?.transcript || "";
        if (ev.results[i].isFinal) finalPiece += alt + " ";
        else interimPiece += alt;
      }
      if (finalPiece.trim()) {
        finalBuf.current = `${finalBuf.current} ${finalPiece}`.trim();
      }
      const live = `${draftBaseRef.current} ${finalBuf.current} ${interimPiece}`.trim();
      setDraft(live);
      clearSilence();
      silenceTimer.current = setTimeout(() => {
        if (listeningRef.current) finishListening();
      }, SILENCE_MS);
    };

    rec.onerror = (ev: RecErrorEvent) => {
      const err = ev.error || "";
      if (err === "no-speech" || err === "aborted") {
        return;
      }
      if (err === "not-allowed" || err === "service-not-allowed") {
        micReady.current = false;
        setMicStatus("Mikrofon izni gerekli. Ayarlardan izin verip tekrar deneyin.");
        stopRec({ abort: true });
        return;
      }
      if (err === "network" || err === "audio-capture") {
        setMicStatus("Ses tanıma hatası — tekrar deneyin.");
        stopRec({ abort: true });
        return;
      }
      if (err === "language-not-supported" && rec.lang === "tr-TR") {
        setMicStatus("TR desteklenmiyor, EN deneniyor…");
        try {
          intentionalStop.current = true;
          rec.stop();
        } catch {
          /* ignore */
        }
        recRef.current = null;
        setTimeout(() => {
          intentionalStop.current = false;
          const C2 = getSpeechRecognitionCtor();
          if (!C2 || !listeningRef.current) return;
          const r2 = new C2();
          r2.lang = "en-US";
          r2.continuous = true;
          r2.interimResults = true;
          r2.maxAlternatives = 1;
          r2.onresult = rec.onresult;
          r2.onerror = (e2: RecErrorEvent) => {
            setMicStatus(`Ses tanıma hatası (${e2.error || "unknown"})`);
            stopRec({ abort: true });
          };
          r2.onend = rec.onend;
          r2.onstart = rec.onstart;
          recRef.current = r2;
          try {
            r2.start();
          } catch {
            setMicStatus("Ses tanıma başlatılamadı.");
            listeningRef.current = false;
            setListening(false);
          }
        }, 200);
        return;
      }
      setMicStatus(`Ses tanıma hatası (${err})`);
      stopRec({ abort: true });
    };

    rec.onend = () => {
      if (intentionalStop.current) return;
      // Engine ended on its own — commit what we have
      if (listeningRef.current) {
        finishListening();
      }
    };

    recRef.current = rec;
    listeningRef.current = true;
    setListening(true);
    try {
      rec.start();
    } catch {
      // InvalidStateError — try en-US fallback
      try {
        rec.lang = "en-US";
        rec.start();
      } catch {
        setMicStatus("Ses tanıma başlatılamadı.");
        listeningRef.current = false;
        setListening(false);
        recRef.current = null;
      }
    }
  }, [clearSilence, ensureMic, finishListening, stopRec]);

  const toggleMic = useCallback(() => {
    if (listeningRef.current) {
      finishListening();
      return;
    }
    void startListening();
  }, [finishListening, startListening]);

  useEffect(() => {
    refresh();
    return subscribeLiveSupport(refresh);
  }, []);

  useEffect(() => {
    function onOpen() {
      const meta = authMeta();
      const t = ensureUserThread({
        userName: meta.name,
        userEmail: meta.email,
      });
      setThread(t);
      setOpen(true);
    }
    window.addEventListener("investor-open-live-support", onOpen);
    return () => window.removeEventListener("investor-open-live-support", onOpen);
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, thread?.messages.length]);

  // Cleanup speech on unmount / close
  useEffect(() => {
    if (!open && listeningRef.current) {
      stopRec({ abort: true });
      setMicStatus(null);
    }
  }, [open, stopRec]);

  useEffect(() => {
    return () => {
      if (autoReplyTimer.current) clearTimeout(autoReplyTimer.current);
      stopRec({ abort: true });
    };
  }, [stopRec]);

  if (isAdmin || !enabled) return null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (listeningRef.current) {
      finishListening();
      return;
    }
    const next = sendUserMessage(draft);
    if (next) {
      setThread(next);
      setDraft("");
      setMicStatus(null);
      scheduleAutoReply(next.id);
    }
  }

  const fabBottom = isTrade
    ? "max(1.25rem, calc(env(safe-area-inset-bottom) + 1rem))"
    : "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.75rem))";

  return (
    <>
      {!hideFab && (
        <button
          type="button"
          aria-label="HRAM Canlı destek"
          onClick={openChat}
          className="live-support-fab fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-nest-solid text-white shadow-lg transition hover:opacity-90 active:scale-95"
          style={{
            right: "max(1rem, env(safe-area-inset-right))",
            bottom: fabBottom,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.15a.75.75 0 0 1-1.2-.6V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => {
            stopRec({ abort: true });
            setOpen(false);
          }}
        >
          <div
            className="flex h-[min(72vh,560px)] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-label="HRAM Canlı destek"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-nest">HRAM Canlı Destek</p>
                <p className="text-[11px] text-muted">
                  {thread?.status === "resolved"
                    ? "Görüşme çözüldü"
                    : listening
                      ? "Sesli mesaj dinleniyor…"
                      : "Yazın veya mikrofonla konuşun"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-beige px-3 py-1.5 text-xs font-semibold text-nest"
                onClick={() => {
                  stopRec({ abort: true });
                  setOpen(false);
                }}
              >
                Kapat
              </button>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {(thread?.messages || []).map((m) => {
                const mine = m.sender === "user";
                const system = m.sender === "system";
                if (system) {
                  return (
                    <p
                      key={m.id}
                      className="mx-auto max-w-[90%] rounded-xl bg-beige px-3 py-2 text-center text-[11px] text-muted"
                    >
                      {m.text}
                    </p>
                  );
                }
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-nest-solid text-white"
                          : "bg-beige text-nest"
                      }`}
                    >
                      {!mine && (
                        <p className="mb-0.5 text-[10px] font-semibold opacity-70">
                          HRAM Destek
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? "text-white/60" : "text-muted"
                        }`}
                      >
                        {new Date(m.at).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-border p-3"
              style={{
                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              }}
            >
              <div className="flex items-end gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    listening ? "Konuşun…" : "Mesajınızı yazın…"
                  }
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30"
                  aria-label="Mesaj"
                  disabled={listening}
                />
                <button
                  type="button"
                  aria-label={listening ? "Dinlemeyi bitir" : "Sesli mesaj"}
                  aria-pressed={listening}
                  onClick={toggleMic}
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${
                    listening
                      ? "border-foreground/40 bg-nest-solid text-white"
                      : "border-border bg-beige text-nest hover:bg-background"
                  }`}
                  title={listening ? "Dinlemeyi bitir" : "Mikrofon"}
                >
                  {listening && (
                    <span
                      className="absolute inset-0 animate-ping rounded-xl bg-nest-solid/30"
                      aria-hidden
                    />
                  )}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="relative"
                  >
                    <rect
                      x="9"
                      y="3"
                      width="6"
                      height="11"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M5.5 11a6.5 6.5 0 0 0 13 0"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 17.5V21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={!draft.trim() && !listening}
                  className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Gönder
                </button>
              </div>
              {micStatus && (
                <p
                  className={`mt-2 text-[11px] ${
                    listening ? "text-muted" : "text-muted"
                  }`}
                  role="status"
                >
                  {micStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
