CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  main_category TEXT NOT NULL,
  monthly_limit REAL NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, main_category)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets (user_id);
