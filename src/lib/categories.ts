export const CATEGORIES = [
  "Transport",
  "Fuel",
  "Meals",
  "Supplies",
  "Equipment",
  "Utilities",
  "Professional Fees",
  "Rental",
  "Personal",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * Simplified Malaysian LHDN-style deductibility rules (Section 39, ITA 1967).
 * Not tax advice — always verify with a qualified tax agent or LHDN before filing.
 */
export function deductiblePercentForCategory(category: string): number {
  switch (category as Category) {
    case "Meals":
      return 50;
    case "Personal":
      return 0;
    default:
      return 100;
  }
}
