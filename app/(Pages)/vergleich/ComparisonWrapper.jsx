"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the actual page logic
const ComparisonPage = dynamic(() => import("./ComparisonPage"), {
  ssr: false,
});

export default function ComparisonWrapper({ ids }) {
  return <ComparisonPage idsFromUrl={ids} />;
}
