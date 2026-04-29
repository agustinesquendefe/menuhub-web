-- Migration: track pickup notifications sent for an order
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_notification_count INTEGER NOT NULL DEFAULT 0;
