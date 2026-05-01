import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder } from '@/lib/db/order-actions';
import { getTeamById, getUser, getUserWithTeam } from '@/lib/db/queries';
import { sendPickupReadyEmail } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['owner', 'manager', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const order = await getOrderById(Number(id));
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (user.role !== 'superadmin') {
      const userWithTeam = await getUserWithTeam(user.id);
      if (!userWithTeam?.teamId || userWithTeam.teamId !== order.teamId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (!order.customerEmail) {
      return NextResponse.json({ error: 'The order does not have a customer email' }, { status: 400 });
    }

    const sentCount = order.pickupNotificationCount ?? 0;
    if (sentCount >= 2) {
      return NextResponse.json(
        { error: 'The pickup notification was already sent 2 times' },
        { status: 400 }
      );
    }

    const team = await getTeamById(order.teamId);
    if (!team) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

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
