import { GoogleGenerativeAI, SchemaType, type ObjectSchema } from "@google/generative-ai";
import { RELIEF_CATEGORIES } from "./reliefCategories";
import type { ExtractedReceipt } from "./types";

const CATEGORY_IDS = RELIEF_CATEGORIES.map((c) => c.id);

const CATEGORY_GUIDE = RELIEF_CATEGORIES.map(
  (c) => `- "${c.id}": ${c.descriptionEn}`
).join("\n");

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
    category: {
      type: SchemaType.STRING,
      format: "enum",
      description: `Best matching Malaysian LHDN individual tax relief category id. Must be exactly one of the ids listed below. Use "not_deductible" if nothing matches:\n${CATEGORY_GUIDE}`,
      enum: CATEGORY_IDS,
    },
    isEInvoice: {
      type: SchemaType.BOOLEAN,
      description:
        "True only if this looks like a Malaysian LHDN MyInvois e-invoice (has a validation/QR reference or explicit e-invoice marking).",
    },
  },
  required: ["merchant", "date", "amount", "category"],
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
      text: `You are reading a Malaysian receipt or invoice to help an individual taxpayer track expenses that qualify for LHDN personal income tax relief (Year of Assessment 2025). Extract the merchant name, transaction date, and total amount. Then classify the expense into the single best-matching relief category id from this list:\n\n${CATEGORY_GUIDE}\n\nIf the receipt is general personal spending (groceries, entertainment, clothing, etc.) that does not match any relief, use "not_deductible". If it looks like an official LHDN MyInvois e-invoice (has a validation link, QR code, or unique identifier number), set isEInvoice to true.`,
    },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(text) as ExtractedReceipt;

  return {
    merchant: parsed.merchant || "Unknown merchant",
    date: parsed.date || new Date().toISOString().slice(0, 10),
    amount: typeof parsed.amount === "number" ? parsed.amount : 0,
    category: CATEGORY_IDS.includes(parsed.category) ? parsed.category : "not_deductible",
    isEInvoice: Boolean(parsed.isEInvoice),
  };
}
