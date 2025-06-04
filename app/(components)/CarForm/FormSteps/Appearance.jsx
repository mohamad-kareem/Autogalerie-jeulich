import React from "react";
import Button from "@/app/(components)/helpers/Button";
import Input from "@/app/(components)/CarForm/FormElements/Input";
import Select from "@/app/(components)/CarForm/FormElements/Select";
import { interiorMaterialOptions } from "@/app/(components)/CarForm/constants";

const Appearance = ({
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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-sm sm:text-2xl font-bold text-gray-900">
            Farbe & Design
          </h2>
          <p className="text-gray-600 mt-2 text-sm ">
            Äußere und innere Gestaltung des Fahrzeugs
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <Input
          label="Farbe (Hersteller)"
          name="exteriorColor"
          value={formData.exteriorColor}
          onChange={handleChange}
          placeholder="FLAMENCOROT BRILLANTEFFEKT METAL"
          inputSize="small"
        />

        <Input
          label="Farbe"
          name="exteriorColorSimple"
          value={formData.exteriorColorSimple}
          onChange={handleChange}
          placeholder="Rot Metallic"
          inputSize="small"
        />

        <Select
          label="Innenmaterial"
          name="interiorMaterial"
          value={formData.interiorMaterial}
          onChange={handleChange}
          options={interiorMaterialOptions}
          inputSize="small"
        />

        <Input
          label="Innenausstattung"
          name="interiorColor"
          value={formData.interiorColor}
          onChange={handleChange}
          placeholder="Vollleder, Schwarz"
          inputSize="small"
        />

        <Input
          label="Innenfarbe"
          name="interiorColorSimple"
          value={formData.interiorColorSimple}
          onChange={handleChange}
          placeholder="Schwarz"
          inputSize="small"
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
          <span className="hidden sm:inline">
            Weiter zu Beschreibung & Bilder
          </span>
          <span className="sm:hidden">Weiter</span>
        </Button>
      </div>
    </div>
  );
};

export default Appearance;
