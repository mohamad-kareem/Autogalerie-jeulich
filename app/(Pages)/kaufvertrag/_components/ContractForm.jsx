"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, OctagonAlert, AlertTriangle, Plus, Save, UserCheck, X } from "lucide-react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";
import Fahrzeugakte, { keysOf, tuevOf } from "../form/Fahrzeugakte";
import { ErrorNote, Field, Modal, Segmented, api, cx } from "@/app/(components)/sales/ui";
import { PAYMENT_METHODS, addMonthsDay, dateDE, formatEuro, isEmail, isPhone, normVin, parseEuro, phoneChars, remaining } from "@/lib/sales";
import { fromForm } from "@/lib/kaufvertrag";
import LogoKarim from "@/app/(assets)/logo1111.png";

const COMPANY = {
  name: "Autogalerie Jülich",
  street: "Alte Dürener Straße 4",
  zip: "52428",
  city: "Jülich",
  phone: "02461 / 916006613",
  email: "autogalerie.juelich@web.de",
};

const SUGGESTED = ["Neuer TÜV/AU", "Ölwechsel", "Inspektion", "Neue Bremsen vorne", "Neue Reifen", "Zulassung inklusive"];

const euroInput = (n) => (n == null || n === "" || Number(n) === 0 ? "" : new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n)));
const kmInput = (n) => (n == null || n === "" ? "" : new Intl.NumberFormat("de-DE").format(Number(n)));

function toForm(c) {
  return {
    date: c.date,
    buyer: { name: "", street: "", zip: "", city: "", phone: "", email: "", idNumber: "", ...(c.buyer || {}) },
    vehicle: {
      name: "",
      vin: "",
      firstRegistration: "",
      ...(c.vehicle || {}),
      mileage: kmInput(c.vehicle?.mileage),
    },
    warranty: c.warranty || "12m",
    agreements: c.agreements || [],
    handover: {
      brief: c.handover?.brief ?? true,
      schein: c.handover?.schein ?? true,
      keyCount: c.handover?.keyCount ?? 2,
      tuevUntil: c.handover?.tuevUntil || "",
    },
    total: euroInput(c.total),
    deposit: euroInput(c.deposit),
    paymentMethod: c.paymentMethod || "cash",
    customerId: c.customerId || "",
  };
}

/**
 * @param {{ initial: object, mode: "new"|"correct", contractId?: string, number?: string, nextNumber?: string, issuer?: string, carId?: string, websiteCar?: object }} props
 */
export default function ContractForm({ initial, mode = "new", contractId = "", number = "", nextNumber = "", issuer = "karim", carId = "", websiteCar = null }) {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [form, setForm] = useState(() => toForm(initial));
  const [touched, setTouched] = useState({ tuev: Boolean(initial.handover?.tuevUntil), keys: mode !== "new" });
  const [missing, setMissing] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(null); // warnings waiting for confirmation
  const [newAgreement, setNewAgreement] = useState("");
  // the car's entry in the Fahrzeugverwaltung, found by FIN
  const [akte, setAkte] = useState({ status: "empty", schein: null, fin: "" });
  const appliedFor = useRef("");
  const [customerName, setCustomerName] = useState(initial.customerId ? initial.buyer?.name : "");

  const set = (path, value) =>
    setForm((f) => {
      const [a, b] = path.split(".");
      return b ? { ...f, [a]: { ...f[a], [b]: value } } : { ...f, [a]: value };
    });

  // Load the Fahrzeugakte whenever the FIN changes (prefilled or typed).
  useEffect(() => {
    const fin = normVin(form.vehicle.vin);
    if (!fin) {
      appliedFor.current = "";
      const t = setTimeout(() => setAkte({ status: "empty", schein: null, fin: "" }), 0);
      return () => clearTimeout(t);
    }
    if (fin.length < 10) {
      const t = setTimeout(() => setAkte({ status: "short", schein: null, fin }), 0);
      return () => clearTimeout(t);
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAkte((prev) => ({ status: "loading", schein: prev.fin === fin ? prev.schein : null, fin }));
      try {
        const res = await fetch(`/api/carschein?finNumber=${encodeURIComponent(fin)}&limit=1`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const found = Array.isArray(data.docs) ? data.docs[0] : null;
        setAkte({ status: found ? "found" : "missing", schein: found || null, fin });
      } catch (err) {
        if (err.name === "AbortError") return;
        setAkte({ status: "error", schein: null, fin });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.vehicle.vin]);

  // Once per car: take TÜV and keys from the Fahrzeugakte when not typed by hand.
  useEffect(() => {
    const schein = akte.schein;
    if (!schein?._id || appliedFor.current === schein._id) return;
    appliedFor.current = schein._id;
    const tuev = tuevOf(schein, websiteCar)?.value || "";
    const keys = keysOf(schein);
    const t = setTimeout(
      () =>
        setForm((f) => ({
          ...f,
          vehicle: { ...f.vehicle, name: f.vehicle.name || schein.carName || "" },
          handover: {
            ...f.handover,
            tuevUntil: touched.tuev || f.handover.tuevUntil ? f.handover.tuevUntil : tuev,
            keyCount: touched.keys ? f.handover.keyCount : keys ?? f.handover.keyCount,
          },
        })),
      0,
    );
    return () => clearTimeout(t);
  }, [akte.schein, websiteCar, touched.tuev, touched.keys]);

  const total = parseEuro(form.total) ?? 0;
  const deposit = parseEuro(form.deposit) ?? 0;
  const rest = remaining(total, deposit);
  const warrantyEnd = form.warranty === "12m" ? addMonthsDay(form.date, 12) : "";

  function addAgreement(text) {
    const t = String(text || "").trim();
    if (!t || form.agreements.includes(t)) return;
    set("agreements", [...form.agreements, t]);
    setNewAgreement("");
  }

  function pickCustomer(c) {
    setForm((f) => ({
      ...f,
      customerId: c._id,
      buyer: { name: c.name, street: c.street, zip: c.zip, city: c.city, phone: c.phone, email: c.email, idNumber: c.idNumber },
    }));
    setCustomerName(c.name);
  }

  function validate() {
    const m = [];
    if (!form.buyer.name.trim()) m.push("buyer.name");
    if (!form.buyer.phone.trim() || !isPhone(form.buyer.phone)) m.push("buyer.phone");
    if (form.buyer.email.trim() && !isEmail(form.buyer.email)) m.push("buyer.email");
    if (!form.vehicle.name.trim()) m.push("vehicle.name");
    if (!(total > 0)) m.push("total");
    const vin = normVin(form.vehicle.vin);
    if (vin && vin.length !== 17) m.push("vehicle.vin");
    setMissing(m);
    return m;
  }

  /** hints from the Fahrzeugakte – must be confirmed before saving */
  function vehicleWarnings() {
    const out = [];
    const schein = akte.schein;
    if (!schein) {
      if (normVin(form.vehicle.vin).length === 17 && akte.status === "missing") out.push({ level: "warn", code: "no_file", text: "Keine Fahrzeugakte zu dieser FIN gefunden." });
      return out;
    }
    if (mode === "new" && (String(schein.stage || "").toUpperCase() === "SOLD" || schein.keySold)) {
      out.push({ level: "error", code: "sold", text: `Bereits verkauft${schein.soldAt ? ` am ${dateDE(schein.soldAt)}` : ""}.` });
    }
    const tuev = tuevOf(schein, websiteCar);
    if (tuev?.failed) out.push({ level: "error", code: "tuev_failed", text: "TÜV nicht bestanden." });
    else if (tuev?.expired) out.push({ level: "error", code: "tuev_expired", text: `TÜV abgelaufen (${tuev.value}).` });
    if (schein.fuelNeeded) out.push({ level: "warn", code: "tank", text: "Tank ist leer." });
    return out;
  }

  async function save(kind, confirmWarnings = false) {
    setError("");
    const m = validate();
    if (m.length) {
      setError(
        m.length === 1 && m[0] === "buyer.email"
          ? "Bitte eine gültige E-Mail-Adresse eingeben (z. B. name@beispiel.de)."
          : m.includes("buyer.email")
            ? "Bitte die markierten Felder ausfüllen – die E-Mail-Adresse braucht die Form name@beispiel.de."
            : "Bitte die markierten Felder ausfüllen.",
      );
      return;
    }
    if (!confirmWarnings) {
      const warnings = vehicleWarnings();
      if (warnings.length) {
        setConfirm(warnings);
        return;
      }
    }
    setBusy(kind);
    let res;
    if (mode === "correct") {
      res = await api(`/api/kaufvertrag/${contractId}`, { method: "PATCH", body: { ...form, action: "correct" } });
    } else {
      res = await api("/api/kaufvertrag", { method: "POST", body: { ...fromForm(form), issuer, carId: carId || undefined, paid: false } });
      if (res.ok && normVin(form.vehicle.vin)) {
        // Fahrzeugverwaltung: car sold (+ date for the Garantie, TÜV note) – never blocks the contract
        await api("/api/carschein/sold", { method: "POST", body: { finNumber: normVin(form.vehicle.vin), soldAt: form.date || null, tuev: form.handover.tuevUntil || "" } });
      }
    }
    setBusy("");

    if (!res.ok) {
      setError(res.status === 409 ? res.data.error || "Diese Rechnungsnummer existiert bereits." : res.data.error || "Speichern fehlgeschlagen.");
      return;
    }
    const id = res.data.contract?._id || res.data._id || contractId;
    router.push(`/kaufvertrag/${id}`);
    router.refresh();
  }

  const bad = (p) => missing.includes(p);
  const inputCls = (p) => cx("field", bad(p) && "!border-rose-400 !bg-rose-50/40");

  const title = mode === "correct" ? `Vertrag ${number} bearbeiten` : "Neuer Kaufvertrag";

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Action bar */}
      <div className="sticky top-14 z-20 -mt-6 mb-4 lg:top-0 ind-stickybar rounded-b-[4px] border-x border-[#a9b0b9] flex flex-wrap items-center gap-2 px-4 py-2.5">
        <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
          <FiMenu className="h-4 w-4" />
        </button>
        <h1 className="min-w-0 truncate text-[15px] font-semibold text-ink">{title}</h1>
        {mode === "new" ? (
          <div className="ind-seg ml-2 inline-flex">
            <span className="ind-seg-btn ind-seg-on">Händler</span>
            <Link
              href={`/kaufvertrag/privat${carId ? `?carId=${encodeURIComponent(carId)}` : normVin(form.vehicle.vin) ? `?fin=${normVin(form.vehicle.vin)}` : ""}`}
              className="ind-seg-btn"
              title="Privater Kaufvertrag (TÜV-SÜD-Formular)"
            >
              Privat
            </Link>
          </div>
        ) : null}
        <span className="mr-auto" />
        <button type="button" onClick={() => save("final")} disabled={Boolean(busy)} className="btn btn-primary">
          {busy === "final" ? <Loader2 className="animate-spin" /> : <Save />}
          {mode === "correct" ? "Änderungen speichern" : "Speichern"}
        </button>
      </div>

      {error ? (
        <div className="mb-3">
          <ErrorNote onClose={() => setError("")}>{error}</ErrorNote>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* ----------------------------- A4 sheet ----------------------------- */}
        <div className="card mx-auto w-full max-w-[860px] px-5 py-6 shadow-card sm:px-10 sm:py-9">
          {/* Company header */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LogoKarim.src} alt="" className="h-9 w-9 rounded-[3px] bg-[#1b2129] object-contain p-0.5 sm:h-10 sm:w-10" />
              <span className="font-playfair text-[17px] tracking-wide text-ink sm:text-[19px]">AUTOGALERIE JÜLICH</span>
            </div>
            <div className="hidden text-right text-[11px] leading-[1.55] text-muted sm:block">
              <p className="font-semibold text-ink">{COMPANY.name}</p>
              <p>{COMPANY.street}</p>
              <p>
                {COMPANY.zip} {COMPANY.city}
              </p>
              <p>Tel. {COMPANY.phone}</p>
              <p>{COMPANY.email}</p>
            </div>
          </div>
          <div className="mb-6 mt-4 flex items-center">
            <span className="h-[2px] w-10 bg-accent-500" />
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Buyer + contract data */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_230px]">
            <div>
              <SheetTitle
                right={
                  customerName ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pl-2 pr-1 text-[11px] font-semibold text-emerald-700">
                      <UserCheck className="h-3 w-3" /> Bestehender Kunde
                      <button
                        type="button"
                        onClick={() => {
                          set("customerId", "");
                          setCustomerName("");
                        }}
                        className="rounded-full p-0.5 hover:bg-emerald-100"
                        aria-label="Verknüpfung lösen"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null
                }
              >
                Käufer
              </SheetTitle>
              <div className="grid grid-cols-6 gap-x-3 gap-y-2.5">
                <Field label="Name" id="b-name" required className="col-span-6 sm:col-span-3">
                  <CustomerInput id="b-name" value={form.buyer.name} onChange={(v) => set("buyer.name", v)} onPick={pickCustomer} className={inputCls("buyer.name")} placeholder="Vor- und Nachname" />
                </Field>
                <Field label="Telefon" id="b-phone" required className="col-span-6 sm:col-span-3">
                  <CustomerInput id="b-phone" type="tel" value={form.buyer.phone} onChange={(v) => set("buyer.phone", phoneChars(v))} onPick={pickCustomer} className={inputCls("buyer.phone")} placeholder="0171 …" />
                </Field>
                <Field label="Straße, Nr." id="b-street" className="col-span-6">
                  <input id="b-street" className="field" value={form.buyer.street} onChange={(e) => set("buyer.street", e.target.value)} autoComplete="off" />
                </Field>
                <Field label="PLZ" id="b-zip" className="col-span-2">
                  <input id="b-zip" className="field" inputMode="numeric" value={form.buyer.zip} onChange={(e) => set("buyer.zip", e.target.value)} autoComplete="off" />
                </Field>
                <Field label="Ort" id="b-city" className="col-span-4">
                  <input id="b-city" className="field" value={form.buyer.city} onChange={(e) => set("buyer.city", e.target.value)} autoComplete="off" />
                </Field>
                <Field label="E-Mail" id="b-mail" className="col-span-6 sm:col-span-3">
                  <input id="b-mail" type="email" className={inputCls("buyer.email")} value={form.buyer.email} onChange={(e) => set("buyer.email", e.target.value.replace(/\s/g, ""))} placeholder="name@beispiel.de" autoComplete="off" />
                </Field>
                <Field label="Ausweis-Nr." id="b-id" className="col-span-6 sm:col-span-3">
                  <input id="b-id" className="field uppercase" value={form.buyer.idNumber} onChange={(e) => set("buyer.idNumber", e.target.value.toUpperCase())} autoComplete="off" />
                </Field>
              </div>
            </div>

            <div className="md:border-l-2 md:border-navy-900 md:pl-4">
              <SheetTitle>Vertrag</SheetTitle>
              <div className="space-y-2.5">
                <Field label="Vertragsnummer">
                  <div className="flex h-[34px] items-center rounded-md bg-canvas px-2.5 text-[13px]">
                    {number ? (
                      <span className="font-semibold text-ink">{number}</span>
                    ) : (
                      <span className="truncate text-muted" title="Die Nummer wird erst beim Speichern vergeben.">
                        {nextNumber ? `beim Speichern · ${nextNumber}` : "wird beim Speichern vergeben"}
                      </span>
                    )}
                  </div>
                </Field>
                <Field label="Datum" id="c-date">
                  <input id="c-date" type="date" className="field" value={form.date} onChange={(e) => e.target.value && set("date", e.target.value)} />
                </Field>
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="mt-7">
            <SheetTitle>Fahrzeug</SheetTitle>
            <div className="grid grid-cols-6 gap-x-3 gap-y-2.5">
              <Field label="Fahrzeug" id="v-name" required className="col-span-6">
                <input id="v-name" className={inputCls("vehicle.name")} value={form.vehicle.name} onChange={(e) => set("vehicle.name", e.target.value)} placeholder="z. B. Jeep Renegade" />
              </Field>
              <Field
                label="FIN"
                id="v-vin"
                className="col-span-6 sm:col-span-3"
                hint={
                  form.vehicle.vin && normVin(form.vehicle.vin).length !== 17 ? `${normVin(form.vehicle.vin).length} / 17 Zeichen` : null
                }
              >
                <input
                  id="v-vin"
                  className={cx(inputCls("vehicle.vin"), "font-mono uppercase tracking-wide")}
                  value={form.vehicle.vin}
                  maxLength={21}
                  onChange={(e) => set("vehicle.vin", e.target.value.toUpperCase())}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              <Field label="Erstzulassung" id="v-ez" className="col-span-3 sm:col-span-1">
                <input id="v-ez" className="field" value={form.vehicle.firstRegistration} onChange={(e) => set("vehicle.firstRegistration", e.target.value)} placeholder="MM/JJJJ" />
              </Field>
              <Field label="Kilometerstand" id="v-km" className="col-span-3 sm:col-span-2">
                <div className="relative">
                  <input
                    id="v-km"
                    className="field pr-9 text-right tabular-nums"
                    inputMode="numeric"
                    value={form.vehicle.mileage}
                    onChange={(e) => set("vehicle.mileage", e.target.value.replace(/[^\d.]/g, ""))}
                    onBlur={(e) => set("vehicle.mileage", kmInput(parseEuro(e.target.value.replace(/\./g, ""))))}
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted">km</span>
                </div>
              </Field>
            </div>
          </div>

          {/* Warranty + agreements */}
          <div className="mt-7">
            <SheetTitle>Vereinbarungen</SheetTitle>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-[150px] text-[12.5px] text-muted">Gewährleistung</span>
              <Segmented
                value={form.warranty}
                onChange={(v) => set("warranty", v)}
                options={[
                  { key: "12m", label: "12 Monate" },
                  { key: "none", label: "Ausgeschlossen" },
                ]}
              />
              {warrantyEnd ? <span className="text-[12px] text-muted">bis {dateDE(warrantyEnd)}</span> : null}
            </div>

            <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:gap-4">
              <span className="w-[150px] shrink-0 pt-1.5 text-[12.5px] text-muted">Besondere Vereinbarungen</span>
              <div className="min-w-0 flex-1">
                {form.agreements.length ? (
                  <ul className="mb-2 divide-y divide-line rounded-lg border border-line">
                    {form.agreements.map((a, i) => (
                      <li key={a} className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-ink">
                        <span className="w-4 text-[11px] tabular-nums text-muted">{i + 1}.</span>
                        <span className="flex-1">{a}</span>
                        <button
                          type="button"
                          onClick={() => set("agreements", form.agreements.filter((x) => x !== a))}
                          className="rounded p-1 text-muted hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`${a} entfernen`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex gap-2">
                  <input
                    className="field"
                    value={newAgreement}
                    onChange={(e) => setNewAgreement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAgreement(newAgreement);
                      }
                    }}
                    placeholder="z. B. Neue Bremsen vorne"
                  />
                  <button type="button" onClick={() => addAgreement(newAgreement)} className="btn btn-secondary shrink-0">
                    <Plus /> Hinzufügen
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED.filter((s) => !form.agreements.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addAgreement(s)}
                      className="rounded-full border border-dashed border-line-strong px-2.5 py-0.5 text-[11.5px] text-muted transition hover:border-brand-500 hover:text-brand-700"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">Jede Vereinbarung kommt als Notiz in die Fahrzeugakte.</p>
              </div>
            </div>

          </div>

          {/* Handover */}
          <div className="mt-7">
            <SheetTitle>Übergabe</SheetTitle>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Check label="Kfz-Brief" checked={form.handover.brief} onChange={(v) => set("handover.brief", v)} />
              <Check label="Kfz-Schein" checked={form.handover.schein} onChange={(v) => set("handover.schein", v)} />
              <div className="flex items-center gap-2">
                <label htmlFor="h-tuev" className="text-[12.5px] text-muted">
                  TÜV bis
                </label>
                <input
                  id="h-tuev"
                  className="field w-[96px]"
                  value={form.handover.tuevUntil}
                  onChange={(e) => {
                    setTouched((t) => ({ ...t, tuev: true }));
                    set("handover.tuevUntil", e.target.value);
                  }}
                  placeholder="MM/JJJJ"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="h-keys" className="text-[12.5px] text-muted">
                  Schlüssel
                </label>
                <input
                  id="h-keys"
                  type="number"
                  min={0}
                  max={9}
                  className="field w-[64px] text-center"
                  value={form.handover.keyCount}
                  onChange={(e) => {
                    setTouched((t) => ({ ...t, keys: true }));
                    set("handover.keyCount", e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="mt-7">
            <SheetTitle>Zahlung</SheetTitle>
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[12.5px] text-muted">Zahlungsart</p>
                  <Segmented value={form.paymentMethod} onChange={(v) => set("paymentMethod", v)} options={PAYMENT_METHODS} size="sm" />
                </div>
                <ul className="space-y-1 text-[11.5px] leading-relaxed text-muted">
                  <li>• Als Betreff bitte immer die Referenznummer mit angeben, damit Ihre Zahlung korrekt zugeordnet werden kann.</li>
                  <li>• Das Fahrzeug bleibt bis zur kompletten Zahlung Eigentum des Verkäufers.</li>
                  <li>• Differenzbesteuerung nach §25a UStG, keine USt. ausweisbar.</li>
                  <li>• Soweit nicht anders angegeben entspricht das Leistungsdatum dem Tag der Übergabe. Der Rechnungsbetrag ist sofort zur Zahlung fällig.</li>
                </ul>
              </div>
              <div className="self-start overflow-hidden rounded-lg border border-line">
                <MoneyRow label="Gesamtpreis" required bad={bad("total")} value={form.total} onChange={(v) => set("total", v)} strong />
                <MoneyRow label="Anzahlung" value={form.deposit} onChange={(v) => set("deposit", v)} />
                <div className="flex items-center justify-between bg-navy-900 px-3 py-2.5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">Restbetrag</span>
                  <span className="text-[15px] font-bold tabular-nums">{formatEuro(rest)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------- Side panel ----------------------------- */}
        <aside className="space-y-3 lg:sticky lg:top-[4.25rem]">
          <Fahrzeugakte
            status={akte.status}
            schein={akte.schein}
            websiteCar={websiteCar}
            onSaved={(updated) => setAkte((prev) => (prev.schein?._id === updated?._id ? { ...prev, schein: updated } : prev))}
          />
        </aside>
      </div>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Bitte prüfen"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(null)}>
              Zurück
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setConfirm(null);
                save("final", true);
              }}
            >
              Trotzdem speichern
            </button>
          </>
        }
      >
        <p className="mb-3 text-[13px] text-body">Zu diesem Fahrzeug gibt es Hinweise:</p>
        <ul className="space-y-1.5">
          {(confirm || []).map((w) => (
            <li
              key={w.code}
              className={cx(
                "flex items-start gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium",
                w.level === "error" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900",
              )}
            >
              {w.level === "error" ? <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              {w.text}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function SheetTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-navy-900">{children}</h2>
      {right}
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-navy-900" />
      {label}
    </label>
  );
}

function MoneyRow({ label, value, onChange, strong, required, bad }) {
  return (
    <label className={cx("flex items-center justify-between gap-3 border-b border-line px-3 py-1.5", bad && "bg-rose-50")}>
      <span className="text-[12.5px] text-muted">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </span>
      <span className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
          onBlur={(e) => onChange(euroInput(parseEuro(e.target.value)))}
          placeholder="0,00"
          className={cx(
            "w-[120px] rounded-md bg-transparent px-1.5 py-1 text-right tabular-nums text-ink outline-none ring-[#3e454e]/20 focus:bg-white focus:ring-2",
            strong ? "text-[15px] font-bold" : "text-[13px]",
          )}
        />
        <span className="text-[12px] text-muted">€</span>
      </span>
    </label>
  );
}

/** Text input that suggests existing customers while typing (name or phone). */
function CustomerInput({ id, value, onChange, onPick, className, placeholder, type = "text" }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const typed = useRef(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!typed.current) return;
    const q = value.trim();
    if (q.length < 2) {
      const t = setTimeout(() => setList([]), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      const res = await api(`/api/kaufvertrag/kunden?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        setList(res.data.customers || []);
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const show = open && list.length > 0;
  const items = useMemo(() => list.slice(0, 6), [list]);

  return (
    <div ref={wrap} className="relative">
      <input
        id={id}
        type={type}
        className={className}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value);
        }}
        onFocus={() => list.length && setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      {show ? (
        <ul className="animate-pop-in absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-line bg-white p-1 shadow-float">
          <li className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Bestehende Kunden</li>
          {items.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                  typed.current = false;
                }}
                className="flex w-full flex-col rounded-md px-2.5 py-1.5 text-left hover:bg-canvas"
              >
                <span className="text-[13px] font-medium text-ink">{c.name}</span>
                <span className="truncate text-[11.5px] text-muted">{[c.phone, [c.zip, c.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || c.email}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
