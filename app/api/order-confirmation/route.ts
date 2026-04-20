import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { getTeamById } from '@/lib/db/queries';
import { sendOrderConfirmation, OrderItem } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, teamId, customerName, customerEmail: emailFromBody, customerPhone, orderType, tableNumber, notes } =
      body;

    if (!paymentIntentId || !teamId || !customerName) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Verify the PaymentIntent actually succeeded with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'El pago no fue completado' }, { status: 400 });
    }

    // Use email from body first, fall back to receipt_email on PaymentIntent
    const customerEmail = emailFromBody || paymentIntent.receipt_email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'Email del cliente no encontrado' }, { status: 400 });
    }

    const team = await getTeamById(Number(teamId));
    if (!team) {
      return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 });
    }

    // Build items from PaymentIntent metadata
    const itemsJson = paymentIntent.metadata?.itemsJson ?? '';
    const totalAmount = paymentIntent.amount;
    const currency = paymentIntent.currency;

    let items: OrderItem[] = [];
    try {
      if (itemsJson) items = JSON.parse(itemsJson) as OrderItem[];
    } catch {
      items = [];
    }

    await sendOrderConfirmation({
      to: customerEmail,
      customerName,
      customerPhone,
      orderType,
      tableNumber,
      notes,
      items,
      totalAmount,
      currency,
      team: {
        name: team.name,
        contactEmail: team.contactEmail,
        contactPhone: team.contactPhone,
        address: team.address,
        logoUrl: team.logoUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[order-confirmation] Error sending email:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
