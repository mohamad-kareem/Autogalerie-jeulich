// components/EntryDetails.jsx
"use client";

import React from "react";

const EntryDetails = ({ entry }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Details</h4>
        <DetailGrid>
          <DetailItem label="Belegart" value={entry.documentType} />
          <DetailItem label="Belegnummer" value={entry.documentNumber} />
          <DetailItem label="Konto" value={entry.account} />
          <DetailItem label="Kategorie" value={entry.category} />
          <DetailItem label="Steuersatz" value={entry.tax} />
        </DetailGrid>
      </div>
    </div>
  );
};

const DetailGrid = ({ children }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</dl>
);

const DetailItem = ({ label, value }) => (
  <div className="sm:col-span-1">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{value || "-"}</dd>
  </div>
);

const ActionButton = ({ onClick, icon, text }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
  >
    {React.cloneElement(icon, { className: "mr-2 h-4 w-4" })}
    {text}
  </button>
);

export default EntryDetails;
