'use client';

import { useState } from 'react';
import { X, Minus, Plus, AlertTriangle } from 'lucide-react';
import { Size, Extra, Addition } from '@/lib/db/schema';
import { ProductWithAssociations, useCart } from './cart-context';

interface AddToCartModalProps {
  product: ProductWithAssociations;
  onClose: () => void;
}

export function AddToCartModal({ product, onClose }: AddToCartModalProps) {
  const { addItem } = useCart();

  const activeSizes = product.sizes.filter(s => s.isActive);
  const activeExtras = product.extras.filter(e => e.isActive);
  const activeAdditions = product.additions.filter(a => a.isActive);

  const [selectedSize, setSelectedSize] = useState<Size | null>(activeSizes[0] ?? null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [selectedAdditions, setSelectedAdditions] = useState<Addition[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const currency = product.currency === 'MXN' ? '$' : (product.currency ?? '$') + ' ';

  const base = parseFloat(product.price ?? '0');
  const sizePrice = selectedSize ? parseFloat(selectedSize.price ?? '0') : 0;
  const extrasPrice = selectedExtras.reduce((s, e) => s + parseFloat(e.price ?? '0'), 0);
  const additionsPrice = selectedAdditions.reduce((s, a) => s + parseFloat(a.price ?? '0'), 0);
  const unitPrice = base + sizePrice + extrasPrice + additionsPrice;
  const total = unitPrice * quantity;

  function toggleExtra(extra: Extra) {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id)
        ? prev.filter(e => e.id !== extra.id)
        : [...prev, extra]
    );
  }

  function toggleAddition(addition: Addition) {
    setSelectedAdditions(prev =>
      prev.some(a => a.id === addition.id)
        ? prev.filter(a => a.id !== addition.id)
        : [...prev, addition]
    );
  }

  function handleAdd() {
    addItem({ product, selectedSize, selectedExtras, selectedAdditions, quantity, notes });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex-1 pr-3">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h2>
            {product.allergenWarning && (
              <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium mt-1">
                <AlertTriangle className="w-3 h-3" />
                Contiene alérgenos
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Image */}
          {product.image && product.showPicture && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-44 object-cover rounded-xl"
            />
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-500">{product.description}</p>
          )}

          {/* Sizes */}
          {activeSizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Tamaño</p>
              <div className="space-y-2">
                {activeSizes.map(size => {
                  const checked = selectedSize?.id === size.id;
                  return (
                    <label
                      key={size.id}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                        checked ? 'border-orange-400 bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="size"
                          checked={checked}
                          onChange={() => setSelectedSize(size)}
                          className="accent-orange-500"
                        />
                        <span className="text-sm text-gray-800">{size.name}</span>
                      </div>
                      {parseFloat(size.price ?? '0') > 0 && (
                        <span className="text-sm text-gray-500">
                          +{currency}{parseFloat(size.price!).toFixed(2)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras */}
          {activeExtras.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Extras</p>
              <div className="space-y-2">
                {activeExtras.map(extra => {
                  const checked = selectedExtras.some(e => e.id === extra.id);
                  return (
                    <label
                      key={extra.id}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                        checked ? 'border-orange-400 bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExtra(extra)}
                          className="accent-orange-500"
                        />
                        <span className="text-sm text-gray-800">{extra.name}</span>
                      </div>
                      {parseFloat(extra.price ?? '0') > 0 && (
                        <span className="text-sm text-gray-500">
                          +{currency}{parseFloat(extra.price!).toFixed(2)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additions */}
          {activeAdditions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Adiciones</p>
              <div className="space-y-2">
                {activeAdditions.map(addition => {
                  const checked = selectedAdditions.some(a => a.id === addition.id);
                  return (
                    <label
                      key={addition.id}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                        checked ? 'border-orange-400 bg-orange-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddition(addition)}
                          className="accent-orange-500"
                        />
                        <span className="text-sm text-gray-800">{addition.name}</span>
                      </div>
                      {parseFloat(addition.price ?? '0') > 0 && (
                        <span className="text-sm text-gray-500">
                          +{currency}{parseFloat(addition.price!).toFixed(2)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Notas (opcional)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej. sin cebolla, bien cocido..."
              className="w-full text-sm border rounded-xl px-3 py-2 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t px-5 py-4 space-y-3 bg-white">
          {/* Quantity stepper */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="cursor-pointer w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="cursor-pointer w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            className="cursor-pointer w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-semibold py-3 rounded-xl flex items-center justify-between px-5 transition-all"
          >
            <span>Agregar al carrito</span>
            <span>{currency}{total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
