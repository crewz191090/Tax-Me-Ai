import { claimableForReceipt } from "./reliefCalc";
import { getReliefCategory } from "./reliefCategories";
import { getSubcategory } from "./expenseCategories";
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
    "Type",
    "Category",
    "Subcategory",
    "Relief category",
    "Claimable (RM)",
    "Payment method",
    "Account",
    "Tags",
    "Recurring",
    "Location",
    "e-Invoice",
    "Notes",
  ];

  const rows = receipts.map((r) => {
    const sub = getSubcategory(r.subcategory);
    const claimable = claimableForReceipt(r);
    const reliefName = r.reliefCategory ? getReliefCategory(r.reliefCategory).nameEn : "";
    return [
      r.date,
      r.merchant,
      r.amount.toFixed(2),
      r.type,
      sub?.category.nameEn ?? "",
      sub?.subcategory.nameEn ?? "",
      reliefName,
      claimable.toFixed(2),
      r.paymentMethod ?? "",
      r.accountName ?? "",
      r.tags ?? "",
      r.isRecurring ? "Yes" : "No",
      r.location ?? "",
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
