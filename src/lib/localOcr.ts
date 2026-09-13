"use client";

import { mainCategoryForSubcategory } from "./expenseCategories";
import { matchKeywords, SUBCATEGORY_KEYWORDS, RELIEF_KEYWORDS } from "./localKeywords";
import type { ExtractedReceipt } from "./types";

const MONTHS: Record<string, string> = {
  jan: "01", january: "01",
  feb: "02", february: "02",
  mar: "03", march: "03",
  apr: "04", april: "04",
  may: "05",
  jun: "06", june: "06",
  jul: "07", july: "07",
  aug: "08", august: "08",
  sep: "09", sept: "09", september: "09",
  oct: "10", october: "10",
  nov: "11", november: "11",
  dec: "12", december: "12",
};

function pad2(n: string | number): string {
  return String(n).padStart(2, "0");
}

function extractDate(text: string): string | null {
  // yyyy-mm-dd or yyyy/mm/dd
  let m = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;

  // dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;

  // dd Mon yyyy (e.g. "15 Jan 2026")
  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month) return `${m[3]}-${month}-${pad2(m[1])}`;
  }

  return null;
}

function extractAmount(text: string): number {
  const lines = text.split("\n");
  const totalKeywords = ["grand total", "total", "jumlah", "amount due", "amt due", "jumlah bayar"];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (totalKeywords.some((k) => lower.includes(k))) {
      const match = line.match(/(\d{1,3}(?:,\d{3})*\.\d{2})/);
      if (match) return parseFloat(match[1].replace(/,/g, ""));
    }
  }

  // Fallback: largest currency-looking number in the whole text.
  const allMatches = Array.from(text.matchAll(/(\d{1,3}(?:,\d{3})*\.\d{2})/g)).map((m) =>
    parseFloat(m[1].replace(/,/g, ""))
  );
  if (allMatches.length > 0) return Math.max(...allMatches);

  return 0;
}

function extractMerchant(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const skipPatterns = /^(tax invoice|receipt|resit|invoice|no\.|tel|fax|gst|sst)/i;

  for (const line of lines.slice(0, 5)) {
    if (skipPatterns.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    return line.slice(0, 60);
  }

  return lines[0]?.slice(0, 60) || "Unknown merchant";
}

export interface LocalExtractionResult extends ExtractedReceipt {
  rawText: string;
}

export async function extractReceiptLocally(file: File): Promise<LocalExtractionResult> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(file, "eng");
  const rawText = data.text;

  const merchant = extractMerchant(rawText);
  const amount = extractAmount(rawText);
  const date = extractDate(rawText) ?? new Date().toISOString().slice(0, 10);

  const haystack = `${merchant}\n${rawText}`;
  const subcategory = matchKeywords(haystack, SUBCATEGORY_KEYWORDS) ?? "uncategorized";
  const reliefCategory = matchKeywords(haystack, RELIEF_KEYWORDS);

  return {
    merchant,
    date,
    amount,
    subcategory,
    reliefCategory,
    isEInvoice: false,
    rawText,
  };
}

export function mainCategoryFor(subcategory: string): string {
  return mainCategoryForSubcategory(subcategory);
}
