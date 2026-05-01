"use client";

import { useEffect, useState } from "react";

import PaymentProviderForm from "./PaymentProviderForm";

export default function PaymentProvidersTable() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function fetchProviders() {
    setLoading(true);
    const res = await fetch("/api/payment-providers");
    const data = await res.json();
    setProviders(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchProviders();
  }, []);

  async function handleCreate(form: any) {
    setMessage("");
    const res = await fetch("/api/payment-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
            setMessage("Payment method saved successfully.");
      fetchProviders();
      setShowForm(false);
      return true;
    } else {
            setMessage("Error saving payment method.");
      return false;
    }
  }

  return (
    <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">
            Configured Payment Methods
        </h2>
        {message && <div className="mb-2 text-green-600">{message}</div>}
        <table className="min-w-full border text-sm mt-4">
            <thead>
            <tr>
                <th className="border px-2 py-1">
                    Provider
                </th>
                <th className="border px-2 py-1">
                    Country
                </th>
                <th className="border px-2 py-1">
                    Currency
                </th>
                <th className="border px-2 py-1">
                    Fee (%)
                </th>
                <th className="border px-2 py-1">
                    Fixed Fee
                </th>
                <th className="border px-2 py-1">
                    Active
                </th>
            </tr>
            </thead>
            <tbody>
            {loading ? (
                <tr>
                    <td colSpan={6} className="text-center">
                        Loading...
                    </td>
                </tr>
            ) : providers.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center">
                        No configured payment methods
                    </td>
                </tr>
            ) : providers.map((p: any) => (
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
        <div className="mt-6">
            {!showForm ? (
            <button
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm cursor-pointer"
                onClick={() => setShowForm(true)}
            >
                Add new provider
            </button>
            ) : (
            <div className="border rounded p-4 mt-2 bg-gray-50">
                <h3 className="font-semibold mb-2">
                    New payment method
                </h3>
                <PaymentProviderForm onSubmit={handleCreate} />
                <button
                    className="bg-white border border-black mt-2 cursor-pointer text-black hover:bg-black hover:text-white px-4 py-1 rounded"
                    onClick={() => setShowForm(false)}
                    type="button"
                >
                Cancel
                </button>
            </div>
            )}
        </div>
    </section>
  );
}
