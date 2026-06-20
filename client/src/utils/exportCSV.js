export const exportToCSV = (filename, headers, rows) => {
    // Build CSV header row
    const headerRow = headers.map((h) => `"${h.label}"`).join(",");
  
    // Build CSV data rows
    const dataRows = rows.map((row) =>
      headers
        .map((h) => {
          const value = h.key.split(".").reduce((obj, key) => obj?.[key], row);
          const cell = value === null || value === undefined ? "" : String(value);
          // Escape double quotes and wrap in quotes
          return `"${cell.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
  
    const csvContent = [headerRow, ...dataRows].join("\n");
  
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };