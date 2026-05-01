'use server';

import { z } from 'zod';
import { db } from './drizzle';
import { teams } from './schema';
import { eq, inArray } from 'drizzle-orm';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam, getTeamByUsername } from './queries';
import { updateStripeConnectAccount } from '@/lib/payments/stripe';
import { revalidatePath } from 'next/cache';

const updateTeamUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'The username must be at least 3 characters long')
    .max(50, 'The username cannot exceed 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Only lowercase letters, numbers, and hyphens are allowed, without leading or trailing hyphens'
    ),
});

function buildUsernameCandidates(username: string) {
  const base = username.slice(0, 42);
  const year = new Date().getFullYear();

  return Array.from(
    new Set([
      `${base}-menu`,
      `${base}-restaurant`,
      `${base}-grill`,
      `${base}-${year}`,
      `${base}-online`
    ])
  ).slice(0, 5);
}

async function getAvailableUsernameSuggestions(username: string) {
  const candidates = buildUsernameCandidates(username);
  const existing = await db
    .select({ username: teams.username })
    .from(teams)
    .where(inArray(teams.username, candidates));
  const taken = new Set(existing.map((row) => row.username).filter(Boolean));

  return candidates.filter((candidate) => !taken.has(candidate)).slice(0, 3);
}

export const updateTeamUsername = validatedActionWithUser(
  updateTeamUsernameSchema,
  async (data, _formData, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return { error: 'Team not found' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only the owner can update the team' };
    }

    const existing = await getTeamByUsername(data.username);
    if (existing && existing.id !== userWithTeam.teamId) {
      return {
        error: 'That username is not available.',
        suggestions: await getAvailableUsernameSuggestions(data.username)
      };
    }

    await db
      .update(teams)
      .set({ username: data.username, updatedAt: new Date() })
      .where(eq(teams.id, userWithTeam.teamId));

    revalidatePath('/dashboard/general');

    return { success: 'Username updated' };
  }
);


const updateTeamContactSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  contactEmail: z.string().email('Invalid email').or(z.literal('')).optional(),
  contactPhone: z.string().max(50).optional(),
  line1: z.string().max(300).optional(),
  line2: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipcode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  profilePictureUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  bannerUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  description: z.string().max(500).optional(),
  facebookUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  instagramUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  tiktokUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  youtubeUrl: z.string().url('Invalid URL').or(z.literal('')).optional(),
  whatsappPhone: z.string().max(50).optional(),
  callPhone: z.string().max(50).optional(),
  openingHours: z.string().optional(),
});

export const updateTeamContact = validatedActionWithUser(
  updateTeamContactSchema,
  async (data, _formData, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return { error: 'Team not found' };
    }

    if (user.role !== 'owner') {
      return { error: 'Only the owner can update the team' };
    }

    const [currentTeam] = await db.select().from(teams).where(eq(teams.id, userWithTeam.teamId));

    await db
      .update(teams)
      .set({
        name: data.name,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        line1: data.line1 || null,
        line2: data.line2 || null,
        city: data.city || null,
        state: data.state || null,
        zipcode: data.zipcode || null,
        country: data.country || null,
        profilePictureUrl: data.profilePictureUrl || null,
        bannerUrl: data.bannerUrl || null,
        description: data.description || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        tiktokUrl: data.tiktokUrl || null,
        youtubeUrl: data.youtubeUrl || null,
        whatsappPhone: data.whatsappPhone || null,
        callPhone: data.callPhone || null,
        openingHours: data.openingHours || null,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, userWithTeam.teamId));

    if (currentTeam?.stripeConnectAccountId) {
      const changed =
        data.name !== currentTeam.name ||
        data.contactEmail !== currentTeam.contactEmail ||
        data.contactPhone !== currentTeam.contactPhone ||
        data.line1 !== currentTeam.line1 ||
        data.line2 !== currentTeam.line2 ||
        data.city !== currentTeam.city ||
        data.state !== currentTeam.state ||
        data.zipcode !== currentTeam.zipcode ||
        data.country !== currentTeam.country;
      if (changed) {
        await updateStripeConnectAccount({
          accountId: currentTeam.stripeConnectAccountId,
          name: data.name,
          email: data.contactEmail,
          phone: data.contactPhone,
          line1: data.line1,
          line2: data.line2,
          city: data.city,
          state: data.state,
          zipcode: data.zipcode,
          country: data.country
        });
      }
    }

    revalidatePath('/dashboard/general');

    return { success: 'Contact information updated' };
  }
);
