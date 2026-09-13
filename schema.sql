-- Canonical schema for a fresh database. If you're migrating an existing
-- database, use the numbered files in migrations/ instead — this file
-- assumes no data exists yet in these tables.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  merchant TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  main_category TEXT NOT NULL DEFAULT 'other',
  subcategory TEXT NOT NULL DEFAULT 'uncategorized',
  relief_category TEXT,
  type TEXT NOT NULL DEFAULT 'expense',
  payment_method TEXT,
  account_name TEXT,
  tags TEXT,
  is_recurring INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  image_key TEXT,
  is_e_invoice INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts (date);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts (created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_main_category ON receipts (main_category);
CREATE INDEX IF NOT EXISTS idx_receipts_type ON receipts (type);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  main_category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, main_category)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets (user_id);

CREATE TABLE IF NOT EXISTS income_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount REAL NOT NULL,
  income_type TEXT NOT NULL,
  label TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_income_entries_user_period ON income_entries (user_id, year, month);
