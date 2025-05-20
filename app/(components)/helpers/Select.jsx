"use client";
import React from "react";

const Select = ({
  label,
  value,
  onChange,
  required = false,
  options = [],
  placeholder = "",
  className = "",
  containerClassName = "",
}) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        className={`w-full p-2 border rounded-md border-black focus:outline-none focus:border-red-600 ${className}`}
        value={value}
        onChange={onChange}
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
