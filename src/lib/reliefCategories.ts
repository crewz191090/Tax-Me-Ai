/**
 * Malaysian individual income tax relief categories (Year of Assessment 2025),
 * based on LHDN's official "Pelepasan Cukai Individu Pemastautin" brochure.
 * Only expense/receipt-based reliefs are included here — status-based reliefs
 * (e.g. self, spouse, child count) are not something a receipt can prove and
 * are excluded.
 *
 * Not tax advice — always verify against the latest LHDN guidance or a
 * qualified tax agent before filing. See https://www.hasil.gov.my
 */

export interface ReliefCategory {
  id: string;
  nameEn: string;
  nameBm: string;
  cap: number;
  descriptionEn: string;
  descriptionBm: string;
}

export const RELIEF_CATEGORIES: ReliefCategory[] = [
  {
    id: "medical_self",
    nameEn: "Medical (self, spouse, child)",
    nameBm: "Perubatan (diri, pasangan, anak)",
    cap: 10000,
    descriptionEn:
      "Serious diseases, fertility treatment, vaccination, dental exams, medical check-ups, mental health consultation, disease screening, for self/spouse/child.",
    descriptionBm:
      "Penyakit serius, rawatan kesuburan, pemvaksinan, pemeriksaan pergigian, pemeriksaan perubatan, konsultasi kesihatan mental, ujian saringan penyakit, untuk diri/pasangan/anak.",
  },
  {
    id: "medical_parents",
    nameEn: "Medical (parents & grandparents)",
    nameBm: "Perubatan (ibu bapa & datuk nenek)",
    cap: 8000,
    descriptionEn:
      "Medical treatment, dental treatment, special needs and caregiving expenses, full medical exam and vaccination for parents/grandparents.",
    descriptionBm:
      "Rawatan perubatan, rawatan pergigian, keperluan khas dan penjagaan, pemeriksaan perubatan penuh dan pemvaksinan untuk ibu bapa/datuk nenek.",
  },
  {
    id: "disability_equipment",
    nameEn: "Disability support equipment",
    nameBm: "Peralatan sokongan OKU",
    cap: 6000,
    descriptionEn:
      "Basic supporting equipment for a disabled self, spouse, child, or parent (e.g. wheelchair, hearing aid).",
    descriptionBm:
      "Peralatan sokongan asas untuk OKU (diri sendiri, pasangan, anak, atau ibu bapa) seperti kerusi roda, alat bantu dengar.",
  },
  {
    id: "child_disability_intervention",
    nameEn: "Disabled child early intervention",
    nameBm: "Intervensi awal anak kurang upaya",
    cap: 6000,
    descriptionEn:
      "Diagnosis, early intervention or rehabilitation for a child aged 18 and below with learning disabilities.",
    descriptionBm:
      "Diagnosis, intervensi awal atau pemulihan untuk anak berumur 18 tahun ke bawah yang kurang upaya pembelajaran.",
  },
  {
    id: "education_fees_self",
    nameEn: "Self education fees",
    nameBm: "Yuran pengajian diri sendiri",
    cap: 7000,
    descriptionEn:
      "Course fees for your own further studies, professional courses, or skills/self-development courses.",
    descriptionBm:
      "Yuran kursus pengajian sendiri, kursus profesional, atau kursus peningkatan kemahiran/kemajuan diri.",
  },
  {
    id: "lifestyle",
    nameEn: "Lifestyle",
    nameBm: "Gaya hidup",
    cap: 2500,
    descriptionEn:
      "Books/journals/magazines, personal computer, smartphone or tablet, internet subscription, skills course fees — for self, spouse or child.",
    descriptionBm:
      "Buku/jurnal/majalah, komputer peribadi, telefon pintar atau tablet, langganan internet, yuran kursus kemahiran — untuk diri, pasangan atau anak.",
  },
  {
    id: "lifestyle_sports",
    nameEn: "Sports & gym",
    nameBm: "Sukan & gimnasium",
    cap: 1000,
    descriptionEn:
      "Sports equipment, sports facility rental/entry fees, competition registration, gym membership.",
    descriptionBm:
      "Peralatan sukan, sewaan/fi kemasukan fasiliti sukan, pendaftaran pertandingan, yuran keahlian gimnasium.",
  },
  {
    id: "ev_compost",
    nameEn: "EV charger & compost machine",
    nameBm: "Pengecas EV & mesin kompos",
    cap: 2500,
    descriptionEn:
      "Electric vehicle charging equipment and domestic food waste composting machine, for own use.",
    descriptionBm:
      "Alat pengecasan kenderaan elektrik dan mesin kompos sisa makanan domestik, untuk kegunaan sendiri.",
  },
  {
    id: "life_insurance_epf",
    nameEn: "Life insurance & EPF",
    nameBm: "Insurans nyawa & KWSP",
    cap: 7000,
    descriptionEn: "Life insurance premiums and EPF/KWSP contributions.",
    descriptionBm: "Premium insurans nyawa dan caruman KWSP.",
  },
  {
    id: "education_medical_insurance",
    nameEn: "Education & medical insurance",
    nameBm: "Insurans pendidikan & perubatan",
    cap: 4000,
    descriptionEn:
      "Education and medical insurance premiums for self, spouse or child.",
    descriptionBm:
      "Premium insurans pendidikan dan perubatan untuk diri, pasangan atau anak.",
  },
  {
    id: "socso",
    nameEn: "SOCSO contribution",
    nameBm: "Caruman PERKESO",
    cap: 350,
    descriptionEn: "Contributions to the Social Security Organization (SOCSO/PERKESO).",
    descriptionBm: "Caruman kepada Pertubuhan Keselamatan Sosial (PERKESO).",
  },
  {
    id: "prs_annuity",
    nameEn: "PRS & deferred annuity",
    nameBm: "PRS & anuiti tertangguh",
    cap: 3000,
    descriptionEn: "Private Retirement Scheme contributions and deferred annuity premiums.",
    descriptionBm: "Caruman Skim Persaraan Swasta (PRS) dan premium anuiti tertangguh.",
  },
  {
    id: "sspn",
    nameEn: "SSPN net savings",
    nameBm: "SSPN (simpanan bersih)",
    cap: 8000,
    descriptionEn: "Net deposit into an SSPN education savings account.",
    descriptionBm: "Simpanan bersih ke dalam akaun SSPN.",
  },
  {
    id: "childcare_fees",
    nameEn: "Childcare / kindergarten fees",
    nameBm: "Yuran taska / tadika",
    cap: 3000,
    descriptionEn: "Fees paid to a registered childcare centre or kindergarten for a child aged 6 and below.",
    descriptionBm: "Yuran ke taska/tadika berdaftar untuk anak berumur 6 tahun ke bawah.",
  },
  {
    id: "breastfeeding_equipment",
    nameEn: "Breastfeeding equipment",
    nameBm: "Peralatan penyusuan ibu",
    cap: 1000,
    descriptionEn:
      "Breastfeeding equipment for a child aged 2 and below (female taxpayers, once every 2 years).",
    descriptionBm:
      "Peralatan penyusuan ibu untuk anak berumur 2 tahun ke bawah (pembayar cukai wanita, sekali setiap 2 tahun).",
  },
  {
    id: "housing_loan_interest",
    nameEn: "First home loan interest",
    nameBm: "Faedah pinjaman rumah pertama",
    cap: 7000,
    descriptionEn:
      "Interest paid on a housing loan for a first residential property (SPA signed 2025-2027).",
    descriptionBm:
      "Faedah dibayar untuk pinjaman perumahan bagi rumah kediaman pertama (SPB ditandatangani 2025-2027).",
  },
  {
    id: "not_deductible",
    nameEn: "Personal (not tax-deductible)",
    nameBm: "Peribadi (tidak layak pelepasan)",
    cap: 0,
    descriptionEn: "General personal spending that does not qualify for any tax relief.",
    descriptionBm: "Perbelanjaan peribadi am yang tidak layak untuk sebarang pelepasan cukai.",
  },
];

export const RELIEF_CATEGORY_IDS = RELIEF_CATEGORIES.map((c) => c.id);

export function getReliefCategory(id: string): ReliefCategory {
  return (
    RELIEF_CATEGORIES.find((c) => c.id === id) ??
    RELIEF_CATEGORIES[RELIEF_CATEGORIES.length - 1]
  );
}

export function reliefCap(id: string): number {
  return getReliefCategory(id).cap;
}
