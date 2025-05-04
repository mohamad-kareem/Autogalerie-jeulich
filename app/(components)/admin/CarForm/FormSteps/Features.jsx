import React from "react";
import Button from "@/app/(components)/admin/CarForm/FormElements/Button";
import Input from "@/app/(components)/admin/CarForm/FormElements/Input";
import Select from "@/app/(components)/admin/CarForm/FormElements/Select";

import { FiPlus, FiX } from "react-icons/fi";
import {
  airConditioningOptions,
  parkingAssistanceOptions,
} from "@/app/(components)/admin/CarForm/constants";

const Features = ({
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

  const handleFeatureChange = (index, value, field = "features") => {
    const newFeatures = [...formData[field]];
    newFeatures[index] = value;
    setFormData({ ...formData, [field]: newFeatures });
  };

  const addFeatureField = (field = "features") => {
    setFormData({ ...formData, [field]: [...formData[field], ""] });
  };

  const removeFeature = (index, field = "features") => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900">Ausstattung</h2>
        <p className="text-gray-600 mt-1">Features und Komfort des Fahrzeugs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Klimatisierung"
          name="airConditioning"
          value={formData.airConditioning}
          onChange={handleChange}
          options={airConditioningOptions}
        />

        <Select
          label="Einparkhilfe"
          name="parkingAssistance"
          value={formData.parkingAssistance}
          onChange={handleChange}
          options={parkingAssistanceOptions}
        />

        <Input
          label="Airbags"
          name="airbags"
          value={formData.airbags}
          onChange={handleChange}
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Standardausstattung
        </h3>
        <div className="space-y-3">
          {formData.features.map((feature, index) => (
            <div key={`feature-${index}`} className="flex gap-3 items-center">
              <Input
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                containerClassName="flex-1"
              />
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addFeatureField("features")}
            className="mt-2 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Ausstattung hinzufügen
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sonderausstattung
        </h3>
        <div className="space-y-3">
          {formData.specialFeatures.map((feature, index) => (
            <div key={`special-${index}`} className="flex gap-3 items-center">
              <Input
                value={feature}
                onChange={(e) =>
                  handleFeatureChange(index, e.target.value, "specialFeatures")
                }
                containerClassName="flex-1"
              />
              <button
                type="button"
                onClick={() => removeFeature(index, "specialFeatures")}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addFeatureField("specialFeatures")}
            className="mt-2 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Sonderausstattung hinzufügen
          </button>
        </div>
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
          Weiter zu Farbe & Design
        </Button>
      </div>
    </div>
  );
};

export default Features;
