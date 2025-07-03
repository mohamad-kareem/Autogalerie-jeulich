"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/app/(assets)/kauftraglogo.png";
import toast from "react-hot-toast";
import Button from "@/app/(components)/helpers/Button";
import { useSearchParams } from "next/navigation";

export default function KaufvertragClientForm() {
  const [form, setForm] = useState({ downPayment: 0 });

  const searchParams = useSearchParams();
  const [rawTotal, setRawTotal] = useState("");
  const [rawDownPayment, setRawDownPayment] = useState("");
  useEffect(() => {
    setRawDownPayment(`€ ${formatGermanNumber(0)}`);
  }, []);

  useEffect(() => {
    const issuer = searchParams.get("issuer");
    if (issuer && !form.issuer) {
      setForm((prev) => ({ ...prev, issuer }));
    }
  }, [searchParams]);

  const formatDateToGermanDash = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const parsedValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };
  const formatGermanNumber = (value) =>
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const parseGermanNumber = (value) => {
    const cleaned = value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace("€", "")
      .trim();
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Force downPayment to be 0 if empty
    const cleanedForm = {
      ...form,
      downPayment:
        form.downPayment === "" || form.downPayment === undefined
          ? 0
          : Number(form.downPayment),
    };

    try {
      const res = await fetch("/api/kaufvertrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedForm),
      });

      if (res.status === 409) {
        toast.error("Diese Rechnungsnummer existiert bereits.");
        return;
      }

      if (!res.ok) throw new Error("Fehler beim Speichern");

      toast.success("Kaufvertrag wurde erfolgreich gespeichert!");
      setForm((prev) => ({ issuer: prev.issuer }));
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern des Formulars.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 font-sans text-[13px] print:p-0 print:max-w-none">
      <form onSubmit={handleSubmit} className="space-y-4 print:space-y-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center border p-2 sm:p-7 bg-black text-white print:flex-row print:justify-between print:items-center print:p-2 print:px-6">
          <div className="text-left w-full md:w-auto mb-2 md:mb-0 print:mb-2 print:text-left print:w-full">
            <p className="font-semibold text-sm md:text-lg print:text-sm">
              E-Mail: autogalerie.juelich@web.de / Tel.: 02461/9163780
            </p>
          </div>
          <div className="text-right w-full md:w-auto print:w-1/2 print:text-right">
            <Image
              src={logo}
              alt="Logo"
              width={150}
              height={100}
              className="object-fill mx-auto md:mx-0 print:ml-auto print:mr-0"
            />
          </div>
        </div>

        {/* Buyer Info and Invoice */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-2 print:pb-1 gap-4 md:gap-0">
          <div className="text-left space-y-1 print:space-y-0 print:leading-none print:gap-0 print:mt-2 w-full md:w-1/2">
            <p className="font-bold">Käuferdaten:</p>
            <input
              type="text"
              name="buyerName"
              placeholder="Name"
              onChange={handleChange}
              className="input w-full p-1"
            />
            <input
              type="text"
              name="buyerStreet"
              placeholder="Straße"
              onChange={handleChange}
              className="input w-full p-1"
            />
            <input
              type="text"
              name="buyerCity"
              placeholder="PLZ Ort"
              onChange={handleChange}
              className="input w-full p-1"
            />
          </div>
          <div className="text-right space-y-1 w-full md:w-auto">
            <p className="text-red-600 text-xl md:text-2xl print:text-2xl">
              Kaufvertrag
            </p>
            <div className="flex justify-end items-center gap-2 text-[13px]">
              <label
                htmlFor="invoiceNumber"
                className="font-medium whitespace-nowrap"
              >
                Rechnungsnummer:
              </label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                onChange={handleChange}
                className="border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px]"
              />
            </div>
            <div className="flex justify-end items-center gap-2 text-[13px] mt-1">
              <label
                htmlFor="invoiceDate"
                className="font-medium whitespace-nowrap"
              >
                Datum:
              </label>
              <input
                type="date"
                id="invoiceDate"
                name="invoiceDate"
                value={form.invoiceDate || ""}
                onChange={handleChange}
                className="border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] print:hidden"
              />
              {form.invoiceDate && (
                <p className="hidden print:flex items-center border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] ">
                  {formatDateToGermanDash(form.invoiceDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-[max-content_1fr] gap-y-1 print:gap-y-0 print:leading-none w-full md:w-1/2">
          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Ausweisnummer
          </label>
          <input
            type="text"
            name="idNumber"
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />

          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Telefon / Mobil
          </label>
          <input
            type="text"
            name="phone"
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />

          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Persönliche E-Mail
          </label>
          <input
            type="email"
            name="email"
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />
        </div>

        {/* Vehicle Info */}
        <div className="pt-4 md:pt-6 print:pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-2 text-[13px] font-semibold">
            <div>
              <label htmlFor="carType">Fahrzeugtyp</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="carType"
                name="carType"
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="vin">Fahrgestellnummer</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="vin"
                name="vin"
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="firstRegistration">Erstzulassung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                type="date"
                id="firstRegistration"
                name="firstRegistration"
                onChange={handleChange}
                value={form.firstRegistration ?? ""}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="mileage">Gesamtlaufleistung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="mileage"
                name="mileage"
                onChange={handleChange}
                className="input w-full"
              />
            </div>
          </div>
        </div>

        {/* Warranty */}
        <div className="pt-4 md:pt-6 print:mt-1">
          <p className="font-semibold">Gewährleistung:</p>
          <div className="p-1 text-[13px]">
            <div className="flex items-center space-x-1">
              <input
                type="radio"
                name="warranty"
                value="12months"
                onChange={handleChange}
                className="accent-black"
              />
              <span>
                Die Gewährleistung wird auf 12 Monate ab Kaufdatum festgelegt
              </span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <input
                type="radio"
                name="warranty"
                value="excluded"
                onChange={handleChange}
                className="accent-black"
              />
              <span>Die Gewährleistung wird ausgeschlossen</span>
            </div>
          </div>
        </div>

        {/* Agreements */}
        <div>
          <p className="font-semibold">Besondere Vereinbarungen</p>

          {/* Textarea for editing */}
          <textarea
            name="agreements"
            rows="3"
            onChange={handleChange}
            value={form.agreements || ""}
            className="input w-full p-1 text-[13px] print:hidden"
            placeholder="* Ölservice Neu\n* TÜV Neu"
          />

          {/* Render as list for print and view */}
          {!form.agreements || form.agreements.trim() === "" ? (
            <p className="text-[11px] hidden print:block mt-2 italic text-gray-700">
              Keine besonderen Vereinbarungen
            </p>
          ) : (
            <ul className="list-disc pl-5 text-[13px] hidden print:block mt-2">
              {form.agreements
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line, idx) => (
                  <li key={idx}>{line.replace(/^\* /, "")}</li>
                ))}
            </ul>
          )}
        </div>

        {/* Documents */}
        <div className="pt-4 md:pt-6 print:pt-1">
          <p className="font-semibold text-[13px] border-b w-fit">
            Das Kfz wurde mit folgenden Papieren und Schlüsseln übergeben
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-1 text-[13px] pt-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="kfzBrief"
                onChange={handleChange}
                className="mr-1"
              />
              Kfz Brief
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="kfzSchein"
                onChange={handleChange}
                className="mr-1"
              />
              Kfz Schein
            </label>
            <label className="flex items-center">
              Asu/Tüv:
              <input
                type="text"
                name="tuev"
                className="input print-bordered w-16 ml-1"
                onChange={handleChange}
              />
            </label>
            <label className="flex items-center">
              Schlüssel:
              <input
                type="number"
                name="keys"
                className="input print-bordered w-12 ml-1"
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 md:pt-6 print:pt-1">
          {/* Rechnungsbetrag */}
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">
              Rechnungsbetrag (€)
            </div>
            <input
              type="text"
              name="total"
              value={rawTotal}
              onChange={(e) => {
                const val = e.target.value;
                setRawTotal(val);
                setForm((prev) => ({
                  ...prev,
                  total: parseGermanNumber(val),
                }));
              }}
              onBlur={() => {
                setRawTotal(`€ ${formatGermanNumber(form.total || 0)}`);
              }}
              onFocus={() => {
                setRawTotal(form.total?.toString() || "");
              }}
              className="input w-full p-1"
            />
          </div>

          {/* Anzahlung (€) */}
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">
              Anzahlung (€)
            </div>
            <input
              type="text"
              name="downPayment"
              value={rawDownPayment}
              onChange={(e) => {
                const val = e.target.value;
                setRawDownPayment(val);
                setForm((prev) => ({
                  ...prev,
                  downPayment: parseGermanNumber(val),
                }));
              }}
              onBlur={() => {
                const value = Number.isFinite(form.downPayment)
                  ? form.downPayment
                  : 0;
                setForm((prev) => ({ ...prev, downPayment: value }));
                setRawDownPayment(`€ ${formatGermanNumber(value)}`);
              }}
              onFocus={() => {
                setRawDownPayment(form.downPayment?.toString() || "0");
              }}
              className="input w-full p-1"
            />
          </div>

          {/* Restbetrag (calculated) */}
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">
              Restbetrag (€)
            </div>
            <input
              type="text"
              name="restAmount"
              className="input w-full p-1"
              readOnly
              value={
                Number.isFinite(form.total - form.downPayment)
                  ? `€ ${formatGermanNumber(form.total - form.downPayment)}`
                  : ""
              }
            />
          </div>
        </div>

        <input
          type="text"
          name="paymentNote"
          value={form.paymentNote || ""}
          onChange={handleChange}
          className="input italic text-[13px] mt-1 w-full"
          placeholder="Betrag wird Bar per Abholung bezahlt"
        />

        {/* Terms */}
        <div className="mb-3 print:mt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end font-bold text-[13px] gap-2">
            <p>Zahlungsbedingungen</p>
            <div className="flex flex-col items-start sm:items-center w-full sm:w-auto">
              <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
              <p className="text-left sm:text-center text-[13px]">
                Restbetrag erhalten
              </p>
            </div>
          </div>

          <ul className="text-[13px] text-black list-disc pl-4 mt-1 space-y-0 print:text-[13px]">
            <li>
              Differenzbesteuerung nach §25a, UStG, Keine USt. Ausweisbar.
            </li>
            <li>
              Das Fahrzeug bleibt bis zur kompletten Zahlung Eigentum des
              Verkäufers.
            </li>
            <li>
              Soweit nicht anders angegeben entspricht das Leistungsdatum dem
              Tag der Übergabe.
            </li>
            <li>Der Rechnungsbetrag ist sofort zur Zahlung fällig.</li>
            <li>
              Als Betreff bitte immer die Referenznummer mit angeben, damit Ihre
              Zahlung korrekt zugeordnet werden kann.
            </li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="flex flex-col sm:flex-row justify-between mt-8 sm:mt-18 print:mt-3 gap-4 sm:gap-0">
          <div className="flex flex-col items-start sm:items-center">
            <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
            <p className="text-left sm:text-center text-[13px]">
              Unterschrift Verkäufer
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-center">
            <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
            <p className="text-left sm:text-center text-[13px]">
              Unterschrift Käufer
            </p>
          </div>
        </div>

        {/* Bank Info */}
        {form.issuer === "alawie" ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 text-white print:mt-2">
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
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 text-white print:mt-2">
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
          </div>
        )}

        {/* Print and Submit Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 print:hidden mt-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Drucken
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Vertrag absenden
          </button>
        </div>

        <style jsx>{`
          .input {
            border: 1px solid #ccc;
            border-radius: 0.15rem;
            background-color: white;
            color: black;
            padding: 0.25rem;
            font-size: 0.75rem;
            width: 100%;
          }
        `}</style>

        <style jsx global>{`
          @media print {
            .print\\:hidden {
              display: none !important;
            }

            .input {
              border: none !important;
              box-shadow: none !important;
              background-color: white !important;
              color: black !important;
            }

            input[type="date"]::-webkit-calendar-picker-indicator {
              display: none;
            }

            input[type="date"] {
              appearance: none;
              background: transparent !important;
              border: none;
              padding: 0;
            }
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0px 1000px white inset !important;
            box-shadow: 0 0 0px 1000px white inset !important;
            -webkit-text-fill-color: black !important;
          }
        `}</style>
      </form>
    </div>
  );
}
