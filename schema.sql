CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  merchant TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  deductible_percent INTEGER NOT NULL,
  notes TEXT,
  image_key TEXT,
  is_e_invoice INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts (date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts (created_at);
