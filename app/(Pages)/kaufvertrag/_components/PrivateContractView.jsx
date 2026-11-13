"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarFront, CheckCircle2, Download, Loader2, Mail, Pencil, Phone, Printer, Trash2, User } from "lucide-react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";
import { useCompanyStamp } from "@/app/(components)/useCompanyStamp";
import PrivateSheet from "./PrivateSheet";
import PrivateDocumentOptions from "./PrivateDocumentOptions";
import VollmachtButton from "./VollmachtButton";
import SepaButton from "./SepaButton";
import { downloadPdf, pdfDataUri, waitForCompanyStamp } from "@/lib/pdfCapture";
import { privateForm } from "@/lib/privateContract";
import { ErrorNote, Modal, Pill, api, cx } from "@/app/(components)/sales/ui";
import { berlinDay, buyerAddress, dateDE, formatEuro, isEmail, telHref } from "@/lib/sales";
import { confirmDialog } from "@/app/(components)/ConfirmHost";

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cx("tabular-nums text-ink", strong && "text-[15px] font-bold")}>{value}</dd>
    </div>
  );
}

/** Saved private contract – same page as the normal Kaufvertrag (PDF, Zahlung, Käufer, Fahrzeug) */
export default function PrivateContractView({ contract: initial, vehicle }) {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const sheet = useRef(null);
  const vehicleSoldHere = Boolean(vehicle?.sold);
  const [c, setC] = useState(initial);
  const [companyStamp] = useCompanyStamp();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState(initial.mailTo || "");
  const [paidAt, setPaidAt] = useState(berlinDay());
  const savingDocumentOptions = busy === "documentOptions";

  const d = privateForm(c.data);
  const { buyer, seller, car, documentOptions } = d;
  const stampImageId = companyStamp.id;
  const carName = [car.maker, car.type].filter(Boolean).join(" ") || c.vehicleName;
  const pdfName = `Kaufvertrag_privat_${(carName || "Fahrzeug").replace(/[^\w-]+/g, "-")}.pdf`;

  async function patch(body, key) {
    setBusy(key);
    setError("");
    const res = await api(`/api/privatvertraege/${c._id}`, { method: "PATCH", body });
    setBusy("");
    if (!res.ok) {
      setError(res.data.error || "Aktion fehlgeschlagen.");
      return null;
    }
    return res.data;
  }

  async function setPaid(paid) {
    const data = await patch({ action: "paid", paid, paidAt }, "paid");
    if (data) setC((x) => ({ ...x, paid: data.paid, paidAt: data.paidAt }));
  }

  async function saveDocumentOptions(options) {
    const data = await patch({ action: "documentOptions", documentOptions: options }, "documentOptions");
    if (data) {
      setC((current) => ({ ...current, data: { ...current.data, documentOptions: data.documentOptions } }));
    }
  }

  async function sendMail() {
    setBusy("mail");
    setError("");
    let pdf = "";
    try {
      pdf = await pdfDataUri(sheet.current, { margin: 0 });
    } catch (err) {
      console.error("PDF:", err);
      setBusy("");
      setMailOpen(false);
      return setError("PDF konnte nicht erstellt werden.");
    }
    const res = await api(`/api/privatvertraege/${c._id}/email`, { method: "POST", body: { to: mailTo, pdf } });
    setBusy("");
    setMailOpen(false);
    if (!res.ok) return setError(res.data.error || "E-Mail konnte nicht gesendet werden.");
    setNotice(`Der Vertrag wurde an ${res.data.to} gesendet.`);
  }

  async function remove() {
    const ok = await confirmDialog({
      title: "Vertrag löschen",
      message: "Diesen privaten Kaufvertrag endgültig löschen? Das Fahrzeug ist danach wieder verfügbar.",
      confirmLabel: "Löschen",
      danger: true,
    });
    if (!ok) return;
    setBusy("delete");
    const res = await api(`/api/privatvertraege/${c._id}`, { method: "DELETE" });
    setBusy("");
    if (!res.ok) return setError(res.data.error || "Vertrag konnte nicht gelöscht werden.");
    router.push("/kaufvertrag/liste?tab=privat");
    router.refresh();
  }

  async function print() {
    setError("");
    try {
      await waitForCompanyStamp(sheet.current);
      window.print();
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePdf() {
    setBusy("pdf");
    setError("");
    try {
      await downloadPdf(sheet.current, pdfName, { margin: 0 });
    } catch (err) {
      console.error("PDF:", err);
      setError("PDF konnte nicht erstellt werden.");
    }
    setBusy("");
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Action bar */}
      <div className="sticky top-14 z-20 -mt-6 mb-4 lg:top-0 flex flex-wrap items-center gap-2 px-4 py-2.5 ind-stickybar rounded-b-[4px] border-x border-[#a9b0b9] print:hidden">
        <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="mr-auto flex min-w-0 items-center gap-2">
          <h1 className="truncate text-[15px] font-semibold text-ink">Privatvertrag</h1>
          {c.paid ? <Pill tone="green">Bezahlt</Pill> : <Pill tone="amber">Offen</Pill>}
        </div>
        <button type="button" onClick={print} disabled={savingDocumentOptions || companyStamp.loading || Boolean(companyStamp.error)} className="btn btn-secondary">
          <Printer /> <span className="hidden sm:inline">Drucken</span>
        </button>
        <button type="button" onClick={savePdf} disabled={Boolean(busy) || companyStamp.loading || Boolean(companyStamp.error)} className="btn btn-secondary">
          {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />} <span className="hidden sm:inline">PDF</span>
        </button>
        <VollmachtButton buyer={buyer} vehicle={{ name: carName, vin: car.vin, plate: car.plate }} />
        <SepaButton buyer={buyer} plate={car.plate} />
        <button type="button" onClick={() => setMailOpen(true)} disabled={savingDocumentOptions || companyStamp.loading || Boolean(companyStamp.error)} className="btn btn-secondary">
          <Mail /> <span className="hidden sm:inline">An Käufer senden</span>
        </button>
        <Link href={`/kaufvertrag/privat/${c._id}/bearbeiten`} className="btn btn-primary">
          <Pencil /> Bearbeiten
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={busy === "delete" || savingDocumentOptions}
          className="btn btn-secondary text-rose-700 hover:!border-rose-400 hover:!text-rose-700"
          title="Vertrag löschen"
        >
          {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} <span className="hidden sm:inline">Löschen</span>
        </button>
      </div>

      <div className="mb-3 space-y-2 print:hidden">
        {error ? <ErrorNote onClose={() => setError("")}>{error}</ErrorNote> : null}
        {notice ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </div>
        ) : null}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* the filled TÜV-SÜD form – as printed */}
        <div className="overflow-x-auto print:overflow-visible">
          <PrivateSheet ref={sheet} d={d} stampImageId={stampImageId} readOnly />
        </div>

        {/* Side */}
        <aside className="space-y-3 lg:sticky lg:top-[4.25rem] print:hidden">
          {/* Payment */}
          <div className="card p-4">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Zahlung</p>
            <dl className="space-y-1 text-[13px]">
              <Row label="Kaufpreis" value={formatEuro(c.price)} strong />
              <Row label="Datum" value={dateDE(c.date) || "–"} />
            </dl>
            <div className="mt-3 border-t border-line pt-3">
              {c.paid ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Bezahlt am {dateDE(c.paidAt)}
                  </span>
                  <button type="button" onClick={() => setPaid(false)} disabled={busy === "paid" || savingDocumentOptions} className="text-[12px] text-muted hover:text-ink">
                    Zurücksetzen
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className="field w-[140px]" aria-label="Bezahlt am" />
                  <button type="button" onClick={() => setPaid(true)} disabled={busy === "paid" || savingDocumentOptions} className="btn btn-primary flex-1">
                    {busy === "paid" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Bezahlt
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Buyer */}
          <div className="card p-4 text-[13px]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Käufer</p>
              <Link href="/Kundenkontakte" className="link inline-flex items-center gap-1 text-[12px]">
                <User className="h-3.5 w-3.5" /> Kunden
              </Link>
            </div>
            <p className="font-semibold text-ink">{buyer.name || "–"}</p>
            {buyerAddress(buyer) ? <p className="text-muted">{buyerAddress(buyer)}</p> : null}
            {buyer.phone ? (
              <a href={telHref(buyer.phone)} className="link mt-1.5 inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {buyer.phone}
              </a>
            ) : null}
          </div>

          {/* Seller */}
          <div className="card p-4 text-[13px]">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Verkäufer</p>
            <p className="font-semibold text-ink">{seller.name || "–"}</p>
            {buyerAddress(seller) ? <p className="text-muted">{buyerAddress(seller)}</p> : null}
            {seller.phone ? (
              <a href={telHref(seller.phone)} className="link mt-1.5 inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {seller.phone}
              </a>
            ) : null}
          </div>

          {/* Vehicle */}
          <div className="card p-4 text-[13px]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Fahrzeug</p>
              {vehicle?.fin ? (
                <Link href={`/Fahrzeugverwaltung?fin=${encodeURIComponent(vehicle.fin)}`} className="link inline-flex items-center gap-1 text-[12px]">
                  <CarFront className="h-3.5 w-3.5" /> Fahrzeugakte
                </Link>
              ) : null}
            </div>
            <p className="font-semibold text-ink">{carName || "–"}</p>
            {c.vin ? <p className="font-mono text-[12px] text-muted">{c.vin}</p> : null}
            {vehicle ? <div className="mt-2">{vehicleSoldHere ? <Pill tone="green">Verkauft</Pill> : <Pill tone="amber">Nicht als verkauft markiert</Pill>}</div> : null}
          </div>
          <PrivateDocumentOptions value={documentOptions} onChange={saveDocumentOptions} companyStamp={companyStamp} canStamp={Boolean(stampImageId) || documentOptions.stamp !== "none"} disabled={Boolean(busy)} />
        </aside>
      </div>

      {/* E-mail */}
      <Modal
        open={mailOpen}
        onClose={() => setMailOpen(false)}
        title="Vertrag per E-Mail senden"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setMailOpen(false)}>
              Abbrechen
            </button>
            <button type="button" className="btn btn-primary" onClick={sendMail} disabled={busy === "mail" || !isEmail(mailTo)}>
              {busy === "mail" ? <Loader2 className="animate-spin" /> : <Mail />} Senden
            </button>
          </>
        }
      >
        <label htmlFor="pv-mail-to" className="mb-1 block text-[12px] text-muted">
          Empfänger
        </label>
        <input id="pv-mail-to" type="email" className="field" value={mailTo} onChange={(e) => setMailTo(e.target.value.replace(/\s/g, ""))} placeholder="name@beispiel.de" />
        {mailTo && !isEmail(mailTo) ? <p className="mt-1 text-[12px] text-rose-700">Bitte eine gültige E-Mail-Adresse eingeben (name@beispiel.de).</p> : null}
        <p className="mt-2 text-[12px] text-muted">Der Kaufvertrag wird als PDF angehängt.</p>
      </Modal>
    </div>
  );
}
