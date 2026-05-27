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

const BasicInfo = ({ formData, setFormData, nextStep, prevStep, errors }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* HEADER */}
      <div className="rounded-3xl border border-black/[0.06] bg-[#eef6f0] p-4 shadow-sm sm:p-6">
        <div className="mb-3 h-[2px] w-10 bg-[#146c2e]" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e] sm:text-[11px]">
          Fahrzeugdaten
        </p>

        <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-3xl">
          Grundinformationen
        </h2>

        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#5f695f] sm:text-[14px]">
          Basisinformationen über das Fahrzeug für eine schnelle und faire
          Bewertung.
        </p>
      </div>

      {/* FORM */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <div className="space-y-4 sm:space-y-5">
            <Input
              label="Hersteller (Marke)"
              name="make"
              value={formData.make}
              onChange={handleChange}
              requislate
              error={errors.make}
            />

            <Input
              label="Fahrzeug-Identifizierungsnummer (VIN)"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              requislate
              error={errors.vin}
            />

            <Input
              label="Modell"
              name="model"
              value={formData.model}
              onChange={handleChange}
              requislate
              error={errors.model}
            />

            <Input
              label="Preis (€)"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              requislate
              error={errors.price}
            />
          </div>

          <div className="space-y-4 sm:space-y-5">
            <Input
              label="Erstzulassung"
              name="registration"
              value={formData.registration}
              onChange={handleChange}
              placeholder="MM/YYYY"
              requislate
              error={errors.registration}
            />

            <Input
              label="Kilometerstand"
              type="number"
              name="kilometers"
              value={formData.kilometers}
              onChange={handleChange}
              requislate
              error={errors.kilometers}
            />

            <Input
              label="Leistung (PS)"
              type="number"
              name="hp"
              value={formData.hp}
              onChange={handleChange}
              requislate
              error={errors.hp}
            />

            <Select
              label="Kraftstoffart"
              name="fuel"
              value={formData.fuel}
              onChange={handleChange}
              options={fuelOptions}
              requislate
              error={errors.fuel}
            />
          </div>

          {/* SELECTS */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:col-span-2 md:grid-cols-2">
            <Select
              label="Zustand"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              options={conditionOptions}
              requislate
              error={errors.condition}
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              requislate
              error={errors.status}
            />
          </div>

          {/* CHECKBOXES */}
          <div className="md:col-span-2 rounded-2xl border border-[#146c2e]/10 bg-[#fafbf9] p-4 sm:p-5">
            <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.02em] text-[#07111f] sm:text-base">
              Zusätzliche Informationen
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          {/* CATEGORY */}
          <div className="md:col-span-2">
            <Select
              label="Kategorie"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions}
              requislate
              error={errors.category}
            />
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex flex-col-reverse gap-3 border-t border-black/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-7">
        <Button
          onClick={prevStep}
          bgColor="bg-[#101510]"
          hoverColor="hover:bg-[#263126]"
          icon="FiArrowLeft"
          className="w-full sm:w-auto"
        >
          Zurück
        </Button>

        <Button
          onClick={nextStep}
          icon="FiArrowRight"
          className="w-full sm:w-auto"
        >
          Weiter zu Technische Daten
        </Button>
      </div>
    </div>
  );
};

export default BasicInfo;
