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
  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className="mx-auto w-full max-w-4xl px-0 py-2 sm:px-3 lg:px-4">
      {/* STEP INDICATOR */}
      <div className="mb-4 overflow-x-auto pb-2 sm:mb-6">
        <div className="relative min-w-[520px] sm:min-w-0">
          <div className="absolute left-0 right-0 top-[18px] h-1 rounded-full bg-black/[0.08]">
            <div
              className="h-full rounded-full bg-[#146c2e] transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="relative flex justify-between">
            {steps.map(({ title }, index) => {
              const stepNumber = index + 1;
              const isDone = step > stepNumber;
              const isActive = step === stepNumber;
              const isClickable = step > stepNumber;

              return (
                <div
                  key={title}
                  className="flex flex-col items-center px-1"
                  style={{ width: `${100 / steps.length}%` }}
                >
                  <button
                    type="button"
                    onClick={() => isClickable && setStep(stepNumber)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-all sm:h-10 sm:w-10 ${
                      isDone
                        ? "bg-[#146c2e] text-white shadow-md shadow-green-900/15 hover:bg-[#0f5724]"
                        : isActive
                          ? "bg-[#101510] text-white shadow-md"
                          : "border border-black/[0.12] bg-white text-[#6b756b]"
                    } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {isDone ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                      stepNumber
                    )}
                  </button>

                  <span
                    className={`mt-1.5 max-w-[80px] truncate text-center text-[10px] font-semibold sm:mt-2 sm:text-[11px] ${
                      step >= stepNumber ? "text-[#101510]" : "text-[#8b958b]"
                    }`}
                  >
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FORM CONTENT */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_10px_35px_-24px_rgba(7,17,31,0.18)] sm:rounded-3xl sm:p-5 md:p-7"
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
