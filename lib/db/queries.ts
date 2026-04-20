import { desc, and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, categories, products, sizes, extras, additions, productSizes, productExtras, productAdditions } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: string;
    stripeConnectAccountId?: string | null;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getCategories(teamId: number) {
  return await db
    .select()
    .from(categories)
    .where(eq(categories.teamId, teamId))
    .orderBy(categories.position);
}

export async function getCategoriesWithProducts(teamId: number) {
  const categoriesList = await db
    .select()
    .from(categories)
    .where(eq(categories.teamId, teamId))
    .orderBy(categories.position);

  const categoriesWithProducts = await Promise.all(
    categoriesList.map(async (category) => {
      const categoryProducts = await db
        .select()
        .from(products)
        .where(eq(products.categoryId, category.id))
        .orderBy(products.position);

      const productsWithAssociations = await Promise.all(
        categoryProducts.map(async (product) => {
          const [sizeRows, extraRows, additionRows] = await Promise.all([
            db.select({ size: sizes })
              .from(productSizes)
              .innerJoin(sizes, eq(productSizes.sizeId, sizes.id))
              .where(eq(productSizes.productId, product.id)),
            db.select({ extra: extras })
              .from(productExtras)
              .innerJoin(extras, eq(productExtras.extraId, extras.id))
              .where(eq(productExtras.productId, product.id)),
            db.select({ addition: additions })
              .from(productAdditions)
              .innerJoin(additions, eq(productAdditions.additionId, additions.id))
              .where(eq(productAdditions.productId, product.id)),
          ]);

          return {
            ...product,
            sizes: sizeRows.map(r => r.size),
            extras: extraRows.map(r => r.extra),
            additions: additionRows.map(r => r.addition),
          };
        })
      );

      return {
        ...category,
        products: productsWithAssociations,
      };
    })
  );

  return categoriesWithProducts;
}

export async function getTeamById(teamId: number) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  return result[0] ?? null;
}

export async function getTeamByUsername(username: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.username, username))
    .limit(1);
  return result[0] ?? null;
}

export async function getTeamCatalog(teamId: number) {
  const [teamSizes, teamExtras, teamAdditions] = await Promise.all([
    db.select().from(sizes).where(eq(sizes.teamId, teamId)).orderBy(sizes.position),
    db.select().from(extras).where(eq(extras.teamId, teamId)).orderBy(extras.position),
    db.select().from(additions).where(eq(additions.teamId, teamId)).orderBy(additions.position),
  ]);
  return { sizes: teamSizes, extras: teamExtras, additions: teamAdditions };
}

export async function getProducts(categoryId: number) {
  return await db
    .select()
    .from(products)
    .where(eq(products.categoryId, categoryId))
    .orderBy(products.position);
}
