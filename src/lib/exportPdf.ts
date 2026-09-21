import { getExpenseCategory } from "./expenseCategories";
import { claimableForReceipt, groupYearlyDeductibleReceiptsByCategory } from "./reliefCalc";
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

interface LandscapeImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Fetches a receipt photo and re-renders it through a canvas, always
 * landscape. Two problems get fixed by this round-trip: (1) jsPDF's
 * addImage() reads raw JPEG bytes and ignores EXIF orientation, while the
 * browser's own <img> decoder applies it — re-drawing through a canvas
 * bakes in the same orientation the phone already displays, so the photo
 * doesn't come out sideways or squashed; (2) most phone receipt photos are
 * portrait, which we rotate 90° so every receipt sits wide in the PDF.
 */
async function fetchReceiptImageLandscape(receiptId: string): Promise<LandscapeImage | null> {
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

    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not decode receipt image."));
      el.src = dataUrl;
    });

    const { naturalWidth: w, naturalHeight: h } = img;
    const rotate = h > w;
    const canvas = document.createElement("canvas");
    canvas.width = rotate ? h : w;
    canvas.height = rotate ? w : h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (rotate) {
      ctx.translate(canvas.width, 0);
      ctx.rotate(Math.PI / 2);
    }
    ctx.drawImage(img, 0, 0, w, h);

    return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height };
  } catch {
    // A missing or unreadable receipt image should not block the export —
    // the transaction still appears in the pack, just without a photo.
    return null;
  }
}

function getFinalY(doc: import("jspdf").jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

const MAX_PER_PAGE = 2;

/**
 * A submission-ready pack for one assessment year, laid out for LHDN:
 * page 1 is an overview of every relief category and its claimable total,
 * then each category gets its own page(s) — a table row per transaction
 * with that transaction's receipt photo (landscape) right underneath,
 * capped at two transactions per page so nothing gets squeezed.
 */
export async function downloadYearlyTaxSummaryPdf(
  receipts: Receipt[],
  year: number,
  lang: "en" | "bm"
) {
  const { default: jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");

  const groups = groupYearlyDeductibleReceiptsByCategory(receipts, year);
  const totalClaimable = groups.reduce((sum, g) => sum + g.totalClaimable, 0);
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

  autoTable(doc, {
    startY: 32,
    margin: { left: margin, right: margin },
    head: [
      [
        lang === "bm" ? "Kategori Pelepasan" : "Relief Category",
        lang === "bm" ? "Bilangan Resit" : "Receipts",
        lang === "bm" ? "Boleh Dituntut (RM)" : "Claimable (RM)",
      ],
    ],
    body: groups.map((g) => [
      lang === "bm" ? g.nameBm : g.nameEn,
      String(g.receipts.length),
      g.totalClaimable.toFixed(2),
    ]),
    foot: [
      [
        lang === "bm" ? "Jumlah Boleh Dituntut" : "Total Claimable",
        "",
        `RM ${totalClaimable.toFixed(2)}`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [17, 22, 29] },
    footStyles: { fillColor: [17, 22, 29], fontStyle: "bold" },
  });

  const availableWidth = pageWidth - margin * 2;

  for (const group of groups) {
    const images = await Promise.all(
      group.receipts.map((r) => (r.imageKey ? fetchReceiptImageLandscape(r.id) : Promise.resolve(null)))
    );

    for (let i = 0; i < group.receipts.length; i += MAX_PER_PAGE) {
      doc.addPage();
      doc.setFontSize(12);
      doc.setTextColor(20);
      doc.text(lang === "bm" ? group.nameBm : group.nameEn, margin, 18);

      const pageEntries = group.receipts.slice(i, i + MAX_PER_PAGE);
      const contentTop = 24;
      const slotGap = 10;
      const usableHeight = pageHeight - contentTop - margin - slotGap;
      const slotHeight = usableHeight / pageEntries.length;
      const slotTops = pageEntries.map((_, slot) => contentTop + slot * (slotHeight + slotGap));

      pageEntries.forEach((receipt, slot) => {
        const slotTop = slotTops[slot];
        const slotBottom = slotTop + slotHeight;
        const image = images[i + slot];

        autoTable(doc, {
          startY: slotTop,
          margin: { left: margin, right: margin },
          head: [
            [
              lang === "bm" ? "Tarikh" : "Date",
              lang === "bm" ? "Peniaga" : "Merchant",
              lang === "bm" ? "Jumlah (RM)" : "Amount (RM)",
              lang === "bm" ? "Boleh Dituntut (RM)" : "Claimable (RM)",
            ],
          ],
          body: [
            [receipt.date, receipt.merchant, receipt.amount.toFixed(2), claimableForReceipt(receipt).toFixed(2)],
          ],
          theme: "grid",
          headStyles: { fillColor: [17, 22, 29] },
          styles: { fontSize: 8 },
        });

        const imageTop = getFinalY(doc) + 4;
        if (image) {
          const availableHeight = slotBottom - imageTop - 2;
          const scale = Math.min(availableWidth / image.width, availableHeight / image.height, 1);
          const drawWidth = image.width * scale;
          const drawHeight = image.height * scale;
          const x = margin + (availableWidth - drawWidth) / 2;
          doc.addImage(image.dataUrl, x, imageTop, drawWidth, drawHeight);
        } else {
          doc.setFontSize(9);
          doc.setTextColor(150);
          doc.text(lang === "bm" ? "Tiada gambar resit" : "No receipt image", margin, imageTop + 6);
          doc.setTextColor(20);
        }
      });
    }
  }

  const blob = doc.output("blob");
  await saveOrShareFile(blob, `tax-me-ai-tax-summary-${year}.pdf`);
}
