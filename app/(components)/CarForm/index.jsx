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
    <div className="w-full max-w-4xl mx-auto px-0 sm:px-4 md:px-4 lg:px-6 xl:px-8 py-2 ">
      {/* Enhanced Responsive Step Indicator */}
      <div className="mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <div className="relative min-w-[550px] sm:min-w-0">
          {/* Progress line */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full -z-10 transform -translate-y-1/2">
            <div
              className="h-full bg-gradient-to-r from-slate-600 to-slate-500 rounded-full transition-all duration-500 ease-in-out"
              style={{
                width: `${((step - 1) / (steps.length - 1)) * 100}%`,
              }}
            ></div>
          </div>

          {/* Steps */}
          <div className="flex justify-between relative">
            {steps.map(({ title }, index) => (
              <div
                key={index}
                className="flex flex-col items-center px-1"
                style={{ width: `${100 / steps.length}%` }}
                onClick={() => step > index + 1 && setStep(index + 1)}
              >
                <button
                  type="button"
                  className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step > index + 1
                      ? "bg-green-500 text-white shadow-md hover:bg-green-600"
                      : step === index + 1
                      ? "bg-gradient-to-br from-slate-600 to-slate-500 text-white shadow-lg"
                      : "bg-white border-2 border-gray-300 text-gray-500 hover:border-gray-400"
                  } ${step > index + 1 ? "cursor-pointer" : "cursor-default"}`}
                >
                  {step > index + 1 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
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
                </button>
                <span
                  className={`text-[11px] sm:text-xs mt-1 sm:mt-2 text-center font-medium whitespace-nowrap ${
                    step >= index + 1 ? "text-gray-800" : "text-gray-500"
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form content */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg md:rounded-xl shadow-md p-4 sm:p-5 md:p-8 border border-gray-100"
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
