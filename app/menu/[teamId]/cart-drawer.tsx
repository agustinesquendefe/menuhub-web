'use client';

import { X, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart, computeLineTotalWithFee } from './cart-context';
import { useProviderFee } from './useProviderFee';

interface CartDrawerProps {
  currency: string;
  onClose: () => void;
  onCheckout: () => void;
  teamCountry: string;
}

export function CartDrawer({ currency, onClose, onCheckout, teamCountry }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  // Asumimos que todos los productos son del mismo país (del team), tomamos el primero
  const { feePercent, feeFixed } = useProviderFee(teamCountry);
  const totalPrice = items.reduce((s, i) => s + computeLineTotalWithFee(i, feePercent, feeFixed), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer panel */}
      <div className="relative bg-white w-full max-w-sm flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Tu pedido</h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
              <ShoppingCart className="w-12 h-12 text-gray-200" />
              <p className="text-gray-400 text-sm">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => {
                const lineTotal = computeLineTotalWithFee(item, feePercent, feeFixed);
                const options: string[] = [];
                if (item.selectedSize) options.push(item.selectedSize.name);
                item.selectedExtras.forEach(e => options.push(e.name));
                item.selectedAdditions.forEach(a => options.push(a.name));

                return (
                  <div key={item.cartId} className="flex gap-3 py-3 border-b last:border-0">
                    {item.product.image && item.product.showPicture && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">
                          {item.product.name}
                        </p>
                        <button
                          onClick={() => removeItem(item.cartId)}
                          className="cursor-pointer p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {options.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">{options.join(', ')}</p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-gray-400 italic mt-0.5">"{item.notes}"</p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                            className="cursor-pointer w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                            className="cursor-pointer w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {currency}{lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t px-5 py-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-xl font-bold text-gray-900">
                {currency}{totalPrice.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => { onCheckout(); onClose(); }}
              className="cursor-pointer w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Confirmar pedido
            </button>
            <button
              onClick={clearCart}
              className="cursor-pointer w-full text-sm text-gray-400 hover:text-red-500 transition-colors py-1"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
