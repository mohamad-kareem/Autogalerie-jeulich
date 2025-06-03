// FormElements/Select.jsx
import React from "react";
import { FiChevronDown } from "react-icons/fi";

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Bitte auswählen...",
  error = "",
  inputSize = "default",
}) => {
  const sizeClasses = {
    default: "px-4 py-2.5 text-sm",
    small: "px-3 py-2 text-xs",
  };

  return (
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
          required={required}
          className={`block w-full rounded-lg border ${
            error ? "border-red-500" : "border-gray-300"
          } ${
            sizeClasses[inputSize]
          } pr-8 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none outline-none bg-white`}
        >
          <option value="">{placeholder}</option>
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
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Select;
