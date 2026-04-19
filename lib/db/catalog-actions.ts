'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  sizes, extras, additions,
  productSizes, productExtras, productAdditions,
  NewSize, NewExtra, NewAddition,
} from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ─── Shared schema ────────────────────────────────────────────────────────────
const catalogItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  image: z.string().optional(),
  showPicture: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  price: z.string().transform(v => parseFloat(v) || 0).pipe(z.number().min(0)),
  currency: z.string().default('MXN'),
});

const catalogItemUpdateSchema = catalogItemSchema.extend({
  id: z.coerce.number(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
});

const deleteSchema = z.object({ id: z.coerce.number() });

// ─── Product association schema ───────────────────────────────────────────────
const productAssocSchema = z.object({
  productId: z.coerce.number(),
  ids: z.string().transform(v => v ? v.split(',').map(Number).filter(Boolean) : []),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function requireTeam(userId: number) {
  const userWithTeam = await getUserWithTeam(userId);
  if (!userWithTeam?.teamId) throw new Error('User is not part of a team');
  return userWithTeam.teamId;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIZES
// ═══════════════════════════════════════════════════════════════════════════════

export const createSize = validatedActionWithUser(
  catalogItemSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    const { name, description, image, showPicture, price, currency } = data;

    const last = await db.select({ position: sizes.position }).from(sizes).where(eq(sizes.teamId, teamId as number)).orderBy(sizes.position);
    const position = last.length > 0 ? Math.max(...last.map(s => s.position)) + 1 : 0;

    const newSize: NewSize = {
      teamId: teamId as number, name, description: description || null,
      image: image || null, showPicture: showPicture ?? false,
      price: price.toString(), currency, position, isActive: true,
    };
    const [created] = await db.insert(sizes).values(newSize).returning();
    revalidatePath('/dashboard/menu');
    return { success: 'Size created', sizeId: created.id };
  }
);

export const updateSize = validatedActionWithUser(
  catalogItemUpdateSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    const { id, name, description, image, showPicture, price, currency, isActive } = data;
    await db.update(sizes).set({
      name, description: description || null, image: image || null,
      showPicture: showPicture ?? false, price: price.toString(), currency,
      isActive: isActive ?? true, updatedAt: new Date(),
    }).where(and(eq(sizes.id, id), eq(sizes.teamId, teamId as number)));
    revalidatePath('/dashboard/menu');
    return { success: 'Size updated' };
  }
);

export const deleteSize = validatedActionWithUser(
  deleteSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    await db.delete(sizes).where(and(eq(sizes.id, data.id), eq(sizes.teamId, teamId as number)));
    revalidatePath('/dashboard/menu');
    return { success: 'Size deleted' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRAS
// ═══════════════════════════════════════════════════════════════════════════════

export const createExtra = validatedActionWithUser(
  catalogItemSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    const { name, description, image, showPicture, price, currency } = data;

    const last = await db.select({ position: extras.position }).from(extras).where(eq(extras.teamId, teamId as number)).orderBy(extras.position);
    const position = last.length > 0 ? Math.max(...last.map(e => e.position)) + 1 : 0;

    const newExtra: NewExtra = {
      teamId: teamId as number, name, description: description || null,
      image: image || null, showPicture: showPicture ?? false,
      price: price.toString(), currency, position, isActive: true,
    };
    const [created] = await db.insert(extras).values(newExtra).returning();
    revalidatePath('/dashboard/menu');
    return { success: 'Extra created', extraId: created.id };
  }
);

export const updateExtra = validatedActionWithUser(
  catalogItemUpdateSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    const { id, name, description, image, showPicture, price, currency, isActive } = data;
    await db.update(extras).set({
      name, description: description || null, image: image || null,
      showPicture: showPicture ?? false, price: price.toString(), currency,
      isActive: isActive ?? true, updatedAt: new Date(),
    }).where(and(eq(extras.id, id), eq(extras.teamId, teamId as number)));
    revalidatePath('/dashboard/menu');
    return { success: 'Extra updated' };
  }
);

export const deleteExtra = validatedActionWithUser(
  deleteSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    await db.delete(extras).where(and(eq(extras.id, data.id), eq(extras.teamId, teamId as number)));
    revalidatePath('/dashboard/menu');
    return { success: 'Extra deleted' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const createAddition = validatedActionWithUser(
  catalogItemSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    const { name, description, image, showPicture, price, currency } = data;

    const last = await db.select({ position: additions.position }).from(additions).where(eq(additions.teamId, teamId as number)).orderBy(additions.position);
    const position = last.length > 0 ? Math.max(...last.map(a => a.position)) + 1 : 0;

    const newAddition: NewAddition = {
      teamId: teamId as number, name, description: description || null,
      image: image || null, showPicture: showPicture ?? false,
      price: price.toString(), currency, position, isActive: true,
    };
    const [created] = await db.insert(additions).values(newAddition).returning();
    revalidatePath('/dashboard/menu');
    return { success: 'Addition created', additionId: created.id };
  }
);

export const updateAddition = validatedActionWithUser(
  catalogItemUpdateSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    const { id, name, description, image, showPicture, price, currency, isActive } = data;
    await db.update(additions).set({
      name, description: description || null, image: image || null,
      showPicture: showPicture ?? false, price: price.toString(), currency,
      isActive: isActive ?? true, updatedAt: new Date(),
    }).where(and(eq(additions.id, id), eq(additions.teamId, teamId as number)));
    revalidatePath('/dashboard/menu');
    return { success: 'Addition updated' };
  }
);

export const deleteAddition = validatedActionWithUser(
  deleteSchema,
  async (data, _, user) => {
    const teamId = await requireTeam(user.id).catch(e => { throw e; });
    await db.delete(additions).where(and(eq(additions.id, data.id), eq(additions.teamId, teamId as number)));
    revalidatePath('/dashboard/menu');
    return { success: 'Addition deleted' };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT ASSOCIATIONS (sync sizes/extras/additions for a product)
// ═══════════════════════════════════════════════════════════════════════════════

export const syncProductSizes = validatedActionWithUser(
  productAssocSchema,
  async (data, _, user) => {
    await requireTeam(user.id).catch(e => { throw e; });
    const { productId, ids } = data;
    await db.delete(productSizes).where(eq(productSizes.productId, productId));
    if (ids.length > 0) {
      await db.insert(productSizes).values(ids.map(sizeId => ({ productId, sizeId })));
    }
    revalidatePath('/dashboard/menu');
    return { success: 'Product sizes updated' };
  }
);

export const syncProductExtras = validatedActionWithUser(
  productAssocSchema,
  async (data, _, user) => {
    await requireTeam(user.id).catch(e => { throw e; });
    const { productId, ids } = data;
    await db.delete(productExtras).where(eq(productExtras.productId, productId));
    if (ids.length > 0) {
      await db.insert(productExtras).values(ids.map(extraId => ({ productId, extraId })));
    }
    revalidatePath('/dashboard/menu');
    return { success: 'Product extras updated' };
  }
);

export const syncProductAdditions = validatedActionWithUser(
  productAssocSchema,
  async (data, _, user) => {
    await requireTeam(user.id).catch(e => { throw e; });
    const { productId, ids } = data;
    await db.delete(productAdditions).where(eq(productAdditions.productId, productId));
    if (ids.length > 0) {
      await db.insert(productAdditions).values(ids.map(additionId => ({ productId, additionId })));
    }
    revalidatePath('/dashboard/menu');
    return { success: 'Product additions updated' };
  }
);
