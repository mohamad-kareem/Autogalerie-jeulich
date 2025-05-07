"use client";
import { useState, useRef } from "react";
import { FiPrinter, FiDownload } from "react-icons/fi";
import KVPrivatForm from "@/app/(components)/admin/Kauftrags/KVPrivatForm";
import KaufvertragForm from "@/app/(components)/admin/Kauftrags/KaufvertragForm";

const forms = [
  { name: "Kfz-Kaufvertrag (TÜV Süd)", component: KaufvertragForm },
  { name: "Kfz-Kaufvertrag (ADAC)", component: KVPrivatForm },
];

export default function FormsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const formRef = useRef(null);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    if (formRef.current) {
      html2pdf(formRef.current, {
        margin: 0.2,
        filename: "Kfz-Kaufvertrag.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      });
    }
  };

  const ActiveForm = forms[activeTab].component;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto bg-white shadow rounded-lg p-6 print:shadow-none">
        <h1 className="text-2xl font-bold mb-6">Vertragsformulare ausfüllen</h1>
        <div className="flex border-b mb-4">
          {forms.map((f, i) => (
            <button
              key={f.name}
              onClick={() => setActiveTab(i)}
              className={`py-2 px-4 -mb-px font-medium ${
                activeTab === i
                  ? "border-b-2 border-red-600 text-red-600"
                  : "text-gray-600 hover:text-red-500"
              } print:hidden`}
            >
              {f.name}
            </button>
          ))}
        </div>

        <div ref={formRef} className="print:bg-white">
          <ActiveForm />
        </div>

        <div className="flex justify-end gap-3 mt-4 print:hidden">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            <FiDownload /> Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FiPrinter /> Drucken
          </button>
        </div>
      </div>
    </div>
  );
}
