"use client";

import { useEffect, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { PORTAL_LABEL } from "@/lib/marktanalyse/knowledge/defaults.js";
import { portalOf } from "@/lib/marktanalyse/search.js";

const KIND = { body: "Karosserie", mech: "Technik", wear: "Verschleiß", vague: "Unklar", history: "Vorgeschichte", seller: "Verkäufer", positive: "Pluspunkt" };
const SEVERITY = ["Plus", "Hinweis", "Kosten", "Ernst", "Ausschluss"];
const FUEL = { PETROL: "Benzin", DIESEL: "Diesel", HYBRID: "Hybrid", PLUGIN_HYBRID: "Plug-in-Hybrid", ELECTRIC: "Elektro", LPG: "Autogas", CNG: "Erdgas" };
const GEAR = { MANUAL: "Schaltgetriebe", AUTOMATIC: "Automatik" };
const day = (value) => (value ? new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "–");

function Table({ head, children, min = 640 }) {
  return (
    <div className="ma-table-scroll" tabIndex={0} role="region" aria-label="Wissenstabelle">
      <table className="ma-table w-full text-left text-[13px]" style={{ minWidth: min }}>
        <thead className="ind-thead"><tr>{head.map((cell, index) => <th key={index} scope="col" className={cell.right ? "text-right" : ""}>{cell.label ?? cell}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function WissenView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("regeln");

  useEffect(() => {
    let active = true;
    fetch("/api/marktanalyse/wissen", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!active) return;
        if (response.ok) setData(body);
        else setError(body.error || "Das Wissen konnte nicht geladen werden.");
      })
      .catch(() => active && setError("Das Wissen konnte nicht geladen werden."));
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" className="ind-panel ma-panel ma-panel-message ma-danger-text">{error}</p>;
  if (!data) return <p role="status" className="ind-panel ma-panel ma-panel-message flex items-center gap-2 text-muted"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> Wissen wird geladen …</p>;

  const tabs = [
    ["regeln", "Regeln", data.rules.length],
    ["woerterbuch", "Wörterbuch", data.dictionary.length],
    ["modelle", "Modellwissen", data.models.length],
    ["generationen", "Generationen", (data.generations || []).length],
    ["linien", "Ausstattungslinien", (data.trims || []).length],
    ["steuertrieb", "Zahnriemen / Kette", (data.timing || []).length],
    ["markt", "Marktdaten", data.market.length],
    ["unbekannt", "Unbekannte Hinweise", data.unknown.length],
    ["log", "Änderungen", data.log.length],
  ];
  const { summary, tuning } = data;

  return (
      <section className="ind-panel ma-panel" aria-labelledby="ma-knowledge-title">
        <div className="ma-panel-heading justify-between">
          <h2 id="ma-knowledge-title">Gehirn</h2>
          <a href="/api/marktanalyse/wissen?export=1" download className="btn btn-secondary btn-sm"><Download /> Export für Claude</a>
        </div>
        <div className="ma-metrics">
          <dl className="ma-price-grid ma-knowledge-stats">
            <div><dt>Analysen</dt><dd>{summary.analyses}</dd></div>
            <div><dt>Erfasste Angebote</dt><dd>{summary.offers.toLocaleString("de-DE")}</dd></div>
            <div><dt>Gekauft</dt><dd>{summary.bought}</dd></div>
            <div><dt>Über dem Limit gekauft</dt><dd>{summary.overLimit ?? 0}</dd></div>
          </dl>
        </div>
        {summary.suggestion ? <div className="ma-table-note"><p className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-violet-900">Vorschlag: {summary.suggestion}</p></div> : null}
        <div className="ma-panel-heading ma-table-toolbar">
          <div className="ind-seg inline-flex" role="group" aria-label="Wissensbereiche">
            {tabs.map(([key, label, count]) => (
              <button key={key} type="button" onClick={() => setTab(key)} className={`ind-seg-btn inline-flex items-center gap-1.5 whitespace-nowrap ${tab === key ? "ind-seg-on" : ""}`} aria-pressed={tab === key}>
                {label} <span className="ind-count">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {tab === "regeln" ? (
          <Table head={["Regel", { label: "Angewendet", right: true }]}>
            {data.rules.map((rule) => (
              <tr key={rule.id} className="ind-row"><td className="px-3 py-2 text-ink">{rule.rule}</td><td className="px-3 py-2 text-right tabular-nums text-muted">{rule.count}×</td></tr>
            ))}
          </Table>
        ) : null}

        {tab === "woerterbuch" ? (
          <Table head={["Bedeutung", "Art", "Stufe", "Kostenposition", "Formulierungen in Anzeigen"]} min={900}>
            {data.dictionary.map((entry) => (
              <tr key={entry.id} className="ind-row align-top">
                <td className="px-3 py-2 font-semibold text-ink">{entry.label}</td>
                <td className="px-3 py-2 text-muted">{KIND[entry.kind] || entry.kind}</td>
                <td className="px-3 py-2 text-muted">{SEVERITY[entry.severity]}</td>
                <td className="px-3 py-2 text-muted">{entry.cost || "–"}</td>
                <td className="px-3 py-2 font-mono text-[11.5px] leading-relaxed text-slate-600">{[...entry.patterns, ...entry.mention.map((m) => `${m} + neu`)].join(" · ")}</td>
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "modelle" ? (
          <Table head={["Marken", "Motor / Getriebe", "Baujahre", "Bekannte Schwachstelle", "Quelle", { label: "Treffer", right: true }]} min={980}>
            {data.models.map((entry) => (
              <tr key={entry.id} className="ind-row align-top">
                <td className="px-3 py-2 capitalize text-ink">{entry.makes.filter((make, index, all) => all.indexOf(make) === index && make !== "vw" && make !== "mercedes").join(", ")}</td>
                <td className="px-3 py-2 text-muted">
                  {[FUEL[entry.fuel], GEAR[entry.gearbox], entry.ccm && `${entry.ccm[0]}–${entry.ccm[1]} cm³`, entry.ps && `${entry.ps[0]}–${entry.ps[1]} PS`].filter(Boolean).join(", ")}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted">{entry.years[0]}–{entry.years[1]}</td>
                <td className="px-3 py-2 text-ink">{entry.text}<span className="block text-[12px] text-muted">Frage: {entry.ask}</span></td>
                <td className="px-3 py-2 text-[12px] text-muted">{entry.source}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted">{entry.count}×</td>
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "generationen" ? (
          <Table head={["Marke", "Modell", "Generationen und Bauzeit"]} min={760}>
            {(data.generations || []).map((entry) => (
              <tr key={entry.makes[0] + entry.label} className="ind-row align-top">
                <td className="px-3 py-2 capitalize text-muted">{entry.makes.join(", ")}</td>
                <td className="px-3 py-2 font-semibold text-ink">{entry.label}</td>
                <td className="px-3 py-2 text-ink">{entry.gens.map((gen) => `${gen.name} (${gen.from}–${gen.to ?? "heute"})`).join(" · ")}</td>
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "linien" ? (
          <Table head={["Marke", "Basis", "Mittel", "Top", "Sport"]} min={900}>
            {(data.trims || []).map((entry) => (
              <tr key={entry.make} className="ind-row align-top">
                <td className="px-3 py-2 font-semibold capitalize text-ink">{entry.make}</td>
                {["base", "mid", "top", "sport"].map((level) => (
                  <td key={level} className="px-3 py-2 text-ink">{(entry[level] || []).join(", ") || "–"}</td>
                ))}
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "steuertrieb" ? (
          <Table head={["Marke", "Motor", "Kraftstoff", "Erstzulassung", "Antrieb", "Wechsel"]} min={900}>
            {(data.timing || []).map((entry, index) => (
              <tr key={index} className="ind-row align-top">
                <td className="px-3 py-2 capitalize text-muted">{entry.makes.join(", ")}</td>
                <td className="px-3 py-2 font-semibold text-ink">{entry.name}{entry.ccm ? <span className="font-normal text-muted"> · {entry.ccm[0] === entry.ccm[1] ? entry.ccm[0] : `${entry.ccm[0]}–${entry.ccm[1]}`} ccm</span> : null}{entry.ps ? <span className="font-normal text-muted"> · {entry.ps[0]}–{entry.ps[1]} PS</span> : null}</td>
                <td className="px-3 py-2 text-ink">{entry.fuel === "DIESEL" ? "Diesel" : entry.fuel === "PETROL" ? "Benzin" : "alle"}</td>
                <td className="px-3 py-2 text-ink">{entry.years[0]}–{entry.years[1] >= 2026 ? "heute" : entry.years[1]}</td>
                <td className="px-3 py-2 text-ink">{entry.drive}{entry.unsure ? " (nicht sicher)" : ""}</td>
                <td className="px-3 py-2 text-ink">{[entry.km ? `${entry.km.toLocaleString("de-DE")} km` : null, entry.interval ? `${entry.interval} Jahre` : null].filter(Boolean).join(" / ") || "–"}{entry.est && (entry.km || entry.interval) ? " (Richtwert)" : ""}</td>
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "markt" ? (
          data.market.length ? (
            <Table head={["Modell", { label: "Angebote gesehen", right: true }, { label: "Wertverlust je km", right: true }, { label: "je Monat", right: true }, { label: "Standzeit (Mitte)", right: true }, { label: "Preissenkung (Mitte)", right: true }]} min={860}>
              {data.market.map((row) => (
                <tr key={row.scope} className="ind-row">
                  <td className="px-3 py-2 capitalize text-ink">{row.make} {row.model}<span className="block text-[12px] normal-case text-muted">{[FUEL[row.fuel], GEAR[row.gearbox]].filter(Boolean).join(", ")}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.offers}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.perKm ? `${row.perKm.toLocaleString("de-DE")} €` : "–"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.perMonth ? `${row.perMonth} €` : "–"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.daysToSell ? `${row.daysToSell} Tage (${row.goneCount})` : "–"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{row.dropPct ? `${row.dropPct.toLocaleString("de-DE")} % (${row.dropCount})` : "–"}</td>
                </tr>
              ))}
            </Table>
          ) : <p className="px-4 py-6 text-center text-[13px] text-muted">Noch keine Marktdaten. Sie entstehen mit jeder Analyse.</p>
        ) : null}

        {tab === "unbekannt" ? (
          data.unknown.length ? (
            <Table head={["Satz aus einer Anzeige", "Auslöser", { label: "Gesehen", right: true }, "Zuletzt", "Beispiel"]} min={820}>
              {data.unknown.map((hint, index) => (
                <tr key={index} className="ind-row align-top">
                  <td className="px-3 py-2 text-ink">„{hint.quote}“</td>
                  <td className="px-3 py-2 text-muted">{hint.signal}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{hint.count}×</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{day(hint.lastSeen)}</td>
                  <td className="px-3 py-2">{portalOf(hint.example) ? <a href={hint.example} target="_blank" rel="noopener noreferrer" className="underline">{PORTAL_LABEL[portalOf(hint.example)]}</a> : "–"}</td>
                </tr>
              ))}
            </Table>
          ) : <p className="px-4 py-6 text-center text-[13px] text-muted">Keine unbekannten Hinweise gesammelt.</p>
        ) : null}

        {tab === "log" ? (
          data.log.length ? (
            <Table head={["Datum", "Wer", "Änderung"]}>
              {data.log.map((entry, index) => (
                <tr key={index} className="ind-row align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{day(entry.at)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted">{entry.by}</td>
                  <td className="px-3 py-2 text-ink">{entry.text.replace(/\bGewinn \d+–\d+ €/g, "Gewinnspanne angepasst")}</td>
                </tr>
              ))}
            </Table>
          ) : <p className="px-4 py-6 text-center text-[13px] text-muted">Noch keine Änderungen.</p>
        ) : null}

        {tab !== "regeln" && <p className="ma-table-note">
          {tab === "regeln" ? null
            : tab === "woerterbuch" ? "So versteht die Marktanalyse Anzeigentexte. Verneinungen („kein Rost“, „unfallfrei“) erkennt sie von selbst."
              : tab === "modelle" ? "Hinweise, keine Diagnosen: Der Bericht fragt nach, er behauptet keinen Schaden."
                : tab === "generationen" ? "Verglichen wird nur innerhalb einer Generation. Im Jahr des Modellwechsels entscheiden der Titel und die Generationsnummer von AutoScout24."
                : tab === "linien" ? `Die Linie wird aus dem Titel gelesen. Basis gegen Top oder Sport wird nicht verglichen; eine Nachbarstufe wird umgerechnet (Mittel +${tuning?.trimValuePct?.mid ?? 4} %, Top +${tuning?.trimValuePct?.top ?? 8} %, Sport +${tuning?.trimValuePct?.sport ?? 10} % gegenüber Basis).`
                : tab === "steuertrieb" ? "Der Motor wird über Marke, Kraftstoff, Hubraum, Leistung und Erstzulassung gefunden. Ist der Wechsel nahe oder überfällig und die Anzeige nennt keinen, warnt der Bericht und fragt nach. Kosten werden dafür nicht eingerechnet."
                : tab === "markt" ? "Aus allen bisher gesehenen Händlerangeboten gelernt. Standzeit = Tage, bis ein Angebot aus der Suche verschwand (Zahl in Klammern: Anzahl)."
                  : tab === "unbekannt" ? "Sätze, die nach Mangel klingen, aber noch nicht im Wörterbuch stehen. „Export für Claude“ lädt sie als Datei herunter."
                    : "Was gelernt oder geändert wurde."}
        </p>}
      </section>
  );
}
