// components/PrintButton.jsx
"use client";

import React from "react";
import { FiPrinter } from "react-icons/fi";
import { printEntries } from "../utils/PrintService";

const PrintButton = ({ entries, filterMonth, filterYear, totals }) => {
  return (
    <button
      onClick={() => printEntries(entries, filterMonth, filterYear, totals)}
      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
    >
      <FiPrinter className="mr-2 h-4 w-4" />
      Drucken
    </button>
  );
};

export default PrintButton;
