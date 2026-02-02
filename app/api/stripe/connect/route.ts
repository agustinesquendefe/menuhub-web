import { getUser } from '@/lib/db/queries';
import { getUserWithTeam } from '@/lib/db/queries';
import { getStripeConnectAccountLink, createStripeConnectAccount } from '@/lib/payments/stripe';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithTeam = await getUserWithTeam(user.id);
    if (!userWithTeam?.teamId) {
      return NextResponse.json({ error: 'User not associated with a team' }, { status: 400 });
    }

    // Get team data to access Connect account ID
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, userWithTeam.teamId))
      .limit(1);

    if (!team[0]) {
      return NextResponse.json({ error: 'Team not found' }, { status: 400 });
    }

    let connectAccountId = team[0].stripeConnectAccountId;

    // If no Connect account exists, create one now
    if (!connectAccountId) {
      try {
        connectAccountId = await createStripeConnectAccount(team[0].name, userWithTeam.teamId);
        
        // Update the team with the new Connect account ID
        await db
          .update(teams)
          .set({ stripeConnectAccountId: connectAccountId })
          .where(eq(teams.id, userWithTeam.teamId));
      } catch (createError) {
        console.error('Failed to create Stripe Connect account:', createError);
        return NextResponse.json(
          { error: 'Failed to create Stripe Connect account. Please try again.' },
          { status: 500 }
        );
      }
    }

    const accountLink = await getStripeConnectAccountLink(connectAccountId, userWithTeam.teamId);

    return NextResponse.json({ accountLink, accountId: connectAccountId });
  } catch (error) {
    console.error('Error getting Stripe Connect link:', error);
    return NextResponse.json(
      { error: 'Failed to generate Stripe Connect link' },
      { status: 500 }
    );
  }
}
