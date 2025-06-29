"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/app/(assets)/kauftraglogo.png";
import toast from "react-hot-toast";
import Button from "@/app/(components)/helpers/Button";
import { useSearchParams } from "next/navigation";
export default function KaufvertragClientForm() {
  const [form, setForm] = useState({});
  const searchParams = useSearchParams();

  useEffect(() => {
    const issuer = searchParams.get("issuer");
    if (issuer && !form.issuer) {
      setForm((prev) => ({ ...prev, issuer }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const numericFields = ["total", "downPayment"];
    const parsedValue =
      type === "checkbox"
        ? checked
        : numericFields.includes(name)
        ? parseFloat(value) || 0
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("Submitting form:", form);

      const res = await fetch("/api/kaufvertrag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <form onSubmit={handleSubmit} className="space-y-4 print:space-y-2">
        <input type="hidden" name="issuer" value={form.issuer || ""} />
        {/* Header */}
        <div className="flex justify-between items-center border p-7 bg-black text-white print:p-1">
          <div className="text-left">
            <p className="font-semibold text-lg">
              E-Mail: autogalerie.juelich@web.de / Tel.: 02461/9163780
            </p>
          </div>
          <div className="text-right">
            <Image
              src={logo}
              alt="Logo"
              width={150}
              height={100}
              className="object-fill"
            />
          </div>
        </div>

        {/* Buyer Info and Invoice */}
        <div className="flex justify-between items-start  pb-2 print:pb-1">
          <div className="text-left space-y-1 print:space-y-0 print:leading-none print:gap-0 print:m-0 w-1/2">
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
          <div className="text-right space-y-1">
            <p className="text-red-600 text-2xl   print:text-2xl">
              Kaufvertrag
            </p>
            <div className="flex justify-end items-center space-x-2 text-[13px]">
              <label htmlFor="invoiceNumber" className="font-medium">
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
            <div className="flex justify-end items-center space-x-2 text-[13px]">
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
                onChange={handleChange}
                className="border border-gray-400 rounded px-2 py-1 w-[140px] text-[13px]"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}

        <div className="space-y-1 print:space-y-0 print:leading-none w-1/2">
          <div className="flex items-center ">
            <label className="w-40 font-semibold text-[13px]">
              Ausweisnummer
            </label>
            <input
              type="text"
              name="idNumber"
              onChange={handleChange}
              className="input  p-1"
            />
          </div>

          <div className="flex items-center ">
            <label className="w-40 font-semibold text-[13px]">
              Telefon / Mobil:
            </label>
            <input
              type="text"
              name="phone"
              onChange={handleChange}
              className="input  p-1"
            />
          </div>

          <div className="flex items-center ">
            <label className="w-40 font-semibold text-[13px]">
              Persönliche E-Mail:
            </label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="input  p-1"
            />
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="pt-6 print:pt-1">
          <div className="grid grid-cols-4 gap-2 text-[13px] font-semibold">
            <div>
              <label htmlFor="carType">Fahrzeugtyp</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="carType"
                name="carType"
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="vin">Fahrgestellnummer</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="vin"
                name="vin"
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="firstRegistration">Erstzulassung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="firstRegistration"
                name="firstRegistration"
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="mileage">Gesamtlaufleistung</label>
              <div className="h-[1px] bg-gray-400 w-full my-1" />
              <input
                id="mileage"
                name="mileage"
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Warranty */}
        <div className="pt-6 print:mt-1">
          <p className="font-semibold">Gewährleistung:</p>
          <div className=" p-1 text-[13px]">
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
          {form.agreements && (
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
        <div className=" pt-6 print:pt-1">
          <p className="font-semibold text-[13px] border-b w-fit  ">
            Das Kfz wurde mit folgenden Papieren und Schlüsseln übergeben
          </p>
          <div className="grid grid-cols-4 gap-1 text-[13px] pt-2">
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
              Asu/Tüv{" "}
              <input
                type="text"
                name="tuev"
                className="input print-bordered w-16 ml-1"
                onChange={handleChange}
              />
            </label>
            <label className="flex items-center">
              Schlüssel{" "}
              <input
                type="number"
                name="keys"
                className="input print-bordered w-12 ml-1"
                onChange={handleChange}
              />
            </label>
          </div>
        </div>

        {/* Payment */}
        {/* Payment Section */}
        <div className="grid grid-cols-3 gap-2 pt-6 print:pt-1">
          {/* Rechnungsbetrag */}
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">
              Rechnungsbetrag (€)
            </div>
            <input
              type="number"
              name="total"
              className="input w-full p-1"
              onChange={handleChange}
              value={form.total || ""}
            />
          </div>

          {/* Anzahlung */}
          <div>
            <div className="border-b border-black inline-block text-[13px] font-semibold mb-1">
              Anzahlung (€)
            </div>
            <input
              type="number"
              name="downPayment"
              className="input w-full p-1"
              onChange={handleChange}
              value={form.downPayment || ""}
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
                form.total && form.downPayment
                  ? `€ ${(form.total - form.downPayment).toFixed(2)}`
                  : ""
              }
            />
          </div>
        </div>

        <p className="italic text-[13px]">
          Betrag wird Bar per Abholung bezahlt
        </p>

        {/* Terms */}
        <div className="mt-4 print:mt-2">
          <div className="flex justify-between items-end font-bold text-[13px]">
            <p>Zahlungsbedingungen</p>
            <div className="flex flex-col items-center ">
              <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
              <p className="text-center text-[13px]">Restbetrag erhalten</p>
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
        <div className="flex justify-between mt-16 print:mt-3">
          <div className="flex flex-col items-center">
            <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
            <p className=" text-center text-[13px]">Unterschrift Verkäufer</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-12 w-40 border-b border-dashed border-gray-400 mb-1 print:h-16" />
            <p className=" text-center text-[13px]">Unterschrift Käufer</p>
          </div>
        </div>

        {/* Bank Info */}
        {form.issuer === "alawie" ? (
          <div className="mt-4 grid grid-cols-2 text-white print:mt-2">
            <div className="bg-gray-600 p-2 print:p-1">
              <p className="font-semibold text-[13px]">Autogalerie Jülich</p>
              <p className="text-[13px]">Inh. Jibrail Alawie</p>
              <p className="text-[13px]">Alte Dürener straße 4</p>
              <p className="text-[13px]">52428 Jülich</p>
            </div>
            <div className="bg-gray-600 p-2 text-right print:p-1">
              <p className="font-semibold text-[13px]">Commerzbank</p>
              <p className="text-[13px]">IBAN: DE42 3904 0013 0446 9508 00</p>
              <p className="text-[13px]">USt-IdNr.: DE317574583</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 text-white print:mt-2">
            <div className="bg-gray-600 p-2 print:p-1">
              <p className="font-semibold text-[13px]">Bankverbindung</p>
              <p className="text-[13px]">Inh. Hussein Karim</p>
              <p className="text-[13px]">Alte Dürener straße 4</p>
              <p className="text-[13px]">52428 Jülich</p>
            </div>
            <div className="bg-gray-600 p-2 text-right print:p-1">
              <p className="font-semibold text-[13px]">Commerzbank</p>
              <p className="text-[13px]">IBAN: DE91 3904 0013 0444 4964 00</p>
              <p className="text-[13px]">USt-IdNr.: DE305423608</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="mt-4 px-4 py-1 text-[13px] print:hidden"
        >
          Vertrag absenden
        </Button>

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
              border: none;
              background-color: white;
              color: black;
              padding: 0;
              margin: 0;
              font-size: 0.75rem;
              line-height: 1rem;
              height: auto;
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
