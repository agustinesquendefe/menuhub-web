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
  if (user.role !== 'superadmin') {
    redirect('/dashboard');
  }

  // Si quieres mostrar algo relacionado a la compañía, puedes cargarlo aquí
  // Ejemplo: lista de teams, cuentas stripe, etc.

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurar Pagos</h1>
        <p className="text-gray-600 mt-2">
          Configura tu cuenta de Stripe Connect para recibir pagos de tus clientes
        </p>
      </div>
      {/* Aquí puedes renderizar la UI de superadmin para Stripe Connect */}
    </div>
  );
}
