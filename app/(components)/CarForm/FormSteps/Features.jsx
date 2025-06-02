import React from "react";
import Button from "@/app/(components)/helpers/Button";
import Input from "@/app/(components)/CarForm/FormElements/Input";
import Select from "@/app/(components)/CarForm/FormElements/Select";

import { FiPlus, FiX } from "react-icons/fi";
import {
  airConditioningOptions,
  parkingAssistanceOptions,
} from "@/app/(components)/CarForm/constants";

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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-4 sm:p-6 rounded-xl">
        <h2 className="text-md sm:text-2xl font-bold text-gray-900">
          Ausstattung
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Features und Komfort des Fahrzeugs
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
        <Select
          label="Klimatisierung"
          name="airConditioning"
          value={formData.airConditioning}
          onChange={handleChange}
          options={airConditioningOptions}
          inputSize="small"
        />

        <Select
          label="Einparkhilfe"
          name="parkingAssistance"
          value={formData.parkingAssistance}
          onChange={handleChange}
          options={parkingAssistanceOptions}
          inputSize="small"
        />

        <Input
          label="Airbags"
          name="airbags"
          value={formData.airbags}
          onChange={handleChange}
          inputSize="small"
        />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Standardausstattung
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {formData.features.map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="flex gap-2 sm:gap-3 items-center"
            >
              <Input
                value={feature}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                containerClassName="flex-1"
                inputSize="small"
              />
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addFeatureField("features")}
            className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
          >
            <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            Ausstattung hinzufügen
          </button>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Sonderausstattung
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {formData.specialFeatures.map((feature, index) => (
            <div
              key={`special-${index}`}
              className="flex gap-2 sm:gap-3 items-center"
            >
              <Input
                value={feature}
                onChange={(e) =>
                  handleFeatureChange(index, e.target.value, "specialFeatures")
                }
                containerClassName="flex-1"
                inputSize="small"
              />
              <button
                type="button"
                onClick={() => removeFeature(index, "specialFeatures")}
                className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addFeatureField("specialFeatures")}
            className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium"
          >
            <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            Sonderausstattung hinzufügen
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200">
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
          <span className="hidden sm:inline">Weiter zu Farbe & Design</span>
          <span className="sm:hidden">Weiter</span>
        </Button>
      </div>
    </div>
  );
};

export default Features;
