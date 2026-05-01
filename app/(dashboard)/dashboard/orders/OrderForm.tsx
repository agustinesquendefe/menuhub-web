"use client";
import { useState } from "react";

export function OrderForm({ onCreated, teamId }: { onCreated?: () => void, teamId?: number }) {
  const [form, setForm] = useState({
    products: '',
    subtotal: '',
    taxes: '',
    total: '',
    type: '',
    payment: '',
    status: '',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'subtotal' || e.target.name === 'taxes') {
      const subtotal = Number(next.subtotal) || 0;
      const fees = Number(next.taxes) || 0;
      next.total = (subtotal + fees).toFixed(2);
      next.price = next.total;
    }
    setForm(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const products = JSON.parse(form.products);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: JSON.parse(form.products),
          subtotal: form.subtotal,
          taxes: form.taxes,
          total: form.total,
          type: form.type,
          payment: form.payment,
          status: form.status,
          price: form.price,
          teamId,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || 'Error creating order.');
      } else {
        setForm({ products: '', subtotal: '', taxes: '', total: '', type: '', payment: '', status: '', price: '' });
        if (onCreated) onCreated();
      }
    } catch {
      setError('Error creating order.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-2">
      <textarea name="products" value={form.products} onChange={handleChange} placeholder="[{'id':1,'qty':2}]" className="border p-1 w-full text-xs" required />
      <input name="subtotal" value={form.subtotal} onChange={handleChange} placeholder="Subtotal" className="border p-1 w-full" required />
      <input name="taxes" value={form.taxes} onChange={handleChange} placeholder="Fees" className="border p-1 w-full" required />
      <input name="total" value={form.total} placeholder="Total" className="border p-1 w-full bg-gray-100" readOnly required />
      <input name="type" value={form.type} onChange={handleChange} placeholder="Type" className="border p-1 w-full" required />
      <input name="payment" value={form.payment} onChange={handleChange} placeholder="Payment" className="border p-1 w-full" required />
      <input name="status" value={form.status} onChange={handleChange} placeholder="Status" className="border p-1 w-full" required />
      <input name="price" value={form.price} onChange={handleChange} placeholder="Price (optional)" className="border p-1 w-full" />
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create order'}</button>
      {error && <div className="text-red-600 text-xs">{error}</div>}
    </form>
  );
}
