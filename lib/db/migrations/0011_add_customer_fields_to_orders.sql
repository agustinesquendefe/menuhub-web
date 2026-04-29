-- Migration: add customer fields to orders table
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(30);
