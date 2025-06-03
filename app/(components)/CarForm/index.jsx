// AdminCarForm.jsx
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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = "Name ist erforderlich";
      if (!formData.email) newErrors.email = "E-Mail ist erforderlich";
      if (!formData.phone) newErrors.phone = "Telefonnummer ist erforderlich";
    }

    if (step === 2) {
      if (!formData.make) newErrors.make = "Hersteller ist erforderlich";
      if (!formData.vin) newErrors.vin = "Vin ist erforderlich";
      if (!formData.model) newErrors.model = "Modell ist erforderlich";
      if (!formData.price) newErrors.price = "Preis ist erforderlich";
      if (!formData.registration)
        newErrors.registration = "Erstzulassung ist erforderlich";
      if (!formData.kilometers)
        newErrors.kilometers = "Kilometerstand ist erforderlich";
      if (!formData.hp) newErrors.hp = "Leistung ist erforderlich";
      if (!formData.fuel) newErrors.fuel = "Kraftstoffart ist erforderlich";
      if (!formData.condition) newErrors.condition = "Zustand ist erforderlich";
      if (!formData.status) newErrors.status = "Status ist erforderlich";
      if (!formData.category) newErrors.category = "Kategorie ist erforderlich";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(step)) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Fahrzeug wird gesendet...");

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
        toast.success("Fahrzeug erfolgreich hinzugefügt!", { id: toastId });
        setFormData(formInitialData);
        setImages([]);
        setPreviews([]);
        setStep(1);
        setErrors({});
      } else {
        throw new Error(result.error || "Fehler beim Hinzufügen");
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
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
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Enhanced Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 transform -translate-y-1/2">
            <div
              className="h-full bg-red-600 transition-all duration-500 ease-in-out"
              style={{
                width: `${((step - 1) / (steps.length - 1)) * 100}%`,
              }}
            ></div>
          </div>

          {/* Steps */}
          {steps.map(({ title }, index) => (
            <div key={index} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  step > index + 1
                    ? "bg-green-500 text-white"
                    : step === index + 1
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > index + 1 ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  step >= index + 1 ? "text-gray-800" : "text-gray-500"
                }`}
              >
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form content */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6"
      >
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
          errors={errors}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
};

export default AdminCarForm;
