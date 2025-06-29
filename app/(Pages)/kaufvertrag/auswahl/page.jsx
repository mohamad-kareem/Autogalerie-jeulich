"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function KaufvertragAuswahlPage() {
  const [selected, setSelected] = useState("");
  const router = useRouter();

  const handleContinue = () => {
    if (!selected) return alert("Bitte eine Option wählen");
    router.push(`/kaufvertrag/form?issuer=${selected}`);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Wähle den Vertragstyp</h1>
      <div className="space-y-2">
        <label className="block">
          <input
            type="radio"
            name="issuer"
            value="karim"
            onChange={(e) => setSelected(e.target.value)}
            className="mr-2"
          />
          Hussein Karim
        </label>
        <label className="block">
          <input
            type="radio"
            name="issuer"
            value="alawie"
            onChange={(e) => setSelected(e.target.value)}
            className="mr-2"
          />
          Jibrail Alawie
        </label>
      </div>
      <button
        onClick={handleContinue}
        className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Weiter
      </button>
    </div>
  );
}
