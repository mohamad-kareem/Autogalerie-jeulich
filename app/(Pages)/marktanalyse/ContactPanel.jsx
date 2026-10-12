"use client";

/**
 * Kontakt — one small button in the strip. Opens a compact box with what the
 * seller published (e-mail, phone) and, with an e-mail address,
 * "E-Mail schreiben" lets the AI draft a short request from the analysis;
 * the buyer reads and edits it, and only his click on "Senden" sends it from
 * the company mailbox. Without contact details: a link to the ad, where the
 * portal's own contact form is.
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FiCheck, FiExternalLink, FiLoader, FiMail, FiPhone, FiSend, FiX } from "react-icons/fi";

async function postContact(payload) {
  const response = await fetch("/api/market-analysis/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* handled below */
  }
  if (!response.ok) throw new Error(data?.error || `Fehler ${response.status}.`);
  return data;
}

const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

export default function ContactButton({ result, dark, onSent }) {
  const target = result.target || {};
  const contact = target.contact || {};
  const email = contact.email || target.sellerEmail || null;
  const phones = contact.phones?.length ? contact.phones : target.sellerPhones || [];
  const log = result.contactLog || [];

  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (event) => {
      if (box.current && !box.current.contains(event.target)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState({ subject: "", body: "" });

  const muted = dark ? "text-slate-400" : "text-slate-500";
  const faint = dark ? "text-slate-500" : "text-slate-400";
  const panel = `rounded-lg border ${dark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`;
  const button = `inline-flex h-8 items-center gap-1.5 rounded border px-3 text-xs font-semibold transition disabled:opacity-60 ${
    dark ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-slate-50"
  }`;
  const input = `w-full rounded border px-2.5 py-1.5 text-sm outline-none focus:border-sky-500 ${
    dark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-300 bg-white text-slate-900"
  }`;

  const startEmail = async () => {
    setMenu(false);
    setOpen(true);
    setDrafting(true);
    setDraft({ subject: "", body: "" });
    try {
      const data = await postContact({ action: "draft", result });
      setDraft({ subject: data.subject || "", body: data.body || "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDrafting(false);
    }
  };

  const send = async () => {
    setSending(true);
    try {
      const data = await postContact({ action: "send", to: email, subject: draft.subject, body: draft.body });
      toast.success(data.test ? `Test-E-Mail an ${data.to} gesendet.` : "E-Mail an den Verkäufer gesendet.");
      onSent?.({ at: data.sentAt, channel: "E-Mail", to: email, subject: draft.subject, test: Boolean(data.test) });
      setOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const sent = log.length > 0;
  const reachable = Boolean(email || phones.length);

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenu((value) => !value)}
        title={sent ? "Verkäufer bereits kontaktiert" : "Verkäufer kontaktieren"}
        className={`inline-flex h-9 items-center gap-1.5 rounded border px-2.5 text-xs font-semibold transition ${
          sent
            ? dark
              ? "border-emerald-800 text-emerald-300"
              : "border-emerald-300 text-emerald-700"
            : dark
              ? "border-slate-700 text-slate-300 hover:bg-slate-800"
              : "border-slate-300 text-slate-600 hover:bg-white"
        }`}
      >
        {sent ? <FiCheck /> : <FiMail />} Kontakt
      </button>

      {menu ? (
        <div className={`${panel} absolute right-0 top-full z-30 mt-1.5 w-72 p-3 text-xs shadow-lg`}>
          {contact.name || target.sellerName ? <p className="mb-1.5 font-semibold">{contact.name || target.sellerName}</p> : null}
          {email ? (
            <p className={`flex items-center gap-1.5 ${muted}`}>
              <FiMail className="size-3 shrink-0" /> <span className="truncate">{email}</span>
            </p>
          ) : null}
          {phones.map((phone) => (
            <a key={phone} href={telHref(phone)} className={`mt-1 flex items-center gap-1.5 hover:underline ${muted}`}>
              <FiPhone className="size-3 shrink-0" /> {phone}
            </a>
          ))}
          {!reachable ? <p className={muted}>Keine E-Mail oder Telefonnummer in der Anzeige – Kontakt über das Portal.</p> : null}

          {sent ? (
            <p className="mt-2 flex items-start gap-1 text-[11px] text-emerald-600">
              <FiCheck className="mt-0.5 size-3 shrink-0" />
              {log
                .map(
                  (entry) =>
                    `${entry.channel} ${entry.test ? "(Test) " : ""}am ${new Date(entry.at).toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`,
                )
                .join(" · ")}
            </p>
          ) : null}

          <div className="mt-2.5 flex gap-2">
            {email ? (
              <button type="button" onClick={startEmail} className={`${button} flex-1 justify-center`}>
                <FiMail /> E-Mail schreiben
              </button>
            ) : null}
            {target.listingUrl ? (
              <a href={target.listingUrl} target="_blank" rel="noreferrer" className={`${button} flex-1 justify-center`}>
                <FiExternalLink /> Anzeige
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-8"
          onMouseDown={() => !sending && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="E-Mail an den Verkäufer"
            onMouseDown={(event) => event.stopPropagation()}
            className={`w-full max-w-xl overflow-hidden rounded-lg border shadow-xl ${
              dark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <header className={`flex items-center justify-between border-b px-4 py-2.5 ${dark ? "border-slate-800" : "border-slate-200"}`}>
              <h2 className="text-sm font-bold">E-Mail an den Verkäufer</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={sending} className={muted} aria-label="Schließen">
                <FiX />
              </button>
            </header>

            <div className="space-y-2.5 p-4 text-xs">
              <p className={muted}>
                An: <span className="font-semibold">{email}</span>
              </p>
              {drafting ? (
                <p className={`flex items-center gap-2 py-8 ${muted}`}>
                  <FiLoader className="animate-spin" /> KI schreibt einen Entwurf …
                </p>
              ) : (
                <>
                  <label className="block">
                    <span className={`mb-1 block font-semibold ${muted}`}>Betreff</span>
                    <input
                      value={draft.subject}
                      onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
                      className={input}
                    />
                  </label>
                  <label className="block">
                    <span className={`mb-1 block font-semibold ${muted}`}>Text</span>
                    <textarea
                      value={draft.body}
                      onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                      rows={12}
                      className={`${input} leading-relaxed`}
                    />
                  </label>
                  <p className={faint}>Wird erst gesendet, wenn du auf „Senden“ klickst. Antworten kommen in dein Postfach.</p>
                </>
              )}
            </div>

            <footer className={`flex justify-end gap-2 border-t px-4 py-2.5 ${dark ? "border-slate-800" : "border-slate-200"}`}>
              <button type="button" onClick={() => setOpen(false)} disabled={sending} className={button}>
                Abbrechen
              </button>
              <button
                type="button"
                onClick={send}
                disabled={drafting || sending || draft.subject.trim().length < 3 || draft.body.trim().length < 10}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-sky-600 px-3 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                {sending ? <FiLoader className="animate-spin" /> : <FiSend />} Senden
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
