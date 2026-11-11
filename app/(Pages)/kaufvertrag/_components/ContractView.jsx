"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";
import KaufvertragDocument from "./KaufvertragDocument";
import VollmachtButton from "./VollmachtButton";
import { downloadPdf, pdfDataUri } from "@/lib/pdfCapture";
import {
  Archive,
  ArchiveRestore,
  Ban,
  CarFront,
  CheckCircle2,
  Download,
  Ellipsis,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Printer,
  RotateCcw,
  Trash2,
  User,
} from "lucide-react";
import { ErrorNote, Modal, Pill, api, cx } from "@/app/(components)/sales/ui";
import { berlinDay, buyerAddress, dateDE, formatEuro, isEmail, paymentLabel, remaining, telHref, warrantyInfo, addMonthsDay } from "@/lib/sales";
import { confirmDialog } from "@/app/(components)/ConfirmHost";

const dtFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ContractView({ contract: initial, doc: initialDoc, vehicle: initialVehicle }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { openSidebar } = useSidebar();
  const sheet = useRef(null);
  const [c, setCState] = useState(initial);
  const [doc, setDoc] = useState(initialDoc);
  const [vehicle, setVehicle] = useState(initialVehicle);
  const vehicleSoldHere = Boolean(vehicle?.sold);

  /** reload contract + printed document after a change (number, status …) */
  const reload = useCallback(async () => {
    const res = await api(`/api/kaufvertrag/${initial._id}?view=1`);
    if (res.ok) {
      setCState(res.data.contract);
      setDoc(res.data.doc);
      setVehicle(res.data.vehicle);
    }
  }, [initial._id]);
  const setC = (next) => {
    setCState(next);
    reload();
  };
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mailOpen, setMailOpen] = useState(false);
  const [mailTo, setMailTo] = useState(initial.buyer.email || "");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [delAvailable, setDelAvailable] = useState(true);
  const [cancelReason, setCancelReason] = useState("");
  const [makeAvailable, setMakeAvailable] = useState(true);
  const [paidAt, setPaidAt] = useState(berlinDay());

  const isDraft = false;
  const isCancelled = c.status === "cancelled";
  const rest = remaining(c.total, c.deposit);
  const pdfName = `Kaufvertrag_${String(c.number || "Vertrag").replace(/[^\w-]+/g, "-")}.pdf`;
  const warranty = c.warranty === "12m" && !isDraft ? warrantyInfo(addMonthsDay(c.date, 12)) : null;

  async function patch(body, key) {
    setBusy(key);
    setError("");
    const res = await api(`/api/kaufvertrag/${c._id}`, { method: "PATCH", body });
    setBusy("");
    if (!res.ok) {
      setError(res.data.error || "Aktion fehlgeschlagen.");
      return null;
    }
    return res.data;
  }

  async function toggleArchive() {
    const archived = !c.archived;
    if (
      archived &&
      !(await confirmDialog({ title: "Vertrag archivieren", message: "Der Vertrag verschwindet aus den Kaufverträgen und liegt danach im Archiv.", confirmLabel: "Archivieren" }))
    )
      return;
    const data = await patch({ action: "archive", archived }, "archive");
    if (!data?.contract) return;
    setC(data.contract);
    setNotice(archived ? "Vertrag archiviert – er liegt jetzt im Archiv." : "Vertrag aus dem Archiv geholt – er steht wieder bei den Kaufverträgen.");
    router.refresh();
  }

  async function setPaid(paid) {
    const data = await patch({ action: "paid", paid, paidAt }, "paid");
    if (data?.contract) setC(data.contract);
  }

  async function cancel() {
    const data = await patch({ action: "cancel", reason: cancelReason, makeAvailable }, "cancel");
    if (data?.contract) {
      setC(data.contract);
      setCancelOpen(false);
      setNotice(makeAvailable ? "Vertrag storniert – das Fahrzeug ist wieder verfügbar." : "Vertrag storniert.");
      router.refresh();
    }
  }

  async function sendMail() {
    setBusy("mail");
    setError("");
    let pdf = "";
    try {
      pdf = await pdfDataUri(sheet.current);
    } catch (err) {
      console.error("PDF:", err);
      setBusy("");
      setMailOpen(false);
      return setError("PDF konnte nicht erstellt werden.");
    }
    const res = await api(`/api/kaufvertrag/${c._id}/email`, { method: "POST", body: { to: mailTo, pdf } });
    setBusy("");
    if (!res.ok) {
      setError(res.data.error || "E-Mail konnte nicht gesendet werden.");
      setMailOpen(false);
      return;
    }
    setMailOpen(false);
    setNotice(`Der Vertrag wurde an ${res.data.to} gesendet.`);
  }

  async function uncancel() {
    if (!(await confirmDialog({ title: "Storno aufheben", message: "Der Vertrag wird wieder gültig und das Fahrzeug wieder als verkauft markiert.", confirmLabel: "Storno aufheben" }))) return;
    const before = c.number || c.formerNumber;
    const data = await patch({ action: "uncancel" }, "uncancel");
    if (!data?.contract) return;
    setC(data.contract);
    setNotice(
      before && data.contract.number !== before
        ? `Storno aufgehoben. ${before} war schon vergeben – der Vertrag hat jetzt die Nummer ${data.contract.number}.`
        : `Storno aufgehoben – ${data.contract.number} ist wieder gültig.`,
    );
    router.refresh();
  }

  async function removeContract() {
    setBusy("delete");
    const res = await api(`/api/kaufvertrag/${c._id}?available=${delAvailable && vehicleSoldHere ? 1 : 0}`, {
      method: "DELETE",
    });
    setBusy("");
    if (!res.ok) {
      setDeleteOpen(false);
      return setError(res.data.error || "Vertrag konnte nicht gelöscht werden.");
    }
    router.push("/kaufvertrag/liste");
    router.refresh();
  }

  function print() {
    window.print();
  }

  async function savePdf() {
    setBusy("pdf");
    setError("");
    try {
      await downloadPdf(sheet.current, pdfName);
    } catch (err) {
      console.error("PDF:", err);
      setError("PDF konnte nicht erstellt werden.");
    }
    setBusy("");
  }

  const adminActions = [
    { label: c.archived ? "Zurückholen" : "Archivieren", icon: c.archived ? ArchiveRestore : Archive, run: toggleArchive },
    isCancelled
      ? { label: "Storno aufheben", icon: RotateCcw, run: uncancel }
      : { label: "Stornieren", icon: Ban, run: () => setCancelOpen(true), danger: true },
    { label: "Löschen", icon: Trash2, run: () => setDeleteOpen(true), danger: true },
  ];
  const adminActionPending = ["archive", "uncancel", "cancel", "delete"].includes(busy);

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Action bar */}
      <div className="sticky top-14 z-20 -mt-6 mb-4 lg:top-0 ind-stickybar rounded-b-[4px] border-x border-[#a9b0b9] flex flex-wrap items-center gap-2 px-4 py-2.5 print:hidden">
        <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="mr-auto flex min-w-0 items-center gap-2">
          <h1 className="truncate text-[15px] font-semibold text-ink">
            {isDraft ? "Entwurf" : c.number || <span className="text-muted line-through">{c.formerNumber}</span>}
          </h1>
          {isCancelled ? (
            <Pill tone="red">Storniert</Pill>
          ) : isDraft ? (
            <Pill>Entwurf</Pill>
          ) : c.paid ? (
            <Pill tone="green">Bezahlt</Pill>
          ) : (
            <Pill tone="amber">Restbetrag offen</Pill>
          )}
          {c.archived ? <Pill>Archiviert</Pill> : null}
        </div>

        {(
          <>
            <button type="button" onClick={print} className="btn btn-secondary">
              <Printer /> <span className="hidden sm:inline">Drucken</span>
            </button>
            <button type="button" onClick={savePdf} disabled={busy === "pdf"} className="btn btn-secondary">
              {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />} <span className="hidden sm:inline">PDF</span>
            </button>
            <VollmachtButton buyer={c.buyer} vehicle={c.vehicle} />
            <button type="button" onClick={() => setMailOpen(true)} className="btn btn-secondary">
              <Mail /> <span className="hidden sm:inline">An Käufer senden</span>
            </button>
            <Link href={`/kaufvertrag/${c._id}/bearbeiten`} className="btn btn-primary">
              <Pencil /> Bearbeiten
            </Link>
            {isAdmin ? (
              <Menu>
                <MenuButton
                  type="button"
                  aria-label="Mehr Vertragsaktionen"
                  title="Mehr Vertragsaktionen"
                  disabled={adminActionPending}
                  className="btn btn-secondary size-[34px] shrink-0 px-0 data-open:ring-1 data-open:ring-inset data-open:ring-slate-500"
                >
                  {adminActionPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Ellipsis className="size-5" aria-hidden="true" />}
                </MenuButton>
                <MenuItems
                  anchor={{ to: "bottom end", gap: 6, padding: 8 }}
                  modal={false}
                  className="z-[65] w-44 rounded border border-line-strong bg-white p-1 shadow-float outline-none print:hidden"
                >
                  {adminActions.map(({ label, icon: Icon, run, danger }) => (
                    <MenuItem key={label}>
                      <button
                        type="button"
                        onClick={run}
                        className={cx(
                          "flex w-full cursor-pointer items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] font-medium outline-none",
                          danger ? "text-rose-700 data-focus:bg-rose-50" : "text-ink data-focus:bg-canvas",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" /> {label}
                      </button>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            ) : null}
          </>
        )}
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
        {/* Printed contract – the same document as on paper */}
        <div className="card overflow-x-auto print:overflow-visible print:border-0 print:shadow-none">
          <div className="min-w-[680px] print:min-w-0">
            <KaufvertragDocument ref={sheet} doc={doc} />
          </div>
        </div>

        {/* Side */}
        <aside className="space-y-3 lg:sticky lg:top-[4.25rem] print:hidden">
          {isCancelled ? (
            <div className="card border-rose-200 bg-rose-50/60 p-4 text-[13px]">
              <p className="font-semibold text-rose-800">Storniert</p>
              <p className="mt-1 text-rose-800/80">
                {c.cancelledAt ? dtFmt.format(new Date(c.cancelledAt)) : ""} · {c.cancelledBy}
              </p>
              {c.cancelReason ? <p className="mt-1.5 text-ink">{c.cancelReason}</p> : null}
            </div>
          ) : null}

          {/* Payment */}
          <div className="card p-4">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Zahlung</p>
            <dl className="space-y-1 text-[13px]">
              <Row label="Gesamtpreis" value={formatEuro(c.total)} strong />
              <Row label="Anzahlung" value={formatEuro(c.deposit)} />
              <Row label="Restbetrag" value={formatEuro(rest)} />
              <Row label="Zahlungsart" value={c.paymentMethod ? paymentLabel(c.paymentMethod) : c.paymentNote || "–"} />
            </dl>
            {c.status === "active" ? (
              <div className="mt-3 border-t border-line pt-3">
                {c.paid ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Bezahlt am {dateDE(c.paidAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPaid(false)}
                      disabled={busy === "paid"}
                      className="text-[12px] text-muted hover:text-ink"
                    >
                      Zurücksetzen
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={paidAt}
                      onChange={(e) => setPaidAt(e.target.value)}
                      className="field w-[140px]"
                      aria-label="Bezahlt am"
                    />
                    <button type="button" onClick={() => setPaid(true)} disabled={busy === "paid"} className="btn btn-primary flex-1">
                      {busy === "paid" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Bezahlt
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Buyer */}
          <div className="card p-4 text-[13px]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Käufer</p>
              <Link href="/Kundenkontakte" className="link inline-flex items-center gap-1 text-[12px]">
                <User className="h-3.5 w-3.5" /> Kunden
              </Link>
            </div>
            <p className="font-semibold text-ink">{c.buyer.name || "–"}</p>
            {buyerAddress(c.buyer) ? <p className="text-muted">{buyerAddress(c.buyer)}</p> : null}
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {c.buyer.phone ? (
                <a href={telHref(c.buyer.phone)} className="link inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {c.buyer.phone}
                </a>
              ) : null}
              {c.buyer.email ? (
                <a href={`mailto:${c.buyer.email}`} className="link inline-flex items-center gap-1 break-all">
                  <Mail className="h-3.5 w-3.5" /> {c.buyer.email}
                </a>
              ) : null}
            </div>
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
            <p className="font-semibold text-ink">{c.vehicle.name || "–"}</p>
            {c.vehicle.vin ? <p className="font-mono text-[12px] text-muted">{c.vehicle.vin}</p> : null}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {warranty ? <Pill tone={warranty.active ? "green" : "slate"}>{warranty.label}</Pill> : null}
              {vehicle ? vehicleSoldHere ? <Pill tone="green">Verkauft</Pill> : <Pill tone="amber">Nicht als verkauft markiert</Pill> : null}
            </div>
          </div>

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
        <label htmlFor="mail-to" className="mb-1 block text-[12px] text-muted">
          Empfänger
        </label>
        <input
          id="mail-to"
          type="email"
          className="field"
          value={mailTo}
          onChange={(e) => setMailTo(e.target.value.replace(/\s/g, ""))}
          placeholder="name@beispiel.de"
        />
        {mailTo && !isEmail(mailTo) ? <p className="mt-1 text-[12px] text-rose-700">Bitte eine gültige E-Mail-Adresse eingeben (name@beispiel.de).</p> : null}
        <p className="mt-2 text-[12px] text-muted">Der Kaufvertrag {c.number} wird als PDF angehängt (wie gedruckt).</p>
      </Modal>

      {/* Cancel */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Vertrag ${c.number} stornieren`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCancelOpen(false)}>
              Abbrechen
            </button>
            <button type="button" className="btn bg-rose-600 text-white hover:bg-rose-700" onClick={cancel} disabled={busy === "cancel"}>
              {busy === "cancel" ? <Loader2 className="animate-spin" /> : <Ban />} Stornieren
            </button>
          </>
        }
      >
        <p className="text-[13px] text-body">Der Vertrag bleibt in der Liste und wird als „Storniert“ gekennzeichnet.</p>
        <p className="mt-2 text-[12px] text-muted">Die Nummer {c.number} bekommt ein „X“ und wird für den nächsten Vertrag wieder frei.</p>
        <label htmlFor="cancel-reason" className="mb-1 mt-3 block text-[12px] text-muted">
          Grund (optional)
        </label>
        <input
          id="cancel-reason"
          className="field"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="z. B. Kunde ist zurückgetreten"
        />
        {vehicleSoldHere ? (
          <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 text-[13px]">
            <input
              type="checkbox"
              checked={makeAvailable}
              onChange={(e) => setMakeAvailable(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-600"
            />
            <span>
              <span className="font-medium text-ink">Fahrzeug wieder verfügbar machen</span>
              <span className="block text-[12px] text-muted">Fahrzeugakte und Website zeigen das Auto wieder als verfügbar.</span>
            </span>
          </label>
        ) : null}
      </Modal>

      {/* Delete */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`Vertrag ${c.number || c.formerNumber || ""} löschen`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
              Abbrechen
            </button>
            <button
              type="button"
              className="btn bg-rose-600 text-white hover:bg-rose-700"
              onClick={removeContract}
              disabled={busy === "delete"}
            >
              {busy === "delete" ? <Loader2 className="animate-spin" /> : <Trash2 />} Endgültig löschen
            </button>
          </>
        }
      >
        <p className="text-[13px] text-body">
          Der Vertrag wird komplett entfernt und kann nicht wiederhergestellt werden.
        </p>
        <div className="mt-3 space-y-2">
          {vehicleSoldHere ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 text-[13px]">
              <input
                type="checkbox"
                checked={delAvailable}
                onChange={(e) => setDelAvailable(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                <span className="font-medium text-ink">Fahrzeug wieder verfügbar machen</span>
                <span className="block text-[12px] text-muted">Sonst bleibt das Auto als verkauft markiert (ohne Vertrag).</span>
              </span>
            </label>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cx("tabular-nums text-ink", strong && "text-[15px] font-bold")}>{value}</dd>
    </div>
  );
}
