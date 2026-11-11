"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CarFront, CheckCircle2, ChevronDown, ExternalLink, Link2, Loader2, RotateCcw, Send, UserRound } from "lucide-react";
import { ErrorNote, Field as SalesField, Segmented, api, cx } from "@/app/(components)/sales/ui";
import { ANKAUF_ACCIDENT_OPTIONS, ANKAUF_PAYMENT, buildAnkaufMail } from "@/lib/ankaufMail";
import { formatEuro, parseEuro } from "@/lib/sales";
import { COMPANY } from "@/lib/company";
import TravelTime from "@/app/(components)/TravelTime";
import { confirmDialog } from "@/app/(components)/ConfirmHost";
import { detectMarketExtension, importMobileListing } from "@/lib/market/extension";
import { mobileUrl } from "@/extensions/marktanalyse/protocol";

const EMPTY_VEHICLE = {
  source: "",
  url: "",
  name: "",
  brand: "",
  model: "",
  firstRegistration: "",
  mileage: "",
  fuel: "",
  power: "",
  powerPs: null,
  gearbox: "",
  tuevUntil: "",
  color: "",
  owners: null,
  accidentStatus: "",
  bodyType: "",
  doors: "",
  seats: "",
  interior: "",
  displacement: "",
  adPrice: null,
  image: "",
  location: "",
};

/** extra details shown in a compact grid (all editable) */
const DETAILS = [
  ["power", "Leistung"],
  ["fuel", "Kraftstoff"],
  ["gearbox", "Getriebe"],
  ["bodyType", "Fahrzeugtyp"],
  ["color", "Außenfarbe"],
  ["interior", "Innenausstattung"],
  ["doors", "Türen"],
  ["seats", "Sitzplätze"],
  ["owners", "Vorbesitzer"],
  ["displacement", "Hubraum"],
];

const kmInput = (n) => (n == null || n === "" ? "" : new Intl.NumberFormat("de-DE").format(Number(n)));
const euroInput = (n) => (n == null || n === "" ? "" : new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n)));

export default function BestaetigungClient() {
  const [url, setUrl] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [loading, setLoading] = useState(false);
  const importRef = useRef(null);
  const [importStatus, setImportStatus] = useState(null);
  useEffect(() => () => importRef.current?.abort(), []);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [seller, setSeller] = useState({ name: "", email: "", phone: "", street: "", zip: "", city: "" });
  // driving time: the seller's address, otherwise the place from the listing
  const sellerTown = [seller.zip, seller.city].filter((x) => String(x).trim()).join(" ");
  const travelTo = sellerTown ? [seller.street.trim(), sellerTown].filter(Boolean).join(", ") : vehicle?.location || "";
  const [mode, setMode] = useState("pickup");
  const [handoverTime, setHandoverTime] = useState("");
  const [price, setPrice] = useState("");
  const [payment, setPayment] = useState("transfer");
  const [handoverDate, setHandoverDate] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [edited, setEdited] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");
  const [copyToCompany, setCopyToCompany] = useState(false);

  const setV = (k, val) => setVehicle((v) => ({ ...v, [k]: val }));
  const mileageNum = parseEuro(String(vehicle.mileage).replace(/\./g, ""));
  const priceNum = parseEuro(price);

  // the e-mail follows the form until somebody edits the text by hand
  const draft = useMemo(
    () =>
      buildAnkaufMail({
        vehicle: { ...vehicle, mileage: mileageNum },
        seller,
        price: priceNum,
        payment,
        handoverDate,
        handoverTime,
        mode,
      }),
    [vehicle, mileageNum, seller, priceNum, payment, handoverDate, handoverTime, mode],
  );
  useEffect(() => {
    if (edited) return;
    const t = setTimeout(() => {
      setSubject(draft.subject);
      setBody(draft.body);
    }, 0);
    return () => clearTimeout(t);
  }, [draft, edited]);

  async function load(fromText = false) {
    if (loading) return;
    setError("");
    setLoading(true);
    const controller = new AbortController();
    importRef.current = controller;
    try {
      let payload = fromText ? { text: paste, url } : { url };
      if (!fromText && mobileUrl(url.trim())) {
        setImportStatus({ status: "LOADING" });
        const connected = await detectMarketExtension();
        if (controller.signal.aborted) return;
        if (!connected) {
          setError(
            <>
              Die mobile.de-Erweiterung ist nicht verbunden. Bitte in den{" "}
              <Link href="/einstellungen#browser-erweiterung" className="font-semibold underline">Einstellungen</Link>{" "}
              installieren oder aktualisieren und danach diese Seite neu laden.
            </>,
          );
          return;
        }
        const page = await importMobileListing(url.trim(), {
          signal: controller.signal,
          onStatus: (status, showTab) => setImportStatus({ status, showTab }),
        });
        payload = { url: page.url, pageHtml: page.html };
      }
      if (controller.signal.aborted) return;
      const res = await api("/api/ankauf/import", { method: "POST", body: payload });
      if (controller.signal.aborted) return;
      if (!res.ok) {
        setError(res.data.error || "Daten konnten nicht geladen werden.");
        if (res.data.blocked) setPasteOpen(true);
        if (res.data.partial?.name) applyVehicle(res.data.partial);
        return;
      }
      applyVehicle(res.data.vehicle);
      setPasteOpen(false);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure?.message || "Daten konnten nicht geladen werden.");
    } finally {
      if (importRef.current === controller) {
        importRef.current = null;
        setLoading(false);
        setImportStatus(null);
      }
    }
  }

  function applyVehicle(v) {
    const imported = Object.fromEntries(Object.entries(EMPTY_VEHICLE).map(([key, fallback]) => [key, v[key] ?? fallback]));
    setVehicle({ ...imported, url: v.url || url, mileage: kmInput(v.mileage) });
  }

  function reset() {
    setUrl("");
    setPasteOpen(false);
    setPaste("");
    setVehicle(EMPTY_VEHICLE);
    setSeller({ name: "", email: "", phone: "", street: "", zip: "", city: "" });
    setMode("pickup");
    setHandoverTime("");
    setPrice("");
    setPayment("transfer");
    setHandoverDate("");
    setEdited(false);
    setSent(null);
    setError("");
  }

  async function send() {
    setError("");
    if (!seller.email.trim()) return setError("Bitte die E-Mail-Adresse des Verkäufers eintragen.");
    if (!(priceNum > 0)) return setError("Bitte den Ankaufspreis eintragen.");
    if (!(await confirmDialog({ title: "Bestätigung senden", message: `Ankaufbestätigung jetzt an ${seller.email.trim()} senden?`, confirmLabel: "Jetzt senden" }))) return;
    setSending(true);
    const res = await api("/api/ankauf/bestaetigung", {
      method: "POST",
      body: {
        vehicle: { ...vehicle, mileage: mileageNum },
        seller,
        price: priceNum,
        payment,
        handoverDate,
        handoverTime,
        mode,
        subject,
        body,
        copy: copyToCompany,
      },
    });
    setSending(false);
    if (!res.ok) return setError(res.data.error || "E-Mail konnte nicht gesendet werden.");
    setSent(res.data);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-lg pt-10">
        <div className="card p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-[17px] font-semibold text-ink">Bestätigung gesendet</h1>
          <p className="mt-1 text-[13px] text-muted">
            Die Ankaufbestätigung ging an <span className="font-medium text-ink">{sent.to}</span>.
            {sent.copy ? ` Eine Kopie liegt im Postfach ${COMPANY.email}.` : ""}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {sent.id ? (
              <Link href="/Posteingang/abholungen" className="btn btn-secondary">
                Zu den Abholungen
              </Link>
            ) : null}
            <button type="button" onClick={reset} className="btn btn-primary">
              Neue Bestätigung
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="ind-plate mb-4 flex flex-wrap items-center gap-2 px-3 py-3">
        <div className="mr-auto">
          <h1 className="ind-title">Ankauf bestätigen</h1>
        </div>
      </div>

      {error ? (
        <div className="mb-3">
          <ErrorNote onClose={() => setError("")}>{error}</ErrorNote>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_clamp(320px,35vw,440px)]">
        <div className="@container min-w-0 space-y-4">
          <FormCard title="Inserat" icon={Link2}>
            <form
              className="flex flex-col gap-2 @sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (url.trim()) load(false);
              }}
            >
              <input
                aria-label="Inserat-Link"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Link zum Fahrzeuginserat einfügen"
                className="field min-w-0 @sm:flex-1"
                inputMode="url"
                disabled={loading}
              />
              <button type="submit" disabled={loading || !url.trim()} className="btn btn-primary shrink-0">
                {loading && !pasteOpen ? <Loader2 className="animate-spin" /> : null} Daten laden
              </button>
            </form>
            {importStatus ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted" role="status">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {importStatus.status === "WAITING" ? "Bitte die Anzeige im geöffneten Tab bestätigen." : "Fahrzeugdaten werden geladen …"}
                {importStatus.status === "WAITING" && importStatus.showTab ? <button type="button" onClick={importStatus.showTab} className="underline">Anzeige öffnen</button> : null}
                <button type="button" onClick={() => importRef.current?.abort()} className="underline">Abbrechen</button>
              </div>
            ) : null}
            {pasteOpen ? (
              <div className="mt-2 space-y-2">
                <textarea
                  rows={5}
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  className="field text-[12px]"
                  placeholder="Im Inserat Strg + A, dann Strg + C drücken und hier mit Strg + V einfügen."
                />
                <button type="button" onClick={() => load(true)} disabled={loading || !paste.trim()} className="btn btn-secondary">
                  {loading ? <Loader2 className="animate-spin" /> : null} Aus Text übernehmen
                </button>
              </div>
            ) : null}
          </FormCard>

          <FormCard
            title="Fahrzeug"
            icon={CarFront}
            right={vehicle.url ? (
              <a href={vehicle.url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-[12px]">
                Inserat öffnen <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          >
            <div className="flex items-center gap-3">
              {vehicle.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vehicle.image} alt="" className="h-14 w-20 shrink-0 rounded object-cover ring-1 ring-line @md:h-16 @md:w-24" />
              ) : null}
              <Field label="Marke und Modell" id="a-name" value={vehicle.name} className="min-w-0 flex-1">
                <input id="a-name" className="field font-semibold" value={vehicle.name} onChange={(e) => setV("name", e.target.value)} placeholder="z. B. VW Golf 1.5 TSI" />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 @xl:grid-cols-4">
              <Field label="Erstzulassung" id="a-ez" value={vehicle.firstRegistration}>
                <input id="a-ez" className="field" value={vehicle.firstRegistration} onChange={(e) => setV("firstRegistration", e.target.value)} placeholder="MM/JJJJ" />
              </Field>
              <Field label="Kilometerstand" id="a-km" value={vehicle.mileage}>
                <div className="relative">
                  <input
                    id="a-km"
                    className="field pr-8 text-right tabular-nums"
                    inputMode="numeric"
                    value={vehicle.mileage}
                    onChange={(e) => setV("mileage", e.target.value.replace(/[^\d.]/g, ""))}
                    onBlur={(e) => setV("mileage", kmInput(parseEuro(e.target.value.replace(/\./g, ""))))}
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">km</span>
                </div>
              </Field>
              <Field label="HU bis" id="a-hu" value={vehicle.tuevUntil}>
                <input id="a-hu" className="field" value={vehicle.tuevUntil} onChange={(e) => setV("tuevUntil", e.target.value)} placeholder="MM/JJJJ" />
              </Field>
              <Field label="Unfallhistorie" id="a-accident" value={vehicle.accidentStatus}>
                <select id="a-accident" className="field" value={vehicle.accidentStatus} onChange={(e) => setV("accidentStatus", e.target.value)}>
                  {ANKAUF_ACCIDENT_OPTIONS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
                </select>
              </Field>
            </div>
            <details className="group mt-4 border-t border-line pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[13px] font-semibold text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
                Weitere Fahrzeugdaten <ChevronDown className="size-4 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3 @xl:grid-cols-4">
                {DETAILS.map(([key, label]) => (
                  <Field key={key} label={label} id={`a-${key}`} value={vehicle[key]}>
                    <input id={`a-${key}`} className="field" value={vehicle[key] ?? ""} onChange={(e) => setV(key, e.target.value)} />
                  </Field>
                ))}
              </div>
            </details>
          </FormCard>

          <FormCard title="Verkäufer" icon={UserRound}>
            <div className="grid grid-cols-12 gap-3">
              <Field label="Name" id="s-name" value={seller.name} className="col-span-12 @lg:col-span-4">
                <input id="s-name" className="field" value={seller.name} onChange={(e) => setSeller({ ...seller, name: e.target.value })} />
              </Field>
              <Field label="E-Mail" id="s-mail" value={seller.email} required className="col-span-12 @lg:col-span-5">
                <input id="s-mail" type="email" className="field" value={seller.email} onChange={(e) => setSeller({ ...seller, email: e.target.value })} />
              </Field>
              <Field label="Telefon" id="s-phone" value={seller.phone} className="col-span-12 @lg:col-span-3">
                <input id="s-phone" type="tel" className="field" value={seller.phone} onChange={(e) => setSeller({ ...seller, phone: e.target.value })} />
              </Field>
              <Field label="Straße, Nr." id="s-street" value={seller.street} className="col-span-12 @lg:col-span-5">
                <input id="s-street" className="field" value={seller.street} onChange={(e) => setSeller({ ...seller, street: e.target.value })} />
              </Field>
              <Field label="PLZ" id="s-zip" value={seller.zip} className="col-span-4 @lg:col-span-2">
                <input id="s-zip" className="field" inputMode="numeric" value={seller.zip} onChange={(e) => setSeller({ ...seller, zip: e.target.value })} />
              </Field>
              <Field label="Ort" id="s-city" value={seller.city} className="col-span-8 @lg:col-span-5">
                <input id="s-city" className="field" value={seller.city} onChange={(e) => setSeller({ ...seller, city: e.target.value })} />
              </Field>
            </div>
          </FormCard>

          <FormCard
            title={mode === "pickup" ? "Ankauf & Abholung" : "Ankauf & Übergabe"}
            icon={CalendarClock}
            right={vehicle.adPrice > 0 ? (
              <span className="text-xs tabular-nums text-muted">Inseratspreis <strong className="text-ink">{formatEuro(vehicle.adPrice)}</strong></span>
            ) : null}
          >
            <div className="grid grid-cols-2 gap-3 @lg:grid-cols-3">
              <Field label="Ankaufspreis" id="s-price" value={price} required className="col-span-2 @lg:col-span-1">
                <div className="relative">
                  <input
                    id="s-price"
                    inputMode="decimal"
                    className="field pr-7 text-right font-semibold tabular-nums"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))}
                    onBlur={(e) => setPrice(euroInput(parseEuro(e.target.value)))}
                    placeholder="0,00"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted">€</span>
                </div>
              </Field>
              <Field label={mode === "pickup" ? "Abholung am" : "Übergabe am"} id="s-date" value={handoverDate} className="min-w-0">
                <input id="s-date" type="date" className="field min-w-0" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)} />
              </Field>
              <Field label="Uhrzeit" id="s-time" value={handoverTime} className="min-w-0">
                <input id="s-time" type="time" className="field min-w-0" value={handoverTime} onChange={(e) => setHandoverTime(e.target.value)} />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
              <div>
                <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-brand-700">Zahlungsart</p>
                <Segmented value={payment} onChange={setPayment} options={ANKAUF_PAYMENT} size="sm" />
              </div>
              {travelTo ? <div className="text-[12px] text-muted"><TravelTime address={travelTo} /></div> : null}
            </div>
          </FormCard>
        </div>

        {/* E-mail */}
        <aside className="card overflow-hidden lg:sticky lg:top-4">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">E-Mail an den Verkäufer</p>
            {edited ? (
              <button type="button" onClick={() => setEdited(false)} className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink" title="Text wieder aus dem Formular erstellen">
                <RotateCcw className="h-3.5 w-3.5" /> Neu erstellen
              </button>
            ) : null}
          </div>
          <div className="space-y-2.5 p-4">
            <div className="flex items-center gap-2 text-[13px]">
              <span className="w-14 shrink-0 text-muted">An</span>
              <span className={cx("truncate", seller.email ? "text-ink" : "text-muted")}>{seller.email || "E-Mail des Verkäufers"}</span>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="m-subject" className="w-14 shrink-0 text-[13px] text-muted">
                Betreff
              </label>
              <input
                id="m-subject"
                className="field"
                spellCheck={false}
                value={subject}
                onChange={(e) => {
                  setEdited(true);
                  setSubject(e.target.value);
                }}
              />
            </div>
            <textarea
              aria-label="Text der Ankaufbestätigung"
              spellCheck={false}
              rows={30}
              style={{ fieldSizing: "content" }}
              value={body}
              onChange={(e) => {
                setEdited(true);
                setBody(e.target.value);
              }}
              className="field min-h-[420px] resize-y overflow-hidden text-[13px] leading-relaxed"
            />
            <button type="button" onClick={send} disabled={sending} className="btn btn-primary btn-lg w-full">
              {sending ? <Loader2 className="animate-spin" /> : <Send />} Bestätigung senden
            </button>
            <label className="flex cursor-pointer items-center justify-center gap-2 text-[12px] text-muted">
              <input type="checkbox" checked={copyToCompany} onChange={(e) => setCopyToCompany(e.target.checked)} className="h-3.5 w-3.5 accent-brand-600" />
              Kopie an {COMPANY.email}
            </label>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ value, className, ...props }) {
  const filled = String(value ?? "").trim().length > 0;
  return <SalesField {...props} className={cx(className, filled && "[&>label]:text-brand-700")} />;
}

function FormCard({ title, icon: Icon, right, children }) {
  return (
    <section className="card overflow-hidden">
      <div className="ind-toolbar flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Icon className="size-4 text-muted" aria-hidden="true" />
          {title}
        </h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
