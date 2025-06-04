"use client";
import React from "react";
import Input from "@/app/(components)/CarForm/FormElements/Input";
import Button from "@/app/(components)/helpers/Button";
import { toast } from "react-hot-toast";

const ContactInfo = ({
  formData,
  setFormData,
  nextStep,
  errors,
  isSubmitting,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    const { fullName, email, phone } = formData;

    if (!fullName || !email || !phone) {
      toast.error("Bitte füllen Sie alle Kontaktfelder aus.");
      return;
    }

    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header Card with contained content */}
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-sm sm:text-2xl font-bold text-gray-900">
            Kontaktinformationen
          </h2>
          <p className="text-gray-600 mt-2 text-sm ">
            Persönliche Daten zur Kontaktaufnahme bei Interesse oder Rückfragen
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          required
        />

        <Input
          label="E-Mail"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <Input
          label="Telefonnummer"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          onClick={handleNext}
          icon="FiCheck"
          className="w-full md:w-auto"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Weiter
        </Button>
      </div>
    </div>
  );
};

export default ContactInfo;
