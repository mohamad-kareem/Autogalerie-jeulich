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
    <div className="space-y-4 sm:space-y-8">
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-4 sm:p-6 rounded-xl">
        <h2 className="text-md sm:text-2xl font-bold text-gray-900">
          Technische Daten
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Technische Spezifikationen des Fahrzeugs
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2">
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

      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
        <Button
          onClick={prevStep}
          icon="FiArrowLeft"
          bgColor="bg-black"
          hoverColor="hover:bg-red-950"
          size="small"
        >
          Zurück
        </Button>
        <Button onClick={nextStep} icon="FiArrowRight" size="small">
          <span className="hidden sm:inline">Weiter zu Ausstattung</span>
          <span className="sm:hidden">Weiter</span>
        </Button>
      </div>
    </div>
  );
};

export default TechSpecs;
