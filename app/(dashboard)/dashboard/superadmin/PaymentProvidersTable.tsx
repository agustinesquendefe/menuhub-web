
import { getPaymentProviders, createPaymentProvider } from '@/lib/db/payment-provider-actions';
import PaymentProviderForm from './PaymentProviderForm';


export default async function PaymentProvidersTable() {
  const providers = await getPaymentProviders();

  async function handleCreate(form) {
    'use server';
    await createPaymentProvider({
      ...form,
      feePercent: parseFloat(form.feePercent),
      feeFixed: parseFloat(form.feeFixed),
    });
  }

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-2">Configured Payment Methods</h2>
      <PaymentProviderForm onSubmit={handleCreate} />
      <table className="min-w-full border text-sm mt-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Provider</th>
            <th className="border px-2 py-1">Country</th>
            <th className="border px-2 py-1">Currency</th>
            <th className="border px-2 py-1">Fee (%)</th>
            <th className="border px-2 py-1">Fixed Fee</th>
            <th className="border px-2 py-1">Active</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.name}</td>
              <td className="border px-2 py-1">{p.country}</td>
              <td className="border px-2 py-1">{p.currency}</td>
              <td className="border px-2 py-1">{p.feePercent}%</td>
              <td className="border px-2 py-1">${p.feeFixed}</td>
              <td className="border px-2 py-1">{p.active ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">
        Example: Stripe for the US charges 2.9% + $0.30 per transaction. Mercado Pago for LATAM may use different values.
      </p>
    </section>
  );
}
