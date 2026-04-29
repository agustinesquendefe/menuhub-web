import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { getTeamById } from '@/lib/db/queries';

export interface MenuLineItem {
  name: string;
  unitAmount: number; // in smallest currency unit (centavos / cents)
  quantity: number;
  currency: string;
}

export interface MenuCheckoutPayload {
  teamId: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderType: 'mesa' | 'llevar';
  tableNumber?: string;
  notes?: string;
  lineItems: MenuLineItem[];
  subtotal?: number;
  taxPercent?: number;
  taxFixed?: number;
  taxAmount?: number;
  state?: string;
  total?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: MenuCheckoutPayload = await request.json();
    const {
      teamId,
      customerEmail,
      customerName,
      customerPhone,
      orderType,
      tableNumber,
      notes,
      lineItems,
      subtotal,
      taxPercent,
      taxFixed,
      taxAmount,
      state,
      total,
    } = body;

    if (!teamId || !lineItems?.length || !customerEmail || !customerName) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 });
    }

    const totalAmount = lineItems.reduce(
      (sum, item) => sum + Math.round(item.unitAmount) * item.quantity,
      0
    );
    const currency = lineItems[0].currency.toLowerCase();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency,
      payment_method_types: ['card'],
      receipt_email: customerEmail,
      metadata: {
        teamId: teamId.toString(),
        customerName,
        customerPhone: customerPhone ?? '',
        orderType,
        tableNumber: tableNumber ?? '',
        notes: notes ?? '',
        state: state ?? '',
        subtotal: String(subtotal ?? (totalAmount / 100) - (taxAmount ?? 0)),
        taxPercent: String(taxPercent ?? 0),
        taxFixed: String(taxFixed ?? 0),
        taxAmount: String(taxAmount ?? 0),
        total: String(total ?? totalAmount / 100),
        items: lineItems.filter(i => i.name !== 'Fees').map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 500),
        // JSON for email: [{name, quantity, unitAmount, currency}]
        itemsJson: JSON.stringify(
          lineItems.filter(i => i.name !== 'Fees').map(i => ({
            name: i.name,
            quantity: i.quantity,
            unitAmount: Math.round(i.unitAmount),
            currency: i.currency,
          }))
        ),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('[menu-checkout] Error creating PaymentIntent:', error);
    const message =
      error instanceof Error ? error.message : 'Error al procesar el pago. Intenta de nuevo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
