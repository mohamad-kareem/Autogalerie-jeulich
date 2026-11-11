"use client";

import { VOLLMACHT_FORM, vollmachtDefaults } from "@/lib/zulassungsvollmacht";
import PrintableFormButton from "./PrintableFormButton";

export default function VollmachtButton({ buyer, vehicle }) {
  return <PrintableFormButton form={VOLLMACHT_FORM} defaults={vollmachtDefaults(buyer, vehicle)} />;
}
