"use client";

export default function LoadingSpinner({ size = "md" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-600 ${sizeClasses[size]}`}
      ></div>
      <p className="mt-3 text-gray-600">Lade Daten...</p>
    </div>
  );
}
