export interface IncomeType {
  id: string;
  nameEn: string;
  nameBm: string;
  emoji: string;
}

export const INCOME_TYPES: IncomeType[] = [
  { id: "cash", nameEn: "Cash", nameBm: "Tunai", emoji: "💵" },
  { id: "bank", nameEn: "Bank", nameBm: "Bank", emoji: "🏦" },
  { id: "credit_card", nameEn: "Credit Card", nameBm: "Kad Kredit", emoji: "💳" },
  { id: "personal_loan", nameEn: "Personal Loan", nameBm: "Pinjaman Peribadi", emoji: "📄" },
  { id: "ewallet", nameEn: "E-Wallet", nameBm: "E-Dompet", emoji: "📱" },
  { id: "other", nameEn: "Other", nameBm: "Lain-lain", emoji: "➕" },
];

export const INCOME_TYPE_IDS = INCOME_TYPES.map((t) => t.id);

export function getIncomeType(id: string): IncomeType {
  return INCOME_TYPES.find((t) => t.id === id) ?? INCOME_TYPES[INCOME_TYPES.length - 1];
}
