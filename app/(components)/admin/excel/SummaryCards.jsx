// components/SummaryCards.jsx
"use client";

import React from "react";

const SummaryCards = ({ totalIncome, totalExpense, currentBalance }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      {/* Income Card */}
      <div className="flex-1 bg-white p-4 rounded-lg border-l-4 border-green-500 shadow">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Einnahmen</p>
            <p className="text-2xl font-bold text-gray-800">
              €{totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="text-green-500">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expense Card */}
      <div className="flex-1 bg-white p-4 rounded-lg border-l-4 border-red-500 shadow">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Ausgaben</p>
            <p className="text-2xl font-bold text-gray-800">
              €{totalExpense.toFixed(2)}
            </p>
          </div>
          <div className="text-red-500">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="flex-1 bg-white p-4 rounded-lg border-l-4 border-gray-800 shadow">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Saldo</p>
            <p
              className={`text-2xl font-bold ${
                currentBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              €{currentBalance.toFixed(2)}
            </p>
          </div>
          <div className="text-gray-800">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
