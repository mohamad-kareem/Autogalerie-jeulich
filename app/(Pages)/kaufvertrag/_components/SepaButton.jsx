"use client";

import { Landmark } from "lucide-react";
import { SEPA_FORM, sepaDefaults } from "@/lib/sepaMandate";
import PrintableFormButton from "./PrintableFormButton";

export default function SepaButton({ buyer, plate }) {
  return (
    <PrintableFormButton
      form={SEPA_FORM}
      defaults={sepaDefaults(buyer, plate)}
      icon={Landmark}
    />
  );
}
