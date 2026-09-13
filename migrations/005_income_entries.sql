-- Replaces the single-income-per-month model with multiple income entries
-- per month (e.g. salary + side income), each with its own type and label.
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

INSERT INTO income_entries (id, user_id, year, month, amount, income_type, created_at)
SELECT id, user_id, year, month, amount, income_type, created_at FROM monthly_income;

DROP TABLE IF EXISTS monthly_income;
