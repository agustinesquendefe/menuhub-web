'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { teamPolicies, NewTeamPolicy } from '@/lib/db/schema';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const boolField = z.enum(['true', 'false']).transform(v => v === 'true').optional().default('false');

const upsertPoliciesSchema = z.object({
  warnRawIngredients: boolField,
  warnAllergens: boolField,
  warnAlcohol: boolField,
  warnGluten: boolField,
  warnNuts: boolField,
  warnDairy: boolField,
});

export const upsertTeamPolicies = validatedActionWithUser(
  upsertPoliciesSchema,
  async (data, _, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only team owners can update policies' };
    }

    const teamId = userWithTeam.teamId;

    const values: NewTeamPolicy = {
      teamId,
      ...data,
      updatedAt: new Date(),
    };

    await db
      .insert(teamPolicies)
      .values(values)
      .onConflictDoUpdate({
        target: teamPolicies.teamId,
        set: {
          warnRawIngredients: data.warnRawIngredients,
          warnAllergens: data.warnAllergens,
          warnAlcohol: data.warnAlcohol,
          warnGluten: data.warnGluten,
          warnNuts: data.warnNuts,
          warnDairy: data.warnDairy,
          updatedAt: new Date(),
        },
      });

    revalidatePath('/dashboard/policies');
    return { success: 'Policies saved successfully' };
  }
);

export async function getTeamPolicies(teamId: number) {
  const rows = await db
    .select()
    .from(teamPolicies)
    .where(eq(teamPolicies.teamId, teamId))
    .limit(1);
  return rows[0] ?? null;
}
