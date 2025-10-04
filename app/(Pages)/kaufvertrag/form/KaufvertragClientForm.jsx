"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import logo from "@/app/(assets)/kauftraglogo.png";
import toast from "react-hot-toast";
import Button from "@/app/(components)/helpers/Button";
import { useSearchParams } from "next/navigation";

export default function KaufvertragClientForm() {
  const initialFormState = {
    downPayment: 0,
    title: "Kaufvertrag",
    issuer: "",
    invoiceNumber: "",
    invoiceDate: "",
    buyerName: "",
    buyerStreet: "",
    buyerCity: "",
    idNumber: "",
    phone: "",
    email: "",
    carType: "",
    vin: "",
    firstRegistration: "",
    mileage: "",
    warranty: "",
    agreements: [],
    kfzBrief: false,
    kfzSchein: false,
    tuev: "",
    keys: "",
    total: 0,
    paymentNote: "",
  };

  const [form, setForm] = useState(initialFormState);
  const searchParams = useSearchParams();

  const issuerQP = useMemo(
    () => searchParams.get("issuer") || "",
    [searchParams]
  );
  const carId = useMemo(() => searchParams.get("carId") || "", [searchParams]);

  const [rawTotal, setRawTotal] = useState("");
  const [rawDownPayment, setRawDownPayment] = useState("");

  // Number helpers
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

  const formatDateToGermanDash = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Initialize down payment display
  useEffect(() => {
    setRawDownPayment(`€ ${formatGermanNumber(0)}`);
  }, []);

  // 1) Set issuer from query + compute next invoice number (your existing logic)
  useEffect(() => {
    if (!issuerQP) return;

    setForm((prev) => (prev.issuer ? prev : { ...prev, issuer: issuerQP }));

    const fetchNextNumber = async () => {
      try {
        const res = await fetch(`/api/kaufvertrag/last?issuer=${issuerQP}`);
        const { nextNumber } = await res.json();

        if (!nextNumber) {
          toast.error("Keine Rechnungsnummer gefunden.");
          return;
        }

        setForm((prev) => ({ ...prev, invoiceNumber: nextNumber }));
      } catch (e) {
        console.error(e);
        toast.error("Fehler beim Abrufen der Rechnungsnummer.");
      }
    };

    if (!form.invoiceNumber) {
      fetchNextNumber();
    }
  }, [issuerQP]);

  // 2) If carId present, fetch car and prefill car fields
  useEffect(() => {
    const fetchAndPrefill = async () => {
      if (!carId) return;
      try {
        const res = await fetch(`/api/cars/${encodeURIComponent(carId)}`);
        if (!res.ok) throw new Error("Auto nicht gefunden");
        const car = await res.json();

        // Try to map to your form:
        // carType → make + model (or modelDescription/title if you prefer)
        const carType =
          [car.make, car.model].filter(Boolean).join(" ") ||
          car.modelDescription ||
          car.title ||
          "";

        // firstRegistration may be "YYYY-MM" or a full date — keep raw value in the input
        // Convert firstRegistration (e.g. "201312" or "2013-12") into "MM/YYYY"
        let firstRegistration = "";
        if (car.firstRegistration) {
          const raw = car.firstRegistration.toString().replace(/[^0-9]/g, ""); // keep only digits
          if (raw.length === 6) {
            const year = raw.substring(0, 4);
            const month = raw.substring(4, 6);
            firstRegistration = `${month}/${year}`;
          } else if (raw.length === 7 || raw.length === 8) {
            // Handle things like 2013-12 or 2013/12
            const parts = car.firstRegistration.split(/[-/]/);
            if (parts.length === 2) {
              firstRegistration = `${parts[1]}/${parts[0]}`;
            }
          } else {
            firstRegistration = car.firstRegistration;
          }
        }

        // mileage → plain number text
        const mileage =
          typeof car.mileage === "number"
            ? String(car.mileage)
            : car.mileage || "";

        setForm((prev) => ({
          ...prev,
          carType,
          vin: car.vin || car.VIN || "", // support both field casings, if any
          firstRegistration,
          mileage,
        }));
      } catch (e) {
        console.error(e);
        toast.error("Fahrzeugdaten konnten nicht geladen werden.");
      }
    };

    fetchAndPrefill();
  }, [carId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const parsedValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedForm = {
      ...form,
      agreements: (form.agreements || []).filter((line) => line.trim() !== ""),
      total: Number.isFinite(form.total) ? Number(form.total) : 0,
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

      setForm((prev) => ({
        ...initialFormState,
        issuer: prev.issuer, // keep issuer
      }));
      setRawTotal("");
      setRawDownPayment("€ 0,00");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern des Formulars.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 font-sans text-[13px] print:p-0 print:max-w-none">
      <form
        autoComplete="off"
        onSubmit={handleSubmit}
        className="space-y-4 print:space-y-1"
      >
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
              autoComplete="off"
              placeholder="Name"
              onChange={handleChange}
              className="input w-full p-1"
              value={form.buyerName || ""}
            />
            <input
              type="text"
              name="buyerStreet"
              autoComplete="off"
              placeholder="Straße"
              onChange={handleChange}
              className="input w-full p-1"
              value={form.buyerStreet || ""}
            />
            <input
              type="text"
              name="buyerCity"
              value={form.buyerCity || ""}
              autoComplete="off"
              placeholder="PLZ Ort"
              onChange={handleChange}
              className="input w-full p-1"
            />
          </div>

          <div className="text-right space-y-1 w-full md:w-auto">
            <input
              type="text"
              name="title"
              autoComplete="off"
              value={form.title || ""}
              onChange={handleChange}
              className="text-red-600 text-xl md:text-2xl print:text-2xl bg-transparent border-none outline-none w-[160px] text-right"
            />

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
                autoComplete="off"
                name="invoiceNumber"
                value={form.invoiceNumber || ""}
                onChange={handleChange}
                className="border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] print:border-none"
                placeholder="z.B. RE-202583 oder 37/25"
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
                autoComplete="off"
                value={form.invoiceDate || ""}
                onChange={handleChange}
                className="border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] print:hidden "
              />
              {form.invoiceDate && (
                <p className="hidden print:flex items-center border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] print:border-none ">
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
            value={form.idNumber || ""}
            autoComplete="off"
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />

          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Telefon / Mobil
          </label>
          <input
            type="text"
            name="phone"
            value={form.phone || ""}
            autoComplete="off"
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />

          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Persönliche E-Mail
          </label>
          <input
            type="email"
            name="email"
            value={form.email || ""}
            autoComplete="off"
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />
        </div>

        {/* Vehicle Info (prefilled if carId exists) */}
        <div className="pt-4 md:pt-6 print:pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-4 gap-2 text-[13px] font-semibold">
            <div>
              <label htmlFor="carType">Fahrzeugtyp</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="carType"
                name="carType"
                value={form.carType || ""}
                autoComplete="off"
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
                value={form.vin || ""}
                autoComplete="off"
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="firstRegistration">Erstzulassung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                type="text"
                id="firstRegistration"
                name="firstRegistration"
                placeholder="TT-MM-JJ oder JJJJ-MM"
                value={form.firstRegistration || ""}
                onChange={handleChange}
                className="input w-full"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="mileage">Gesamtlaufleistung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="mileage"
                name="mileage"
                value={form.mileage || ""}
                onChange={handleChange}
                className="input w-full"
                autoComplete="off"
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
                checked={form.warranty === "12months"}
                autoComplete="off"
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
                checked={form.warranty === "excluded"}
                autoComplete="off"
                onChange={handleChange}
                className="accent-black"
              />
              <span>Die Gewährleistung wird ausgeschlossen</span>
            </div>
          </div>
        </div>

        {/* Agreements */}
        <div>
          {/* Title shows on both screen & print */}
          <p className="font-semibold  text-[14px] print:text-[13px]">
            Besondere Vereinbarungen
          </p>

          {/* Screen view */}
          <div className="print:hidden">
            {form.agreements?.length > 0 ? (
              <ul className="space-y-1 text-[13px]">
                {form.agreements.map((item, idx) => (
                  <li
                    key={idx}
                    className="relative pl-5 flex items-center justify-between group"
                  >
                    {/* Smaller custom bullet for screen */}
                    <span className="absolute left-2 top-2 w-1 h-1 rounded-full bg-black" />
                    <span className="flex-1">{item}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          agreements: prev.agreements.filter(
                            (_, i) => i !== idx
                          ),
                        }))
                      }
                      className="ml-2 text-gray-500 hover:text-red-600 text-sm font-bold transition"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic text-[12px]">
                Keine besonderen Vereinbarungen
              </p>
            )}

            {/* Add new agreement input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                name="agreementInput"
                placeholder="Neue Vereinbarung..."
                value={form.agreementInput || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    agreementInput: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && form.agreementInput?.trim()) {
                    e.preventDefault();
                    setForm((prev) => ({
                      ...prev,
                      agreements: [
                        ...(prev.agreements || []),
                        prev.agreementInput.trim(),
                      ],
                      agreementInput: "",
                    }));
                  }
                }}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-[13px] focus:ring-1 focus:ring-black focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (form.agreementInput?.trim()) {
                    setForm((prev) => ({
                      ...prev,
                      agreements: [
                        ...(prev.agreements || []),
                        prev.agreementInput.trim(),
                      ],
                      agreementInput: "",
                    }));
                  }
                }}
                className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>

          {/* Print view */}
          <div className="hidden print:block mt-2">
            {form.agreements?.length > 0 ? (
              <ul className="list-disc list-outside pl-5 text-[13px]">
                {form.agreements.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className="italic text-[12px] text-gray-700">
                Keine besonderen Vereinbarungen
              </p>
            )}
          </div>
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
                checked={form.kfzBrief}
                onChange={handleChange}
                className="mr-1"
              />
              Kfz Brief
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="kfzSchein"
                checked={form.kfzSchein}
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
                autoComplete="off"
                value={form.tuev || ""}
                className="input print-bordered w-16 ml-1"
                onChange={handleChange}
              />
            </label>
            <label className="flex items-center">
              Schlüssel:
              <input
                type="number"
                name="keys"
                value={form.keys || ""}
                autoComplete="off"
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
              autoComplete="off"
              value={rawTotal}
              onChange={(e) => {
                const val = e.target.value;
                setRawTotal(val);
                setForm((prev) => ({ ...prev, total: parseGermanNumber(val) }));
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
              autoComplete="off"
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
              autoComplete="off"
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

        {/* Payment Note Selection (radio) */}
        <div className="mt-4 print:hidden">
          <p className="font-semibold mb-1">Zahlungsmethode</p>
          <div className="flex flex-col gap-1 text-[13px]">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentNote"
                value="Barzahlung bei Abholung"
                checked={form.paymentNote === "Barzahlung bei Abholung"}
                onChange={handleChange}
                className="accent-black"
              />
              Barzahlung bei Abholung
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentNote"
                value="Bezahlung per Überweisung"
                checked={form.paymentNote === "Bezahlung per Überweisung"}
                onChange={handleChange}
                className="accent-black"
              />
              Bezahlung per Überweisung
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentNote"
                value="Betrag wird finanziert"
                checked={form.paymentNote === "Betrag wird finanziert"}
                onChange={handleChange}
                className="accent-black"
              />
              Bezahlung per Finanzierung
            </label>
          </div>
        </div>

        {/* Print version of payment note */}
        {form.paymentNote && (
          <div className="mt-0 hidden print:block leading-tight">
            <p className="italic text-[13px]">{form.paymentNote}</p>
          </div>
        )}

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
