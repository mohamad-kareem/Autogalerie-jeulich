import React from "react";
import Button from "@/app/(components)/helpers/Button";
import Input from "@/app/(components)/CarForm/FormElements/Input";
import Select from "@/app/(components)/CarForm/FormElements/Select";

import {
  emissionClassOptions,
  environmentalBadgeOptions,
  driveTypeOptions,
  transmissionOptions,
} from "@/app/(components)/CarForm/constants";

const TechSpecs = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  currentStep,
  totalSteps,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* HEADER */}
      <div className="rounded-3xl border border-black/[0.06] bg-[#eef6f0] p-4 shadow-sm sm:p-6">
        <div className="mb-3 h-[2px] w-10 bg-[#146c2e]" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e] sm:text-[11px]">
          Fahrzeugtechnik
        </p>

        <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-3xl">
          Technische Daten
        </h2>

        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#5f695f] sm:text-[14px]">
          Technische Spezifikationen und Verbrauchsdaten des Fahrzeugs.
        </p>
      </div>

      {/* FORM */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <Input
            label="Baureihe"
            name="modelSeries"
            value={formData.modelSeries}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="Ausstattungslinie"
            name="equipmentLine"
            value={formData.equipmentLine}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="Hubraum (L)"
            name="displacement"
            value={formData.displacement}
            onChange={handleChange}
            placeholder="1.5"
            inputSize="small"
          />

          <Input
            label="Sitzplätze"
            type="number"
            name="seats"
            value={formData.seats}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="Türen"
            name="doors"
            value={formData.doors}
            onChange={handleChange}
            placeholder="4/5"
            inputSize="small"
          />

          <Select
            label="Schadstoffklasse"
            name="emissionClass"
            value={formData.emissionClass}
            onChange={handleChange}
            options={emissionClassOptions}
            inputSize="small"
          />

          <Select
            label="Umweltplakette"
            name="environmentalBadge"
            value={formData.environmentalBadge}
            onChange={handleChange}
            options={environmentalBadgeOptions}
            inputSize="small"
          />

          <Input
            label="Fahrzeughalter"
            type="number"
            name="previousOwners"
            value={formData.previousOwners}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="HU bis"
            name="inspectionDate"
            value={formData.inspectionDate}
            onChange={handleChange}
            placeholder="MM/YYYY"
            inputSize="small"
          />

          <Input
            label="Zylinder"
            type="number"
            name="cylinders"
            value={formData.cylinders}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="Tankgröße (L)"
            name="tankCapacity"
            value={formData.tankCapacity}
            onChange={handleChange}
            inputSize="small"
          />

          <Select
            label="Antriebsart"
            name="driveType"
            value={formData.driveType}
            onChange={handleChange}
            options={driveTypeOptions}
            inputSize="small"
          />

          <Input
            label="Verbrauch (komb.)"
            name="energyConsumption"
            value={formData.energyConsumption}
            onChange={handleChange}
            placeholder="5.3 l/100km"
            inputSize="small"
          />

          <Input
            label="CO₂-Emissionen"
            name="co2Emission"
            value={formData.co2Emission}
            onChange={handleChange}
            placeholder="126 g/km"
            inputSize="small"
          />

          <Input
            label="Kraftstoffverbrauch"
            name="fuelConsumption"
            value={formData.fuelConsumption}
            onChange={handleChange}
            placeholder="5.3 l/100km"
            inputSize="small"
          />

          <Input
            label="Gewicht (kg)"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="Anhängelast gebremst"
            name="towCapacityBraked"
            value={formData.towCapacityBraked}
            onChange={handleChange}
            inputSize="small"
          />

          <Input
            label="Anhängelast ungebremst"
            name="towCapacityUnbraked"
            value={formData.towCapacityUnbraked}
            onChange={handleChange}
            inputSize="small"
          />

          <Select
            label="Getriebe"
            name="transmission"
            value={formData.transmission}
            onChange={handleChange}
            options={transmissionOptions}
            inputSize="small"
          />
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex flex-col gap-3 border-t border-black/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-7">
        <Button
          onClick={prevStep}
          icon="FiArrowLeft"
          bgColor="bg-[#101510]"
          hoverColor="hover:bg-[#263126]"
          size="small"
          className="w-full sm:w-auto"
        >
          Zurück
        </Button>

        <Button
          onClick={nextStep}
          icon="FiArrowRight"
          size="small"
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Weiter zu Ausstattung</span>
          <span className="sm:hidden">Weiter</span>
        </Button>
      </div>
    </div>
  );
};

export default TechSpecs;
