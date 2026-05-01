import { NextRequest, NextResponse } from 'next/server';
import { updateOrder, deleteOrder, createOrderPublic, getOrderById } from '@/lib/db/order-actions';
import { getTeamById, getUser, getUserWithTeam } from '@/lib/db/queries';
import { sendOrderStatusEmail } from '@/lib/email/resend';
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('POST /api/orders data:', data);
    if (!data.products || !data.subtotal || !data.taxes || !data.total || !data.type || !data.payment || !data.status) {
      console.error('Missing required fields', data);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    try {
      const created = await createOrderPublic({
        products: JSON.stringify(data.products),
        subtotal: data.subtotal,
        taxes: data.taxes,
        total: data.total,
        type: data.type,
        payment: data.payment,
        status: data.status,
        price: data.price,
        teamId: data.teamId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      });
      console.log('Order created:', created);
      return NextResponse.json({ success: true, order: created });
    } catch (err) {
      console.error('Error creating order in DB:', err);
      return NextResponse.json({ error: 'Error creating order in DB', details: String(err) }, { status: 500 });
    }
  } catch (e) {
    console.error('General error in POST /api/orders:', e);
    return NextResponse.json({ error: 'Error creating order', details: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
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

    if (user.role === 'manager') {
      const keys = Object.keys(data);
      if (keys.length !== 1 || keys[0] !== 'status') {
        return NextResponse.json({ error: 'Managers can only update order status' }, { status: 403 });
      }
    }

    if (data.subtotal !== undefined || data.taxes !== undefined) {
      const subtotal = Number(data.subtotal) || 0;
      const fees = Number(data.taxes) || 0;
      data.total = (subtotal + fees).toFixed(2);
      data.price = data.total;
    }
    const updated = await updateOrder(Number(id), data);
    if (
      updated?.customerEmail &&
      (data.status === 'completada' || data.status === 'cancelada')
    ) {
      const team = await getTeamById(updated.teamId);
      if (team) {
        await sendOrderStatusEmail({
          to: updated.customerEmail,
          customerName: updated.customerName,
          orderCode: updated.orderCode,
          status: data.status,
          team: {
            name: team.name,
            contactEmail: team.contactEmail,
            contactPhone: team.contactPhone,
          },
        });
      }
    }
    return NextResponse.json({ success: true, order: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'owner' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role !== 'superadmin') {
      const [order, userWithTeam] = await Promise.all([
        getOrderById(Number(id)),
        getUserWithTeam(user.id)
      ]);
      if (!order || !userWithTeam?.teamId || userWithTeam.teamId !== order.teamId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const deleted = await deleteOrder(Number(id));
    return NextResponse.json({ success: true, order: deleted });
  } catch (e) {
    return NextResponse.json({ error: 'Error deleting order' }, { status: 500 });
  }
}
