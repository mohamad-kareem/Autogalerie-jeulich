"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  Check,
  ImageOff,
  Loader2,
  Mail,
  MailCheck,
  Phone,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  ACCIDENT_OPTIONS,
  TRADEIN_STATUS_LABELS,
  TRADEIN_STATUS_STYLES,
  formatEuro,
  formatKm,
} from "@/lib/tradeInOptions";
import { confirmDialog } from "@/app/(components)/ConfirmHost";

const cx = (...c) => c.filter(Boolean).join(" ");

const TABS = [
  { key: "", label: "Alle" },
  { key: "new", label: "Neu" },
  { key: "checking", label: "In Prüfung" },
  { key: "offer", label: "Angebot" },
  { key: "bought", label: "Angekauft" },
  { key: "declined", label: "Abgelehnt" },
];

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function relative(iso) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.round(h / 24);
  return d === 1 ? "gestern" : `vor ${d} Tagen`;
}

const digits = (v) => String(v ?? "").replace(/[^\d]/g, "");
const thousands = (v) => (v !== "" && v !== null && v !== undefined ? new Intl.NumberFormat("de-DE").format(Number(v)) : "");

export default function AnkaufClient({ canDelete = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState("");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(searchParams.get("id") || null);
  const [detail, setDetail] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [offer, setOffer] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (tab) qs.set("status", tab);
      if (debounced) qs.set("q", debounced);
      const res = await fetch(`/api/ankauf?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Angebote konnten nicht geladen werden.");
        return;
      }
      setError("");
      setItems(data.items || []);
      setCounts(data.counts || {});
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setLoading(false);
    }
  }, [tab, debounced]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // load the selected request (marks it as read)
  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ankauf/${selectedId}`, { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setError(data.error || "Angebot konnte nicht geladen werden.");
          return;
        }
        setDetail(data.item);
        setPhotoIdx(0);
        setOffer(data.item.offerPrice ?? "");
        setNote(data.item.note || "");
        setSaved("");
        setItems((list) => list.map((i) => (i._id === data.item._id ? { ...i, read: true } : i)));
      } catch {
        if (alive) setError("Keine Verbindung zum Server.");
      }
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [selectedId]);

  function open(id) {
    setSelectedId(id);
    router.replace(`/Posteingang/ankauf?id=${id}`, { scroll: false });
  }

  async function patch(payload, label) {
    if (!detail) return;
    setBusy(true);
    setSaved("");
    try {
      const res = await fetch(`/api/ankauf/${detail._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Speichern fehlgeschlagen.");
        return;
      }
      setDetail(data.item);
      setItems((list) => list.map((i) => (i._id === data.item._id ? { ...i, ...data.item } : i)));
      if (label) setSaved(label);
      if (payload.status) load();
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!detail || !(await confirmDialog("Dieses Angebot mit allen Fotos endgültig löschen?"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/ankauf/${detail._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Löschen fehlgeschlagen.");
        return;
      }
      setDetail(null);
      setSelectedId(null);
      router.replace("/Posteingang/ankauf", { scroll: false });
      load();
    } catch {
      setError("Keine Verbindung zum Server.");
    } finally {
      setBusy(false);
    }
  }

  const mailHref = useMemo(() => {
    if (!detail) return "#";
    const subject = `Ihr ${detail.brand} ${detail.model} – Ankaufangebot Autogalerie Jülich`;
    const price = detail.offerPrice ? `\n\nfür Ihren ${detail.brand} ${detail.model} können wir Ihnen ${formatEuro(detail.offerPrice)} anbieten.` : "";
    const body = `Guten Tag ${detail.name},${price}\n\nMit freundlichen Grüßen\nAutogalerie Jülich`;
    return `mailto:${detail.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [detail]);

  // the photos are stored on Cloudinary – the list holds their addresses
  const photoUrl = (url) => url;

  return (
    <div className="mx-auto max-w-[1600px]">
      {/* Header */}
      <div className="ind-plate flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ind-title">Ankauf</h1>
          <p className="text-sm text-muted">Fahrzeuge, die Kunden uns über „Auto verkaufen“ anbieten.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/Posteingang/ankauf/bestaetigung" className="btn btn-primary shrink-0">
            <MailCheck /> Ankauf bestätigen
          </Link>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Marke, Modell, Name …"
              className="field w-full pl-8 sm:w-64"
              aria-label="Angebote durchsuchen"
            />
          </div>
          <button type="button" onClick={load} className="btn btn-secondary px-2.5" aria-label="Aktualisieren">
            <RefreshCw className={cx("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ind-seg no-scrollbar mt-4 inline-flex max-w-full overflow-x-auto">
        {TABS.map((t) => {
          const n = t.key ? counts[t.key] || 0 : counts.all || 0;
          return (
            <button
              key={t.key || "all"}
              type="button"
              onClick={() => setTab(t.key)}
              className={cx("ind-seg-btn", tab === t.key && "ind-seg-on")}
            >
              {t.label}
              <span className="ind-count">{n}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">{error}</p>
      ) : null}

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[360px_1fr]">
        {/* List */}
        <div className={cx("card overflow-hidden", selectedId && "hidden lg:block")}>
          {loading && !items.length ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird geladen …
            </div>
          ) : !items.length ? (
            <div className="p-10 text-center text-[13px] text-muted">
              <Car className="mx-auto mb-2 h-6 w-6 text-line-strong" />
              Noch keine Angebote.
            </div>
          ) : (
            <ul className="scroll-slim max-h-[72vh] divide-y divide-line overflow-y-auto">
              {items.map((it) => (
                <li key={it._id}>
                  <button
                    type="button"
                    onClick={() => open(it._id)}
                    className={cx(
                      "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-canvas",
                      selectedId === it._id && "bg-brand-50/60",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!it.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-label="neu" /> : null}
                      <span className={cx("truncate text-[13px] text-ink", it.read ? "font-medium" : "font-semibold")}>
                        {it.brand} {it.model}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted">{relative(it.createdAt)}</span>
                    </span>
                    <span className="truncate text-[12px] text-body">
                      EZ {it.year || "–"} · {formatKm(it.mileage)}
                      {it.askingPrice ? ` · ${formatEuro(it.askingPrice)}` : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[11px] text-muted">{it.name}</span>
                      <span
                        className={cx(
                          "ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          TRADEIN_STATUS_STYLES[it.status],
                        )}
                      >
                        {TRADEIN_STATUS_LABELS[it.status]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className={cx(!selectedId && "hidden lg:block")}>
          {!detail ? (
            <div className="card flex min-h-[320px] flex-col items-center justify-center p-10 text-center text-[13px] text-muted">
              {selectedId ? <Loader2 className="h-5 w-5 animate-spin" /> : "Wählen Sie links ein Angebot aus."}
            </div>
          ) : (
            <div className="card overflow-hidden">
              {/* Title row */}
              <div className="flex flex-wrap items-start gap-3 border-b border-line px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setDetail(null);
                    router.replace("/Posteingang/ankauf", { scroll: false });
                  }}
                  className="basis-full text-left text-xs font-medium text-muted hover:text-ink lg:hidden"
                >
                  Zur Liste
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-ink">
                    {detail.brand} {detail.model}
                  </h2>
                  <p className="text-[12px] text-muted">
                    Eingegangen {detail.createdAt ? dateFmt.format(new Date(detail.createdAt)) : ""}
                    {detail.handledBy ? ` · zuletzt bearbeitet von ${detail.handledBy}` : ""}
                  </p>
                </div>
                <span className={cx("rounded px-2 py-1 text-[11px] font-semibold", TRADEIN_STATUS_STYLES[detail.status])}>
                  {TRADEIN_STATUS_LABELS[detail.status]}
                </span>
              </div>

              <div className="grid gap-5 p-4 xl:grid-cols-[1.15fr_1fr]">
                {/* Photos */}
                <div>
                  {detail.photos.length ? (
                    <>
                      <a
                        href={photoUrl(detail.photos[photoIdx])}
                        target="_blank"
                        rel="noreferrer"
                        className="block aspect-[4/3] overflow-hidden rounded-lg bg-canvas"
                        title="In voller Größe öffnen"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl(detail.photos[photoIdx])}
                          alt={`${detail.brand} ${detail.model} – Foto ${photoIdx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </a>
                      {detail.photos.length > 1 ? (
                        <div className="mt-2 grid grid-cols-6 gap-1.5">
                          {detail.photos.map((pid, i) => (
                            <button
                              key={pid}
                              type="button"
                              onClick={() => setPhotoIdx(i)}
                              className={cx(
                                "aspect-[4/3] overflow-hidden rounded-md ring-2 transition",
                                i === photoIdx ? "ring-brand-500" : "ring-transparent opacity-75 hover:opacity-100",
                              )}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photoUrl(pid)} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg bg-canvas text-[12px] text-muted">
                      <ImageOff className="h-5 w-5" />
                      Keine Fotos gesendet
                    </div>
                  )}

                  {detail.description ? (
                    <div className="mt-4">
                      <p className="label">Beschreibung des Kunden</p>
                      <p className="whitespace-pre-wrap text-[13px] text-body">{detail.description}</p>
                    </div>
                  ) : null}

                  {detail.extras?.length ? (
                    <div className="mt-4">
                      <p className="label">Weitere Angaben</p>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                        {detail.extras.map((x) => (
                          <div key={x.label} className="min-w-0">
                            <dt className="text-[11px] text-muted">{x.label}</dt>
                            <dd className="truncate font-medium text-ink">{x.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}

                  {detail.features?.length ? (
                    <div className="mt-4">
                      <p className="label">Ausstattung</p>
                      <p className="text-[12.5px] text-body">{detail.features.join(" · ")}</p>
                    </div>
                  ) : null}
                </div>

                {/* Data + handling */}
                <div className="space-y-4">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    {[
                      ["Erstzulassung", detail.year || "–"],
                      ["Kilometerstand", formatKm(detail.mileage)],
                      ["Kraftstoff", detail.fuel || "–"],
                      ["Getriebe", detail.gearbox || "–"],
                      ["Leistung", detail.power ? `${detail.power} PS` : "–"],
                      ["Zustand", detail.condition || "–"],
                      ["Unfallfrei", ACCIDENT_OPTIONS.find((o) => o.value === detail.accidentFree)?.label || "–"],
                      ["TÜV bis", detail.tuev ? detail.tuev.split("-").reverse().join("/") : "–"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[11px] text-muted">{k}</dt>
                        <dd className="font-medium text-ink">{v}</dd>
                      </div>
                    ))}
                    <div className="col-span-2 rounded-md bg-canvas px-3 py-2">
                      <dt className="text-[11px] text-muted">Preisvorstellung des Kunden</dt>
                      <dd className="text-[15px] font-bold text-ink">{formatEuro(detail.askingPrice)}</dd>
                    </div>
                  </dl>

                  {/* Seller */}
                  <div className="border-t border-line pt-3">
                    <p className="label">Verkäufer</p>
                    <p className="text-[13px] font-medium text-ink">
                      {detail.name}
                      {detail.zip ? <span className="font-normal text-muted"> · PLZ {detail.zip}</span> : null}
                    </p>
                    <p className="text-[12px] text-muted">
                      {detail.email}
                      {detail.phone ? ` · ${detail.phone}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <a href={mailHref} className="btn btn-primary btn-sm">
                        <Mail className="h-3.5 w-3.5" />
                        Per E-Mail antworten
                      </a>
                      {detail.phone ? (
                        <a href={`tel:${detail.phone.replace(/\s+/g, "")}`} className="btn btn-secondary btn-sm">
                          <Phone className="h-3.5 w-3.5" />
                          Anrufen
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Our offer */}
                  <div className="border-t border-line pt-3">
                    <label htmlFor="offer" className="label">
                      Unser Angebot
                    </label>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          id="offer"
                          inputMode="numeric"
                          value={thousands(offer)}
                          onChange={(e) => setOffer(digits(e.target.value).slice(0, 8))}
                          className="field pr-7"
                          placeholder="z. B. 9.500"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted">€</span>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          patch(
                            { offerPrice: offer === "" ? null : Number(offer), ...(offer !== "" && detail.status === "new" ? { status: "offer" } : {}) },
                            "Angebot gespeichert",
                          )
                        }
                        className="btn btn-secondary"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label htmlFor="note" className="label">
                      Interne Notiz
                    </label>
                    <textarea
                      id="note"
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onBlur={() => note !== detail.note && patch({ note }, "Notiz gespeichert")}
                      className="field"
                      placeholder="z. B. Besichtigung Do 15 Uhr, Reifen neu nötig …"
                    />
                  </div>

                  {saved ? (
                    <p className="flex items-center gap-1 text-[12px] text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      {saved}
                    </p>
                  ) : null}

                  {/* Status */}
                  <div className="border-t border-line pt-3">
                    <p className="label">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(TRADEIN_STATUS_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          disabled={busy || detail.status === key}
                          onClick={() => patch({ status: key })}
                          className={cx(
                            "rounded-md border px-2.5 py-1 text-[12px] font-medium transition",
                            detail.status === key
                              ? "border-ink bg-ink text-white"
                              : "border-line-strong text-body hover:border-ink hover:text-ink",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                      {canDelete ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={remove}
                          className="btn btn-sm ml-auto border border-rose-200 text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Löschen
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
