import React from "react";
import { FiCheck } from "react-icons/fi";

const Checkbox = ({ label, name, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer">
    <div
      className={`relative w-5 h-5 rounded border ${
        checked ? "bg-red-500 border-red-500" : "bg-white border-gray-300"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="absolute opacity-0 w-full h-full cursor-pointer"
      />
      {checked && (
        <FiCheck className="absolute text-white w-4 h-4 top-0.5 left-0.5" />
      )}
    </div>
    <span className="text-gray-700">{label}</span>
  </label>
);

export default Checkbox;
