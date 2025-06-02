import React from "react";

const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  containerClassName = "",
}) => (
  <div className={`space-y-1 ${containerClassName}`}>
    {label && (
      <label className="block text-sm sm:text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full px-4 py-2.5 sm:px-2 sm:py-2 rounded-lg border border-gray-300 text-sm sm:text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
    />
  </div>
);

export default Input;
