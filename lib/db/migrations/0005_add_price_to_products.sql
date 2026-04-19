-- Add price and currency columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'MXN';

-- Migrate existing prices from the prices table into products
UPDATE products p
SET price = pr.amount,
    currency = pr.currency
FROM (
    SELECT DISTINCT ON (product_id) product_id, amount, currency
    FROM prices
    ORDER BY product_id, updated_at DESC
) pr
WHERE p.id = pr.product_id;
