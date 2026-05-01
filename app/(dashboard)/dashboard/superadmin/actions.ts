'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray, isNull, ne, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { teamMembers, users } from '@/lib/db/schema';

type DeleteTeamUsersState = {
  error?: string;
  success?: string;
};

export async function deleteTeamUsers(
  _prevState: DeleteTeamUsersState,
  formData: FormData
): Promise<DeleteTeamUsersState> {
  const session = await getSession();

  if (!session || session.user.role !== 'superadmin') {
    return { error: 'Unauthorized.' };
  }

  const teamId = Number(formData.get('teamId'));

  if (!Number.isInteger(teamId) || teamId <= 0) {
    return { error: 'Invalid team.' };
  }

  const teamUsers = await db
    .select({ userId: users.id })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        ne(users.role, 'superadmin'),
        isNull(users.deletedAt)
      )
    );

  const userIds = teamUsers.map((user) => user.userId);

  if (userIds.length === 0) {
    return { error: 'This team has no active users to delete.' };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
        updatedAt: new Date()
      })
      .where(inArray(users.id, userIds));

    await tx
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          inArray(teamMembers.userId, userIds)
        )
      );
  });

  revalidatePath('/dashboard/superadmin');

  return {
    success:
      userIds.length === 1
        ? 'User deleted successfully.'
        : `${userIds.length} users deleted successfully.`
  };
}
