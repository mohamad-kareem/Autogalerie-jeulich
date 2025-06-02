"use client";
import React, { useState } from "react";
import ContactInfo from "./FormSteps/ContactInfo";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting:", formData);

    try {
      const formPayload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formPayload.append(`${key}_${index}`, item);
          });
        } else {
          formPayload.append(key, value);
        }
      });

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
    { component: ContactInfo, title: "Kontakt" },
    { component: BasicInfo, title: "Grundinfo" },
    { component: TechSpecs, title: "Tech. Daten" },
    { component: Features, title: "Ausstattung" },
    { component: Appearance, title: "Design" },
    { component: Description, title: "Bilder" },
  ];

  const CurrentStepComponent = steps[step - 1].component;

  return (
    <div className="w-full max-w-[95vw] mx-auto px-2 sm:px-4">
      <div className="overflow-hidden">
        {/* Progress bar - simplified for mobile */}
        <div className="px-2 sm:px-4 pb-2 border-b border-gray-200">
          <div className="relative overflow-x-auto scrollbar-hide">
            <div className="flex space-x-6 sm:justify-between relative min-w-max px-2">
              {steps.map(({ title }, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center z-10 flex-shrink-0"
                  style={{ minWidth: "40px" }}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors text-sm sm:text-base ${
                      step >= index + 1
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center font-medium ${
                      step >= index + 1 ? "text-red-600" : "text-gray-500"
                    }`}
                  >
                    {title}
                  </span>
                </div>
              ))}

              {/* Progress bar background line */}
              <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 sm:h-1.5 bg-gray-200 -z-1">
                <div
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{
                    width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="px-2 sm:px-4 py-4 sm:py-6">
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
