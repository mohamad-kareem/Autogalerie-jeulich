import React from "react";

import Button from "@/app/(components)/helpers/Button";
import Input from "@/app/(components)/CarForm/FormElements/Input";
import Select from "@/app/(components)/CarForm/FormElements/Select";
import Checkbox from "@/app/(components)/CarForm/FormElements/Checkbox";
import {
  fuelOptions,
  conditionOptions,
  statusOptions,
  categoryOptions,
} from "@/app/(components)/CarForm/constants";

const BasicInfo = ({ formData, setFormData, nextStep, prevStep }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-6 rounded-xl">
        <h2 className="text-md sm:text-2xl font-bold text-gray-900">
          Grundinformationen
        </h2>
        <p className="text-gray-600 mt-1">
          Basisinformationen über das Fahrzeug
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Hersteller (Marke)"
          name="make"
          value={formData.make}
          onChange={handleChange}
          required
        />

        <Input
          label="Fahrzeug-Identifizierungsnummer (VIN)"
          name="vin"
          value={formData.vin}
          onChange={handleChange}
        />
        <Input
          label="Modell"
          name="model"
          value={formData.model}
          onChange={handleChange}
        />

        <Input
          label="Preis (€)"
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
        />

        <Input
          label="Erstzulassung"
          name="registration"
          value={formData.registration}
          onChange={handleChange}
          placeholder="MM/YYYY"
          required
        />

        <Input
          label="Kilometerstand"
          type="number"
          name="kilometers"
          value={formData.kilometers}
          onChange={handleChange}
          required
        />

        <Input
          label="Leistung (PS)"
          type="number"
          name="hp"
          value={formData.hp}
          onChange={handleChange}
          required
        />

        <Select
          label="Kraftstoffart"
          name="fuel"
          value={formData.fuel}
          onChange={handleChange}
          options={fuelOptions}
          required
        />

        <Select
          label="Zustand"
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          options={conditionOptions}
          required
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
          required
        />

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg col-span-1 md:col-span-2">
          <h3 className="font-medium text-gray-700">
            Zusätzliche Informationen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Unfallfrei"
              name="accidentFree"
              checked={formData.accidentFree}
              onChange={handleChange}
            />
            <Checkbox
              label="Fahrtauglich"
              name="operational"
              checked={formData.operational}
              onChange={handleChange}
            />
          </div>
        </div>

        <Select
          label="Kategorie"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200">
        <Button
          onClick={prevStep}
          bgColor="bg-black"
          hoverColor="hover:bg-red-950"
          icon="FiArrowLeft"
          size="small"
        >
          Zurück
        </Button>
        <Button onClick={nextStep} icon="FiArrowRight" size="small">
          <span className="hidden sm:inline">Weiter zu Technische Daten</span>
          <span className="sm:hidden">Weiter</span>
        </Button>
      </div>
    </div>
  );
};

export default BasicInfo;
