import { GoogleGenerativeAI, SchemaType, type ObjectSchema } from "@google/generative-ai";
import { CATEGORIES } from "./categories";
import type { ExtractedReceipt } from "./types";

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
      description: `Best matching expense category. Must be one of: ${CATEGORIES.join(", ")}.`,
      enum: [...CATEGORIES],
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
      text: `You are reading a Malaysian business receipt or invoice. Extract the merchant name, transaction date, total amount, and the best-matching expense category from this list: ${CATEGORIES.join(
        ", "
      )}. If the date is unclear, use your best guess. If it looks like an official LHDN MyInvois e-invoice (has a validation link, QR code, or unique identifier number), set isEInvoice to true.`,
    },
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(text) as ExtractedReceipt;

  return {
    merchant: parsed.merchant || "Unknown merchant",
    date: parsed.date || new Date().toISOString().slice(0, 10),
    amount: typeof parsed.amount === "number" ? parsed.amount : 0,
    category: CATEGORIES.includes(parsed.category as (typeof CATEGORIES)[number])
      ? parsed.category
      : "Other",
    isEInvoice: Boolean(parsed.isEInvoice),
  };
}
