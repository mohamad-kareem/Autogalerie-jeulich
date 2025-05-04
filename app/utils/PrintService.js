// utils/PrintService.js
export const printEntries = (entries, filterMonth, filterYear, totals) => {
  const printWindow = window.open("", "", "width=800,height=600");

  printWindow.document.write(`
      <html>
        <head>
          <title>Kassenbuch Bericht</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #dc2626; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
          </style>
        </head>
        <body>
          <h1>Kassenbuch Bericht</h1>
          <p>Zeitraum: ${new Date(
            filterYear,
            filterMonth - 1,
            1
          ).toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric",
          })}</p>
          <table>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Beschreibung</th>
                <th>Fahrzeug</th>
                <th>Einnahmen</th>
                <th>Ausgaben</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${entries
                .map(
                  (entry) => `
                <tr>
                  <td>${new Date(entry.date).toLocaleDateString("de-DE")}</td>
                  <td>${entry.description}</td>
                  <td>${entry.carName || "-"}</td>
                  <td class="${entry.income ? "positive" : ""}">${
                    entry.income
                      ? `€${parseFloat(entry.income).toFixed(2)}`
                      : "-"
                  }</td>
                  <td class="${entry.expense ? "negative" : ""}">${
                    entry.expense
                      ? `€${parseFloat(entry.expense).toFixed(2)}`
                      : "-"
                  }</td>
                  <td>€${parseFloat(entry.balance).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3"><strong>Gesamt</strong></td>
                <td class="positive"><strong>€${totals.totalIncome.toFixed(
                  2
                )}</strong></td>
                <td class="negative"><strong>€${totals.totalExpense.toFixed(
                  2
                )}</strong></td>
                <td><strong>€${totals.currentBalance.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
