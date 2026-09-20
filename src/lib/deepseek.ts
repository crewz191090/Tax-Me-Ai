import { EXPENSE_CATEGORIES, getExpenseCategory } from "./expenseCategories";
import { RELIEF_CATEGORIES } from "./reliefCategories";
import type { ExtractedReceipt } from "./types";

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-flash";

const RELIEF_CATEGORY_IDS = RELIEF_CATEGORIES.map((c) => c.id);
const MAIN_CATEGORY_IDS = EXPENSE_CATEGORIES.map((c) => c.id);

const MAIN_CATEGORY_GUIDE = EXPENSE_CATEGORIES.map(
  (cat) => `- "${cat.id}": ${cat.nameEn}`
).join("\n");

const RELIEF_GUIDE = RELIEF_CATEGORIES.filter((c) => c.cap > 0)
  .map((c) => `- "${c.id}": ${c.descriptionEn}`)
  .join("\n");

interface ChatContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

async function chatCompletion(params: {
  content: ChatContentPart[] | string;
  jsonMode?: boolean;
}): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is not set. Add it to .env.local — get a key at https://platform.deepseek.com/api_keys"
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: params.content }],
      response_format: params.jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek API error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices[0]?.message.content;
  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }
  return content;
}

export async function extractReceiptFromImage(params: {
  base64Data: string;
  mimeType: string;
}): Promise<ExtractedReceipt> {
  // DeepSeek's JSON mode has no schema/enum enforcement (unlike Gemini's
  // responseSchema) — it only guarantees syntactically valid JSON, so the
  // prompt spells out the exact shape and valid ids explicitly, and every
  // field is re-validated against the real id lists below before use.
  const prompt = `You are reading an image uploaded to a personal expense tracker. Respond with ONLY a single JSON object (no markdown, no code fences) in exactly this shape:

{
  "merchant": string,
  "location": string,
  "date": string,
  "amount": number,
  "mainCategory": string,
  "reliefCategoryOrNone": string,
  "isEInvoice": boolean,
  "documentType": "receipt" | "bank_transaction" | "unrelated",
  "transactionNumber": string
}

First, determine what kind of document this actually is (documentType): a purchase "receipt"/invoice, a "bank_transaction" screenshot (bank transfer, e-wallet payment, ATM slip), or "unrelated" if it is not a receipt or bank transaction at all — in that case still fill the other fields with your best guess, but documentType is what matters.

If it is a receipt or bank transaction, extract the merchant/store name (or bank/payee name for a bank transaction) into "merchant" — the business or brand name only, not its address. If it's a "receipt", also extract the store's branch location (e.g. the mall, city, or area printed near the merchant name/address, such as "Mid Valley" or "Petaling Jaya") into "location" — empty string if this is a bank_transaction or no location is legible. Extract the transaction date into "date" (yyyy-mm-dd format, from what is printed on the image itself — if no date is legible, use an empty string rather than guessing a year), and the total amount paid as a plain number (no currency symbol) into "amount". If it's a bank_transaction, also put the transaction/reference number shown into "transactionNumber" (empty string if not applicable).

Set "mainCategory" to the single best-matching id from this list (respond with the id exactly as written, in quotes):
${MAIN_CATEGORY_GUIDE}

Set "reliefCategoryOrNone" to the id of a Malaysian LHDN individual tax relief category if this expense clearly qualifies for one, otherwise the literal string "none":
${RELIEF_GUIDE}

Set "isEInvoice" to true only if this looks like an official LHDN MyInvois e-invoice (has a validation link, QR code, or unique identifier number).`;

  const content = await chatCompletion({
    jsonMode: true,
    content: [
      { type: "text", text: prompt },
      {
        type: "image_url",
        image_url: { url: `data:${params.mimeType};base64,${params.base64Data}` },
      },
    ],
  });

  const step1 = JSON.parse(content) as {
    merchant: string;
    location?: string;
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
      const step2Content = await chatCompletion({
        jsonMode: true,
        content: `Merchant: "${step1.merchant}". Category: ${category.nameEn}. Respond with ONLY a JSON object of the shape {"subcategory": string}, picking the single best-matching subcategory id for this expense from: ${category.subcategories
          .map((s) => `"${s.id}" (${s.nameEn})`)
          .join(", ")}.`,
      });
      const step2 = JSON.parse(step2Content) as { subcategory: string };
      if (subcategoryIds.includes(step2.subcategory)) {
        subcategory = step2.subcategory;
      }
    } catch {
      // Fall back to the category's first subcategory if this second,
      // smaller call fails for any reason — the main category is still correct.
    }
  }

  // "Store Name (Location)" for receipts, "Payee Name (Transaction No.)"
  // for bank transfers/e-wallet screenshots.
  const baseName = step1.merchant || "Unknown merchant";
  let merchant = baseName;
  if (step1.documentType === "bank_transaction" && step1.transactionNumber) {
    merchant = `${baseName} (${step1.transactionNumber})`;
  } else if (step1.location) {
    merchant = `${baseName} (${step1.location})`;
  }

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

  const content = await chatCompletion({ content: prompt });
  return content.trim();
}
