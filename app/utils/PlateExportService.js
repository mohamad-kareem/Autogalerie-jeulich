import * as XLSX from "xlsx";

export const exportPlateReport = (data, fileName) => {
  if (!data || data.length === 0) {
    alert("Keine Daten zum Exportieren vorhanden!");
    return;
  }

  const formattedData = data.map((entry) => ({
    Datum: new Date(entry.date).toLocaleDateString("de-DE"),
    Kennzeichen: entry.plateNumber,
    "Fahrzeug-Ident-Nr.": entry.vinNumber || "-", // ✅ VIN added
    Mitarbeiter: entry.account,
    Zielort: entry.destination,
    Startzeit: new Date(entry.date).toLocaleTimeString("de-DE"),
    Endzeit: entry.endTime
      ? new Date(entry.endTime).toLocaleTimeString("de-DE")
      : "Aktiv",
    "Dauer (h)": entry.durationHours || "-",
    Standort: entry.from || "-",
    Fahrzeugtyp: entry.carType || "-",
    Notizen: entry.notes || "-",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  XLSX.utils.book_append_sheet(wb, ws, "Kennzeichen-Bericht");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
