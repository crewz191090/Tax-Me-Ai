-- Adds general expense-tracking fields to receipts, additive only.
-- The old `category` column is left in place (unused by new code) and
-- copied into the new `relief_category` column so existing tax-relief
-- data survives. Safe to run once against a table that already has data.

ALTER TABLE receipts ADD COLUMN main_category TEXT NOT NULL DEFAULT 'other';
ALTER TABLE receipts ADD COLUMN subcategory TEXT NOT NULL DEFAULT 'uncategorized';
ALTER TABLE receipts ADD COLUMN relief_category TEXT;
ALTER TABLE receipts ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';
ALTER TABLE receipts ADD COLUMN payment_method TEXT;
ALTER TABLE receipts ADD COLUMN account_name TEXT;
ALTER TABLE receipts ADD COLUMN tags TEXT;
ALTER TABLE receipts ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;
ALTER TABLE receipts ADD COLUMN location TEXT;

UPDATE receipts
SET relief_category = CASE WHEN category = 'not_deductible' THEN NULL ELSE category END
WHERE relief_category IS NULL;

-- Now safe to drop — its data has been copied into relief_category above.
ALTER TABLE receipts DROP COLUMN category;

CREATE INDEX IF NOT EXISTS idx_receipts_main_category ON receipts (main_category);
CREATE INDEX IF NOT EXISTS idx_receipts_type ON receipts (type);
