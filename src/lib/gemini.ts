import { GoogleGenerativeAI, SchemaType, type ObjectSchema } from "@google/generative-ai";
import { EXPENSE_CATEGORIES, ALL_SUBCATEGORY_IDS } from "./expenseCategories";
import { RELIEF_CATEGORIES } from "./reliefCategories";
import type { ExtractedReceipt } from "./types";

const RELIEF_CATEGORY_IDS = RELIEF_CATEGORIES.map((c) => c.id);

const SUBCATEGORY_GUIDE = EXPENSE_CATEGORIES.map(
  (cat) =>
    `${cat.nameEn} (${cat.id}): ${cat.subcategories.map((s) => `"${s.id}"`).join(", ")}`
).join("\n");

const RELIEF_GUIDE = RELIEF_CATEGORIES.filter((c) => c.cap > 0)
  .map((c) => `- "${c.id}": ${c.descriptionEn}`)
  .join("\n");

const EXTRACTION_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    merchant: {
      type: SchemaType.STRING,
      description: "The name of the merchant or business on the receipt.",
    },
    date: {
      type: SchemaType.STRING,
      description: "The transaction date in yyyy-mm-dd format.",
    },
    amount: {
      type: SchemaType.NUMBER,
      description: "The total amount paid, as a plain number (no currency symbol).",
    },
    subcategory: {
      type: SchemaType.STRING,
      format: "enum",
      description: `Best matching general expense subcategory id, grouped by main category below. Pick the single best subcategory id:\n${SUBCATEGORY_GUIDE}`,
      enum: ALL_SUBCATEGORY_IDS,
    },
    reliefCategoryOrNone: {
      type: SchemaType.STRING,
      format: "enum",
      description: `Malaysian LHDN individual tax relief category id if this expense qualifies for a specific relief, otherwise "none":\n${RELIEF_GUIDE}`,
      enum: [...RELIEF_CATEGORY_IDS, "none"],
    },
    isEInvoice: {
      type: SchemaType.BOOLEAN,
      description:
        "True only if this looks like a Malaysian LHDN MyInvois e-invoice (has a validation/QR reference or explicit e-invoice marking).",
    },
  },
  required: ["merchant", "date", "amount", "subcategory", "reliefCategoryOrNone"],
};

export async function extractReceiptFromImage(params: {
  base64Data: string;
  mimeType: string;
}): Promise<ExtractedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local — get a free key at https://aistudio.google.com/apikey"
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_SCHEMA,
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: params.base64Data,
        mimeType: params.mimeType,
      },
    },
    {
      text: `You are reading a Malaysian receipt or invoice for a personal expense tracker. Extract the merchant name, transaction date, and total amount. Classify the expense into the single best-matching general expense subcategory id from this list:\n\n${SUBCATEGORY_GUIDE}\n\nSeparately, check whether this expense also qualifies for a specific LHDN individual income tax relief category (Year of Assessment 2025). If it clearly matches one of these, return its id; otherwise return "none":\n\n${RELIEF_GUIDE}\n\nIf it looks like an official LHDN MyInvois e-invoice (has a validation link, QR code, or unique identifier number), set isEInvoice to true.`,
    },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(text) as {
    merchant: string;
    date: string;
    amount: number;
    subcategory: string;
    reliefCategoryOrNone: string;
    isEInvoice?: boolean;
  };

  return {
    merchant: parsed.merchant || "Unknown merchant",
    date: parsed.date || new Date().toISOString().slice(0, 10),
    amount: typeof parsed.amount === "number" ? parsed.amount : 0,
    subcategory: ALL_SUBCATEGORY_IDS.includes(parsed.subcategory)
      ? parsed.subcategory
      : "uncategorized",
    reliefCategory:
      parsed.reliefCategoryOrNone && parsed.reliefCategoryOrNone !== "none"
        ? parsed.reliefCategoryOrNone
        : null,
    isEInvoice: Boolean(parsed.isEInvoice),
  };
}

export async function generateSpendingInsight(params: {
  periodLabel: string;
  totalSpent: number;
  totalIncome: number;
  breakdown: { name: string; amount: number }[];
  lang: "en" | "bm";
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const breakdownText = params.breakdown
    .map((b) => `- ${b.name}: RM ${b.amount.toFixed(2)}`)
    .join("\n");

  const languageInstruction =
    params.lang === "bm"
      ? "Reply in conversational Malay (Bahasa Malaysia)."
      : "Reply in English.";

  const prompt = `You are a friendly personal finance assistant for a Malaysian user. Here is their spending for ${params.periodLabel}:

Total spent: RM ${params.totalSpent.toFixed(2)}
Total income: RM ${params.totalIncome.toFixed(2)}
By category:
${breakdownText || "(no expenses recorded)"}

Write 2-3 short, specific sentences of friendly insight: point out their biggest spending category with its RM amount and rough percentage of total, note their cash flow (income vs expense, positive or negative), and give one concrete, practical tip relevant to their top category. Do not use markdown formatting, headings, or bullet points — plain conversational sentences only. ${languageInstruction}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
