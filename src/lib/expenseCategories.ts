export interface ExpenseSubcategory {
  id: string;
  nameEn: string;
  nameBm: string;
}

export interface ExpenseCategory {
  id: string;
  nameEn: string;
  nameBm: string;
  emoji: string;
  subcategories: ExpenseSubcategory[];
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: "housing",
    nameEn: "Housing & Utilities",
    nameBm: "Rumah & Utiliti",
    emoji: "🏠",
    subcategories: [
      { id: "rent_mortgage", nameEn: "Rent / Mortgage", nameBm: "Sewa / Ansuran rumah" },
      { id: "electricity", nameEn: "Electricity", nameBm: "Elektrik" },
      { id: "water", nameEn: "Water", nameBm: "Air" },
      { id: "internet", nameEn: "Internet", nameBm: "Internet" },
      { id: "phone_bill", nameEn: "Phone", nameBm: "Telefon" },
      { id: "gas", nameEn: "Gas", nameBm: "Gas" },
      { id: "maintenance_repair", nameEn: "Maintenance / Repair", nameBm: "Maintenance / Repair" },
      { id: "property_assessment", nameEn: "Property Tax / Assessment", nameBm: "Cukai / Assessment" },
      { id: "indah_water", nameEn: "Indah Water", nameBm: "Indah Water" },
      { id: "security_fee", nameEn: "Security / Maintenance Fee", nameBm: "Security / Maintenance fee" },
    ],
  },
  {
    id: "food",
    nameEn: "Food & Drinks",
    nameBm: "Makanan & Minuman",
    emoji: "🍔",
    subcategories: [
      { id: "breakfast", nameEn: "Breakfast", nameBm: "Sarapan" },
      { id: "lunch", nameEn: "Lunch", nameBm: "Makan tengah hari" },
      { id: "dinner", nameEn: "Dinner", nameBm: "Makan malam" },
      { id: "drinks_coffee", nameEn: "Drinks / Coffee", nameBm: "Minuman / Kopi" },
      { id: "snacks", nameEn: "Snacks", nameBm: "Makanan ringan" },
      { id: "delivery", nameEn: "Delivery", nameBm: "Delivery" },
      { id: "fast_food", nameEn: "Fast Food", nameBm: "Fast food" },
      { id: "restaurant", nameEn: "Restaurant", nameBm: "Restoran" },
      { id: "groceries", nameEn: "Groceries", nameBm: "Groceries / Barang dapur" },
    ],
  },
  {
    id: "transport",
    nameEn: "Transportation",
    nameBm: "Pengangkutan",
    emoji: "🚗",
    subcategories: [
      { id: "petrol", nameEn: "Petrol", nameBm: "Petrol" },
      { id: "toll", nameEn: "Toll", nameBm: "Tol" },
      { id: "parking", nameEn: "Parking", nameBm: "Parking" },
      { id: "ehailing", nameEn: "Grab / E-hailing", nameBm: "Grab / E-hailing" },
      { id: "public_transport", nameEn: "Public Transport", nameBm: "Pengangkutan awam" },
      { id: "car_maintenance", nameEn: "Car Maintenance", nameBm: "Maintenance kereta" },
      { id: "car_service", nameEn: "Car Service", nameBm: "Servis kereta" },
      { id: "tires", nameEn: "Tires", nameBm: "Tayar" },
      { id: "vehicle_insurance", nameEn: "Vehicle Insurance", nameBm: "Insurans kenderaan" },
      { id: "road_tax", nameEn: "Road Tax", nameBm: "Road tax" },
      { id: "car_installment", nameEn: "Car Installment", nameBm: "Ansuran kereta" },
    ],
  },
  {
    id: "shopping",
    nameEn: "Shopping",
    nameBm: "Shopping",
    emoji: "🛒",
    subcategories: [
      { id: "clothing", nameEn: "Clothing", nameBm: "Pakaian" },
      { id: "shoes", nameEn: "Shoes", nameBm: "Kasut" },
      { id: "electronics", nameEn: "Electronics", nameBm: "Elektronik" },
      { id: "gadgets", nameEn: "Gadgets", nameBm: "Gadget" },
      { id: "household_items", nameEn: "Household Items", nameBm: "Barang rumah" },
      { id: "personal_items", nameEn: "Personal Items", nameBm: "Barang peribadi" },
      { id: "online_shopping", nameEn: "Online Shopping", nameBm: "Online shopping" },
      { id: "gifts_shopping", nameEn: "Gifts", nameBm: "Hadiah" },
      { id: "shopping_other", nameEn: "Other", nameBm: "Lain-lain" },
    ],
  },
  {
    id: "debt",
    nameEn: "Commitments & Debt",
    nameBm: "Komitmen & Hutang",
    emoji: "💳",
    subcategories: [
      { id: "credit_card", nameEn: "Credit Card", nameBm: "Kad kredit" },
      { id: "personal_loan", nameEn: "Personal Loan", nameBm: "Personal loan" },
      { id: "ptptn", nameEn: "PTPTN", nameBm: "PTPTN" },
      { id: "car_loan", nameEn: "Car Loan", nameBm: "Pinjaman kereta" },
      { id: "home_loan", nameEn: "Home Loan", nameBm: "Pinjaman rumah" },
      { id: "bnpl", nameEn: "BNPL", nameBm: "BNPL" },
      { id: "personal_debt", nameEn: "Personal Debt", nameBm: "Hutang peribadi" },
      { id: "minimum_payment", nameEn: "Minimum Payment", nameBm: "Bayaran minimum" },
      { id: "interest_charge", nameEn: "Interest / Charges", nameBm: "Interest / Caj" },
    ],
  },
  {
    id: "health",
    nameEn: "Health",
    nameBm: "Kesihatan",
    emoji: "🏥",
    subcategories: [
      { id: "clinic", nameEn: "Clinic", nameBm: "Klinik" },
      { id: "hospital", nameEn: "Hospital", nameBm: "Hospital" },
      { id: "medicine", nameEn: "Medicine", nameBm: "Ubat" },
      { id: "dental", nameEn: "Dental", nameBm: "Dental" },
      { id: "medical_checkup", nameEn: "Medical Check-up", nameBm: "Medical check-up" },
      { id: "medical_insurance", nameEn: "Insurance / Medical Card", nameBm: "Insurance / Medical card" },
      { id: "supplements", nameEn: "Supplements", nameBm: "Supplement" },
      { id: "health_other", nameEn: "Other Health", nameBm: "Kesihatan lain" },
    ],
  },
  {
    id: "family",
    nameEn: "Family",
    nameBm: "Keluarga",
    emoji: "👨‍👩‍👧",
    subcategories: [
      { id: "children", nameEn: "Children", nameBm: "Anak" },
      { id: "school_fees", nameEn: "School Fees", nameBm: "Yuran sekolah" },
      { id: "books_stationery", nameEn: "Books / Stationery", nameBm: "Buku / Alat tulis" },
      { id: "childcare_nursery", nameEn: "Childcare / Nursery", nameBm: "Taska / Nursery" },
      { id: "parents_allowance", nameEn: "Parents' Allowance", nameBm: "Belanja ibu bapa" },
      { id: "household_money", nameEn: "Household Money", nameBm: "Duit rumah" },
      { id: "family_gifts", nameEn: "Family Gifts", nameBm: "Hadiah keluarga" },
      { id: "family_needs", nameEn: "Family Needs", nameBm: "Keperluan keluarga" },
    ],
  },
  {
    id: "education",
    nameEn: "Education",
    nameBm: "Pendidikan",
    emoji: "🎓",
    subcategories: [
      { id: "tuition_fees", nameEn: "Tuition Fees", nameBm: "Yuran pengajian" },
      { id: "courses", nameEn: "Courses", nameBm: "Kursus" },
      { id: "seminars", nameEn: "Seminars", nameBm: "Seminar" },
      { id: "education_books", nameEn: "Books", nameBm: "Buku" },
      { id: "learning_subscription", nameEn: "Learning Subscription", nameBm: "Subscription pembelajaran" },
      { id: "exam_certification", nameEn: "Exam / Certification", nameBm: "Exam / Certification" },
      { id: "training", nameEn: "Training", nameBm: "Training" },
    ],
  },
  {
    id: "entertainment",
    nameEn: "Entertainment & Lifestyle",
    nameBm: "Hiburan & Lifestyle",
    emoji: "🎮",
    subcategories: [
      { id: "streaming", nameEn: "Streaming", nameBm: "Netflix / Streaming" },
      { id: "games", nameEn: "Games", nameBm: "Games" },
      { id: "gaming", nameEn: "Gaming", nameBm: "Gaming" },
      { id: "movies", nameEn: "Movies", nameBm: "Wayang" },
      { id: "concerts", nameEn: "Concerts", nameBm: "Konsert" },
      { id: "hobbies", nameEn: "Hobbies", nameBm: "Hobi" },
      { id: "gym", nameEn: "Gym", nameBm: "Gym" },
      { id: "sports", nameEn: "Sports", nameBm: "Sports" },
      { id: "subscriptions", nameEn: "Subscriptions", nameBm: "Subscription" },
      { id: "entertainment_other", nameEn: "Other Entertainment", nameBm: "Entertainment lain" },
    ],
  },
  {
    id: "travel",
    nameEn: "Travel",
    nameBm: "Travel",
    emoji: "✈️",
    subcategories: [
      { id: "flight", nameEn: "Flight", nameBm: "Flight" },
      { id: "hotel", nameEn: "Hotel", nameBm: "Hotel" },
      { id: "travel_transport", nameEn: "Transport", nameBm: "Pengangkutan" },
      { id: "travel_food", nameEn: "Food", nameBm: "Makanan" },
      { id: "activities", nameEn: "Activities", nameBm: "Aktiviti" },
      { id: "travel_insurance", nameEn: "Travel Insurance", nameBm: "Travel insurance" },
      { id: "souvenirs", nameEn: "Shopping / Souvenirs", nameBm: "Shopping / Souvenir" },
      { id: "visa", nameEn: "Visa", nameBm: "Visa" },
      { id: "travel_other", nameEn: "Other", nameBm: "Lain-lain" },
    ],
  },
  {
    id: "finance",
    nameEn: "Finance & Savings",
    nameBm: "Kewangan & Simpanan",
    emoji: "💰",
    subcategories: [
      { id: "savings", nameEn: "Savings", nameBm: "Simpanan" },
      { id: "emergency_fund", nameEn: "Emergency Fund", nameBm: "Emergency fund" },
      { id: "investment", nameEn: "Investment", nameBm: "Investment" },
      { id: "asb", nameEn: "ASB", nameBm: "ASB" },
      { id: "tabung_haji", nameEn: "Tabung Haji", nameBm: "Tabung Haji" },
      { id: "stocks", nameEn: "Stocks", nameBm: "Saham" },
      { id: "crypto", nameEn: "Crypto", nameBm: "Crypto" },
      { id: "fixed_deposit", nameEn: "Fixed Deposit", nameBm: "Fixed deposit" },
      { id: "epf_retirement", nameEn: "EPF / Retirement", nameBm: "KWSP / Retirement" },
      { id: "account_transfer", nameEn: "Transfer Between Own Accounts", nameBm: "Transfer antara akaun" },
    ],
  },
  {
    id: "tax_gov",
    nameEn: "Tax & Government",
    nameBm: "Cukai & Kerajaan",
    emoji: "🧾",
    subcategories: [
      { id: "income_tax", nameEn: "Income Tax", nameBm: "Income tax" },
      { id: "zakat", nameEn: "Zakat", nameBm: "Zakat" },
      { id: "land_tax", nameEn: "Land Tax", nameBm: "Cukai tanah" },
      { id: "door_tax", nameEn: "Door Tax", nameBm: "Cukai pintu" },
      { id: "license", nameEn: "License", nameBm: "Lesen" },
      { id: "fines", nameEn: "Fines", nameBm: "Denda" },
      { id: "summons", nameEn: "Summons", nameBm: "Saman" },
      { id: "government_matters", nameEn: "Government Matters", nameBm: "Urusan kerajaan" },
    ],
  },
  {
    id: "business",
    nameEn: "Work / Business",
    nameBm: "Kerja / Business",
    emoji: "💼",
    subcategories: [
      { id: "office_supplies", nameEn: "Office Supplies", nameBm: "Office supplies" },
      { id: "work_travel", nameEn: "Work Travel", nameBm: "Travel kerja" },
      { id: "work_petrol", nameEn: "Work Petrol", nameBm: "Petrol kerja" },
      { id: "work_parking_toll", nameEn: "Parking / Toll", nameBm: "Parking / Tol" },
      { id: "client_entertainment", nameEn: "Client Entertainment", nameBm: "Client entertainment" },
      { id: "software", nameEn: "Software", nameBm: "Software" },
      { id: "advertising", nameEn: "Advertising", nameBm: "Advertising" },
      { id: "professional_fees", nameEn: "Professional Fees", nameBm: "Professional fees" },
      { id: "equipment", nameEn: "Equipment", nameBm: "Equipment" },
      { id: "business_training", nameEn: "Training", nameBm: "Training" },
      { id: "business_subscription", nameEn: "Business Subscription", nameBm: "Business subscription" },
    ],
  },
  {
    id: "pets",
    nameEn: "Pets",
    nameBm: "Haiwan Peliharaan",
    emoji: "🐱",
    subcategories: [
      { id: "pet_food", nameEn: "Food", nameBm: "Makanan" },
      { id: "vet", nameEn: "Vet", nameBm: "Vet" },
      { id: "pet_medicine", nameEn: "Medicine", nameBm: "Ubat" },
      { id: "grooming", nameEn: "Grooming", nameBm: "Grooming" },
      { id: "pet_accessories", nameEn: "Accessories", nameBm: "Accessories" },
      { id: "boarding", nameEn: "Boarding", nameBm: "Boarding" },
      { id: "pet_insurance", nameEn: "Insurance", nameBm: "Insurance" },
    ],
  },
  {
    id: "other",
    nameEn: "Other",
    nameBm: "Lain-lain",
    emoji: "📦",
    subcategories: [{ id: "uncategorized", nameEn: "Uncategorized", nameBm: "Tidak dikategorikan" }],
  },
];

export function getExpenseCategory(id: string): ExpenseCategory {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export function getSubcategory(
  subcategoryId: string
): { category: ExpenseCategory; subcategory: ExpenseSubcategory } | null {
  for (const category of EXPENSE_CATEGORIES) {
    const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
    if (subcategory) return { category, subcategory };
  }
  return null;
}

export function mainCategoryForSubcategory(subcategoryId: string): string {
  return getSubcategory(subcategoryId)?.category.id ?? "other";
}

export const ALL_SUBCATEGORY_IDS = EXPENSE_CATEGORIES.flatMap((c) =>
  c.subcategories.map((s) => s.id)
);

export type TransactionType = "expense" | "income" | "transfer";

export const PAYMENT_METHODS = [
  { id: "cash", nameEn: "Cash", nameBm: "Tunai" },
  { id: "debit_card", nameEn: "Debit Card", nameBm: "Kad Debit" },
  { id: "credit_card", nameEn: "Credit Card", nameBm: "Kad Kredit" },
  { id: "ewallet", nameEn: "E-Wallet", nameBm: "E-Wallet" },
  { id: "bank_transfer", nameEn: "Bank Transfer", nameBm: "Pindahan Bank" },
  { id: "other", nameEn: "Other", nameBm: "Lain-lain" },
];
