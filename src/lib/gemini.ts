import { GoogleGenAI } from "@google/genai";
import { EXPENSE_CATEGORIES, getExpenseCategory } from "./expenseCategories";
import { RELIEF_CATEGORIES } from "./reliefCategories";
import type { ExtractedReceipt } from "./types";

const MODEL = "gemini-3.5-flash-lite";

const RELIEF_CATEGORY_IDS = RELIEF_CATEGORIES.map((c) => c.id);
const MAIN_CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id);

const MAIN_CATEGORY_GUIDE = EXPENSE_CATEGORIES.map(
  (cat) => `- "${cat.id}": ${cat.nameEn}`
).join("\n");

const RELIEF_GUIDE = RELIEF_CATEGORIES.filter((c) => c.cap > 0)
  .map((c) => `- "${c.id}": ${c.descriptionEn}`)
  .join("\n");

/**
 * Gemini's structured-output schema becomes unreliable (intermittent 400
 * "invalid argument" errors) once the combined enum values across a schema
 * get too large — we measured the real category+relief lists (137 + 17)
 * failing consistently, while smaller lists (under ~90 combined) were
 * reliable. So classification is split into two small calls instead of one
 * giant one: main category first (16 options), then subcategory scoped to
 * that category (at most ~11 options) as a second, cheap text-only call.
 */
const STEP1_SCHEMA = {
  type: "object",
  properties: {
    merchant: {
      type: "string",
      description: "The name of the merchant or business on the receipt.",
    },
    date: {
      type: "string",
      description: "The transaction date in yyyy-mm-dd format.",
    },
    amount: {
      type: "number",
      description: "The total amount paid, as a plain number (no currency symbol).",
    },
    mainCategory: {
      type: "string",
      description: `Best matching general expense category id:\n${MAIN_CATEGORY_GUIDE}`,
      enum: MAIN_CATEGORY_IDS,
    },
    reliefCategoryOrNone: {
      type: "string",
      description: `Malaysian LHDN individual tax relief category id if this expense qualifies for a specific relief, otherwise "none":\n${RELIEF_GUIDE}`,
      enum: [...RELIEF_CATEGORY_IDS, "none"],
    },
    isEInvoice: {
      type: "boolean",
      description:
        "True only if this looks like a Malaysian LHDN MyInvois e-invoice (has a validation/QR reference or explicit e-invoice marking).",
    },
    documentType: {
      type: "string",
      enum: ["receipt", "bank_transaction", "unrelated"],
      description:
        'Classify the image itself: "receipt" for a purchase receipt/invoice, "bank_transaction" for a bank transfer/payment confirmation screenshot (online banking, e-wallet, ATM slip), or "unrelated" if the image is not a receipt or bank transaction at all (e.g. a random photo, selfie, document unrelated to a transaction, blank/unreadable image).',
    },
    transactionNumber: {
      type: "string",
      description:
        'Only when documentType is "bank_transaction": the transaction/reference number shown on the screenshot (e.g. "TXN123456789", reference no., or transfer ID). Empty string if not applicable or not visible.',
    },
  },
  required: ["merchant", "date", "amount", "mainCategory", "reliefCategoryOrNone", "documentType"],
};

function subcategorySchema(subcategoryIds: string[]) {
  return {
    type: "object",
    properties: {
      subcategory: {
        type: "string",
        enum: subcategoryIds,
      },
    },
    required: ["subcategory"],
  };
}

function getClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

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

  const ai = getClient(apiKey);

  const step1Result = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: params.base64Data,
              mimeType: params.mimeType,
            },
          },
          {
            text: `You are reading an image uploaded to a personal expense tracker. First, determine what kind of document this actually is (documentType): a purchase "receipt"/invoice, a "bank_transaction" screenshot (bank transfer, e-wallet payment, ATM slip), or "unrelated" if it is not a receipt or bank transaction at all — in that case still fill the other fields with your best guess, but documentType is what matters.\n\nIf it is a receipt or bank transaction, extract the merchant name (or bank/payee name for a bank transaction), transaction date, and total amount. The date must come only from what is printed on the image itself (e.g. a date/time line, transaction timestamp, or invoice date) — if no date is legible, return an empty string for date rather than guessing a year. If it's a bank_transaction, also extract the transaction/reference number shown, if any.\n\nClassify the expense into the single best-matching general category id from this list:\n\n${MAIN_CATEGORY_GUIDE}\n\nSeparately, check whether this expense also qualifies for a specific LHDN individual income tax relief category. If it clearly matches one of these, return its id; otherwise return "none":\n\n${RELIEF_GUIDE}\n\nIf it looks like an official LHDN MyInvois e-invoice (has a validation link, QR code, or unique identifier number), set isEInvoice to true.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: STEP1_SCHEMA,
    },
  });

  const step1Text = step1Result.text ?? "";
  const step1 = JSON.parse(step1Text) as {
    merchant: string;
    date: string;
    amount: number;
    mainCategory: string;
    reliefCategoryOrNone: string;
    isEInvoice?: boolean;
    documentType?: string;
    transactionNumber?: string;
  };

  if (step1.documentType === "unrelated") {
    const err = new Error(
      "This image doesn't look like a receipt or bank transaction. Please upload a valid receipt or bank transfer screenshot."
    );
    (err as Error & { code?: string }).code = "UNRELATED_IMAGE";
    throw err;
  }

  const mainCategoryId = MAIN_CATEGORY_IDS.includes(step1.mainCategory)
    ? step1.mainCategory
    : "other";
  const category = getExpenseCategory(mainCategoryId);
  const subcategoryIds = category.subcategories.map((s) => s.id);

  let subcategory = subcategoryIds[0] ?? "uncategorized";
  if (subcategoryIds.length > 1) {
    try {
      const step2Result = await ai.models.generateContent({
        model: MODEL,
        contents: `Merchant: "${step1.merchant}". Category: ${category.nameEn}. Pick the single best-matching subcategory id for this expense from: ${category.subcategories
          .map((s) => `"${s.id}" (${s.nameEn})`)
          .join(", ")}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: subcategorySchema(subcategoryIds),
        },
      });
      const step2 = JSON.parse(step2Result.text ?? "") as { subcategory: string };
      if (subcategoryIds.includes(step2.subcategory)) {
        subcategory = step2.subcategory;
      }
    } catch {
      // Fall back to the category's first subcategory if this second,
      // smaller call fails for any reason — the main category is still correct.
    }
  }

  const baseName = step1.merchant || "Unknown merchant";
  const merchant =
    step1.documentType === "bank_transaction" && step1.transactionNumber
      ? `${baseName} (${step1.transactionNumber})`
      : baseName;

  return {
    merchant,
    date: step1.date || new Date().toISOString().slice(0, 10),
    amount: typeof step1.amount === "number" ? step1.amount : 0,
    subcategory,
    reliefCategory:
      step1.reliefCategoryOrNone && step1.reliefCategoryOrNone !== "none"
        ? step1.reliefCategoryOrNone
        : null,
    isEInvoice: Boolean(step1.isEInvoice),
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

  const ai = getClient(apiKey);

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
By category (this list is complete — every category the user spent in during this period, already summing every transaction including manually-entered ones):
${breakdownText || "(no expenses recorded)"}

Write 2-4 short, specific sentences of friendly insight: mention the total spent, name their biggest spending category with its RM amount and rough percentage of total, and if there is a second category also mention it briefly by name and amount so the total is clearly accounted for (skip this if there's only one category). Note their cash flow (income vs expense, positive or negative), and give one concrete, practical tip relevant to their top category. Do not use markdown formatting, headings, or bullet points — plain conversational sentences only. ${languageInstruction}`;

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  return (result.text ?? "").trim();
}
