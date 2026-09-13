/**
 * Keyword hints for local (offline) classification — used only when Gemini
 * is unavailable (no internet, or the AI call failed/quota-limited). Matched
 * case-insensitively against the merchant name and full OCR text. Not
 * exhaustive; unmatched receipts fall back to "uncategorized" / no relief,
 * same as the AI path does for genuinely ambiguous receipts.
 */

export const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  // Housing
  electricity: ["tnb", "tenaga nasional", "sesb", "sarawak energy"],
  water: ["syabas", "air selangor", "pba", "water board"],
  internet: ["unifi", "tm ", "maxis fibre", "time internet", "astro fibre"],
  phone_bill: ["maxis", "celcom", "digi", "umobile", "u mobile", "yes 4g", "hotlink", "xpax"],
  indah_water: ["indah water", "iwk"],

  // Food
  drinks_coffee: ["starbucks", "coffee bean", "zus coffee", "old town", "oldtown", "chatime", "tealive", "boost juice"],
  delivery: ["grabfood", "foodpanda", "shopeefood"],
  fast_food: ["mcdonald", "mcd", "kfc", "burger king", "pizza hut", "domino", "subway", "marrybrown", "texas chicken"],
  restaurant: ["restoran", "restaurant", "cafe", "kopitiam"],
  groceries: ["tesco", "lotus", "aeon", "giant", "mydin", "econsave", "jaya grocer", "village grocer", "99 speedmart", "kk mart", "family mart", "sunshine", "billion"],

  // Transport
  petrol: ["petronas", "shell", "petron", "caltex", "bhp"],
  toll: ["plus", "touch n go toll", "grandsaga", "litrak", "prolintas"],
  parking: ["parking", "tempat letak kereta"],
  ehailing: ["grab", "airasia ride", "mytaxi", "indriver"],
  public_transport: ["rapid kl", "ktm", "mrt", "lrt", "myrapid", "touch n go"],
  car_maintenance: ["tayar", "tire", "kedai kereta", "auto service"],
  car_service: ["proton service", "perodua service", "honda service", "toyota service", "service center", "service centre"],
  vehicle_insurance: ["takaful", "allianz", "etiqa", "zurich insurance", "great eastern general"],
  road_tax: ["road tax", "cukai jalan", "myeg"],

  // Shopping
  electronics: ["senheng", "harvey norman", "courts", "best denki"],
  online_shopping: ["shopee", "lazada", "zalora", "amazon"],

  // Health
  clinic: ["klinik", "clinic"],
  hospital: ["hospital", "hospital sultanah", "kpj", "gleneagles", "pantai", "sunway medical", "columbia asia"],
  medicine: ["farmasi", "pharmacy", "guardian", "watsons", "caring pharmacy", "big pharmacy"],
  dental: ["dental", "pergigian", "klinik gigi"],
  medical_insurance: ["prudential", "aia", "great eastern", "allianz life", "hong leong assurance"],

  // Family / education
  school_fees: ["yuran sekolah", "school fee"],
  childcare_nursery: ["taska", "tadika", "nursery", "kindergarten"],
  tuition_fees: ["universiti", "university", "kolej", "college", "politeknik"],

  // Entertainment
  streaming: ["netflix", "spotify", "disney+", "disney plus", "viu", "astro go", "youtube premium", "apple music"],
  movies: ["gsc", "golden screen", "tgv", "mbo cinemas", "cinema"],
  gym: ["gym", "fitness first", "celebrity fitness", "anytime fitness"],

  // Travel
  flight: ["airasia", "malaysia airlines", "mas ", "firefly", "batik air", "scoot"],
  hotel: ["hotel", "airbnb", "booking.com", "agoda"],

  // Finance
  asb: ["asb", "amanah saham"],
  tabung_haji: ["tabung haji", "lembaga tabung haji", "tha "],
  epf_retirement: ["kwsp", "epf"],

  // Tax & government
  income_tax: ["lhdn", "hasil", "income tax", "cukai pendapatan"],
  zakat: ["zakat", "baitulmal", "lzs", "maiwp"],
  fines: ["saman", "summons", "jpj", "polis diraja"],

  // Business
  software: ["adobe", "microsoft 365", "google workspace", "canva", "notion", "figma"],

  // Pets
  vet: ["vet", "veterinar", "klinik haiwan"],

  // Income
  salary: ["salary", "gaji", "payroll"],
};

export const RELIEF_KEYWORDS: Record<string, string[]> = {
  medical_self: ["klinik", "clinic", "hospital", "farmasi", "pharmacy", "dental", "pergigian"],
  medical_parents: ["klinik ibu bapa"],
  education_fees_self: ["yuran pengajian", "universiti", "kolej", "college", "university"],
  lifestyle: ["mph", "popular bookstore", "kinokuniya", "computer", "smartphone", "unifi", "streamyx"],
  lifestyle_sports: ["gym", "fitness", "sukan", "sports"],
  life_insurance_epf: ["kwsp", "epf", "insurans nyawa", "life insurance"],
  education_medical_insurance: ["prudential", "aia", "great eastern", "insurans pendidikan"],
  socso: ["perkeso", "socso"],
  sspn: ["sspn", "ptptn savings"],
  childcare_fees: ["taska", "tadika", "nursery", "kindergarten"],
  breastfeeding_equipment: ["breast pump", "penyusuan"],
  housing_loan_interest: ["home loan interest", "faedah pinjaman perumahan"],
};

function normalize(text: string): string {
  return text.toLowerCase();
}

export function matchKeywords(
  haystack: string,
  keywordMap: Record<string, string[]>
): string | null {
  const normalized = normalize(haystack);
  for (const [id, keywords] of Object.entries(keywordMap)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        return id;
      }
    }
  }
  return null;
}
