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
        items: lineItems.map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 500),
        // JSON for email: [{name, quantity, unitAmount, currency}]
        itemsJson: JSON.stringify(
          lineItems.map(i => ({
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
