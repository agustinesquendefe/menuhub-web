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
  address: z.string().max(300).optional(),
  profilePictureUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  bannerUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  description: z.string().max(500).optional(),
  facebookUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  instagramUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  whatsappPhone: z.string().max(50).optional(),
  callPhone: z.string().max(50).optional(),
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
        address: data.address || null,
        profilePictureUrl: data.profilePictureUrl || null,
        bannerUrl: data.bannerUrl || null,
        description: data.description || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        whatsappPhone: data.whatsappPhone || null,
        callPhone: data.callPhone || null,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, userWithTeam.teamId));

    revalidatePath('/dashboard/general');

    return { success: 'Información de contacto actualizada' };
  }
);
