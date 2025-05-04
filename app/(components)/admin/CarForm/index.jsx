"use client";
import React, { useState } from "react";
import BasicInfo from "./FormSteps/BasicInfo";
import TechSpecs from "./FormSteps/TechSpecs";
import Features from "./FormSteps/Features";
import Appearance from "./FormSteps/Appearance";
import Description from "./FormSteps/Description";
import { formInitialData } from "./constants";
import { toast } from "react-hot-toast";
const AdminCarForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(formInitialData);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Update the handleSubmit function in AdminCarForm component
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting:", formData);

    try {
      const formPayload = new FormData();

      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formPayload.append(`${key}_${index}`, item);
          });
        } else {
          formPayload.append(key, value);
        }
      });

      // Append images
      images.forEach((image) => {
        formPayload.append("images", image);
      });

      const response = await fetch("/api/cars/add", {
        method: "POST",
        body: formPayload,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Fahrzeug erfolgreich hinzugefügt!");
        // Reset form or redirect
        setFormData(formInitialData);
        setImages([]);
        setPreviews([]);
        setStep(1);
      } else {
        throw new Error(result.error || "Failed to add car");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Fehler beim Hinzufügen: ${error.message}`);
    }
  };

  const steps = [
    { component: BasicInfo, title: "Grundinformationen" },
    { component: TechSpecs, title: "Technische Daten" },
    { component: Features, title: "Ausstattung" },
    { component: Appearance, title: "Farbe & Design" },
    { component: Description, title: "Beschreibung & Bilder" },
  ];

  const CurrentStepComponent = steps[step - 1].component;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-700 px-8 py-2">
          <h1 className="text-3xl font-bold text-white">Fahrzeug hinzufügen</h1>
          <p className="text-red-100 mt-1">
            Erstellen Sie einen neuen Fahrzeugeintrag
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-8 pt-6 pb-2 border-b border-gray-200">
          <div className="flex justify-between relative">
            {steps.map(({ title }, index) => (
              <div key={index} className="flex flex-col items-center z-10">
                <button
                  type="button"
                  onClick={() => setStep(index + 1)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= index + 1
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </button>
                <span
                  className={`text-xs mt-2 text-center font-medium ${
                    step >= index + 1 ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
            <div className="absolute top-5 left-0 right-0 h-1.5 bg-gray-200 -z-1">
              <div
                className="h-full bg-red-600 transition-all duration-500"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          <CurrentStepComponent
            formData={formData}
            setFormData={setFormData}
            images={images}
            setImages={setImages}
            previews={previews}
            setPreviews={setPreviews}
            nextStep={nextStep}
            prevStep={prevStep}
            currentStep={step}
            totalSteps={steps.length}
          />
        </form>
      </div>
    </div>
  );
};

export default AdminCarForm;
