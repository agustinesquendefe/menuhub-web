"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SimpleModal } from "@/components/ui/SimpleModal";

const OrderForm = dynamic(() => import('./OrderForm').then(m => m.OrderForm), { ssr: false });

function EditStatusModal({ open, onClose, order, onUpdated }: { open: boolean, onClose: () => void, order: any, onUpdated: () => void }) {
  const [status, setStatus] = useState(order.status || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  const [pickupCount, setPickupCount] = useState(order.pickupNotificationCount || 0);

  async function handleUpdate(newStatus: string) {
    if (
      (newStatus === 'completada' || newStatus === 'cancelada') &&
      !window.confirm(`¿Seguro que quieres marcar esta orden como ${newStatus} y enviar un email al cliente?`)
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || json.error) setError(json.error || 'Error al actualizar');
      else {
        setStatus(newStatus);
        onUpdated();
        onClose();
      }
    } catch {
      setError('Error al actualizar');
    }
    setLoading(false);
  }

  async function handleNotify() {
    if (pickupCount >= 2) {
      setNotifyMsg('La notificación de recogida ya fue enviada 2 veces');
      return;
    }
    if (!window.confirm('¿Seguro que quieres notificar al cliente que su pedido está listo para recoger?')) {
      return;
    }

    setNotifyLoading(true);
    setNotifyMsg(null);
    try {
      const res = await fetch('/api/orders/notify-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setNotifyMsg(json.error || 'Error al notificar');
        setNotifyLoading(false);
        return;
      }
      setPickupCount(json.order?.pickupNotificationCount ?? pickupCount + 1);
      setNotifyMsg('Notificación enviada al cliente');
    } catch {
      setNotifyMsg('Error al notificar');
    }
    setNotifyLoading(false);
  }

  // Ticket visual
  let productsArr: any[] = [];
  try {
    productsArr = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
  } catch {}

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div className="flex flex-col gap-4 min-w-[340px] max-w-[95vw]">
        <h2 className="text-lg font-bold text-center mb-2">Orden #{order.orderCode || order.order_code || order.id}</h2>
        <div className="bg-gray-50 rounded p-4 border text-sm space-y-4">
          <div><b>Cliente:</b> {order.customerName}</div>
          <div><b>Email:</b> {order.customerEmail}</div>
          <div><b>Teléfono:</b> {order.customerPhone}</div>
          <div><b>Fecha:</b> {new Date(order.createdAt).toLocaleString()}</div>
          <div className="mt-2 mb-1 font-semibold">Productos:</div>
          <ul className="list-disc pl-4">
            {Array.isArray(productsArr) && productsArr.map((prod, idx) => {
              const qty = prod.quantity || prod.qty || 1;
              const name = prod.name || prod.product?.name || 'Producto';
              let opts: string[] = [];
              if (prod.options) opts = opts.concat(prod.options);
              if (prod.selectedSize?.name) opts.push(prod.selectedSize.name);
              if (Array.isArray(prod.selectedExtras)) opts = opts.concat(prod.selectedExtras.map((e: any) => e.name));
              if (Array.isArray(prod.selectedAdditions)) opts = opts.concat(prod.selectedAdditions.map((a: any) => a.name));
              const optsStr = opts.length > 0 ? ` (${opts.join(', ')})` : '';
              return <li key={idx}>{qty}x {name}{optsStr}</li>;
            })}
          </ul>
          <div className="mt-2"><b>Subtotal:</b> ${order.subtotal}</div>
          <div><b>Fees:</b> ${order.taxes}</div>
          <div><b>Total:</b> ${order.total}</div>
          <div><b>Avisos de recogida enviados:</b> {pickupCount}/2</div>
          <div><b>Estado actual:</b> <span className={
            `font-semibold ` +
            (status === 'en proceso' ? 'text-yellow-600' : status === 'completada' ? 'text-green-600' : status === 'cancelada' ? 'text-red-600' : '')
          }>{status}</span></div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {['en proceso', 'completada', 'cancelada'].map(s => {
            let color = '';
            if (s === 'en proceso') color = 'yellow';
            else if (s === 'completada') color = 'green';
            else if (s === 'cancelada') color = 'red';
            // Tailwind no soporta clases dinámicas para colores, así que usamos un objeto para clases
            const colorMap = {
              yellow: {
                base: 'bg-white text-yellow-600 border-yellow-600',
                active: 'bg-yellow-600 text-white border-yellow-600',
                hover: 'hover:bg-yellow-500 hover:text-white',
              },
              green: {
                base: 'bg-white text-green-600 border-green-600',
                active: 'bg-green-600 text-white border-green-600',
                hover: 'hover:bg-green-500 hover:text-white',
              },
              red: {
                base: 'bg-white text-red-600 border-red-600',
                active: 'bg-red-600 text-white border-red-600',
                hover: 'hover:bg-red-500 hover:text-white',
              },
            };
            const c = colorMap[color as keyof typeof colorMap];
            return (
              <button
                key={s}
                className={`px-3 py-1 cursor-pointer rounded border transition ${status === s ? c.active : c.base + ' ' + c.hover}`}
                disabled={loading || status === s}
                onClick={() => handleUpdate(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>
        <button
          className="bg-green-600 text-white cursor-pointer hover:bg-green-700 px-4 py-1 rounded w-full mt-2"
          onClick={handleNotify}
          disabled={notifyLoading || pickupCount >= 2}
        >
          {notifyLoading ? 'Enviando notificación...' : 'Notificar listo para recoger'}
        </button>
        {notifyMsg && <div className="text-center text-xs text-green-700 mt-1">{notifyMsg}</div>}
        {error && <div className="text-red-600 text-xs text-center">{error}</div>}
      </div>
    </SimpleModal>
  );
}

export default function OrdersClient({ orders, team }: { orders: any[], team: any }) {
  const [editId, setEditId] = useState<number|null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Filtrar por fecha (solo las del día seleccionado)
  const filteredByDate = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().slice(0, 10);
    return orderDate === selectedDate;
  });

  // Filtrar por status si se selecciona
  const filteredOrders = selectedStatus
    ? filteredByDate.filter(order => order.status === selectedStatus)
    : filteredByDate;

  // Ordenar por fecha ascendente (más antiguas primero)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Órdenes de {team.name}</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm font-medium mr-1">Fecha:</label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={todayStr}
          />
          <label className="text-sm font-medium ml-4 mr-1">Estado:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="en proceso">En proceso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>
      <table className="min-w-full border mt-4">
        <thead>
          <tr>
            <th className="border px-2 py-1 whitespace-nowrap">ID</th>
            <th className="border px-2 py-1 whitespace-nowrap">Código</th>
            <th className="border px-2 py-1 whitespace-nowrap">Nombre</th>
            <th className="border px-2 py-1 whitespace-nowrap">Email</th>
            <th className="border px-2 py-1 whitespace-nowrap">Teléfono</th>
            <th className="border px-2 py-1">Productos</th>
            <th className="border px-2 py-1 whitespace-nowrap">Subtotal</th>
            <th className="border px-2 py-1 whitespace-nowrap">Fees</th>
            <th className="border px-2 py-1 whitespace-nowrap">Total</th>
            <th className="border px-2 py-1 whitespace-nowrap">Tipo</th>
            <th className="border px-2 py-1 whitespace-nowrap">Pago</th>
            <th className="border px-2 py-1 whitespace-nowrap">Estado</th>
            <th className="border px-2 py-1 whitespace-nowrap">Fecha</th>
            <th className="border px-2 py-1 whitespace-nowrap">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map(order => (
            <tr key={order.id}>
              <td className="border px-2 py-1 whitespace-nowrap">{order.id}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.orderCode || order.order_code || '-'}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.customerName || ''}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.customerEmail || ''}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.customerPhone || ''}</td>
              <td className="border px-2 py-1 whitespace-nowrap text-xs max-w-xs">
                {(() => {
                  let productsArr: any[] = [];
                  try {
                    productsArr = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
                  } catch {
                    return <span className="text-red-600">Error productos</span>;
                  }
                  if (!Array.isArray(productsArr)) return <span className="text-gray-400">Sin productos</span>;
                  return (
                    <ul className="list-disc pl-4">
                      {productsArr.map((prod, idx) => {
                        // Compatibilidad flexible: nombre, cantidad, opciones
                        const qty = prod.quantity || prod.qty || 1;
                        const name = prod.name || prod.product?.name || 'Producto';
                        // Opciones: extras, size, additions, etc.
                        let opts: string[] = [];
                        if (prod.options) opts = opts.concat(prod.options);
                        if (prod.selectedSize?.name) opts.push(prod.selectedSize.name);
                        if (Array.isArray(prod.selectedExtras)) opts = opts.concat(prod.selectedExtras.map((e: any) => e.name));
                        if (Array.isArray(prod.selectedAdditions)) opts = opts.concat(prod.selectedAdditions.map((a: any) => a.name));
                        const optsStr = opts.length > 0 ? ` (${opts.join(', ')})` : '';
                        return (
                          <li key={idx}>{qty}x {name}{optsStr}</li>
                        );
                      })}
                    </ul>
                  );
                })()}
              </td>
              <td className="border px-2 py-1 whitespace-nowrap">${order.subtotal}</td>
              <td className="border px-2 py-1 whitespace-nowrap">${order.taxes}</td>
              <td className="border px-2 py-1 whitespace-nowrap font-bold">${order.total}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.type}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.payment}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{order.status}</td>
              <td className="border px-2 py-1 whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
              <td className="border px-2 py-1 whitespace-nowrap">
                <>
                    <button 
                        className="text-blue-600 text-xs underline mr-2 cursor-pointer"
                        onClick={() => setEditId(order.id)}
                    >
                        Actualizar estado
                    </button>
                    <button
                        className="text-red-600 text-xs underline cursor-pointer"
                        onClick={async () => {
                        await fetch('/api/orders', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: order.id }),
                        });
                        window.location.reload();
                        }}
                    >
                        Eliminar
                    </button>

                    <EditStatusModal
                        open={editId === order.id}
                        onClose={() => setEditId(null)}
                        order={order}
                        onUpdated={() => window.location.reload()}
                    />
                </>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
