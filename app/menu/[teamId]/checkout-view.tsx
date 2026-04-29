'use client';

import { useState } from 'react';
import { ArrowLeft, CreditCard, Loader2, ShoppingBag } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart, computeLineTotalWithFee } from './cart-context';
import { useProviderFee } from './useProviderFee';
import { useCompanyFee } from './useCompanyFee';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#111827',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

type OrderType = 'mesa' | 'llevar';

interface CheckoutViewProps {
  currency: string;
  teamName: string;
  teamId: number;
  teamCountry: string;
  teamState?: string | null;
  companyId?: number | null;
  onBack: () => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  orderType: OrderType;
  tableNumber: string;
  notes: string;
}

const ORDER_TYPES: { value: OrderType; label: string; description: string }[] = [
  { value: 'mesa', label: 'En mesa', description: 'Te llevamos tu pedido a la mesa' },
  { value: 'llevar', label: 'Para llevar', description: 'Recoge tu pedido en caja' },
];

function normalizeStateCode(state: string | null | undefined) {
  const normalized = state?.trim().toUpperCase();
  if (!normalized) return '';
  return normalized.slice(0, 2);
}

function CheckoutForm(props: CheckoutViewProps) {
  const { currency, teamName, teamId, teamCountry, teamState, companyId, onBack } = props;
  const stripe = useStripe();
  const elements = useElements();
  const { items, clearCart } = useCart();
  const stateCode = normalizeStateCode(teamState);
  const {
    feePercent: providerFeePercent,
    feeFixed: providerFeeFixed,
    isLoading: isProviderFeeLoading,
  } = useProviderFee(teamCountry);
  const {
    feePercent: taxPercent,
    feeFixed: taxFixed,
    isLoading: isTaxLoading,
  } = useCompanyFee(undefined, undefined, companyId, teamId);

  const subtotal = items.reduce(
    (s, i) => s + computeLineTotalWithFee(i, providerFeePercent, providerFeeFixed),
    0
  );
  const companyFeeAmount = (subtotal * taxPercent / 100) + taxFixed;
  const totalPrice = subtotal + companyFeeAmount;

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    orderType: 'mesa',
    tableNumber: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'El nombre completo es obligatorio';
    if (!form.email.trim()) next.email = 'El email es obligatorio';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = 'Ingresa un email válido';
    if (form.orderType === 'mesa' && !form.tableNumber.trim())
      next.tableNumber = 'Ingresa el número de mesa';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsLoading(true);
    setApiError(null);
    setCardError(null);

    try {
      const lineItems = items.map(item => {
        const options: string[] = [];
        if (item.selectedSize) options.push(item.selectedSize.name);
        item.selectedExtras.forEach(e => options.push(e.name));
        item.selectedAdditions.forEach(a => options.push(a.name));
        const name = options.length > 0
          ? `${item.product.name} (${options.join(', ')})`
          : item.product.name;
        const unitSubtotal = computeLineTotalWithFee(item, providerFeePercent, providerFeeFixed) / item.quantity;
        const unitAmount = Math.round(unitSubtotal * 100);
        return { name, unitAmount, quantity: item.quantity, currency: item.product.currency ?? 'MXN' };
      });
      if (companyFeeAmount > 0) {
        lineItems.push({
          name: 'Fees',
          unitAmount: Math.round(companyFeeAmount * 100),
          quantity: 1,
          currency: items[0]?.product.currency ?? 'MXN',
        });
      }

      const res = await fetch('/api/stripe/menu-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          customerEmail: form.email,
          customerName: form.name,
          customerPhone: form.phone,
          orderType: form.orderType,
          tableNumber: form.tableNumber,
          notes: form.notes,
          lineItems,
          subtotal,
          taxPercent: taxPercent || 0,
          taxFixed: taxFixed || 0,
          taxAmount: companyFeeAmount,
          state: stateCode || undefined,
          total: totalPrice,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.clientSecret) {
        setApiError(data.error ?? 'Error al procesar el pago. Intenta de nuevo.');
        setIsLoading(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
          },
        },
      });

      if (stripeError) {
        setCardError(stripeError.message ?? 'Error al confirmar el pago.');
        setIsLoading(false);
        return;
      }

      // Send confirmation email (non-blocking — errors are ignored)
      if (paymentIntent?.id) {
        fetch('/api/order-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            teamId,
            customerName: form.name,
            customerEmail: form.email,
            customerPhone: form.phone,
            orderType: form.orderType,
            tableNumber: form.tableNumber,
            notes: form.notes,
          }),
        })
          .then(r => r.json())
          .then(d => { if (!d.ok) console.error('[order-confirmation]', d.error); })
          .catch(e => console.error('[order-confirmation] network error', e));
      }

      clearCart();
      setSubmitted(true);
    } catch {
      setApiError('Error de conexión. Revisa tu internet e intenta de nuevo.');
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Pago realizado!
          </h2>
          <p className="text-gray-500 text-sm">
            Tu pedido ha sido confirmado. Recibirás un email con el resumen.
          </p>
          <button
            onClick={onBack}
            className="cursor-pointer w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Volver al menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors -ml-1"
            aria-label="Volver al menú"
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Finalizar pedido
            </h1>
            <p className="text-xs text-gray-400">
              {teamName}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-[calc(18rem+env(safe-area-inset-bottom))]">

        {/* Order summary */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Resumen del pedido</h2>
          </div>
          <div className="divide-y px-5">
            {items.map(item => {
              const options: string[] = [];
              if (item.selectedSize) options.push(item.selectedSize.name);
              item.selectedExtras.forEach(e => options.push(e.name));
              item.selectedAdditions.forEach(a => options.push(a.name));
              return (
                <div key={item.cartId} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      <span className="text-orange-500 font-bold mr-1.5">{item.quantity}×</span>
                      {item.product.name}
                    </p>
                    {options.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{options.join(', ')}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-400 italic mt-0.5">"{item.notes}"</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0">
                    {currency}{computeLineTotalWithFee(item, providerFeePercent, providerFeeFixed).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Customer info */}
        <section className="bg-white rounded-xl shadow-sm px-5 py-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Tus datos</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Tu nombre completo"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="tu@email.com"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
              Teléfono <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="Ej. 55 1234 5678"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </section>

        {/* Order type */}
        <section className="bg-white rounded-xl shadow-sm px-5 py-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Tipo de pedido</h2>

          <div className="space-y-2">
            {ORDER_TYPES.map(type => {
              const active = form.orderType === type.value;
              return (
                <label
                  key={type.value}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-colors ${
                    active ? 'border-orange-400 bg-orange-50' : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="orderType"
                    value={type.value}
                    checked={active}
                    onChange={() => set('orderType', type.value)}
                    className="accent-orange-500 cursor-pointer"
                  />
                  <div>
                    <p className={`text-sm font-semibold ${active ? 'text-orange-700' : 'text-gray-800'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {form.orderType === 'mesa' && (
            <div className="pt-1">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="table">
                Número de mesa <span className="text-red-500">*</span>
              </label>
              <input
                id="table"
                type="text"
                value={form.tableNumber}
                onChange={e => set('tableNumber', e.target.value)}
                placeholder="Ej. 5"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors ${
                  errors.tableNumber ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.tableNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.tableNumber}</p>
              )}
            </div>
          )}
        </section>

        {/* Notes — only for mesa */}
        {form.orderType === 'mesa' && (
          <section className="bg-white rounded-xl shadow-sm px-5 py-5 space-y-3">
            <h2 className="font-semibold text-gray-900">
              Notas del pedido{' '}
              <span className="text-gray-400 text-xs font-normal">(opcional)</span>
            </h2>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Instrucciones especiales, alergias, preferencias..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </section>
        )}

        {/* Card payment */}
        <section className="bg-white rounded-xl shadow-sm px-5 py-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900">Pago con tarjeta</h2>
          </div>
          <div
            className={`border rounded-xl px-3 py-3 transition-colors ${
              cardError ? 'border-red-400 bg-red-50' : 'border-gray-200'
            }`}
          >
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={e => {
                if (e.error) setCardError(e.error.message ?? null);
                else setCardError(null);
              }}
            />
          </div>
          {cardError && <p className="text-xs text-red-500">{cardError}</p>}
          <p className="text-xs text-gray-400">
            🔒 Pago seguro procesado por Stripe. Nunca almacenamos tus datos de tarjeta.
          </p>
        </section>

      </main>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-sm text-gray-500">
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          {/* Desglose en el footer */}
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-gray-700">Subtotal</span>
            <span className="text-gray-900">{currency}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="text-gray-700">Fees</span>
            <span className="text-gray-900">{currency}{companyFeeAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-1 text-base font-bold border-t pt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{currency}{totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !stripe || isProviderFeeLoading || isTaxLoading}
            className="cursor-pointer w-full bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-base flex items-center justify-center gap-2"
          >
            {isLoading || isProviderFeeLoading || isTaxLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isProviderFeeLoading || isTaxLoading ? 'Calculando total...' : 'Procesando pago...'}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pagar {currency}{totalPrice.toFixed(2)}
              </>
            )}
          </button>
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {apiError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CheckoutView(props: CheckoutViewProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
