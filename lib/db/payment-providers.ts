import {
  pgTable,
  serial,
  varchar,
  decimal,
  boolean,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const paymentProviders = pgTable('payment_providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // Stripe, Mercado Pago, etc
  country: varchar('country', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 10 }), // USD, ARS, etc
  feePercent: decimal('fee_percent', { precision: 5, scale: 2 }).notNull(), // Ej: 2.90
  feeFixed: decimal('fee_fixed', { precision: 10, scale: 2 }).notNull(), // Ej: 0.30
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
