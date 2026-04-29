-- Migration: add order_code to orders table
ALTER TABLE orders ADD COLUMN order_code VARCHAR(12) NOT NULL UNIQUE;
