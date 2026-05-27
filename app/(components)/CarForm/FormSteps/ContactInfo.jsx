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

    setFormData({
      ...formData,
      [name]: value,
    });
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
    <div className="space-y-5 sm:space-y-7">
      {/* HEADER */}
      <div className="rounded-3xl border border-black/[0.06] bg-[#eef6f0] p-4 shadow-sm sm:p-6">
        <div className="mb-3 h-[2px] w-10 bg-[#146c2e]" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#146c2e] sm:text-[11px]">
          Kontakt
        </p>

        <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-[#07111f] sm:text-3xl">
          Kontaktinformationen
        </h2>

        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#5f695f] sm:text-[14px]">
          Ihre Kontaktdaten, damit wir Sie bei Interesse oder Rückfragen schnell
          erreichen können.
        </p>
      </div>

      {/* FORM */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
          <Input
            label="Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            requislate
          />

          <Input
            label="E-Mail"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            requislate
          />

          <Input
            label="Telefonnummer"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            requislate
          />
        </div>
      </div>

      {/* ACTION */}
      <div className="flex justify-start border-t border-black/[0.08] pt-5 sm:pt-7">
        <Button
          onClick={handleNext}
          icon="FiCheck"
          className="w-full sm:w-auto"
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
