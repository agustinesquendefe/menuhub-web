"use client";
import { useEffect, useState } from "react";

export default function CompanyFeesManager({ companyId }: { companyId: number }) {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ country: '', state: '', feePercent: '', feeFixed: '', currency: 'USD' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/company-fees?companyId=${companyId}`)
      .then(res => res.json())
      .then(data => { setFees(data.fees || []); setLoading(false); });
  }, [companyId]);

  function handleEdit(fee: any) {
    setEditing(fee);
    setForm({ ...fee });
  }
  function handleCancel() {
    setEditing(null);
    setForm({ country: '', state: '', feePercent: '', feeFixed: '', currency: 'USD' });
  }
  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este fee?')) return;
    await fetch(`/api/company-fees?id=${id}`, { method: 'DELETE' });
    setFees(fees.filter(f => f.id !== id));
    handleCancel();
  }
  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);
    const payload = { ...form, companyId, feePercent: Number(form.feePercent), feeFixed: Number(form.feeFixed) };
    let res;
    if (editing) {
      res = await fetch('/api/company-fees', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editing.id }) });
    } else {
      res = await fetch('/api/company-fees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error || 'Error'); return; }
    if (editing) setFees(fees.map(f => f.id === editing.id ? data.fee : f));
    else setFees([...fees, data.fee]);
    handleCancel();
  }

  return (
    <div className="border rounded p-4 bg-white mt-6">
      <h2 className="font-bold mb-2">Fees por país/estado</h2>
      {loading ? <div>Cargando...</div> : (
        <table className="min-w-full text-sm mb-4">
          <thead>
            <tr>
              <th>País</th>
              <th>Estado</th>
              <th>Fee (%)</th>
              <th>Fee fijo</th>
              <th>Moneda</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {fees.map(fee => (
              <tr key={fee.id} className={editing && editing.id === fee.id ? 'bg-yellow-50' : ''}>
                <td>{fee.country}</td>
                <td>{fee.state || '-'}</td>
                <td>{fee.feePercent}</td>
                <td>{fee.feeFixed}</td>
                <td>{fee.currency}</td>
                <td>
                  <button className="text-blue-600 mr-2" onClick={() => handleEdit(fee)}>Editar</button>
                  <button className="text-red-600" onClick={() => handleDelete(fee.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form className="flex flex-wrap gap-2 items-end" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs">País</label>
          <input className="border rounded px-2 py-1 text-sm" name="country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value.toUpperCase() })} maxLength={2} required />
        </div>
        <div>
          <label className="block text-xs">Estado (opcional)</label>
          <input className="border rounded px-2 py-1 text-sm" name="state" value={form.state || ''} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} maxLength={2} />
        </div>
        <div>
          <label className="block text-xs">Fee (%)</label>
          <input className="border rounded px-2 py-1 text-sm" name="feePercent" type="number" step="0.001" value={form.feePercent} onChange={e => setForm({ ...form, feePercent: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs">Fee fijo</label>
          <input className="border rounded px-2 py-1 text-sm" name="feeFixed" type="number" step="0.01" value={form.feeFixed} onChange={e => setForm({ ...form, feeFixed: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs">Moneda</label>
          <input className="border rounded px-2 py-1 text-sm" name="currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} maxLength={8} required />
        </div>
        <button type="submit" className="bg-orange-600 text-white text-sm hover:bg-orange-700 px-3 py-1 rounded mt-5 cursor-pointer">{editing ? 'Actualizar' : 'Agregar'}</button>
        {editing && <button type="button" className="ml-2 px-3 py-1 rounded border" onClick={handleCancel}>Cancelar</button>}
        {error && <span className="text-red-600 text-xs ml-2">{error}</span>}
      </form>
    </div>
  );
}
