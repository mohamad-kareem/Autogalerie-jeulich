"use client";

import { useState, useMemo } from "react";
import { BsSpeedometer2 } from "react-icons/bs";
import { FaEuroSign } from "react-icons/fa";

const FinanceCalculatorAdvanced = ({ price = 0 }) => {
  const [downPayment, setDownPayment] = useState(0);
  const [term, setTerm] = useState(36);
  const interestRate = 7.99; // interner effektiver Jahreszins
  const [monthlyRate, setMonthlyRate] = useState(null);

  const principal = useMemo(() => {
    const p = Number(price) - Number(downPayment || 0);
    return p > 0 ? p : 0;
  }, [price, downPayment]);

  const calculate = () => {
    const r = interestRate / 100 / 12; // Monatszins
    const n = term;

    if (principal <= 0 || n <= 0 || !isFinite(principal)) {
      setMonthlyRate(null);
      return;
    }

    const monthly =
      (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    setMonthlyRate(Number.isFinite(monthly) ? monthly.toFixed(2) : null);
  };

  const formatEuro = (amount) =>
    `${Number(amount || 0).toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €`;

  const downPaymentPercent =
    price > 0 ? Math.min(100, Math.max(0, (downPayment / price) * 100)) : 0;

  return (
    <div className="  bg-slate-950/95 p-4 sm:p-5 shadow-sm shadow-black/40">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Finanzierung
          </p>
          <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
            Finanzierung berechnen
          </h2>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full bg-sky-950/60 px-2.5 py-1 text-[11px] font-medium text-sky-200 ring-1 ring-sky-500/40">
          <BsSpeedometer2 className="h-3.5 w-3.5" />
          <span>ab Monat</span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3 space-y-1.5">
        <label className="text-xs font-medium text-slate-300">
          Fahrzeugpreis (Brutto)
        </label>
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100">
          <FaEuroSign className="mr-2 h-3 w-3 text-slate-400" />
          <span className="truncate">{formatEuro(price)}</span>
        </div>
      </div>

      {/* Down payment */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <label className="font-medium">Anzahlung</label>
          <span className="text-slate-400">
            {downPayment > 0
              ? `${downPaymentPercent.toFixed(0)} %`
              : "optional"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={downPayment}
              onChange={(e) =>
                setDownPayment(
                  Math.min(
                    Number(price) || 0,
                    Math.max(0, Number(e.target.value) || 0)
                  )
                )
              }
              min={0}
              max={price}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="0"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-slate-500">
              €
            </span>
          </div>
        </div>

        {/* small progress bar */}
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-900">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300 transition-all duration-300"
            style={{ width: `${downPaymentPercent || 0}%` }}
          />
        </div>
      </div>

      {/* Term */}
      <div className="mb-4 space-y-1.5">
        <label className="text-xs font-medium text-slate-300">
          Laufzeit (Monate)
        </label>
        <select
          value={term}
          onChange={(e) => setTerm(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        >
          {[12, 24, 36, 48, 60, 72, 84, 96].map((m) => (
            <option key={m} value={m}>
              {m} Monate
            </option>
          ))}
        </select>
      </div>

      {/* Button */}
      <button
        onClick={calculate}
        className="mb-3 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-sky-900/40 transition-all hover:from-sky-500 hover:via-sky-400 hover:to-sky-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!price || principal <= 0}
      >
        Monatliche Rate berechnen
      </button>

      {/* Result */}
      {monthlyRate && (
        <div className="mb-3 rounded-xl border border-sky-800/60 bg-sky-900/15 px-3 py-3 text-xs text-slate-200">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] text-sky-300">
              Geschätzte Rate
            </span>
            <span className="text-[11px] text-slate-400">
              Effektiver Jahreszins {interestRate.toFixed(2)} %
            </span>
          </div>
          <p className="text-lg font-semibold text-sky-300">
            {formatEuro(Number(monthlyRate))}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="space-y-0.5">
              <p className="text-slate-500">Finanzierungsbetrag</p>
              <p className="font-medium">{formatEuro(principal)}</p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-slate-500">Laufzeit</p>
              <p className="font-medium">{term} Monate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCalculatorAdvanced;
