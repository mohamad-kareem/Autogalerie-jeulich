// components/ExportButton.jsx
"use client";

import React from "react";
import { FiDownload } from "react-icons/fi";
import { exportToExcel } from "../utils/ExportService";

const ExportButton = ({ data, fileName }) => {
  return (
    <button
      onClick={() => exportToExcel(data, fileName)}
      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
    >
      <FiDownload className="mr-2 h-4 w-4" />
      Excel Export
    </button>
  );
};

export default ExportButton;
