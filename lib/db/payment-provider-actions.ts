import { db } from './drizzle';
import { paymentProviders } from './payment-providers';

export async function createPaymentProvider({ name, country, currency, feePercent, feeFixed, active = true }) {
  return db.insert(paymentProviders).values({
    name,
    country,
    currency,
    feePercent,
    feeFixed,
    active,
  });
}

export async function getPaymentProviders() {
  return db.select().from(paymentProviders);
}

export async function updatePaymentProvider(id, data) {
  return db.update(paymentProviders).set(data).where(paymentProviders.id.eq(id));
}

export async function deletePaymentProvider(id) {
  return db.delete(paymentProviders).where(paymentProviders.id.eq(id));
}
