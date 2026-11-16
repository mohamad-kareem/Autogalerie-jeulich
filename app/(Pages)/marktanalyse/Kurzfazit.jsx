"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

function AssessmentOverview({ reasons = [], collapsible = false }) {
  const visibleReasons = reasons
    .filter((reason) => !/^Beim Angebotspreis von .*\b(?:Gewinn|Verlust)\b/.test(reason))
    .map((reason) => reason.replace(/(\bMarktwert [\d.,]+\s*€) \([\d.,]+\s*€ bis [\d.,]+\s*€\)/, "$1"));
  const list = <ul>{visibleReasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>;

  if (collapsible) {
    return (
      <details className="ma-inline-details ma-ai-overview">
        <summary>Bewertung im Überblick <ChevronDown size={14} aria-hidden="true" /></summary>
        {list}
      </details>
    );
  }

  return (
    <section className="ma-reason-details" aria-labelledby="ma-reasons-title">
      <h3 className="ma-fixed-heading" id="ma-reasons-title">Bewertung im Überblick</h3>
      {list}
    </section>
  );
}

function summaryLines(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, "")).filter(Boolean);
  if (lines.length !== 1 || typeof Intl.Segmenter !== "function") return lines;
  const sentences = new Intl.Segmenter("de", { granularity: "sentence" });
  return Array.from(sentences.segment(lines[0]), ({ segment }) => segment.trim());
}

function WrittenSummary({ text, children }) {
  const [visible, setVisible] = useState(0);
  const { lines, length } = useMemo(() => {
    let length = 0;
    const lines = summaryLines(text).map((line) => {
      const letters = Array.from(line);
      const start = length;
      length += letters.length;
      return { letters, start };
    });
    return { lines, length };
  }, [text]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(length);
      return;
    }

    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisible(count);
      if (count === length) window.clearInterval(timer);
    }, 16);

    return () => window.clearInterval(timer);
  }, [length]);

  return (
    <div className="ma-ai-summary" data-writing={visible < length ? "" : undefined}>
      <h3>
        <span className="ma-ai-avatar" aria-hidden="true">
          <span className="ma-ai-avatar-face" />
        </span>
        KI-Kurzfazit
      </h3>
      <ul className="ma-ai-summary-text" aria-hidden="true">
        {lines.map(({ letters, start }) => {
          const count = Math.max(0, visible - start);
          return (
            <li key={start} className={count === 0 ? "ma-ai-summary-pending" : undefined}>
              {letters.slice(0, count).join("")}
              <span className="ma-ai-summary-pending">{letters.slice(count).join("")}</span>
            </li>
          );
        })}
      </ul>
      {children}
    </div>
  );
}

/** Solange die KI schreibt: Kopf mit nickendem Gesicht und drei Platzhalterzeilen; die Bewertung ist eingeklappt. */
function ThinkingSummary({ reasons }) {
  return (
    <div className="ma-ai-summary" data-writing="" aria-busy="true">
      <h3>
        <span className="ma-ai-avatar" aria-hidden="true">
          <span className="ma-ai-avatar-face" />
        </span>
        KI-Kurzfazit
        <span className="ma-ai-thinking">denkt nach …</span>
      </h3>
      <ul className="ma-ai-skeleton" aria-hidden="true">
        <li /><li /><li />
      </ul>
      <AssessmentOverview reasons={reasons} collapsible />
    </div>
  );
}

export default function Kurzfazit({ id, report }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/marktanalyse/${id}/kurzfazit`, { method: "POST", signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !Object.hasOwn(data, "summary")) {
          throw new Error(data.error || "KI-Kurzfazit derzeit nicht verfügbar.");
        }
        if (!controller.signal.aborted) setResult({ report, summary: data.summary });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ report, error: error.message || "KI-Kurzfazit derzeit nicht verfügbar." });
      }
    }

    load();
    return () => controller.abort();
  }, [id, report]);

  const current = result?.report === report ? result : null;
  return (
    <>
      <span className="sr-only" role="status">{current?.summary || ""}</span>
      {current?.summary ? (
        <WrittenSummary key={current.summary} text={current.summary}>
          <AssessmentOverview reasons={report.reasons} collapsible />
        </WrittenSummary>
      ) : id && !current ? <ThinkingSummary reasons={report.reasons} />
        : <AssessmentOverview reasons={report.reasons} />}
      {current?.error && (
        <p className="ma-ai-summary text-muted" role="status">{current.error}</p>
      )}
    </>
  );
}
