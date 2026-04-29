"use client";

import { useState } from "react";

export function EditOrderForm({ order, onUpdated, onCancel }: { order: any, onUpdated?: () => void, onCancel?: () => void }) {
  
    const [form, setForm] = useState({
      products: typeof order.products === 'string' ? order.products : JSON.stringify(order.products),
      subtotal: order.subtotal?.toString() ?? '',
      taxes: order.taxes?.toString() ?? '',
      total: order.total?.toString() ?? '',
      type: order.type?.toString() ?? '',
      payment: order.payment?.toString() ?? '',
      status: order.status?.toString() ?? '',
      price: order.price !== undefined && order.price !== null ? order.price.toString() : '',
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
      

      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          products,
          subtotal: form.subtotal,
          taxes: form.taxes,
          total: form.total,
          type: form.type,
          payment: form.payment,
          status: form.status,
          price: form.price,
        }),
      });

      if (onUpdated) onUpdated();

    } catch (err) {
      setError('Error al actualizar la orden.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-2 space-y-2 bg-gray-50 p-2 rounded">
      <textarea name="products" value={form.products} onChange={handleChange} className="border p-1 w-full text-xs" required />
      <input name="subtotal" value={form.subtotal} onChange={handleChange} placeholder="Subtotal" className="border p-1 w-full" required />
      <input name="taxes" value={form.taxes} onChange={handleChange} placeholder="Fees" className="border p-1 w-full" required />
      <input name="total" value={form.total} className="border p-1 w-full bg-gray-100" readOnly required />
      <input name="type" value={form.type} onChange={handleChange} className="border p-1 w-full" required />
      <input name="payment" value={form.payment} onChange={handleChange} className="border p-1 w-full" required />
      <input name="status" value={form.status} onChange={handleChange} className="border p-1 w-full" required />
      <input name="price" value={form.price} onChange={handleChange} className="border p-1 w-full" />
      <div className="flex gap-2">
        <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" className="bg-gray-300 px-4 py-1 rounded" onClick={onCancel}>Cancelar</button>
      </div>
      {error && <div className="text-red-600 text-xs">{error}</div>}
    </form>
  );
}
