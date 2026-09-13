import { GoogleGenerativeAI, SchemaType, type ObjectSchema } from "@google/generative-ai";
import { EXPENSE_CATEGORIES, getExpenseCategory } from "./expenseCategories";
import { RELIEF_CATEGORIES } from "./reliefCategories";
import type { ExtractedReceipt } from "./types";

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
const STEP1_SCHEMA: ObjectSchema = {
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
    mainCategory: {
      type: SchemaType.STRING,
      format: "enum",
      description: `Best matching general expense category id:\n${MAIN_CATEGORY_GUIDE}`,
      enum: MAIN_CATEGORY_IDS,
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
  required: ["merchant", "date", "amount", "mainCategory", "reliefCategoryOrNone"],
};

function subcategorySchema(subcategoryIds: string[]): ObjectSchema {
  return {
    type: SchemaType.OBJECT,
    properties: {
      subcategory: {
        type: SchemaType.STRING,
        format: "enum",
        enum: subcategoryIds,
      },
    },
    required: ["subcategory"],
  };
}

function getModel(apiKey: string, schema: ObjectSchema) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
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

  const step1Model = getModel(apiKey, STEP1_SCHEMA);
  const step1Result = await step1Model.generateContent([
    {
      inlineData: {
        data: params.base64Data,
        mimeType: params.mimeType,
      },
    },
    {
      text: `You are reading a Malaysian receipt or invoice for a personal expense tracker. Extract the merchant name, transaction date, and total amount. Classify the expense into the single best-matching general category id from this list:\n\n${MAIN_CATEGORY_GUIDE}\n\nSeparately, check whether this expense also qualifies for a specific LHDN individual income tax relief category (Year of Assessment 2025). If it clearly matches one of these, return its id; otherwise return "none":\n\n${RELIEF_GUIDE}\n\nIf it looks like an official LHDN MyInvois e-invoice (has a validation link, QR code, or unique identifier number), set isEInvoice to true.`,
    },
  ]);

  const step1Text = step1Result.response.text();
  const step1 = JSON.parse(step1Text) as {
    merchant: string;
    date: string;
    amount: number;
    mainCategory: string;
    reliefCategoryOrNone: string;
    isEInvoice?: boolean;
  };

  const mainCategoryId = MAIN_CATEGORY_IDS.includes(step1.mainCategory)
    ? step1.mainCategory
    : "other";
  const category = getExpenseCategory(mainCategoryId);
  const subcategoryIds = category.subcategories.map((s) => s.id);

  let subcategory = subcategoryIds[0] ?? "uncategorized";
  if (subcategoryIds.length > 1) {
    try {
      const step2Model = getModel(apiKey, subcategorySchema(subcategoryIds));
      const step2Result = await step2Model.generateContent(
        `Merchant: "${step1.merchant}". Category: ${category.nameEn}. Pick the single best-matching subcategory id for this expense from: ${category.subcategories
          .map((s) => `"${s.id}" (${s.nameEn})`)
          .join(", ")}.`
      );
      const step2 = JSON.parse(step2Result.response.text()) as { subcategory: string };
      if (subcategoryIds.includes(step2.subcategory)) {
        subcategory = step2.subcategory;
      }
    } catch {
      // Fall back to the category's first subcategory if this second,
      // smaller call fails for any reason — the main category is still correct.
    }
  }

  return {
    merchant: step1.merchant || "Unknown merchant",
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

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
