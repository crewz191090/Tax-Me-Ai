DROP TABLE IF EXISTS receipts;

CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  merchant TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  image_key TEXT,
  is_e_invoice INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_receipts_date ON receipts (date);
CREATE INDEX idx_receipts_created_at ON receipts (created_at);
