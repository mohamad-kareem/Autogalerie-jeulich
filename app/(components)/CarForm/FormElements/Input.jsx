// FormElements/Input.jsx
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
  error = "",
  inputSize = "default",
}) => {
  const sizeClasses = {
    default: "px-3 py-1.5 text-sm",
    small: "px-3 py-2 text-xs",
  };

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
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
        required={required}
        className={`block w-full rounded-lg border ${
          error ? "border-red-500" : "border-gray-300"
        } ${
          sizeClasses[inputSize]
        } focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default Input;
