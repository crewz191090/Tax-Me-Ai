import { getExpenseCategory } from "./expenseCategories";
import { getReliefCategory } from "./reliefCategories";
import {
  claimableForReceipt,
  groupYearlyDeductibleReceiptsByCategory,
  yearlyDeductibleReceipts,
} from "./reliefCalc";
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

function getFinalY(doc: import("jspdf").jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

/**
 * A submission-ready pack for one assessment year: a summary table of every
 * tax-deductible receipt grouped by relief category, followed by a compact
 * appendix (two receipt photos per page, stacked vertically under their own
 * mini details table) for handing to LHDN if the claim is ever queried.
 */
export async function downloadYearlyTaxSummaryPdf(
  receipts: Receipt[],
  year: number,
  lang: "en" | "bm"
) {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const yearReceipts = yearlyDeductibleReceipts(receipts, year);
  const groups = groupYearlyDeductibleReceiptsByCategory(receipts, year);
  const totalClaimable = yearReceipts.reduce((sum, r) => sum + claimableForReceipt(r), 0);
  const margin = 14;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(16);
  doc.setTextColor(20);
  doc.text("Tax Me AI", margin, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(
    lang === "bm"
      ? `Ringkasan Cukai — Tahun Taksiran ${year}`
      : `Tax Summary — Year of Assessment ${year}`,
    margin,
    26
  );

  const columns = [
    lang === "bm" ? "Tarikh" : "Date",
    lang === "bm" ? "Peniaga" : "Merchant",
    lang === "bm" ? "Jumlah (RM)" : "Amount (RM)",
    lang === "bm" ? "Boleh Dituntut (RM)" : "Claimable (RM)",
    lang === "bm" ? "Resit" : "Receipt",
  ];

  let cursorY = 34;
  for (const group of groups) {
    if (cursorY > pageHeight - 40) {
      doc.addPage();
      cursorY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(lang === "bm" ? group.nameBm : group.nameEn, margin, cursorY);
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [columns],
      body: group.receipts.map((r) => [
        r.date,
        r.merchant,
        r.amount.toFixed(2),
        claimableForReceipt(r).toFixed(2),
        r.imageKey ? (lang === "bm" ? "Ada" : "Attached") : (lang === "bm" ? "Tiada" : "None"),
      ]),
      foot: [
        [
          "",
          "",
          lang === "bm" ? "Jumlah kategori" : "Category total",
          `RM ${group.totalClaimable.toFixed(2)}`,
          "",
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [17, 22, 29] },
      footStyles: { fillColor: [240, 240, 240], textColor: 20, fontStyle: "bold" },
      styles: { fontSize: 8 },
    });

    cursorY = getFinalY(doc) + 10;
  }

  if (cursorY > pageHeight - 20) {
    doc.addPage();
    cursorY = 20;
  }
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.setFont("helvetica", "bold");
  doc.text(
    `${lang === "bm" ? "Jumlah Boleh Dituntut" : "Total Claimable"}: RM ${totalClaimable.toFixed(2)}`,
    margin,
    cursorY
  );
  doc.setFont("helvetica", "normal");

  const withImages = yearReceipts.filter((r) => r.imageKey);
  const images = (
    await Promise.all(
      withImages.map(async (r) => ({ receipt: r, image: await fetchImageAsDataUrl(r.id) }))
    )
  ).filter((entry) => entry.image !== null) as {
    receipt: Receipt;
    image: { dataUrl: string; width: number; height: number };
  }[];

  const slotGap = 10;
  const usableHeight = pageHeight - margin * 2 - slotGap;
  const slotHeight = usableHeight / 2;
  const slotTops = [margin, margin + slotHeight + slotGap];
  const availableWidth = pageWidth - margin * 2;

  images.forEach(({ receipt, image }, index) => {
    if (index % 2 === 0) doc.addPage();
    const slotTop = slotTops[index % 2];
    const relief = receipt.reliefCategory ? getReliefCategory(receipt.reliefCategory) : null;

    autoTable(doc, {
      startY: slotTop,
      margin: { left: margin, right: margin },
      head: [
        [
          lang === "bm" ? "Tarikh" : "Date",
          lang === "bm" ? "Peniaga" : "Merchant",
          lang === "bm" ? "Kategori" : "Category",
          lang === "bm" ? "Jumlah (RM)" : "Amount (RM)",
        ],
      ],
      body: [
        [
          receipt.date,
          receipt.merchant,
          relief ? (lang === "bm" ? relief.nameBm : relief.nameEn) : "",
          receipt.amount.toFixed(2),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [17, 22, 29] },
      styles: { fontSize: 8 },
    });

    const imageTop = getFinalY(doc) + 4;
    const availableHeight = slotTop + slotHeight - imageTop - 2;
    const scale = Math.min(availableWidth / image.width, availableHeight / image.height, 1);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = margin + (availableWidth - drawWidth) / 2;
    doc.addImage(image.dataUrl, x, imageTop, drawWidth, drawHeight);
  });

  const blob = doc.output("blob");
  await saveOrShareFile(blob, `tax-me-ai-tax-summary-${year}.pdf`);
}
