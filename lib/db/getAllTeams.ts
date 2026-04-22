import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';

export async function getAllTeams() {
  return await db.select().from(teams).orderBy(teams.createdAt);
}
