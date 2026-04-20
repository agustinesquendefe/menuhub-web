-- Add allergen_warning to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allergen_warning BOOLEAN NOT NULL DEFAULT FALSE;

-- Create team_policies table (one row per team, upsert pattern)
CREATE TABLE IF NOT EXISTS team_policies (
  id                   SERIAL PRIMARY KEY,
  team_id              INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  warn_raw_ingredients BOOLEAN NOT NULL DEFAULT FALSE,
  warn_allergens       BOOLEAN NOT NULL DEFAULT FALSE,
  warn_alcohol         BOOLEAN NOT NULL DEFAULT FALSE,
  warn_gluten          BOOLEAN NOT NULL DEFAULT FALSE,
  warn_nuts            BOOLEAN NOT NULL DEFAULT FALSE,
  warn_dairy           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
