"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createManualThread,
  getHramGreeting,
  getSupportProfile,
  getSupportThreads,
  initials,
  avatarHue,
  isLiveSupportEnabled,
  relativeTimeTr,
  reopenThread,
  resolveThread,
  sendAgentReply,
  setLiveSupportEnabled,
  subscribeLiveSupport,
  unansweredThreadCount,
  updateSupportProfile,
  type SupportProfile,
  type SupportThread,
} from "@/lib/live-support";
import { getCrmSession } from "@/lib/crm/data";

type Tab = "all" | "new" | "unanswered";

const EMOJIS = ["👍", "🙏", "✅", "😊", "👋", "💼", "⚡", "📌"];

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSep(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function ProfileRow({
  label,
  value,
  danger,
  onEdit,
  onClear,
}: {
  label: string;
  value: string;
  danger?: boolean;
  onEdit?: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="group flex items-start justify-between gap-2 border-b border-black/[0.04] py-2.5">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <p
          className={`mt-0.5 break-words text-[13px] font-medium ${
            danger ? "text-danger" : "text-nest"
          }`}
        >
          {value || "—"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-60 transition group-hover:opacity-100">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md p-1 hover:bg-beige"
            aria-label={`${label} düzenle`}
            title="Düzenle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 20h4l10-10-4-4L4 16v4Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="m13 7 4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 text-danger hover:bg-danger-soft"
            aria-label={`${label} temizle`}
            title="Temizle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 7h14M10 11v6M14 11v6M9 7V5h6v2M7 7l1 12h8l1-12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CrmChatPage() {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [supportOn, setSupportOn] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [profile, setProfile] = useState<SupportProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function refresh() {
    const list = getSupportThreads();
    setThreads(list);
    setSupportOn(isLiveSupportEnabled());
  }

  useEffect(() => {
    refresh();
    return subscribeLiveSupport(refresh);
  }, []);

  useEffect(() => {
    const active =
      threads.find((t) => t.id === activeId) || threads[0] || null;
    if (active && active.id !== activeId) setActiveId(active.id);
    if (active) setProfile(getSupportProfile(active));
    else setProfile(null);
  }, [threads, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, threads]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  const unanswered = unansweredThreadCount();

  const list = useMemo(() => {
    let rows = threads;
    if (tab === "new") {
      rows = rows.filter((t) => t.status === "open" && t.messages.filter((m) => m.sender !== "system").length <= 1);
    } else if (tab === "unanswered") {
      rows = rows.filter((t) => t.status === "open" && !t.answered);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (t) =>
          t.userName.toLowerCase().includes(q) ||
          (t.userEmail || "").toLowerCase().includes(q) ||
          t.messages.some((m) => m.text.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [threads, tab, query]);

  const active = threads.find((t) => t.id === activeId) || list[0] || null;

  function onSend(e?: FormEvent) {
    e?.preventDefault();
    if (!active || !reply.trim()) return;
    const session = getCrmSession();
    const agentName = session?.name || "HRAM Destek";
    const text = reply.trim().includes("HRAM")
      ? reply
      : reply;
    const updated = sendAgentReply(active.id, text, agentName);
    if (updated) {
      setReply("");
      setEmojiOpen(false);
      refresh();
      flash("Yanıt gönderildi");
    }
  }

  function insertGreeting() {
    setReply(getHramGreeting());
  }

  function editField(key: keyof SupportProfile, label: string) {
    if (!active || !profile) return;
    const current = String(profile[key] ?? "");
    const next = window.prompt(`${label}`, current);
    if (next == null) return;
    const updated = updateSupportProfile(active, { [key]: next } as Partial<SupportProfile>);
    setProfile(updated);
    if (key === "name") {
      // keep thread name in sync
      try {
        const raw = localStorage.getItem("hram_live_support_threads");
        if (raw) {
          const arr = JSON.parse(raw) as SupportThread[];
          const mapped = arr.map((t) =>
            t.id === active.id ? { ...t, userName: next } : t,
          );
          localStorage.setItem("hram_live_support_threads", JSON.stringify(mapped));
        }
      } catch {
        /* ignore */
      }
      refresh();
    }
    flash("Profil güncellendi");
  }

  function toggleBool(key: keyof SupportProfile) {
    if (!active || !profile) return;
    const cur = Boolean(profile[key]);
    const updated = updateSupportProfile(active, {
      [key]: !cur,
    } as Partial<SupportProfile>);
    setProfile(updated);
  }

  function onAttach(file: File | null) {
    if (!file || !active) return;
    const session = getCrmSession();
    sendAgentReply(
      active.id,
      `📎 Dosya eklendi: ${file.name} (${Math.round(file.size / 1024)} KB)`,
      session?.name || "HRAM Destek",
    );
    refresh();
    flash("Dosya notu eklendi");
  }

  // Group messages by day for separators
  const messageBlocks = useMemo(() => {
    if (!active) return [] as { key: string; label: string; items: SupportThread["messages"] }[];
    const blocks: { key: string; label: string; items: SupportThread["messages"] }[] = [];
    for (const m of active.messages) {
      const key = dayKey(m.at);
      const last = blocks[blocks.length - 1];
      if (!last || last.key !== key) {
        blocks.push({ key, label: formatDateSep(m.at), items: [m] });
      } else {
        last.items.push(m);
      }
    }
    return blocks;
  }, [active]);

  return (
    <div className="-mx-1 flex h-[calc(100dvh-7.5rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:-mx-0">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-nest-solid px-3 py-1.5 text-[11px] font-bold tracking-wide text-white">
            CRM
          </span>
          <div>
            <p className="text-sm font-semibold text-nest">Canlı Destek Masası</p>
            <p className="text-[11px] text-muted">
              HRAM · {threads.filter((t) => t.status === "open").length} açık ·{" "}
              {unanswered} yanıt bekliyor
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-beige/60 px-2.5 py-1.5">
            <span className="text-[11px] text-muted">Widget</span>
            <button
              type="button"
              role="switch"
              aria-checked={supportOn}
              onClick={() => {
                const next = !supportOn;
                setLiveSupportEnabled(next);
                setSupportOn(next);
                flash(next ? "Canlı destek açık" : "Canlı destek kapalı");
              }}
              className={`toggle ${supportOn ? "on" : ""}`}
              aria-label="Canlı destek"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("Müşteri adı");
              if (!name?.trim()) return;
              const email = window.prompt("E-posta (opsiyonel)") || undefined;
              const t = createManualThread({
                userName: name.trim(),
                userEmail: email?.trim() || undefined,
              });
              setActiveId(t.id);
              refresh();
              flash("Sohbet oluşturuldu");
            }}
            className="rounded-lg bg-nest-solid px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
          >
            Create chat
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)]">
        {/* LEFT — thread list */}
        <aside className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="space-y-2 border-b border-border p-3">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="m16 16 3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-xl border border-border bg-beige/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/25"
                aria-label="Ara"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-beige p-1">
              {(
                [
                  ["all", "All"],
                  ["new", "New"],
                  ["unanswered", "Not Answered"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                    tab === id
                      ? "bg-white text-nest shadow-sm"
                      : "text-muted hover:text-nest"
                  }`}
                >
                  {label}
                  {id === "unanswered" && unanswered > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-nest-solid px-1 text-[9px] text-white">
                      {unanswered}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {list.length === 0 && (
              <li className="rounded-xl px-3 py-8 text-center text-sm text-muted">
                Konuşma yok — Trade FAB veya Create chat ile başlatın.
              </li>
            )}
            {list.map((t) => {
              const last = [...t.messages]
                .reverse()
                .find((m) => m.sender !== "system");
              const isActive = active?.id === t.id;
              const unread = t.status === "open" && !t.answered;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                      isActive
                        ? "bg-[#eef6f1] ring-1 ring-black/5"
                        : "hover:bg-beige/80"
                    }`}
                  >
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: avatarHue(t.userName) }}
                    >
                      {initials(t.userName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[13px] font-semibold text-nest">
                          {t.userName}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted">
                          {relativeTimeTr(t.updatedAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`truncate text-[11px] ${
                            unread ? "font-semibold text-nest" : "text-muted"
                          }`}
                        >
                          {last?.text || "—"}
                        </span>
                        {unread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-nest-solid" />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border px-3 py-2 text-center text-[10px] text-muted">
            All Chats Loaded
          </p>
        </aside>

        {/* CENTER — conversation */}
        <section className="flex min-h-0 flex-col bg-[#fafafa]">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Bir konuşma seçin
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: avatarHue(active.userName) }}
                  >
                    {initials(active.userName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-nest">
                      {active.userName}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {active.userEmail || "Misafir"} ·{" "}
                      {active.status === "open" ? "Açık" : "Çözüldü"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {active.status === "open" ? (
                    <button
                      type="button"
                      onClick={() => {
                        resolveThread(active.id);
                        refresh();
                        flash("Çözüldü");
                      }}
                      className="rounded-full bg-beige px-3 py-1.5 text-xs font-semibold"
                    >
                      Çözüldü
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        reopenThread(active.id);
                        refresh();
                        flash("Yeniden açıldı");
                      }}
                      className="rounded-full bg-beige px-3 py-1.5 text-xs font-semibold"
                    >
                      Yeniden aç
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="rounded-full p-1.5 text-muted hover:bg-beige hover:text-nest"
                    aria-label="Kapat"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messageBlocks.map((block) => (
                  <div key={block.key} className="space-y-2.5">
                    <div className="flex justify-center">
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-muted shadow-sm ring-1 ring-black/5">
                        {block.label}
                      </span>
                    </div>
                    {block.items.map((m) => {
                      if (m.sender === "system") {
                        return (
                          <p
                            key={m.id}
                            className="mx-auto max-w-[90%] text-center text-[11px] text-muted"
                          >
                            {m.text}
                          </p>
                        );
                      }
                      const agent = m.sender === "agent";
                      return (
                        <div
                          key={m.id}
                          className={`flex ${agent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                              agent
                                ? "rounded-br-md bg-[#e8eef2] text-nest"
                                : "rounded-bl-md bg-white text-nest ring-1 ring-black/5"
                            }`}
                          >
                            {agent && (
                              <p className="mb-1 text-[10px] font-semibold text-muted">
                                {m.agentName || "HRAM Destek"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{m.text}</p>
                            <p className="mt-1 text-right text-[10px] text-muted">
                              {formatClock(m.at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={onSend}
                className="relative border-t border-border bg-white p-3"
              >
                {emojiOpen && (
                  <div className="absolute bottom-full left-3 mb-2 flex gap-1 rounded-xl border border-border bg-white p-2 shadow-lg">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="rounded-lg px-2 py-1 text-lg hover:bg-beige"
                        onClick={() => {
                          setReply((r) => r + e);
                          setEmojiOpen(false);
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    onClick={insertGreeting}
                    className="rounded-full bg-beige px-2.5 py-1 text-[10px] font-semibold text-nest"
                  >
                    HRAM karşılama
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:bg-beige"
                    title="Sesli not (yakında)"
                    aria-label="Ses"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M12 17.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Enter message"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-beige/40 px-3 py-2.5 text-sm outline-none focus:border-foreground/25"
                    aria-label="Yanıt"
                  />
                  <button
                    type="button"
                    onClick={() => setEmojiOpen((v) => !v)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:bg-beige"
                    aria-label="Emoji"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
                      <circle cx="9" cy="10" r="1" fill="currentColor" />
                      <circle cx="15" cy="10" r="1" fill="currentColor" />
                      <path d="M8.5 14c1.2 1.4 2.7 2 3.5 2s2.3-.6 3.5-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted hover:bg-beige"
                    aria-label="Dosya ekle"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M14.5 7.5 8 14a3 3 0 0 0 4.2 4.2l7.1-7.1a4.5 4.5 0 0 0-6.4-6.4L6 11.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      onAttach(e.target.files?.[0] || null);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nest-solid text-white disabled:opacity-40"
                    aria-label="Gönder"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12 20 4l-5.5 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* RIGHT — profile */}
        <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-border bg-white lg:flex">
          {!profile || !active ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted">
              Profil için sohbet seçin
            </div>
          ) : (
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-bold text-[#5b4b8a]">
                      {profile.name}
                    </h2>
                    <button
                      type="button"
                      className="text-muted hover:text-nest"
                      title="Görüntüle"
                      aria-label="Görüntüle"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(
                          `${profile.name} · ID ${profile.displayId}`,
                        );
                        flash("Kopyalandı");
                      }}
                      className="text-muted hover:text-nest"
                      title="Kopyala"
                      aria-label="Kopyala"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M6 16V6a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">
                    ID: {profile.displayId}
                  </p>
                </div>
              </div>

              <ProfileRow
                label="Name"
                value={profile.name}
                onEdit={() => editField("name", "Name")}
              />
              <ProfileRow
                label="Account Type"
                value={profile.accountType}
                onEdit={() => editField("accountType", "Account Type")}
              />
              <ProfileRow
                label="Currency"
                value={profile.currency}
                onEdit={() => editField("currency", "Currency")}
              />
              <ProfileRow
                label="Timezone"
                value={profile.timezone}
                onEdit={() => editField("timezone", "Timezone")}
              />
              <ProfileRow
                label="Language"
                value={profile.language}
                onEdit={() => editField("language", "Language")}
              />
              <ProfileRow
                label="Is Active"
                value={profile.isActive ? "Yes" : "No"}
                danger={!profile.isActive}
                onEdit={() => toggleBool("isActive")}
              />
              <ProfileRow
                label="Is Active Trading"
                value={profile.isActiveTrading ? "Yes" : "No"}
                danger={!profile.isActiveTrading}
                onEdit={() => toggleBool("isActiveTrading")}
              />
              <ProfileRow
                label="Is Active Deposit"
                value={profile.isActiveDeposit ? "Yes" : "No"}
                danger={!profile.isActiveDeposit}
                onEdit={() => toggleBool("isActiveDeposit")}
              />
              <ProfileRow
                label="Is Active Withdrawal"
                value={profile.isActiveWithdrawal ? "Yes" : "No"}
                danger={!profile.isActiveWithdrawal}
                onEdit={() => toggleBool("isActiveWithdrawal")}
              />
              <ProfileRow
                label="Trading Server"
                value={profile.tradingServer}
                onEdit={() => editField("tradingServer", "Trading Server")}
              />
              <ProfileRow
                label="Registered At"
                value={new Date(profile.registeredAt).toLocaleString("tr-TR")}
                onEdit={() => editField("registeredAt", "Registered At (ISO)")}
              />
              <ProfileRow
                label="Registration Country"
                value={profile.registrationCountry}
                onEdit={() => editField("registrationCountry", "Registration Country")}
              />
              <ProfileRow
                label="Registration IP"
                value={profile.registrationIp}
                onEdit={() => editField("registrationIp", "Registration IP")}
              />
              <ProfileRow
                label="Last Login At"
                value={new Date(profile.lastLoginAt).toLocaleString("tr-TR")}
                onEdit={() => editField("lastLoginAt", "Last Login At (ISO)")}
              />
              <ProfileRow
                label="Mark FTD"
                value={
                  profile.markFtd
                    ? new Date(profile.markFtd).toLocaleString("tr-TR")
                    : "—"
                }
                onEdit={() => editField("markFtd", "Mark FTD (ISO date)")}
                onClear={() => {
                  if (!active) return;
                  setProfile(updateSupportProfile(active, { markFtd: "" }));
                }}
              />
              <ProfileRow
                label="Mark Ftd Broker"
                value={profile.markFtdBroker}
                danger={profile.markFtdBroker === "Not Assigned"}
                onEdit={() => editField("markFtdBroker", "Mark Ftd Broker")}
                onClear={() => {
                  if (!active) return;
                  setProfile(
                    updateSupportProfile(active, { markFtdBroker: "Not Assigned" }),
                  );
                }
                }
              />
              <ProfileRow
                label="Withdrawal Details"
                value={profile.withdrawalDetails}
                danger={profile.withdrawalDetails === "Empty"}
                onEdit={() => editField("withdrawalDetails", "Withdrawal Details")}
              />
              <ProfileRow
                label="Assignment Affiliate"
                value={profile.assignmentAffiliate}
                onEdit={() => editField("assignmentAffiliate", "Assignment Affiliate")}
              />
            </div>
          )}
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-nest-solid px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
