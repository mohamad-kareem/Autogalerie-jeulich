// @/app/(components)/Textarea.jsx
"use client";
import React from "react";

const Textarea = ({ label, rows = 4, ...props }) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className="block w-full rounded-md border-gray-900 shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm"
        {...props}
      />
    </div>
  );
};

export default Textarea; // Must have this default export
