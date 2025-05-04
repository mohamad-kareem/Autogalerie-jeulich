// utils/ExportService.js
import * as XLSX from "xlsx";

export const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    alert("Keine Daten zum Exportieren vorhanden!");
    return;
  }

  const formattedData = data.map((entry) => ({
    Datum: new Date(entry.date).toLocaleDateString("de-DE"),
    Einnahmen: entry.income ? `€${parseFloat(entry.income).toFixed(2)}` : "-",
    Ausgaben: entry.expense ? `€${parseFloat(entry.expense).toFixed(2)}` : "-",
    Saldo: `€${parseFloat(entry.balance).toFixed(2)}`,
    Beschreibung: entry.description,
    Konto: entry.account || "-",
    Belegnummer: entry.documentNumber || "-",
    Fahrzeug: entry.carName || "-",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  XLSX.utils.book_append_sheet(wb, ws, "Kassenbuch");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
