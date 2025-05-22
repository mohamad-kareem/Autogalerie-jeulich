"use client";

import { useState } from "react";

const FinanceCalculatorAdvanced = ({ price }) => {
  const [downPayment, setDownPayment] = useState(0);
  const [term, setTerm] = useState(36);
  const [interestRate] = useState(4.9); // Effektiver Jahreszins
  const [monthlyRate, setMonthlyRate] = useState(null);

  const calculate = () => {
    const principal = price - downPayment;
    const r = interestRate / 100 / 12;
    const n = term;

    if (principal <= 0 || n <= 0) return;

    const monthly =
      (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    setMonthlyRate(monthly.toFixed(2));
  };

  const formatEuro = (amount) =>
    `${amount.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Finanzierung berechnen
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fahrzeugpreis
        </label>
        <input
          type="text"
          value={formatEuro(price)}
          readOnly
          className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anzahlung
        </label>
        <input
          type="number"
          value={downPayment}
          onChange={(e) => setDownPayment(Number(e.target.value))}
          min={0}
          max={price}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Laufzeit (Monate)
        </label>
        <select
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {[12, 24, 36, 48, 60, 72, 84, 96].map((m) => (
            <option key={m} value={m}>
              {m} Monate
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Effektiver Jahreszins
        </label>
        <input
          type="text"
          value={`${interestRate}%`}
          readOnly
          className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={calculate}
        className="w-full bg-gradient-to-br from-red-600 to-black hover:from-red-700 text-white rounded-md px-4 py-2 text-sm font-medium"
      >
        Monatliche Rate berechnen
      </button>

      {monthlyRate && (
        <div className="mt-4 text-sm text-gray-800">
          Monatliche Rate:{" "}
          <span className="font-bold text-red-600">
            {formatEuro(Number(monthlyRate))}
          </span>
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        * Unverbindliches Finanzierungsbeispiel bei einem effektiven Jahreszins
        von {interestRate}%. Bonität vorausgesetzt. Änderungen und Irrtümer
        vorbehalten.
      </p>
    </div>
  );
};

export default FinanceCalculatorAdvanced;
