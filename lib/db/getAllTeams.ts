import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export async function getAllTeams() {
  const rows = await db
    .select({
      team: teams,
      ownerName: users.name,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerEmail: users.email,
      ownerPhone: users.phone
    })
    .from(teams)
    .innerJoin(
      teamMembers,
      and(eq(teams.id, teamMembers.teamId), eq(teamMembers.role, 'owner'))
    )
    .innerJoin(
      users,
      and(eq(teamMembers.userId, users.id), isNull(users.deletedAt))
    )
    .orderBy(teams.createdAt);

  return rows.map((row) => ({
    ...row.team,
    ownerName: row.ownerName,
    ownerFirstName: row.ownerFirstName,
    ownerLastName: row.ownerLastName,
    ownerEmail: row.ownerEmail,
    ownerPhone: row.ownerPhone
  }));
}
