export type Lang = "en" | "bm";

export const translations = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.getStarted": "Get started free",

    "hero.badge": "Personal tax relief tracker for Malaysia",
    "hero.title1": "Every receipt.",
    "hero.title2": "Know what you can claim.",
    "hero.subtitle":
      "Snap or upload your receipts. AI sorts each one into the right LHDN tax relief category and tracks how much of your annual limit you've used.",
    "hero.cta": "Start free",
    "hero.note": "100% free · Unlimited scans · No credit card · No sign-up required",
    "hero.trustedBy":
      "For Malaysian individual taxpayers tracking their own annual relief",
    "hero.strip": "Every receipt scanned and matched to an LHDN relief category",

    "relief.eyebrow": "Tax relief categories",
    "relief.title": "Based on LHDN's official YA2025 relief list",
    "relief.subtitle":
      "Every receipt you scan is matched to one of these categories, with its official annual cap.",
    "relief.cap": "Annual cap",
    "relief.disclaimer":
      "Simplified summary for planning purposes only, based on LHDN's published individual relief brochure. Always confirm with LHDN or a licensed tax agent before filing.",

    "privacy.eyebrow": "Privacy & trust",
    "privacy.title": "Your receipts are yours. Full stop.",
    "privacy.point1.title": "No ad trackers",
    "privacy.point1.body":
      "Zero ad-tracking scripts on this site. Your tax data is never used for advertising.",
    "privacy.point2.title": "Never trains AI",
    "privacy.point2.body":
      "Your receipts are never used to train public AI models. Analysis happens, then is discarded.",
    "privacy.point3.title": "Encrypted storage",
    "privacy.point3.body":
      "Receipt data and images are stored on Cloudflare's infrastructure, not shared with third parties.",
    "privacy.point4.title": "7-year retention",
    "privacy.point4.body":
      "LHDN requires 7-year records under ITA 1967 s.82. Kept automatically while you use the app.",
    "privacy.point5.title": "Export anytime",
    "privacy.point5.body":
      "Download your data as CSV whenever you like. No lock-in.",
    "privacy.point6.title": "Not affiliated with LHDN",
    "privacy.point6.body":
      "Tax Me AI is an independent tool, not affiliated with or endorsed by LHDN / IRBM. Always file on mytax.hasil.gov.my.",

    "free.eyebrow": "Pricing",
    "free.title": "100% free. No catch.",
    "free.subtitle":
      "Tax Me AI is free for everyone — no scan limits, no credit card, no hidden tiers.",
    "free.item1": "Unlimited receipt scans",
    "free.item2": "AI extraction — merchant, amount, date, category",
    "free.item3": "Automatic LHDN relief category matching",
    "free.item4": "CSV export for your own records",
    "free.item5": "Private, Cloudflare-hosted storage",
    "free.cta": "Start scanning free",

    "cta.title": "Stop guessing. Start claiming.",
    "cta.subtitle":
      "Every receipt you have not scanned is a tax relief you might miss.",
    "cta.button": "Try it free — unlimited scans",
    "cta.note": "No credit card · No sign-up · Free forever",

    "footer.tagline":
      "Scan paper into clean, organised records, matched to the right LHDN tax relief category.",
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.talk": "Talk to us",
    "footer.disclaimer":
      "Tax Me AI is an independent tool and is not affiliated with or endorsed by LHDN / IRBM. Tax relief matches are AI-generated estimates — verify before filing.",
    "footer.rights": "All rights reserved.",

    "dashboard.title": "Your receipts",
    "dashboard.subtitle":
      "Scan, review and export — synced to your Cloudflare D1 database and R2 storage.",
    "dashboard.export": "Export CSV",
    "dashboard.loadError": "Failed to load receipts.",
    "dashboard.reliefSummary": "Tax relief summary",
    "dashboard.reliefSummaryFor": "For year of assessment",
    "dashboard.totalClaimable": "Total claimable",

    "upload.drop": "Drop a receipt photo here, or click to upload",
    "upload.hint": "JPG, PNG or WEBP — up to 10MB",
    "upload.scanning": "Reading receipt with AI…",
    "upload.tryAgain": "Try again",
    "upload.review": "Review extracted details",
    "upload.merchant": "Merchant",
    "upload.date": "Date",
    "upload.amount": "Amount (RM)",
    "upload.category": "Tax relief category",
    "upload.annualCap": "Annual cap",
    "upload.save": "Save receipt",
    "upload.saving": "Saving…",
    "upload.cancel": "Cancel",

    "table.receipt": "Receipt",
    "table.date": "Date",
    "table.merchant": "Merchant",
    "table.amount": "Amount",
    "table.category": "Relief category",
    "table.actions": "",
    "table.empty": "No receipts yet. Upload your first one above.",
    "table.delete": "Delete",
    "table.deleting": "Deleting…",

    "summary.totalReceipts": "Total receipts",
    "summary.totalSpent": "Total spent",
    "summary.claimable": "Claimable this year",
  },
  bm: {
    "nav.dashboard": "Papan Pemuka",
    "nav.getStarted": "Mula percuma",

    "hero.badge": "Penjejak pelepasan cukai peribadi untuk Malaysia",
    "hero.title1": "Setiap resit.",
    "hero.title2": "Tahu apa yang boleh dituntut.",
    "hero.subtitle":
      "Snap atau muat naik resit anda. AI akan susun setiap satu ke kategori pelepasan cukai LHDN yang betul dan jejak berapa banyak had tahunan anda telah digunakan.",
    "hero.cta": "Mula percuma",
    "hero.note": "100% percuma · Imbasan tanpa had · Tiada kad kredit · Tiada pendaftaran",
    "hero.trustedBy":
      "Untuk pembayar cukai individu Malaysia yang menjejak pelepasan tahunan sendiri",
    "hero.strip": "Setiap resit diimbas dan dipadankan dengan kategori pelepasan LHDN",

    "relief.eyebrow": "Kategori pelepasan cukai",
    "relief.title": "Berdasarkan senarai pelepasan rasmi LHDN YA2025",
    "relief.subtitle":
      "Setiap resit yang anda imbas dipadankan dengan salah satu kategori ini, berserta had tahunan rasminya.",
    "relief.cap": "Had tahunan",
    "relief.disclaimer":
      "Ringkasan mudah untuk tujuan perancangan sahaja, berdasarkan risalah pelepasan individu rasmi LHDN. Sila sahkan dengan LHDN atau ejen cukai bertauliah sebelum memfailkan.",

    "privacy.eyebrow": "Privasi & kepercayaan",
    "privacy.title": "Resit anda milik anda. Titik.",
    "privacy.point1.title": "Tiada penjejak iklan",
    "privacy.point1.body":
      "Sifar skrip penjejakan iklan di laman ini. Data cukai anda tidak digunakan untuk iklan.",
    "privacy.point2.title": "Tidak melatih AI",
    "privacy.point2.body":
      "Resit anda tidak digunakan untuk melatih model AI awam. Analisis dibuat, kemudian dibuang.",
    "privacy.point3.title": "Storan disulitkan",
    "privacy.point3.body":
      "Data dan imej resit disimpan di infrastruktur Cloudflare, tidak dikongsi dengan pihak ketiga.",
    "privacy.point4.title": "Simpanan 7 tahun",
    "privacy.point4.body":
      "LHDN memerlukan rekod 7 tahun di bawah ITA 1967 s.82. Disimpan secara automatik selagi anda guna aplikasi ini.",
    "privacy.point5.title": "Eksport bila-bila masa",
    "privacy.point5.body":
      "Muat turun data anda sebagai CSV bila-bila masa. Tiada lock-in.",
    "privacy.point6.title": "Tiada gabungan dengan LHDN",
    "privacy.point6.body":
      "Tax Me AI adalah alat bebas, tidak bergabung atau disahkan oleh LHDN / IRBM. Sentiasa failkan di mytax.hasil.gov.my.",

    "free.eyebrow": "Harga",
    "free.title": "100% percuma. Tiada kejutan.",
    "free.subtitle":
      "Tax Me AI percuma untuk semua orang — tiada had imbasan, tiada kad kredit, tiada peringkat tersembunyi.",
    "free.item1": "Imbasan resit tanpa had",
    "free.item2": "Ekstraksi AI — peniaga, jumlah, tarikh, kategori",
    "free.item3": "Padanan automatik kategori pelepasan LHDN",
    "free.item4": "Eksport CSV untuk rekod sendiri",
    "free.item5": "Storan peribadi dihoskan di Cloudflare",
    "free.cta": "Mula imbas percuma",

    "cta.title": "Berhenti meneka. Mula menuntut.",
    "cta.subtitle":
      "Setiap resit yang belum diimbas adalah pelepasan cukai yang mungkin terlepas.",
    "cta.button": "Cuba percuma — imbasan tanpa had",
    "cta.note": "Tiada kad kredit · Tiada pendaftaran · Percuma selamanya",

    "footer.tagline":
      "Imbas kertas menjadi rekod bersih dan tersusun, dipadankan dengan kategori pelepasan cukai LHDN yang betul.",
    "footer.product": "Produk",
    "footer.company": "Syarikat",
    "footer.talk": "Hubungi kami",
    "footer.disclaimer":
      "Tax Me AI adalah alat bebas dan tidak bergabung atau disahkan oleh LHDN / IRBM. Padanan pelepasan cukai adalah anggaran janaan AI — sahkan sebelum memfailkan.",
    "footer.rights": "Hak cipta terpelihara.",

    "dashboard.title": "Resit anda",
    "dashboard.subtitle":
      "Imbas, semak dan eksport — disegerakkan ke pangkalan data D1 dan storan R2 Cloudflare anda.",
    "dashboard.export": "Eksport CSV",
    "dashboard.loadError": "Gagal memuatkan resit.",
    "dashboard.reliefSummary": "Ringkasan pelepasan cukai",
    "dashboard.reliefSummaryFor": "Bagi tahun taksiran",
    "dashboard.totalClaimable": "Jumlah boleh dituntut",

    "upload.drop": "Letak gambar resit di sini, atau klik untuk muat naik",
    "upload.hint": "JPG, PNG atau WEBP — sehingga 10MB",
    "upload.scanning": "Membaca resit dengan AI…",
    "upload.tryAgain": "Cuba lagi",
    "upload.review": "Semak butiran yang diekstrak",
    "upload.merchant": "Peniaga",
    "upload.date": "Tarikh",
    "upload.amount": "Jumlah (RM)",
    "upload.category": "Kategori pelepasan cukai",
    "upload.annualCap": "Had tahunan",
    "upload.save": "Simpan resit",
    "upload.saving": "Menyimpan…",
    "upload.cancel": "Batal",

    "table.receipt": "Resit",
    "table.date": "Tarikh",
    "table.merchant": "Peniaga",
    "table.amount": "Jumlah",
    "table.category": "Kategori pelepasan",
    "table.actions": "",
    "table.empty": "Belum ada resit. Muat naik yang pertama di atas.",
    "table.delete": "Padam",
    "table.deleting": "Memadam…",

    "summary.totalReceipts": "Jumlah resit",
    "summary.totalSpent": "Jumlah perbelanjaan",
    "summary.claimable": "Boleh dituntut tahun ini",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];
