import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { getTeamById } from '@/lib/db/queries';
import { sendOrderConfirmation, OrderItem } from '@/lib/email/resend';
import { createOrderPublic } from '@/lib/db/order-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, teamId, customerName, customerEmail: emailFromBody, customerPhone, orderType, tableNumber, notes } =
      body;

    if (!paymentIntentId || !teamId || !customerName) {
      return NextResponse.json({ error: 'Incomplete data' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment was not completed' }, { status: 400 });
    }

    const customerEmail = emailFromBody || paymentIntent.receipt_email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
    }

    const team = await getTeamById(Number(teamId));
    if (!team) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const itemsJson = paymentIntent.metadata?.itemsJson ?? '';
    const totalAmount = paymentIntent.amount;
    const currency = paymentIntent.currency;
    const metadataSubtotal = Number(paymentIntent.metadata?.subtotal);
    const metadataFees = Number(paymentIntent.metadata?.taxAmount);
    const total = totalAmount / 100;
    const fees = Number.isFinite(metadataFees) ? metadataFees : 0;
    const subtotal = Number.isFinite(metadataSubtotal) ? metadataSubtotal : total - fees;

    let items: OrderItem[] = [];
    try {
      if (itemsJson) items = JSON.parse(itemsJson) as OrderItem[];
    } catch {
      items = [];
    }


    try {
      await createOrderPublic({
        teamId: Number(teamId),
        products: JSON.stringify(items),
        subtotal: subtotal.toFixed(2),
        taxes: fees.toFixed(2),
        total: total.toFixed(2),
        type: orderType,
        payment: 'stripe',
        status: 'pagado',
        price: total.toFixed(2),
        customerName,
        customerEmail,
        customerPhone,
      });
    } catch (err) {
      console.error('[order-confirmation] Error creating order in DB:', err);
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
        address: [team.line1, team.line2, team.city, team.state, team.zipcode, team.country]
          .filter(Boolean)
          .join(', '),
        logoUrl: team.profilePictureUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[order-confirmation] Error sending email:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
