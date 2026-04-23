
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
      <h2 className="text-xl font-semibold mb-2">Métodos de Pago Configurados</h2>
      <PaymentProviderForm onSubmit={handleCreate} />
      <table className="min-w-full border text-sm mt-4">
        <thead>
          <tr>
            <th className="border px-2 py-1">Proveedor</th>
            <th className="border px-2 py-1">País</th>
            <th className="border px-2 py-1">Moneda</th>
            <th className="border px-2 py-1">Fee (%)</th>
            <th className="border px-2 py-1">Fee Fijo</th>
            <th className="border px-2 py-1">Activo</th>
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
              <td className="border px-2 py-1">{p.active ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground mt-2">
        Ejemplo: Stripe para US cobra 2.9% + $0.30 por transacción. Mercado Pago para LATAM puede tener otros valores.
      </p>
    </section>
  );
}
