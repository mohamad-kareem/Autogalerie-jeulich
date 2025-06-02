import React from "react";

const Textarea = ({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  required = false,
}) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
    />
  </div>
);

export default Textarea;
