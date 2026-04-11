import React from 'react';
import dynamic from 'next/dynamic';

const MenuManager = dynamic(() => import('@/components/menu-manager'), { ssr: false });
export default function MenuPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Menú</h1>
      <p>Aquí podrás gestionar las categorías, productos, precios e impuestos de tu menú.</p>
      <div className="mt-6">
        <MenuManager />
      </div>
    </div>
  );
}
