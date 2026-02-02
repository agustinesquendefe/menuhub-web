'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  const subscriptionPriceId = formData.get('priceId') as string;
  const setupPriceId = formData.get('setupPriceId') as string | undefined;
  await createCheckoutSession({ 
    team: team, 
    subscriptionPriceId,
    setupPriceId: setupPriceId || undefined
  });
});

export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
