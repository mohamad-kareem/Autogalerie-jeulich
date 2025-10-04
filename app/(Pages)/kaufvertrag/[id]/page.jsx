"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import logo from "@/app/(assets)/kauftraglogo.png";
import { useSession } from "next-auth/react";

export default function KaufvertragDetail() {
  const defaultForm = {
    issuer: "",
    buyerName: "",
    buyerStreet: "",
    buyerCity: "",
    invoiceNumber: "",
    invoiceDate: "",
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
    keys: 0,
    total: 0,
    downPayment: 0,
    paymentNote: "",
    title: "Kaufvertrag",
  };
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [rawTotal, setRawTotal] = useState("");
  const [rawDownPayment, setRawDownPayment] = useState("");
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const sanitizeData = (data) => {
    const sanitized = { ...defaultForm };

    for (const key in sanitized) {
      const defaultType = typeof sanitized[key];
      const value = data[key];

      if (key === "agreements") {
        if (Array.isArray(value)) {
          // ✅ Already an array → keep as is
          sanitized[key] = value;
        } else if (typeof value === "string" && value.trim() !== "") {
          // ✅ Old string → split into multiple bullets by line breaks or semicolons
          sanitized[key] = value
            .split(/\r?\n|;/) // split on newlines OR semicolons
            .map((line) => line.trim())
            .filter(Boolean);
        } else {
          // ✅ Nothing there → default empty array
          sanitized[key] = [];
        }
      } else if (Array.isArray(value)) {
        sanitized[key] = value;
      } else if (defaultType === "string") {
        sanitized[key] =
          typeof value === "string" ? value : sanitized[key] || "";
      } else if (defaultType === "number") {
        sanitized[key] = typeof value === "number" ? value : 0;
      } else if (defaultType === "boolean") {
        sanitized[key] = typeof value === "boolean" ? value : false;
      } else {
        sanitized[key] = value ?? sanitized[key];
      }
    }

    return sanitized;
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/kaufvertrag/${id}`);
      const data = await res.json();
      const cleanedData = sanitizeData(data);
      setForm(cleanedData);

      setRawTotal(
        cleanedData.total ? `€ ${formatGermanNumber(cleanedData.total)}` : ""
      );
      setRawDownPayment(
        `€ ${formatGermanNumber(cleanedData.downPayment ?? 0)}`
      );
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const numericFields = ["total", "downPayment", "keys"];

    let parsedValue;
    if (type === "checkbox") {
      parsedValue = checked;
    } else if (numericFields.includes(name)) {
      parsedValue = parseFloat(value) || 0;
    } else {
      parsedValue = value;
    }

    setForm((prev) => ({ ...prev, [name]: parsedValue }));
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

  const formatGermanNumber = (value) =>
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const parseGermanNumber = (value) => {
    const cleaned = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/kaufvertrag/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update");
      alert("Kaufvertrag updated successfully!");
      router.push("/kaufvertrag/liste");
    } catch (err) {
      console.error(err);
      alert("Error updating the form.");
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
              autoComplete="off"
              name="buyerName"
              value={form.buyerName}
              onChange={handleChange}
              className="input w-full p-1"
            />
            <input
              type="text"
              name="buyerStreet"
              autoComplete="off"
              value={form.buyerStreet}
              onChange={handleChange}
              className="input w-full p-1"
            />
            <input
              type="text"
              name="buyerCity"
              autoComplete="off"
              value={form.buyerCity}
              onChange={handleChange}
              className="input w-full p-1"
            />
          </div>
          <div className="text-right space-y-1 w-full md:w-auto">
            <input
              type="text"
              name="title"
              autoComplete="off"
              value={form.title}
              onChange={handleChange}
              className="text-red-600 text-xl md:text-2xl print:text-2xl bg-transparent  border-none outline-none w-[160px] text-right"
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
                name="invoiceNumber"
                autoComplete="off"
                value={form.invoiceNumber}
                onChange={handleChange}
                className="border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] print:border-none"
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
                <p className="hidden print:flex items-center border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px] print:border-none">
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
            autoComplete="off"
            value={form.idNumber}
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />

          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Telefon / Mobil
          </label>
          <input
            type="text"
            name="phone"
            autoComplete="off"
            value={form.phone}
            onChange={handleChange}
            className="input p-1 text-[13px] print:text-[11px] w-full"
          />

          <label className="font-semibold text-[13px] print:text-[11px] self-center">
            Persönliche E-Mail
          </label>
          <input
            type="email"
            name="email"
            autoComplete="off"
            value={form.email}
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
                autoComplete="off"
                value={form.carType}
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
                autoComplete="off"
                value={form.vin}
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
                autoComplete="off"
                placeholder="TT-MM-JJ"
                value={form.firstRegistration}
                onChange={handleChange}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="mileage">Gesamtlaufleistung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="mileage"
                name="mileage"
                autoComplete="off"
                value={form.mileage}
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
                checked={form.warranty === "12months"}
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

          {/* Screen view */}
          <div className="print:hidden">
            {form.agreements?.length > 0 ? (
              <ul className="space-y-1 text-[13px]">
                {form.agreements.map((item, idx) => (
                  <li
                    key={idx}
                    className="relative pl-6 flex items-center justify-between group"
                  >
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
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-[13px]"
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
                checked={form.kfzBrief || false}
                onChange={handleChange}
                className="mr-1"
              />
              Kfz Brief
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="kfzSchein"
                checked={form.kfzSchein || false}
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
                value={form.tuev}
                className="input print-bordered w-16 ml-1"
                onChange={handleChange}
              />
            </label>
            <label className="flex items-center">
              Schlüssel:
              <input
                type="number"
                name="keys"
                autoComplete="off"
                value={form.keys}
                className="input print-bordered w-12 ml-1"
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 md:pt-6 print:pt-1">
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
                // Strip € and format on next blur
                setRawTotal(val);
                setForm((prev) => ({
                  ...prev,
                  total: parseGermanNumber(val),
                }));
              }}
              onBlur={() => {
                // Format when leaving the input
                setRawTotal(`€ ${formatGermanNumber(form.total)}`);
              }}
              onFocus={() => {
                // Remove € and show raw number for editing
                setRawTotal(form.total?.toString() || "");
              }}
              className="input w-full p-1"
            />
          </div>
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
                // If the value is NaN or empty, default to 0
                const value = Number.isFinite(form.downPayment)
                  ? form.downPayment
                  : 0;
                setForm((prev) => ({ ...prev, downPayment: value }));
                setRawDownPayment(`€ ${formatGermanNumber(value)}`);
              }}
              onFocus={() => {
                // Show 0 if nothing is set
                setRawDownPayment(
                  form.downPayment?.toString() !== undefined
                    ? form.downPayment.toString()
                    : "0"
                );
              }}
              className="input w-full p-1"
            />
          </div>
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

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-between mt-4 gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => router.push("/kaufvertrag/liste")}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 print:hidden"
          >
            Zurück zur Liste
          </button>
          <div className="flex flex-col sm:flex-row gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Drucken
            </button>

            {isAdmin && (
              <>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Aktualisieren
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = confirm(
                      "Bist du sicher, dass du diesen Vertrag löschen möchtest?"
                    );
                    if (!confirmed) return;

                    try {
                      const res = await fetch(`/api/kaufvertrag/${id}`, {
                        method: "DELETE",
                      });
                      if (!res.ok) throw new Error("Fehler beim Löschen");
                      alert("Vertrag erfolgreich gelöscht");
                      router.push("/kaufvertrag/liste");
                    } catch (err) {
                      alert("Löschen fehlgeschlagen.");
                      console.error(err);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Löschen
                </button>
              </>
            )}
          </div>
        </div>

        {/* Styles */}
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
