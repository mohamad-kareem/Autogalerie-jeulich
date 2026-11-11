"use client";

/**
 * The printed Kaufvertrag – exactly the document Autogalerie always printed
 * (header, buyer, vehicle, warranty, agreements, papers, payment, terms,
 * signatures, bank). Read-only; on screen it looks like the print.
 */

import { forwardRef } from "react";
import Image from "next/image";
import logo from "@/app/(assets)/kauftraglogo.png";
import LogoKarim from "@/app/(assets)/logo1111.png";

const formatGermanNumber = (value) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);

const formatDateToGermanDash = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

function AlawieHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center border p-2 sm:p-7 bg-black text-white print:flex-row print:justify-between print:items-center print:p-2 print:px-6">
      <div className="text-left w-full md:w-auto mb-2 md:mb-0 print:mb-2 print:text-left print:w-full">
        <p className="font-semibold text-sm md:text-lg print:text-sm">E-Mail: autogalerie.juelich@web.de / Tel.: 02461/916006613</p>
      </div>
      <div className="text-right w-full md:w-auto print:w-1/2 print:text-right">
        <Image src={logo} alt="Autogalerie Jülich – Alawie" width={150} height={100} className="object-fill mx-auto md:mx-0 print:ml-auto print:mr-0" />
      </div>
    </div>
  );
}

function KarimHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center border py-2 px-2 sm:px-7 sm:py-6 bg-gradient-to-b from-slate-950/95 to-slate-900/90 text-white print:flex-row print:justify-between print:items-center print:py-2 print:px-6">
      <div className="flex items-center gap-3 w-full md:w-auto mb-2 md:mb-0 print:mb-2 print:w-full">
        <Image src={LogoKarim} alt="Autogalerie Jülich – Karim" width={55} height={55} className="object-contain" priority />
        <span className="font-playfair text-lg md:text-xl tracking-wide print:text-lg">AUTOGALERIE JÜLICH</span>
      </div>
      <div className="text-right w-full md:w-auto print:w-1/2 print:text-right">
        <p className="font-mono text-sm md:text-lg print:text-sm">
          <span className="print:whitespace-nowrap">E-Mail:&nbsp;autogalerie.juelich@web.de</span>
        </p>
        <p className="font-mono text-sm md:text-lg print:text-sm">
          <span className="print:whitespace-nowrap">Tel.:&nbsp;02461&nbsp;/&nbsp;916006613</span>
        </p>
      </div>
    </div>
  );
}

/** read-only input – keeps the printed look 1:1 */
function Val({ value, className = "", type = "text" }) {
  return <input type={type} readOnly tabIndex={-1} value={value ?? ""} className={className} />;
}

const KaufvertragDocument = forwardRef(function KaufvertragDocument({ doc }, ref) {
  const form = doc || {};
  const total = Number(form.total) || 0;
  const down = Number(form.downPayment) || 0;
  const agreements = Array.isArray(form.agreements) ? form.agreements : [];

  return (
    <div ref={ref} className="kv-doc bg-white p-4 font-sans text-[13px] text-black print:p-0">
      <div className="space-y-4 print:space-y-1">
        {/* Header */}
        {form.issuer === "karim" ? <KarimHeader /> : <AlawieHeader />}

        {/* Buyer Info and Invoice */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-2 print:pb-1 gap-4 md:gap-0">
          <div className="text-left space-y-1 print:space-y-0 print:leading-none print:gap-0 print:mt-2 w-full md:w-1/2">
            <p className="font-bold">Käuferdaten:</p>
            <Val value={form.buyerName} className="input w-full p-1" />
            <Val value={form.buyerStreet} className="input w-full p-1" />
            <Val value={form.buyerCity} className="input w-full p-1" />
          </div>

          <div className="text-right space-y-1 w-full md:w-auto">
            <Val
              value={form.title || "Kaufvertrag"}
              className={`text-xl md:text-2xl print:text-2xl bg-transparent border-none outline-none w-[160px] text-right ${
                form.issuer === "karim" ? "text-slate-800" : "text-red-600"
              }`}
            />
            <div className="flex justify-end items-center gap-2 text-[13px]">
              <label className="font-medium whitespace-nowrap">Rechnungsnummer:</label>
              <Val value={form.invoiceNumber} className="kv-box rounded px-2 py-1 w-[140px] text-[13px]" />
            </div>
            <div className="flex justify-end items-center gap-2 text-[13px] mt-1">
              <label className="font-medium whitespace-nowrap">Datum:</label>
              <p className="flex items-center rounded px-2 py-1 w-[140px] text-[13px]">{formatDateToGermanDash(form.invoiceDate)}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-[max-content_1fr] gap-y-1 print:gap-y-0 print:leading-none w-full md:w-1/2">
          <label className="font-semibold text-[13px] print:text-[11px] self-center">Ausweisnummer</label>
          <Val value={form.idNumber} className="input p-1 text-[13px] print:text-[11px] w-full" />
          <label className="font-semibold text-[13px] print:text-[11px] self-center">Telefon / Mobil</label>
          <Val value={form.phone} className="input p-1 text-[13px] print:text-[11px] w-full" />
          <label className="font-semibold text-[13px] print:text-[11px] self-center">Persönliche E-Mail</label>
          <Val value={form.email} className="input p-1 text-[13px] print:text-[11px] w-full" />
        </div>

        {/* Vehicle Info */}
        <div className="pt-4 md:pt-6 print:pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-2 text-[13px] font-semibold">
            {[
              ["Fahrzeugtyp", form.carType],
              ["Fahrgestellnummer", form.vin],
              ["Erstzulassung", form.firstRegistration],
              ["Gesamtlaufleistung", form.mileage],
            ].map(([label, value]) => (
              <div key={label}>
                <label>{label}</label>
                <div className="h-[1px] bg-gray-400 w-full my-1" />
                <Val value={value} className="input w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Warranty */}
        <div className="pt-4 md:pt-6 print:mt-1">
          <p className="font-semibold">Gewährleistung:</p>
          <div className="p-1 text-[13px]">
            <div className="flex items-center space-x-1">
              <input type="radio" readOnly tabIndex={-1} checked={form.warranty === "12months"} className="accent-black" />
              <span>Die Gewährleistung wird auf 12 Monate ab Kaufdatum festgelegt</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <input type="radio" readOnly tabIndex={-1} checked={form.warranty === "excluded"} className="accent-black" />
              <span>Die Gewährleistung wird ausgeschlossen</span>
            </div>
          </div>
        </div>

        {/* Agreements */}
        <div>
          <p className="font-semibold">Besondere Vereinbarungen</p>
          <div className="mt-2">
            {agreements.length > 0 ? (
              <ul className="list-disc list-outside pl-5 text-[13px]">
                {agreements.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-[12px] text-gray-700">Keine besonderen Vereinbarungen</p>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="pt-4 md:pt-6 print:pt-1">
          <p className="font-semibold text-[13px] border-b w-fit">Das Kfz wurde mit folgenden Papieren und Schlüsseln übergeben</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-1 text-[13px] pt-2">
            <label className="flex items-center">
              <input type="checkbox" readOnly tabIndex={-1} checked={Boolean(form.kfzBrief)} className="mr-1" />
              Kfz Brief
            </label>
            <label className="flex items-center">
              <input type="checkbox" readOnly tabIndex={-1} checked={Boolean(form.kfzSchein)} className="mr-1" />
              Kfz Schein
            </label>
            <label className="flex items-center">
              Asu/Tüv:
              <Val value={form.tuev} className="input print-bordered w-16 ml-1" />
            </label>
            <label className="flex items-center">
              Schlüssel:
              <Val value={form.keys ?? ""} className="input print-bordered w-12 ml-1" />
            </label>
          </div>
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 md:pt-6 print:pt-1">
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">Rechnungsbetrag (€)</div>
            <Val value={total ? `€ ${formatGermanNumber(total)}` : ""} className="input w-full p-1" />
          </div>
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">Anzahlung (€)</div>
            <Val value={`€ ${formatGermanNumber(down)}`} className="input w-full p-1" />
          </div>
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">Restbetrag (€)</div>
            <Val value={`€ ${formatGermanNumber(total - down)}`} className="input w-full p-1" />
          </div>
        </div>

        {/* Payment note */}
        {form.paymentNote ? (
          <div className="mt-0 leading-tight">
            <p className="italic text-[13px]">{form.paymentNote}</p>
          </div>
        ) : null}

        {/* Terms */}
        <div className="mb-3 print:mt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end font-bold text-[13px] gap-2">
            <p>Zahlungsbedingungen</p>
            <div className="flex flex-col items-start sm:items-center w-full sm:w-auto">
              <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
              <p className="text-left sm:text-center text-[13px]">Restbetrag erhalten</p>
            </div>
          </div>
          <ul className="text-[13px] text-black list-disc pl-4 mt-1 space-y-0 print:text-[13px]">
            <li>Differenzbesteuerung nach §25a, UStG, Keine USt. Ausweisbar.</li>
            <li>Das Fahrzeug bleibt bis zur kompletten Zahlung Eigentum des Verkäufers.</li>
            <li>Soweit nicht anders angegeben entspricht das Leistungsdatum dem Tag der Übergabe.</li>
            <li>Der Rechnungsbetrag ist sofort zur Zahlung fällig.</li>
            <li>Als Betreff bitte immer die Referenznummer mit angeben, damit Ihre Zahlung korrekt zugeordnet werden kann.</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="flex flex-col sm:flex-row justify-between mt-8 sm:mt-18 print:mt-3 gap-4 sm:gap-0">
          <div className="flex flex-col items-start sm:items-center">
            <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
            <p className="text-left sm:text-center text-[13px]">Unterschrift Verkäufer</p>
          </div>
          <div className="flex flex-col items-start sm:items-center">
            <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
            <p className="text-left sm:text-center text-[13px]">Unterschrift Käufer</p>
          </div>
        </div>

        {/* Bank Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 text-white print:mt-2">
          {form.issuer === "alawie" ? (
            <>
              <div className="bg-gray-600 p-2 print:p-1">
                <p className="font-semibold text-[13px]">Autogalerie Jülich</p>
                <p className="text-[13px]">Inh. Jibrail Alawie</p>
                <p className="text-[13px]">Alte Dürener straße 4</p>
                <p className="text-[13px]">52428 Jülich</p>
              </div>
              <div className="bg-gray-600 p-2 md:text-right print:text-right print:p-1">
                <p className="font-semibold text-[13px]">Commerzbank</p>
                <p className="text-[13px]">IBAN: DE42 3904 0013 0446 9508 00</p>
                <p className="text-[13px]">USt-IdNr.: DE317574583</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-600 p-2 print:p-1">
                <p className="font-semibold text-[13px]">Bankverbindung</p>
                <p className="text-[13px]">Inh. Hussein Karim</p>
                <p className="text-[13px]">Alte Dürener straße 4</p>
                <p className="text-[13px]">52428 Jülich</p>
              </div>
              <div className="bg-gray-600 p-2 md:text-right print:text-right print:p-1">
                <p className="font-semibold text-[13px]">Commerzbank</p>
                <p className="text-[13px]">IBAN: DE91 3904 0013 0444 4964 00</p>
                <p className="text-[13px]">USt-IdNr.: DE305423608</p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .kv-doc .input {
          border: none;
          border-radius: 0.15rem;
          background-color: white;
          color: black;
          padding: 0.25rem;
          font-size: 0.75rem;
          width: 100%;
          outline: none;
          cursor: default;
        }
        .kv-doc .input.w-16 {
          width: 4rem;
        }
        .kv-doc .input.w-12 {
          width: 3rem;
        }
        .kv-doc .kv-box {
          border: none;
          outline: none;
          background: transparent;
        }
        .kv-doc input[type="radio"],
        .kv-doc input[type="checkbox"] {
          pointer-events: none;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
});

export default KaufvertragDocument;
