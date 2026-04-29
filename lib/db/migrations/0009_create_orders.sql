-- Migration: create orders table for teams
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    products JSONB NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    taxes NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    type VARCHAR(32) NOT NULL,
    payment VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    price NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_team_id ON orders(team_id);