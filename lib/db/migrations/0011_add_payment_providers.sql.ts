import { sql } from 'drizzle-orm';
import { paymentProviders } from '../payment-providers';

export async function up(db) {
  await db.schema.createTable(paymentProviders);
}

export async function down(db) {
  await db.schema.dropTable(paymentProviders);
}
