// components/EntryForm.jsx
"use client";
import React from "react";
import { FiChevronDown } from "react-icons/fi";

const EntryForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  editId,
  setIsFormExpanded,
  resetForm,
}) => (
  <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
    <FormHeader
      editId={editId}
      setIsFormExpanded={setIsFormExpanded}
      resetForm={resetForm}
    />
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="Datum"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          required
        />
        <CurrencyInput
          label="Einnahmen"
          name="income"
          value={formData.income}
          onChange={handleInputChange}
        />
        <CurrencyInput
          label="Ausgaben"
          name="expense"
          value={formData.expense}
          onChange={handleInputChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="Konto"
          type="text"
          name="account"
          value={formData.account}
          onChange={handleInputChange}
          placeholder="Kontonummer"
        />
        <FormSelect
          label="Belegart"
          name="documentType"
          value={formData.documentType}
          onChange={handleInputChange}
          options={[
            { value: "", label: "Art auswählen" },
            { value: "Rechnung", label: "Rechnung" },
            { value: "Quittung", label: "Quittung" },
            { value: "Zahlung", label: "Zahlung" },
            { value: "Ausgabe", label: "Ausgabe" },
            { value: "Gutschrift", label: "Gutschrift" },
          ]}
        />
        <FormInput
          label="Belegnummer"
          type="text"
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleInputChange}
          placeholder="Belegnummer"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          label="Kategorie"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          options={[
            { value: "", label: "Kategorie auswählen" },
            { value: "Verkauf", label: "Verkauf" },
            { value: "Service", label: "Service" },
            { value: "Einkauf", label: "Einkauf" },
            { value: "Büro", label: "Büro" },
            { value: "Reise", label: "Reise" },
            { value: "Marketing", label: "Marketing" },
          ]}
        />
        <FormInput
          label="Fahrzeug"
          type="text"
          name="carName"
          value={formData.carName}
          onChange={handleInputChange}
          placeholder="Fahrzeugname"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormSelect
          label="Steuersatz"
          name="tax"
          value={formData.tax}
          onChange={handleInputChange}
          options={[
            { value: "0%", label: "0% (Steuerfrei)" },
            { value: "7%", label: "7% (Ermäßigt)" },
            { value: "19%", label: "19% (Regelsatz)" },
          ]}
        />
      </div>

      <FormTextarea
        label="Beschreibung"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Detaillierte Beschreibung des Eintrags"
        required
      />

      <FormActions
        setIsFormExpanded={setIsFormExpanded}
        resetForm={resetForm}
        editId={editId}
      />
    </form>
  </div>
);

const FormHeader = ({ editId, setIsFormExpanded, resetForm }) => (
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-medium text-gray-900">
      {editId ? "Eintrag bearbeiten" : "Neuen Eintrag erstellen"}
    </h3>
    <button
      onClick={() => {
        setIsFormExpanded(false);
        resetForm();
      }}
      className="text-gray-400 hover:text-gray-500"
    >
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  </div>
);

const FormInput = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
      placeholder={placeholder}
      required={required}
    />
  </div>
);

const CurrencyInput = ({ label, name, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative rounded-md shadow-sm">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
        €
      </span>
      <input
        type="number"
        name={name}
        value={value || ""} // Convert null/undefined to empty string
        onChange={onChange}
        className="block w-full pl-7 pr-12 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="0,00"
        step="0.01"
      />
    </div>
  </div>
);

const FormSelect = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
    </div>
  </div>
);

const FormTextarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={3}
      className="block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
      placeholder={placeholder}
      required={required}
    />
  </div>
);

const FormActions = ({ setIsFormExpanded, resetForm, editId }) => (
  <div className="flex justify-end space-x-3 pt-2">
    <button
      type="button"
      onClick={() => {
        setIsFormExpanded(false);
        resetForm();
      }}
      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Abbrechen
    </button>
    <button
      type="submit"
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      {editId ? "Eintrag aktualisieren" : "Eintrag erstellen"}
    </button>
  </div>
);

export default EntryForm;
