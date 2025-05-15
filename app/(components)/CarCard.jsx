"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  FaGasPump,
  FaTachometerAlt,
  FaCar,
  FaCalendarAlt,
  FaTrash,
} from "react-icons/fa";
import { FiLayers } from "react-icons/fi";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const CarCard = ({ car, viewMode = "grid", onCompareToggle, isComparing }) => {
  const { data: session } = useSession();
  const router = useRouter();

  // Local active state for immediate toggle
  const [isActive, setIsActive] = useState(car.active);

  const handleToggleActive = async () => {
    const newActive = !isActive;
    // Optimistically update UI
    setIsActive(newActive);
    try {
      await fetch(`/api/cars/${car.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      // Optionally refresh if needed: router.refresh();
    } catch (error) {
      // Revert on error
      setIsActive(!newActive);
      console.error("Failed to update car status:", error);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(`Möchtest du das Fahrzeug "${car.name}" wirklich löschen?`)
    ) {
      await fetch(`/api/cars/${car.id}`, { method: "DELETE" });
      router.refresh();
    }
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-all
        ${viewMode === "list" ? "flex flex-col sm:flex-row" : ""}
        ${isComparing ? "ring-2 ring-red-500" : ""}
        overflow-hidden border border-gray-200
      `}
    >
      {/* Image */}
      <div
        className={`
          relative
          ${
            viewMode === "list"
              ? "sm:w-64 w-full h-48 sm:h-auto sm:min-h-[180px]"
              : "w-full h-48"
          }
          flex-none
        `}
      >
        <Image
          src={car.image}
          alt={`${car.name} - ${car.subtitle}`}
          fill
          className="object-contain p-2"
          style={{
            objectPosition: "center center",
            aspectRatio: viewMode === "list" ? "16/9" : "unset",
          }}
          sizes={
            viewMode === "list"
              ? "(max-width: 640px) 100vw, 256px"
              : "(max-width: 768px) 100vw, 33vw"
          }
          priority
          quality={90}
        />
        {car.highlight && (
          <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
            {car.highlight}
          </div>
        )}
      </div>

      {/* Details */}
      <div
        className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col" : ""}`}
      >
        {/* Header */}
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{car.name}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {car.subtitle}
              </p>
            </div>
            <span className="bg-green-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-2">
              {car.price}
            </span>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center text-gray-700">
            <FaTachometerAlt className="mr-2 text-gray-400 w-4 flex-none" />
            <span>{car.kilometers} km</span>
          </div>
          <div className="flex items-center text-gray-700">
            <FaCalendarAlt className="mr-2 text-gray-400 w-4 flex-none" />
            <span>EZ {car.registration}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <FaGasPump className="mr-2 text-gray-400 w-4 flex-none" />
            <span>{car.fuel}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <FaCar className="mr-2 text-gray-400 w-4 flex-none" />
            <span>
              {car.power} kW ({car.hp} PS)
            </span>
          </div>
        </div>

        {/* Features */}
        {car.features?.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {car.features.slice(0, 3).map((feature, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-50 text-red-800 text-xs rounded-full line-clamp-1"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {session?.user?.isAdmin && (
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={handleToggleActive}
              className={`px-3 py-1 rounded-lg font-medium transition-colors focus:outline-none
                ${
                  isActive
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                }`}
            >
              {isActive ? "Aktiv" : "Inaktiv"}
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-600 flex items-center gap-1"
            >
              <FaTrash /> Löschen
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className={`mt-auto ${viewMode === "list" ? "flex justify-end" : ""}`}
        >
          <div
            className={`flex gap-2 ${viewMode === "list" ? "w-1/2" : "w-full"}`}
          >
            <Link
              href={`/gebrauchtwagen/${car.id}`}
              className={`${
                viewMode === "list" ? "py-1.5 px-3 text-sm" : "py-2 px-4"
              } bg-black hover:bg-gradient-to-br from-red-600 to-black text-white rounded-lg font-medium transition-colors flex-1 text-center`}
            >
              Details anzeigen
            </Link>
            <button
              onClick={() => onCompareToggle(car.id)}
              className={`${
                viewMode === "list" ? "p-1.5" : "p-2"
              } border rounded-lg transition-colors flex items-center justify-center 
                ${
                  isComparing
                    ? "bg-blue-100 border-blue-200 text-red-600 hover:bg-gradient-to-br from-red-600 to-black"
                    : "border-gray-400 hover:bg-gray-50 hover:bg-gradient-to-br from-red-600 to-black/10"
                }`}
              aria-label="Fahrzeug vergleichen"
            >
              <FiLayers
                className={`${viewMode === "list" ? "w-4.5 h-4.5" : "w-4 h-4"}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
