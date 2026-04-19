-- ─── Sizes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sizes (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image TEXT,
  show_picture BOOLEAN NOT NULL DEFAULT FALSE,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'MXN',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Extras ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extras (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image TEXT,
  show_picture BOOLEAN NOT NULL DEFAULT FALSE,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'MXN',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Additions ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS additions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image TEXT,
  show_picture BOOLEAN NOT NULL DEFAULT FALSE,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'MXN',
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Junction tables ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_sizes (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id INTEGER NOT NULL REFERENCES sizes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_extras (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  extra_id INTEGER NOT NULL REFERENCES extras(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_additions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  addition_id INTEGER NOT NULL REFERENCES additions(id) ON DELETE CASCADE
);
