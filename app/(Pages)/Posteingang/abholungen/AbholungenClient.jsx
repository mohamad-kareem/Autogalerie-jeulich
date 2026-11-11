"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  MailCheck,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { ErrorNote, Field, Modal, Tabs, api, cx } from "@/app/(components)/sales/ui";
import { ANKAUF_PAYMENT } from "@/lib/ankaufMail";
import { berlinDay, dateDE, daysBetween, formatEuro, mapsHref, telHref } from "@/lib/sales";
import { confirmDialog } from "@/app/(components)/ConfirmHost";
import PlateBadge from "@/app/(Pages)/Fahrzeugverwaltung/_components/PlateBadge";

/** 95 → "1 Std. 35 Min." */
const durationDE = (m) => (m >= 60 ? `${Math.floor(m / 60)} Std.${m % 60 ? ` ${m % 60} Min.` : ""}` : `${m} Min.`);

/** one cell of the "to take along" strip */
function TakeAlong({ label, money, warn, children }) {
  return (
    <div className={cx("flex min-w-0 flex-col justify-between gap-1.5 border-l border-[#e3e6ea] px-3 py-2.5 first:border-l-0", money && "bg-emerald-50", warn && "bg-amber-50")}>
      <span className={cx("text-[10px] font-bold uppercase tracking-[0.12em]", money ? "text-emerald-700" : warn ? "text-amber-700" : "text-[#66707c]")}>{label}</span>
      <span className="flex min-h-[24px] items-center">{children}</span>
    </div>
  );
}

const WEEKDAY = new Intl.DateTimeFormat("de-DE", { weekday: "short", timeZone: "UTC" });
const REGISTERED = "registered";

function whenLabel(p) {
  if (!p.date) return { text: "Termin offen", tone: "slate" };
  const diff = daysBetween(berlinDay(), p.date);
  const time = p.time ? ` · ${p.time}` : "";
  if (diff === 0) return { text: `Heute${time}`, tone: "amber" };
  if (diff === 1) return { text: `Morgen${time}`, tone: "blue" };
  if (diff < 0) return { text: `${dateDE(p.date)}${time} · überfällig`, tone: "red" };
  return { text: `${WEEKDAY.format(new Date(`${p.date}T00:00:00Z`))}, ${dateDE(p.date)}${time}`, tone: "slate" };
}

const TONES = {
  slate: "bg-canvas text-body ring-line",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default function AbholungenClient() {
  const [tab, setTab] = useState("open");
  const [data, setData] = useState({ pickups: [], counts: {}, plates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState("");
  const [travel, setTravel] = useState({ from: "", times: {}, loading: false });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api(`/api/abholungen?status=${tab}`);
    setLoading(false);
    if (!res.ok) return setError(res.data.error || "Abholungen konnten nicht geladen werden.");
    setError("");
    setData({ pickups: [], counts: {}, plates: [], ...res.data });
    // driving time from the company to each car (cached on the server, the first time it takes a moment)
    if (tab === "open" && (res.data.pickups || []).some((p) => p.mode === "pickup")) {
      setTravel((t) => ({ ...t, loading: true }));
      const tr = await api("/api/abholungen/fahrzeit");
      setTravel({ from: tr.ok ? tr.data.from || "" : "", times: tr.ok ? tr.data.times || {} : {}, loading: false });
    }
  }, [tab]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  async function patch(id, body, key) {
    setBusy(key);
    const res = await api(`/api/abholungen/${id}`, { method: "PATCH", body });
    setBusy("");
    if (!res.ok) {
      setError(res.data.error || "Speichern fehlgeschlagen.");
      return null;
    }
    return res.data.pickup;
  }

  async function done(p) {
    const what = p.mode === "pickup" ? "abgeholt" : "angekommen";
    if (
      !(await confirmDialog({
        title: p.mode === "pickup" ? "Fahrzeug abgeholt?" : "Fahrzeug angekommen?",
        message: `${p.vehicle.name || "Fahrzeug"} als ${what} markieren? Es wird in der Fahrzeugverwaltung angelegt (Werkstatt).`,
        confirmLabel: p.mode === "pickup" ? "Abgeholt" : "Angekommen",
      }))
    )
      return;
    if (await patch(p._id, { action: "done" }, `d-${p._id}`)) load();
  }

  async function remove(p) {
    if (!(await confirmDialog(`Abholung von ${p.vehicle.name || "diesem Fahrzeug"} löschen?`))) return;
    const res = await api(`/api/abholungen/${p._id}`, { method: "DELETE" });
    if (!res.ok) return setError(res.data.error || "Löschen fehlgeschlagen.");
    load();
  }

  async function saveEdit() {
    const { originalPayment, plateChoice, originalPlateChoice, originalRedPlate, ...changes } = edit;
    if (changes.payment === originalPayment) delete changes.payment;
    if (plateChoice !== originalPlateChoice) {
      changes.registered = plateChoice === REGISTERED;
      changes.redPlate = changes.registered ? "" : plateChoice;
    }
    const updated = await patch(edit._id, changes, "edit");
    if (updated) {
      setEdit(null);
      load();
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <div className="ind-plate flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="ind-title">Abholungen</h1>
          <p className="mt-0.5 text-[12.5px] text-muted">Angekaufte Fahrzeuge, die noch zu uns kommen.</p>
        </div>
        <Link href="/Posteingang/ankauf/bestaetigung" className="btn btn-primary">
          <MailCheck /> Ankauf bestätigen
        </Link>
      </div>

      {error ? <ErrorNote onClose={() => setError("")}>{error}</ErrorNote> : null}

      <div className="border-b border-line">
        <Tabs
          tabs={[
            { key: "open", label: "Offen" },
            { key: "done", label: "Erledigt" },
          ]}
          value={tab}
          onChange={setTab}
          counts={data.counts}
        />
      </div>

      {data.pickups.length ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {data.pickups.map((p) => {
            const w = whenLabel(p);
            const vehicleName = p.vehicle.name
              ?.split(/\s+/)
              .filter((part) => /[\p{L}\p{N}]/u.test(part))
              .slice(0, 3)
              .join(" ") || "Fahrzeug";
            const address = [p.seller.street, [p.seller.zip, p.seller.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
            const isPickup = p.mode === "pickup";
            const isDone = p.status === "done";
            const plateChoice = p.registered ? REGISTERED : p.redPlate;
            return (
              <article key={p._id} className="card flex h-full flex-col overflow-hidden">
                <div className="flex-1 space-y-3 p-4">
                  {/* car */}
                  <div className="flex items-start gap-3">
                    {p.vehicle.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.vehicle.image} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover ring-1 ring-line" />
                    ) : (
                      <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-canvas text-muted ring-1 ring-line">
                        <Truck className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <h3 className="min-w-0 break-words text-[14px] font-semibold text-ink">{vehicleName}</h3>
                        {!isDone ? (
                          <span className={cx("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold ring-1 ring-inset", TONES[w.tone])}>
                            <CalendarClock className="h-3.5 w-3.5 shrink-0" /> {w.text}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11.5px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {dateDE(p.doneAt)}
                          </span>
                        )}
                      </div>
                      {p.vehicle.firstRegistration ? (
                        <p className="break-words text-[12px] text-muted">EZ {p.vehicle.firstRegistration}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* seller */}
                  <div className="rounded-lg bg-canvas/70 px-3 py-2.5 text-[12.5px]">
                    <p className="flex items-center gap-1.5 font-semibold text-ink">
                      <User className="h-3.5 w-3.5 text-muted" /> {p.seller.name || p.seller.email}
                    </p>
                    {p.seller.phone ? (
                      <a href={telHref(p.seller.phone)} className="mt-1 flex items-center gap-1.5 text-brand-700 hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {p.seller.phone}
                      </a>
                    ) : null}
                    {isPickup ? (
                      address ? (
                        <a href={mapsHref([address])} target="_blank" rel="noreferrer" className="mt-1 flex items-start gap-1.5 text-body hover:text-brand-700">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                          <span>
                            {address} <span className="text-brand-700">· Route</span>
                          </span>
                        </a>
                      ) : (
                        <p className="mt-1 flex items-center gap-1.5 text-amber-700">
                          <MapPin className="h-3.5 w-3.5" /> Adresse fehlt
                        </p>
                      )
                    ) : null}
                    {isPickup && address && !isDone ? (
                      travel.times[p._id] ? (
                        <p className="mt-1.5 flex items-center gap-1.5 font-medium text-ink" title={travel.from ? `ab ${travel.from}` : undefined}>
                          <Navigation className="h-3.5 w-3.5 text-muted" />
                          ca. {durationDE(travel.times[p._id].minutes)} Fahrt
                          <span className="font-normal text-muted">· {String(travel.times[p._id].km).replace(".", ",")} km ab Firma</span>
                        </p>
                      ) : travel.loading ? (
                        <p className="mt-1.5 flex items-center gap-1.5 text-muted">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fahrzeit wird berechnet …
                        </p>
                      ) : null
                    ) : null}
                  </div>

                  {/* to take along – one steel strip: plate · money · driver */}
                  <div
                    className="grid overflow-hidden rounded-[4px] border border-[#dfe2e6] bg-white shadow-[0_1px_2px_rgba(20,26,33,0.05)]"
                    style={{ gridTemplateColumns: `repeat(${1 + (isPickup ? 1 : 0) + (p.driver ? 1 : 0)}, minmax(0, 1fr))` }}
                  >
                    {isPickup ? (
                      <TakeAlong label="Kennzeichen" warn={!p.registered && !p.redPlate}>
                        {p.registered ? (
                          <span className="flex flex-col items-start gap-1">
                            <span className="text-[13px] font-semibold text-ink">Angemeldet</span>
                            <PlateBadge number="DN AB 123" size="xs" red={false} />
                          </span>
                        ) : p.redPlate ? (
                          <PlateBadge number={p.redPlate} size="sm" />
                        ) : (
                          <span className="text-[13px] font-semibold text-amber-800">noch wählen</span>
                        )}
                      </TakeAlong>
                    ) : null}
                    <TakeAlong label={p.payment === "cash" ? "Bargeld mitnehmen" : "Überweisung"} money>
                      <span className="inline-flex items-center gap-1.5 text-[15px] font-bold tabular-nums text-emerald-800">
                        {p.payment === "cash" ? <Banknote className="h-4 w-4 text-emerald-700" /> : null}
                        {formatEuro(p.price)}
                      </span>
                    </TakeAlong>
                    {p.driver ? (
                      <TakeAlong label="Fahrer">
                        <span className="inline-flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-ink">
                          <User className="h-4 w-4 shrink-0 text-muted" />
                          <span className="truncate">{p.driver}</span>
                        </span>
                      </TakeAlong>
                    ) : null}
                  </div>

                  {p.note ? <p className="whitespace-pre-line text-[12px] text-body">{p.note}</p> : null}
                </div>

                <div className="mt-auto flex items-center gap-1.5 border-t border-line bg-canvas/40 px-3 py-2">
                  <div className="mr-auto flex items-center gap-2 text-[11.5px]">
                    {p.vehicle.url ? (
                      <a href={p.vehicle.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1">
                        Inserat <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                    {p.vehicleId ? (
                      <Link href={`/Fahrzeugverwaltung?id=${p.vehicleId}`} className="link">
                        Fahrzeugakte
                      </Link>
                    ) : null}
                  </div>
                  {isDone ? (
                    <button type="button" onClick={async () => (await patch(p._id, { action: "reopen" }, `r-${p._id}`)) && load()} className="btn btn-secondary btn-sm">
                      <RotateCcw /> Wieder öffnen
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => remove(p)} className="rounded-md p-1.5 text-muted hover:bg-white hover:text-rose-600" title="Löschen">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEdit({
                            _id: p._id,
                            mode: p.mode,
                            date: p.date,
                            time: p.time,
                            payment: p.payment,
                            originalPayment: p.payment,
                            plateChoice,
                            originalPlateChoice: plateChoice,
                            originalRedPlate: p.redPlate,
                            driver: p.driver,
                            note: p.note,
                            seller: { ...p.seller },
                          })
                        }
                        className="btn btn-secondary btn-sm"
                      >
                        <Pencil /> Planen
                      </button>
                      <button type="button" onClick={() => done(p)} disabled={busy === `d-${p._id}`} className="btn btn-primary btn-sm">
                        {busy === `d-${p._id}` ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {isPickup ? "Abgeholt" : "Angekommen"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 px-4 py-14 text-center text-[13px] text-muted">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Truck className="h-6 w-6 text-line-strong" />}
          {loading ? "Abholungen werden geladen …" : tab === "open" ? "Keine offenen Abholungen." : "Noch nichts erledigt."}
        </div>
      )}

      {edit ? (
        <Modal
          open
          onClose={() => setEdit(null)}
          title="Abholung planen"
          width="max-w-lg"
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setEdit(null)}>
                Abbrechen
              </button>
              <button type="button" className="btn btn-primary" onClick={saveEdit} disabled={busy === "edit"}>
                {busy === "edit" ? <Loader2 className="animate-spin" /> : null} Speichern
              </button>
            </>
          }
        >
          <div className="grid grid-cols-6 gap-x-3 gap-y-2.5">
            <Field label="Datum" id="p-date" className="col-span-3">
              <input id="p-date" type="date" className="field" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
            </Field>
            <Field label="Uhrzeit" id="p-time" className="col-span-3">
              <input id="p-time" type="time" className="field" value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} />
            </Field>
            {edit.mode === "pickup" ? (
              <Field label="Kennzeichen" id="p-plate" className="col-span-3">
                <select id="p-plate" className="field" value={edit.plateChoice} onChange={(e) => setEdit({ ...edit, plateChoice: e.target.value })}>
                  <option value="">– wählen –</option>
                  <option value={REGISTERED}>Angemeldet</option>
                  {(data.plates || []).map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                  {edit.originalRedPlate && !(data.plates || []).includes(edit.originalRedPlate) ? <option value={edit.originalRedPlate}>{edit.originalRedPlate}</option> : null}
                </select>
                {edit.plateChoice !== REGISTERED && !(data.plates || []).length ? (
                  <p className="mt-1 text-[11px] text-muted">
                    Noch keine roten Kennzeichen –{" "}
                    <Link href="/Rotkennzeichen" className="link">
                      unter „Rote Kennzeichen“ anlegen
                    </Link>
                  </p>
                ) : null}
              </Field>
            ) : null}
            <Field label="Fahrer" id="p-driver" className={edit.mode === "pickup" ? "col-span-3" : "col-span-6"}>
              <input id="p-driver" className="field" value={edit.driver} onChange={(e) => setEdit({ ...edit, driver: e.target.value })} />
            </Field>
            <Field label="Zahlung" id="p-payment" className="col-span-6">
              <select id="p-payment" className="field" value={edit.payment} onChange={(e) => setEdit({ ...edit, payment: e.target.value })}>
                {ANKAUF_PAYMENT.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Telefon" id="p-phone" className="col-span-6 sm:col-span-2">
              <input id="p-phone" className="field" value={edit.seller.phone || ""} onChange={(e) => setEdit({ ...edit, seller: { ...edit.seller, phone: e.target.value } })} />
            </Field>
            <Field label="Straße, Nr." id="p-street" className="col-span-6 sm:col-span-4">
              <input id="p-street" className="field" value={edit.seller.street || ""} onChange={(e) => setEdit({ ...edit, seller: { ...edit.seller, street: e.target.value } })} />
            </Field>
            <Field label="PLZ" id="p-zip" className="col-span-2">
              <input id="p-zip" className="field" value={edit.seller.zip || ""} onChange={(e) => setEdit({ ...edit, seller: { ...edit.seller, zip: e.target.value } })} />
            </Field>
            <Field label="Ort" id="p-city" className="col-span-4">
              <input id="p-city" className="field" value={edit.seller.city || ""} onChange={(e) => setEdit({ ...edit, seller: { ...edit.seller, city: e.target.value } })} />
            </Field>
            <Field label="Notiz" id="p-note" className="col-span-6">
              <textarea id="p-note" rows={2} className="field" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="z. B. Schlüssel beim Nachbarn, Zufahrt über Hof" />
            </Field>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
