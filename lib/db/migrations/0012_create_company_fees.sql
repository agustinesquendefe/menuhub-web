-- Migration: create company_fees table for per-country/state fees
CREATE TABLE company_fees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    country VARCHAR(2) NOT NULL,
    state VARCHAR(2), -- nullable, only for US
    fee_percent DECIMAL(6,3) NOT NULL DEFAULT 0,
    fee_fixed DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, country, state)
);
