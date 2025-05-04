import React from "react";
import { FiChevronDown } from "react-icons/fi";

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) => (
  <div className="space-y-1">
    {label && (
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="block w-full px-4 py-2.5 pr-8 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none outline-none bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <FiChevronDown className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  </div>
);

export default Select;
