import { getExpenseCategory } from "./expenseCategories";
import { getReliefCategory } from "./reliefCategories";
import { claimableForReceipt, yearlyDeductibleReceipts } from "./reliefCalc";
import { saveOrShareFile } from "./nativeExport";
import type { Receipt } from "./types";

export async function downloadMonthlyExpensePdf(
  receipts: Receipt[],
  year: number,
  month: number,
  monthLabel: string,
  lang: "en" | "bm"
) {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const monthReceipts = receipts.filter((r) => {
    if (r.type !== "expense") return false;
    const y = Number(r.date.slice(0, 4));
    const m = Number(r.date.slice(5, 7));
    return y === year && m === month;
  });

  const total = monthReceipts.reduce((sum, r) => sum + r.amount, 0);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Tax Me AI", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(
    lang === "bm" ? `Perbelanjaan — ${monthLabel} ${year}` : `Expenses — ${monthLabel} ${year}`,
    14,
    26
  );

  autoTable(doc, {
    startY: 32,
    head: [
      [
        lang === "bm" ? "Tarikh" : "Date",
        lang === "bm" ? "Peniaga" : "Merchant",
        lang === "bm" ? "Kategori" : "Category",
        lang === "bm" ? "Jumlah (RM)" : "Amount (RM)",
      ],
    ],
    body: monthReceipts.map((r) => {
      const category = getExpenseCategory(r.mainCategory);
      return [
        r.date,
        r.merchant,
        lang === "bm" ? category.nameBm : category.nameEn,
        r.amount.toFixed(2),
      ];
    }),
    foot: [["", "", lang === "bm" ? "Jumlah" : "Total", `RM ${total.toFixed(2)}`]],
    theme: "grid",
    headStyles: { fillColor: [17, 22, 29] },
    footStyles: { fillColor: [17, 22, 29], fontStyle: "bold" },
  });

  const monthStr = String(month).padStart(2, "0");
  const blob = doc.output("blob");
  await saveOrShareFile(blob, `tax-me-ai-expenses-${year}-${monthStr}.pdf`);
}

async function fetchImageAsDataUrl(
  receiptId: string
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(`/api/receipts/${receiptId}/image`);
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const dims: { width: number; height: number } = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("Could not read image dimensions."));
      img.src = dataUrl;
    });
    return { dataUrl, ...dims };
  } catch {
    // A missing or unreadable receipt image should not block the export —
    // the row still appears in the summary table either way.
    return null;
  }
}

/**
 * A submission-ready pack for one assessment year: a summary table of every
 * tax-deductible receipt, followed by one appendix page per receipt photo
 * (for handing to LHDN if the claim is ever queried).
 */
export async function downloadYearlyTaxSummaryPdf(
  receipts: Receipt[],
  year: number,
  lang: "en" | "bm"
) {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const yearReceipts = yearlyDeductibleReceipts(receipts, year);
  const totalClaimable = yearReceipts.reduce((sum, r) => sum + claimableForReceipt(r), 0);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Tax Me AI", 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(
    lang === "bm"
      ? `Ringkasan Cukai — Tahun Taksiran ${year}`
      : `Tax Summary — Year of Assessment ${year}`,
    14,
    26
  );

  autoTable(doc, {
    startY: 32,
    head: [
      [
        lang === "bm" ? "Tarikh" : "Date",
        lang === "bm" ? "Peniaga" : "Merchant",
        lang === "bm" ? "Kategori Pelepasan" : "Relief Category",
        lang === "bm" ? "Jumlah (RM)" : "Amount (RM)",
        lang === "bm" ? "Boleh Dituntut (RM)" : "Claimable (RM)",
        lang === "bm" ? "Resit" : "Receipt",
      ],
    ],
    body: yearReceipts.map((r) => {
      const relief = r.reliefCategory ? getReliefCategory(r.reliefCategory) : null;
      return [
        r.date,
        r.merchant,
        relief ? (lang === "bm" ? relief.nameBm : relief.nameEn) : "",
        r.amount.toFixed(2),
        claimableForReceipt(r).toFixed(2),
        r.imageKey ? (lang === "bm" ? "Ada" : "Attached") : (lang === "bm" ? "Tiada" : "None"),
      ];
    }),
    foot: [
      [
        "",
        "",
        "",
        "",
        lang === "bm" ? "Jumlah Boleh Dituntut" : "Total Claimable",
        `RM ${totalClaimable.toFixed(2)}`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [17, 22, 29] },
    footStyles: { fillColor: [17, 22, 29], fontStyle: "bold" },
    styles: { fontSize: 8 },
  });

  const withImages = yearReceipts.filter((r) => r.imageKey);
  const images = await Promise.all(
    withImages.map(async (r) => ({ receipt: r, image: await fetchImageAsDataUrl(r.id) }))
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - 60;

  for (const { receipt, image } of images) {
    if (!image) continue;
    doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text(receipt.merchant, margin, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const relief = receipt.reliefCategory ? getReliefCategory(receipt.reliefCategory) : null;
    doc.text(
      `${receipt.date}  ·  RM ${receipt.amount.toFixed(2)}${
        relief ? `  ·  ${lang === "bm" ? relief.nameBm : relief.nameEn}` : ""
      }`,
      margin,
      27
    );

    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    doc.addImage(image.dataUrl, margin, 34, drawWidth, drawHeight);
  }

  const blob = doc.output("blob");
  await saveOrShareFile(blob, `tax-me-ai-tax-summary-${year}.pdf`);
}
