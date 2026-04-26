'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Product, Size, Extra, Addition } from '@/lib/db/schema';

export interface ProductWithAssociations extends Product {
  sizes: Size[];
  extras: Extra[];
  additions: Addition[];
}

export interface CartItem {
  cartId: string;
  product: ProductWithAssociations;
  selectedSize: Size | null;
  selectedExtras: Extra[];
  selectedAdditions: Addition[];
  quantity: number;
  notes: string;
}


export function computeLineTotal(item: CartItem): number {
  // Compatibilidad: sin fees
  const base = parseFloat(item.product.price ?? '0');
  const sizePrice = item.selectedSize ? parseFloat(item.selectedSize.price ?? '0') : 0;
  const extrasPrice = item.selectedExtras.reduce((s, e) => s + parseFloat(e.price ?? '0'), 0);
  const additionsPrice = item.selectedAdditions.reduce((s, a) => s + parseFloat(a.price ?? '0'), 0);
  return (base + sizePrice + extrasPrice + additionsPrice) * item.quantity;
}

// Nuevo: calcula el total de la línea con fees
export function computeLineTotalWithFee(
  item: CartItem,
  feePercent: number,
  feeFixed: number,
  applyFee: boolean = true
): number {
  const base = parseFloat(item.product.price ?? '0');
  const sizePrice = item.selectedSize ? parseFloat(item.selectedSize.price ?? '0') : 0;
  const extrasPrice = item.selectedExtras.reduce((s, e) => s + parseFloat(e.price ?? '0'), 0);
  const additionsPrice = item.selectedAdditions.reduce((s, a) => s + parseFloat(a.price ?? '0'), 0);
  let subtotal = base + sizePrice + extrasPrice + additionsPrice;
  if (applyFee) {
    subtotal = subtotal + (subtotal * feePercent / 100) + feeFixed;
  }
  return subtotal * item.quantity;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: Omit<CartItem, 'cartId'>) => {
    const cartId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setItems(prev => [...prev, { ...item, cartId }]);
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    if (quantity < 1) {
      setItems(prev => prev.filter(i => i.cartId !== cartId));
    } else {
      setItems(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + computeLineTotal(i), 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
