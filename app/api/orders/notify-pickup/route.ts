import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder } from '@/lib/db/order-actions';
import { getTeamById } from '@/lib/db/queries';
import { sendPickupReadyEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

    const order = await getOrderById(Number(id));
    if (!order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    if (!order.customerEmail) {
      return NextResponse.json({ error: 'La orden no tiene email de cliente' }, { status: 400 });
    }

    const sentCount = order.pickupNotificationCount ?? 0;
    if (sentCount >= 2) {
      return NextResponse.json(
        { error: 'La notificación de recogida ya fue enviada 2 veces' },
        { status: 400 }
      );
    }

    const team = await getTeamById(order.teamId);
    if (!team) return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 });

    await sendPickupReadyEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderCode: order.orderCode,
      team: {
        name: team.name,
        contactEmail: team.contactEmail,
        contactPhone: team.contactPhone,
      },
    });

    const updated = await updateOrder(order.id, {
      pickupNotificationCount: sentCount + 1,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
