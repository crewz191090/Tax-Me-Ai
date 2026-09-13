import type { Receipt } from "./types";

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function receiptsToCsv(receipts: Receipt[]): string {
  const headers = [
    "Date",
    "Merchant",
    "Amount (RM)",
    "Category",
    "Deductible %",
    "Claimable (RM)",
    "e-Invoice",
    "Notes",
  ];

  const rows = receipts.map((r) => {
    const claimable = (r.amount * r.deductiblePercent) / 100;
    return [
      r.date,
      r.merchant,
      r.amount.toFixed(2),
      r.category,
      `${r.deductiblePercent}%`,
      claimable.toFixed(2),
      r.isEInvoice ? "Yes" : "No",
      r.notes ?? "",
    ]
      .map(escapeCsvField)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(receipts: Receipt[], filename = "tax-me-ai-receipts.csv") {
  const csv = receiptsToCsv(receipts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
