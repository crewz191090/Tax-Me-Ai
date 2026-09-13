CREATE TABLE IF NOT EXISTS monthly_income (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount REAL NOT NULL,
  income_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_income_user_id ON monthly_income (user_id);
