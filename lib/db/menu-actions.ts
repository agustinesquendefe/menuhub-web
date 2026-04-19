'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { categories, products, NewCategory, NewProduct, prices, taxes, productTaxes, NewPrice, NewProductTax, productSizes, productExtras, productAdditions } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
});

export const createCategory = validatedActionWithUser(
  createCategorySchema,
  async (data, _, user) => {
    const { name, description } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Get the highest position
    const lastCategory = await db
      .select({ position: categories.position })
      .from(categories)
      .where(eq(categories.teamId, userWithTeam.teamId))
      .orderBy(categories.position);

    const nextPosition = lastCategory.length > 0 
      ? Math.max(...lastCategory.map(c => c.position)) + 1 
      : 0;

    const newCategory: NewCategory = {
      teamId: userWithTeam.teamId,
      name,
      description: description || null,
      position: nextPosition,
      isActive: true,
    };

    const [createdCategory] = await db
      .insert(categories)
      .values(newCategory)
      .returning();

    if (!createdCategory) {
      return { error: 'Failed to create category' };
    }

    return { success: 'Category created successfully', categoryId: createdCategory.id };
  }
);

const createProductSchema = z.object({
  categoryId: z.coerce.number(),
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().optional(),
  price: z.string().transform(v => parseFloat(v)).pipe(z.number().positive('Price must be positive')),
  currency: z.string().default('MXN'),
  image: z.string().optional(),
  showPicture: z.coerce.boolean().optional(),
  taxIds: z.array(z.number()).optional(), // IDs de impuestos a asociar
});

export const createProduct = validatedActionWithUser(
  createProductSchema,
  async (data, _, user) => {
    const { categoryId, name, description, price, currency, image, showPicture, taxIds } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Verificar que la categoría pertenezca al equipo del usuario
    const category = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (category.length === 0) {
      return { error: 'Category not found or does not belong to your team' };
    }

    // Obtener la posición más alta para esta categoría
    const lastProduct = await db
      .select({ position: products.position })
      .from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(products.position);

    const nextPosition = lastProduct.length > 0 
      ? Math.max(...lastProduct.map(p => p.position)) + 1 
      : 0;

    // Crear el producto con el precio incluido
    const newProduct: NewProduct = {
      categoryId,
      teamId: userWithTeam.teamId,
      name,
      description: description || null,
      image: image || null,
      price: price.toString(),
      currency,
      showPicture: showPicture !== undefined ? showPicture : true,
      position: nextPosition,
      isActive: true,
    };

    const [createdProduct] = await db
      .insert(products)
      .values(newProduct)
      .returning();

    if (!createdProduct) {
      return { error: 'Failed to create product' };
    }

    // Asociar impuestos si se proporcionan
    if (taxIds && Array.isArray(taxIds) && taxIds.length > 0) {
      const productTaxRows: NewProductTax[] = taxIds.map((taxId) => ({
        productId: createdProduct.id,
        taxId,
      }));
      await db.insert(productTaxes).values(productTaxRows);
    }

    revalidatePath('/dashboard/menu');
    return { success: 'Product created successfully', productId: createdProduct.id };
  }
);

const updateCategorySchema = z.object({
  categoryId: z.coerce.number(),
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateCategory = validatedActionWithUser(
  updateCategorySchema,
  async (data, _, user) => {
    const { categoryId, name, description, isActive } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const category = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (category.length === 0) {
      return { error: 'Category not found' };
    }

    await db
      .update(categories)
      .set({
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, categoryId));

    return { success: 'Category updated successfully' };
  }
);

const idListTransform = z.string().optional().transform(v =>
  v ? v.split(',').map(Number).filter(Boolean) : []
);

const updateProductSchema = z.object({
  productId: z.coerce.number(),
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().optional(),
  price: z.string().transform(v => parseFloat(v)).pipe(z.number().positive('Price must be positive')),
  image: z.string().optional(),
  showPicture: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  sizeIds: idListTransform,
  extraIds: idListTransform,
  additionIds: idListTransform,
});

export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    const { productId, name, description, price, image, showPicture, isActive, sizeIds, extraIds, additionIds } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const product = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          eq(products.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (product.length === 0) {
      return { error: 'Product not found' };
    }

    await db
      .update(products)
      .set({
        name,
        description: description || null,
        image: image || null,
        price: price.toString(),
        showPicture: showPicture !== undefined ? showPicture : true,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    // Sync sizes
    await db.delete(productSizes).where(eq(productSizes.productId, productId));
    if (sizeIds.length > 0) {
      await db.insert(productSizes).values(sizeIds.map(sizeId => ({ productId, sizeId })));
    }

    // Sync extras
    await db.delete(productExtras).where(eq(productExtras.productId, productId));
    if (extraIds.length > 0) {
      await db.insert(productExtras).values(extraIds.map(extraId => ({ productId, extraId })));
    }

    // Sync additions
    await db.delete(productAdditions).where(eq(productAdditions.productId, productId));
    if (additionIds.length > 0) {
      await db.insert(productAdditions).values(additionIds.map(additionId => ({ productId, additionId })));
    }

    revalidatePath('/dashboard/menu');
    return { success: 'Product updated successfully' };
  }
);

const deleteItemSchema = z.object({
  id: z.coerce.number(),
});

export const deleteCategory = validatedActionWithUser(
  deleteItemSchema,
  async (data, _, user) => {
    const { id } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const category = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (category.length === 0) {
      return { error: 'Category not found' };
    }

    // Delete all products in this category
    await db
      .delete(products)
      .where(eq(products.categoryId, id));

    // Delete the category
    await db
      .delete(categories)
      .where(eq(categories.id, id));

    return { success: 'Category deleted successfully' };
  }
);

export const deleteProduct = validatedActionWithUser(
  deleteItemSchema,
  async (data, _, user) => {
    const { id } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    const product = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.teamId, userWithTeam.teamId)
        )
      )
      .limit(1);

    if (product.length === 0) {
      return { error: 'Product not found' };
    }

    await db
      .delete(products)
      .where(eq(products.id, id));

    return { success: 'Product deleted successfully' };
  }
);
