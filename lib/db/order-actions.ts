import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { orders, NewOrder } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';


// Editar una orden
export async function updateOrder(orderId: number, data: Partial<NewOrder>) {
  // Normaliza tipos para la base de datos (todos string excepto products)
  const patch: any = { ...data };
  if (patch.products && Array.isArray(patch.products)) {
    patch.products = JSON.stringify(patch.products);
  }
  if (patch.subtotal !== undefined && typeof patch.subtotal !== 'string') {
    patch.subtotal = String(patch.subtotal);
  }
  if (patch.taxes !== undefined && typeof patch.taxes !== 'string') {
    patch.taxes = String(patch.taxes);
  }
  if (patch.total !== undefined && typeof patch.total !== 'string') {
    patch.total = String(patch.total);
  }
  if (patch.price !== undefined && patch.price !== null && typeof patch.price !== 'string') {
    patch.price = String(patch.price);
  }
  if (patch.type !== undefined && typeof patch.type !== 'string') {
    patch.type = String(patch.type);
  }
  if (patch.payment !== undefined && typeof patch.payment !== 'string') {
    patch.payment = String(patch.payment);
  }
  if (patch.status !== undefined && typeof patch.status !== 'string') {
    patch.status = String(patch.status);
  }
  if (patch.orderCode !== undefined && typeof patch.orderCode !== 'string') {
    patch.orderCode = String(patch.orderCode);
  }
  const [updated] = await db
    .update(orders)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  return updated;
}

// Eliminar una orden
export async function deleteOrder(orderId: number) {
  const [deleted] = await db.delete(orders).where(eq(orders.id, orderId)).returning();
  return deleted;
}

export async function getOrderById(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return order ?? null;
}

// Crear una orden (sin usuario, para uso público/checkout)
export async function createOrderPublic(data: Omit<NewOrder, 'id' | 'orderCode' | 'createdAt' | 'updatedAt'>) {
  const orderCode = await generateUniqueOrderCode();
  const newOrder: NewOrder = {
    ...data,
    orderCode: String(orderCode),
    subtotal: data.subtotal !== undefined && data.subtotal !== null ? String(data.subtotal) : '',
    taxes: data.taxes !== undefined && data.taxes !== null ? String(data.taxes) : '',
    total: data.total !== undefined && data.total !== null ? String(data.total) : '',
    price: data.price !== undefined && data.price !== null ? String(data.price) : '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const [createdOrder] = await db.insert(orders).values(newOrder).returning();
  return createdOrder;
}

// Genera un código único de hasta 12 dígitos
async function generateUniqueOrderCode() {
  let code;
  let exists = true;
  while (exists) {
    code = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    // Verifica unicidad en la base de datos
    const found = await db.select().from(orders).where(eq(orders.orderCode, code)).limit(1);
    exists = found.length > 0;
  }
  return code;
}

const createOrderSchema = z.object({
  products: z.array(z.any()), // Puedes definir un schema más estricto si lo deseas
  subtotal: z.number(),
  taxes: z.number(),
  total: z.number(),
  type: z.string(),
  payment: z.string(),
  status: z.string(),
  price: z.number().optional(),
});

export const createOrder = validatedActionWithUser(
  createOrderSchema,
  async (data, _, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    
    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }
    const orderCode = await generateUniqueOrderCode();
    
    const newOrder: NewOrder = {
      orderCode: String(orderCode),
      teamId: userWithTeam.teamId,
      products: JSON.stringify(data.products),
      subtotal: data.subtotal !== undefined && data.subtotal !== null ? String(data.subtotal) : '',
      taxes: data.taxes !== undefined && data.taxes !== null ? String(data.taxes) : '',
      total: data.total !== undefined && data.total !== null ? String(data.total) : '',
      type: data.type,
      payment: data.payment,
      status: data.status,
      price: data.price !== undefined && data.price !== null ? String(data.price) : '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [createdOrder] = await db.insert(orders).values(newOrder).returning();
    if (!createdOrder) {
      return { error: 'Failed to create order' };
    }
    return { success: 'Order created successfully', orderId: createdOrder.id, orderCode };
  }
);

export async function getOrdersByTeam(teamId: number) {
  return await db.select().from(orders).where(eq(orders.teamId, teamId)).orderBy(orders.createdAt);
}
