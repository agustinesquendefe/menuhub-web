"use client";

import { useState } from "react";

export default function PaymentProviderForm({ onSubmit, initialValues }: { onSubmit: (form: any) => Promise<boolean>; initialValues?: any }) {
  const [form, setForm] = useState(
    initialValues || {
      name: "",
      country: "",
      currency: "",
      feePercent: "",
      feeFixed: "",
      active: true,
    }
  );
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((f: any) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  }

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs">
            Provider
        </label>
        <input name="name" value={form.name} onChange={handleChange} className="border px-2 py-1 w-full" required />
      </div>
      <div>
        <label className="block text-xs">
            Country
        </label>
        <input name="country" value={form.country} onChange={handleChange} className="border px-2 py-1 w-full" required />
      </div>
      <div>
        <label className="block text-xs">
            Currency
        </label>
        <input name="currency" value={form.currency} onChange={handleChange} className="border px-2 py-1 w-full" required />
      </div>
      <div>
        <label className="block text-xs">
            Fee (%)
        </label>
        <input name="feePercent" value={form.feePercent} onChange={handleChange} className="border px-2 py-1 w-full" required type="number" step="0.01" />
      </div>
      <div>
        <label className="block text-xs">
            Fixed Fee
        </label>
        <input name="feeFixed" value={form.feeFixed} onChange={handleChange} className="border px-2 py-1 w-full" required type="number" step="0.01" />
      </div>
      <div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> Active
        </label>
      </div>
      <button type="submit" className="bg-gray-800 hover:bg-gray-950 cursor-pointer text-white px-4 py-1 rounded" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
