"use client";

import React from "react";
import Input from "@/app/(components)/CarForm/FormElements/Input";
import Button from "@/app/(components)/helpers/Button";
import { toast } from "react-hot-toast";

const ContactInfo = ({ formData, setFormData, prevStep, nextStep }) => {
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

    nextStep(); // ✅ Proceed if all filled
  };

  return (
    <div className="space-y-6 sm:space-y-4">
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          Kontaktinformationen
        </h2>
        <p className="text-gray-600 mt-2">
          Persönliche Daten zur Kontaktaufnahme bei Interesse oder Rückfragen
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-4">
        <Input
          label="Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <Input
          label="E-Mail"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <Input
          label="Telefonnummer"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 pt-4 border-t border-gray-200">
        <Button
          onClick={handleNext}
          icon="FiCheck"
          className="text-sm sm:text-xs"
        >
          Fahrzeug speichern
        </Button>
      </div>
    </div>
  );
};

export default ContactInfo;
