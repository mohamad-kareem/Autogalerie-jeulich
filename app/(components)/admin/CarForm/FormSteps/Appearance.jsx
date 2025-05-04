import React from "react";
import Button from "@/app/(components)/admin/CarForm/FormElements/Button";
import Input from "@/app/(components)/admin/CarForm/FormElements/Input";
import Select from "@/app/(components)/admin/CarForm/FormElements/Select";
import { interiorMaterialOptions } from "@/app/(components)/admin/CarForm/constants";

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
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900">Farbe & Design</h2>
        <p className="text-gray-600 mt-1">
          Äußere und innere Gestaltung des Fahrzeugs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Farbe (Hersteller)"
          name="exteriorColor"
          value={formData.exteriorColor}
          onChange={handleChange}
          placeholder="FLAMENCOROT BRILLANTEFFEKT METAL"
        />

        <Input
          label="Farbe"
          name="exteriorColorSimple"
          value={formData.exteriorColorSimple}
          onChange={handleChange}
          placeholder="Rot Metallic"
        />

        <Select
          label="Innenmaterial"
          name="interiorMaterial"
          value={formData.interiorMaterial}
          onChange={handleChange}
          options={interiorMaterialOptions}
        />

        <Input
          label="Innenausstattung"
          name="interiorColor"
          value={formData.interiorColor}
          onChange={handleChange}
          placeholder="Vollleder, Schwarz"
        />

        <Input
          label="Innenfarbe"
          name="interiorColorSimple"
          value={formData.interiorColorSimple}
          onChange={handleChange}
          placeholder="Schwarz"
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
          Weiter zu Beschreibung & Bilder
        </Button>
      </div>
    </div>
  );
};

export default Appearance;
