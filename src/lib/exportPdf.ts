import { getExpenseCategory } from "./expenseCategories";
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
