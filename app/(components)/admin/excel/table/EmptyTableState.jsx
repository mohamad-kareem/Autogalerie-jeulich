// components/EmptyTableState.jsx
"use client";

import React from "react";

const EmptyTableState = ({ isFormExpanded }) => (
  <tr>
    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
      Keine Einträge gefunden.{" "}
      {!isFormExpanded && (
        <>Klicken Sie auf "Neuer Eintrag" um einen hinzuzufügen.</>
      )}
    </td>
  </tr>
);

export default EmptyTableState;
