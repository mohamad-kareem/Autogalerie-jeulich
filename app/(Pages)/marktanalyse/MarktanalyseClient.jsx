"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, CircleDashed, Link2, LoaderCircle, Puzzle, Search, Trash2, X, XCircle } from "lucide-react";
import { detectHelperExtension } from "@/lib/ankauf/helperExtension";
import { confirmDialog } from "@/app/(components)/ConfirmHost";
import { PORTAL_LABEL } from "@/lib/marktanalyse/knowledge/defaults.js";
import { runAnalysis } from "@/lib/marktanalyse/run.js";
import { isListingUrl, portalOf } from "@/lib/marktanalyse/search.js";
import { euro } from "@/lib/marktanalyse/text.js";
import MarktanalyseSettings from "./MarktanalyseSettings";
import Report, { VerdictBadge } from "./Report";
import WissenView from "./WissenView";
import "./marktanalyse.css";

const PORTALS = ["MOBILE_DE", "AUTOSCOUT24", "KLEINANZEIGEN"];
const PORTAL_LOGO = {
  MOBILE_DE: { src: "https://services.mobile.de/images/mobile-rebranding-logo.svg", width: 104 },
  AUTOSCOUT24: { src: "/logos/autoscout24.svg", width: 105 },
  KLEINANZEIGEN: { src: "/logos/kleinanzeigen.svg", width: 146 },
};
const VIEWS = [
  { key: "analyse", label: "Analyse" },
  { key: "verlauf", label: "Verlauf" },
  { key: "wissen", label: "Gehirn" },
  { key: "einstellungen", label: "Einstellungen" },
];
const HELPER_STATUS = {
  connected: { label: "Helfer verbunden", icon: CheckCircle2, style: "text-emerald-700" },
  checking: { label: "Helfer wird geprüft …", icon: LoaderCircle, style: "text-muted motion-safe:animate-spin" },
  missing: { label: "Helfer nicht verbunden", icon: AlertTriangle, style: "text-violet-700" },
};
const dateTime = (value) => new Date(value).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

function PortalState({ name, state }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const logo = PORTAL_LOGO[name];
  const icon = state.state === "fertig" ? <CheckCircle2 className="size-4 text-emerald-600" />
    : state.state === "fehler" ? <XCircle className="size-4 ma-danger-text" />
      : state.state === "laedt" ? <LoaderCircle className="size-4 text-slate-500 motion-safe:animate-spin" />
        : <CircleDashed className="size-4 text-slate-400" />;
  return (
    <li className="ma-portal-state">
      <span className="ma-portal-logo">
        {logoFailed ? <strong>{PORTAL_LABEL[name]}</strong> : (
          <img src={logo.src} alt={PORTAL_LABEL[name]} width={logo.width} height={25}
            referrerPolicy="no-referrer" onError={() => setLogoFailed(true)} />
        )}
      </span>
      <span className="ma-portal-status">
        <span aria-hidden="true">{icon}</span>
        {state.state === "ausgelassen" ? "Ausgeschaltet" : state.state === "wartet" ? "Wartet" : state.state === "fehler" ? "Nicht verfügbar"
          : state.state === "laedt" && state.found === 0 ? "Suche läuft …"
            : `${state.found} Fahrzeuge${Number.isFinite(state.total) ? ` von ${state.total.toLocaleString("de-DE")}` : ""}`}
      </span>
      {state.error && <span className="text-[12px] ma-danger-text">{state.error}</span>}
    </li>
  );
}

export default function MarktanalyseClient({ initialView = "analyse" }) {
  const [view, setView] = useState(initialView);
  const [url, setUrl] = useState("");
  const [extension, setExtension] = useState("checking");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const abort = useRef(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const connected = await detectHelperExtension();
      if (active) setExtension(connected ? "connected" : "missing");
    };
    check();
    window.addEventListener("focus", check);
    return () => {
      active = false;
      window.removeEventListener("focus", check);
      abort.current?.abort();
    };
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/marktanalyse", { cache: "no-store" });
      const data = await response.json();
      setHistory(response.ok ? data.items : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (view === "verlauf") loadHistory();
  }, [view, loadHistory]);

  async function start(event) {
    event?.preventDefault();
    const link = url.trim();
    setError("");
    if (!portalOf(link)) return setError("Bitte einen Link von mobile.de, AutoScout24 oder Kleinanzeigen einfügen.");
    if (!isListingUrl(link)) return setError("Das ist keine einzelne Fahrzeuganzeige. Bitte die Anzeige öffnen und deren Link einfügen.");
    if (!(await detectHelperExtension())) {
      setExtension("missing");
      return setError("Die Browser-Erweiterung ist nicht verbunden. Bitte installieren und die Seite neu laden.");
    }
    setExtension("connected");
    const controller = new AbortController();
    abort.current = controller;
    setRunning(true);
    setResult(null);
    setProgress({ stage: "listing", message: "Wird gestartet …", portals: null });
    try {
      const done = await runAnalysis(link, {
        signal: controller.signal,
        onProgress: (next) => setProgress((previous) => ({ ...previous, ...next, message: next.message || previous?.message })),
      });
      setResult(done);
      setProgress(null);
    } catch (problem) {
      if (problem?.name !== "AbortError") setError(problem?.message || "Die Analyse ist fehlgeschlagen.");
      setProgress(null);
    } finally {
      setRunning(false);
      abort.current = null;
    }
  }

  async function open(id) {
    setError("");
    try {
      const response = await fetch(`/api/marktanalyse/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setResult(data);
      setUrl(data.subject?.url || "");
      setView("analyse");
    } catch (problem) {
      setError(problem?.message || "Die Analyse konnte nicht geladen werden.");
    }
  }

  async function remove(id) {
    if (!(await confirmDialog({ title: "Analyse löschen", message: "Diese Analyse aus dem Verlauf löschen?", confirmLabel: "Löschen", danger: true }))) return;
    await fetch(`/api/marktanalyse/${id}`, { method: "DELETE" }).catch(() => {});
    setHistory((list) => (list || []).filter((entry) => entry.id !== id));
  }

  const { label: helperStatus, icon: HelperIcon, style: helperStyle } = HELPER_STATUS[extension];
  const market = result?.report?.market;
  const comparableSources = new Set(
    [...(market?.dealer || []), ...(market?.private || [])]
      .flatMap(({ source, alsoOn }) => [source, ...(alsoOn || [])]),
  );
  const sourceNames = PORTALS.filter((portal) => comparableSources.has(portal)).map((portal) => PORTAL_LABEL[portal]);

  return (
    <div className="ma-workspace">
      <section className="ind-plate" aria-labelledby="ma-title">
        <header className={view === "analyse" ? "ma-header ma-header-analysis" : "ma-header"}>
          <div>
            <h1 className="ind-title" id="ma-title">Marktanalyse</h1>
            {view === "analyse" && sourceNames.length > 0 && (
              <p className="ma-header-description">{sourceNames.join(" · ")}</p>
            )}
          </div>
          <nav className="ind-seg inline-flex justify-self-start" aria-label="Marktanalyse">
            {VIEWS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setView(key)} className={`ind-seg-btn ${view === key ? "ind-seg-on" : ""}`} aria-pressed={view === key}>
                {label}
              </button>
            ))}
          </nav>
          {view === "analyse" ? (
            <form onSubmit={start} className="ma-search">
              <div className="ma-link-field">
                <Link2 className="size-3.5" aria-hidden="true" />
                <label htmlFor="ma-url" className="sr-only">Anzeigenlink</label>
                <input id="ma-url" type="url" inputMode="url" autoComplete="off" spellCheck={false} className="field" placeholder="Anzeigenlink einfügen" aria-describedby="ma-portals" value={url} onChange={(event) => setUrl(event.target.value)} disabled={running} />
                <span id="ma-portals" className="sr-only">mobile.de, AutoScout24 oder Kleinanzeigen</span>
              </div>
              {running ? (
                <button type="button" className="btn btn-secondary" onClick={() => abort.current?.abort()}><X /> Abbrechen</button>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={!url.trim()}><Search /> Prüfen</button>
              )}
              <span className="ma-helper" role="status" title={helperStatus}>
                <HelperIcon className={`size-3.5 ${helperStyle}`} aria-hidden="true" />
                <span className="sr-only">{helperStatus}</span>
              </span>
            </form>
          ) : null}
        </header>

        {view === "analyse" && extension === "missing" ? (
              <p className="ma-notice flex flex-wrap items-center gap-x-2 gap-y-1 border-t ma-tone-warn" role="status">
            <Puzzle className="size-4 shrink-0" aria-hidden="true" />
            Die Browser-Erweiterung „Helfer“ (Version 3) ist nicht verbunden.
            <Link href="/einstellungen#browser-erweiterung" className="font-semibold underline">Zur Installation</Link>
          </p>
        ) : null}
      </section>

      {error && (view === "analyse" || view === "verlauf") ? (
        <p role="alert" className="ma-notice flex items-start gap-2 rounded-md border ma-tone-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : null}

      {view === "wissen" ? <WissenView /> : null}

      {view === "einstellungen" && (
        <section className="ind-panel ma-panel" aria-labelledby="ma-settings-title">
          <h2 id="ma-settings-title" className="sr-only">Marktanalyse-Einstellungen</h2>
          <MarktanalyseSettings />
        </section>
      )}

      {view === "verlauf" ? (
        <section className="ind-panel ma-panel" aria-labelledby="ma-history-title">
          <div className="ma-panel-heading">
            <h2 id="ma-history-title">Gespeicherte Analysen</h2>
            {history ? <span className="ind-count">{history.length}</span> : null}
          </div>
          {history === null ? (
            <p className="ma-panel-message flex items-center gap-2 text-muted"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> Verlauf wird geladen …</p>
          ) : history.length === 0 ? (
            <p className="ma-panel-message text-muted">Noch keine Analysen gespeichert.</p>
          ) : (
            <div className="ma-table-scroll" tabIndex={0} role="region" aria-label="Verlaufstabelle">
              <table className="ma-table w-full min-w-[720px] text-left text-[13px]" aria-labelledby="ma-history-title">
                <thead className="ind-thead">
                  <tr><th scope="col">Datum</th><th scope="col">Fahrzeug</th><th scope="col" className="ma-number">Preis</th><th scope="col" className="ma-number">Marktwert</th><th scope="col" className="ma-number">Einkaufslimit</th><th scope="col">Urteil</th><th scope="col"><span className="sr-only">Aktionen</span></th></tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} className="ind-row cursor-pointer" onClick={() => open(entry.id)}>
                      <td className="whitespace-nowrap px-3 py-2 text-muted">{dateTime(entry.createdAt)}</td>
                      <td className="px-3 py-2">
                        <button type="button" className="ma-history-link" onClick={(event) => { event.stopPropagation(); open(entry.id); }}>{entry.title || "Fahrzeug"}</button>
                        <span className="block text-[12px] text-muted">{PORTAL_LABEL[entry.source] || ""}{entry.feedback?.boughtPrice > 0 ? ` · gekauft für ${euro(entry.feedback.boughtPrice)}` : ""}</span>
                      </td>
                      <td className="ma-number">{euro(entry.ask)}</td>
                      <td className="ma-number">{euro(entry.marketValue)}</td>
                      <td className="ma-number">{euro(entry.limit)}</td>
                      <td className="px-3 py-2"><VerdictBadge verdict={entry.verdict} label={entry.headline} small /></td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" className="ind-icon-btn" aria-label="Analyse löschen" onClick={(event) => { event.stopPropagation(); remove(entry.id); }}>
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {view === "analyse" ? (
        <>
          {progress ? (
            <section className="ind-panel ma-panel" aria-label="Analysefortschritt" aria-live="polite">
              <div className="ma-panel-heading">
                <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
                <h2>{progress.message}</h2>
                {progress.step > 0 && <span className="ml-auto shrink-0 text-[12px] text-muted">Schritt {progress.step} von 3</span>}
              </div>
              <div className="ma-progress-body">
                {progress.subject ? (
                  <p className="text-[13px] text-muted">
                    <strong className="text-ink">{progress.subject.title}</strong> · {progress.subject.firstRegistration} · {progress.subject.mileageKm?.toLocaleString("de-DE")} km · {euro(progress.subject.price)}
                  </p>
                ) : null}
                {progress.portals ? (
                  <ul className="ma-portal-list">
                    {PORTALS.map((name) => <PortalState key={name} name={name} state={progress.portals[name]} />)}
                  </ul>
                ) : null}
              </div>
            </section>
          ) : null}

          {result ? (
            <Report key={result.id} id={result.id} subject={result.subject} report={result.report} createdAt={result.createdAt} feedback={result.feedback}
              onFeedback={(feedback) => setResult((current) => (current ? { ...current, feedback } : current))}
              onReportChange={(report) => setResult((current) => (current?.id === result.id ? { ...current, report } : current))} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
