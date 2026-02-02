import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { StripeConnectSetup } from './stripe-connect-setup';

export const metadata = {
  title: 'Stripe Connect Setup',
};

export default async function StripeConnectPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    redirect('/dashboard');
  }

  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, userWithTeam.teamId))
    .limit(1);

  if (!team[0]) {
    redirect('/dashboard');
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurar Pagos</h1>
        <p className="text-gray-600 mt-2">
          Configura tu cuenta de Stripe Connect para recibir pagos de tus clientes
        </p>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <StripeConnectSetup 
          teamId={userWithTeam.teamId}
          connectAccountId={team[0].stripeConnectAccountId}
          teamName={team[0].name}
        />
      </div>
    </div>
  );
}
