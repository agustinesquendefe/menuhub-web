'use server';

import { z } from 'zod';
import { db } from './drizzle';
import { teams } from './schema';
import { eq } from 'drizzle-orm';
import { validatedActionWithUser } from '@/lib/auth/middleware';
import { getUserWithTeam, getTeamByUsername } from './queries';
import { revalidatePath } from 'next/cache';

const updateTeamUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede superar los 50 caracteres')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Solo letras minúsculas, números y guiones (sin guiones al inicio o final)'
    ),
});

export const updateTeamUsername = validatedActionWithUser(
  updateTeamUsernameSchema,
  async (data, _formData, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return { error: 'No se encontró el equipo' };
    }

    const existing = await getTeamByUsername(data.username);
    if (existing && existing.id !== userWithTeam.teamId) {
      return { error: 'Ese nombre de usuario ya está en uso' };
    }

    await db
      .update(teams)
      .set({ username: data.username, updatedAt: new Date() })
      .where(eq(teams.id, userWithTeam.teamId));

    revalidatePath('/dashboard/general');

    return { success: 'Nombre de usuario actualizado' };
  }
);


const updateTeamContactSchema = z.object({
  contactEmail: z.string().email('Email inválido').or(z.literal('')).optional(),
  contactPhone: z.string().max(50).optional(),
  line1: z.string().max(300).optional(),
  line2: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipcode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  profilePictureUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  bannerUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  description: z.string().max(500).optional(),
  facebookUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  instagramUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  tiktokUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  youtubeUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  whatsappPhone: z.string().max(50).optional(),
  callPhone: z.string().max(50).optional(),
  openingHours: z.string().optional(),
});

export const updateTeamContact = validatedActionWithUser(
  updateTeamContactSchema,
  async (data, _formData, user) => {
    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return { error: 'No se encontró el equipo' };
    }

    await db
      .update(teams)
      .set({
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

    revalidatePath('/dashboard/general');

    return { success: 'Información de contacto actualizada' };
  }
);
