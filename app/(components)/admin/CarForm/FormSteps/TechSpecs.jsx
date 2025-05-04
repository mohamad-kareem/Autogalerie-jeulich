import React from "react";
import Button from "@/app/(components)/admin/CarForm/FormElements/Button";
import Input from "@/app/(components)/admin/CarForm/FormElements/Input";
import Select from "@/app/(components)/admin/CarForm/FormElements/Select";

import {
  emissionClassOptions,
  environmentalBadgeOptions,
  driveTypeOptions,
  transmissionOptions,
} from "@/app/(components)/admin/CarForm/constants";

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
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900">Technische Daten</h2>
        <p className="text-gray-600 mt-1">
          Technische Spezifikationen des Fahrzeugs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Baureihe"
          name="modelSeries"
          value={formData.modelSeries}
          onChange={handleChange}
        />

        <Input
          label="Modell"
          name="model"
          value={formData.model}
          onChange={handleChange}
        />

        <Input
          label="Ausstattungslinie"
          name="equipmentLine"
          value={formData.equipmentLine}
          onChange={handleChange}
        />

        <Input
          label="Hubraum (L)"
          name="displacement"
          value={formData.displacement}
          onChange={handleChange}
          placeholder="1.5"
        />

        <Input
          label="Anzahl Sitzplätze"
          type="number"
          name="seats"
          value={formData.seats}
          onChange={handleChange}
        />

        <Input
          label="Anzahl der Türen"
          name="doors"
          value={formData.doors}
          onChange={handleChange}
          placeholder="4/5"
        />

        <Select
          label="Schadstoffklasse"
          name="emissionClass"
          value={formData.emissionClass}
          onChange={handleChange}
          options={emissionClassOptions}
        />

        <Select
          label="Umweltplakette"
          name="environmentalBadge"
          value={formData.environmentalBadge}
          onChange={handleChange}
          options={environmentalBadgeOptions}
        />

        <Input
          label="Anzahl der Fahrzeughalter"
          type="number"
          name="previousOwners"
          value={formData.previousOwners}
          onChange={handleChange}
        />

        <Input
          label="HU bis"
          name="inspectionDate"
          value={formData.inspectionDate}
          onChange={handleChange}
          placeholder="MM/YYYY"
        />

        <Input
          label="Zylinder"
          type="number"
          name="cylinders"
          value={formData.cylinders}
          onChange={handleChange}
        />

        <Input
          label="Tankgröße (L)"
          name="tankCapacity"
          value={formData.tankCapacity}
          onChange={handleChange}
        />

        <Select
          label="Antriebsart"
          name="driveType"
          value={formData.driveType}
          onChange={handleChange}
          options={driveTypeOptions}
        />

        <Input
          label="Energieverbrauch (komb.)"
          name="energyConsumption"
          value={formData.energyConsumption}
          onChange={handleChange}
          placeholder="5.3 l/100km"
        />

        <Input
          label="CO₂-Emissionen (komb.)"
          name="co2Emission"
          value={formData.co2Emission}
          onChange={handleChange}
          placeholder="126 g/km"
        />

        <Input
          label="Kraftstoffverbrauch"
          name="fuelConsumption"
          value={formData.fuelConsumption}
          onChange={handleChange}
          placeholder="5.3 l/100km (kombiniert)"
        />

        <Input
          label="Gewicht (kg)"
          name="weight"
          value={formData.weight}
          onChange={handleChange}
        />

        <Input
          label="Anhängelast gebremst (kg)"
          name="towCapacityBraked"
          value={formData.towCapacityBraked}
          onChange={handleChange}
        />

        <Input
          label="Anhängelast ungebremst (kg)"
          name="towCapacityUnbraked"
          value={formData.towCapacityUnbraked}
          onChange={handleChange}
        />

        <Select
          label="Getriebe"
          name="transmission"
          value={formData.transmission}
          onChange={handleChange}
          options={transmissionOptions}
        />
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <Button
          onClick={prevStep}
          bgColor="bg-gray-600"
          hoverColor="hover:bg-gray-700"
          icon="FiArrowLeft"
        >
          Zurück
        </Button>
        <Button onClick={nextStep} icon="FiArrowRight">
          Weiter zu Ausstattung
        </Button>
      </div>
    </div>
  );
};

export default TechSpecs;
