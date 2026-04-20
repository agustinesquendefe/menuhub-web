import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { getTeamPolicies } from '@/lib/db/policy-actions';
import { redirect } from 'next/navigation';
import PoliciesForm from './policies-form';

export const metadata = {
  title: 'Políticas del menú',
};

export default async function PoliciesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) redirect('/dashboard');

  const policies = await getTeamPolicies(userWithTeam.teamId);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Políticas del menú</h1>
        <p className="mt-2 text-sm text-gray-600">
          Define los avisos y advertencias que se mostrarán a tus clientes en el menú digital.
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <PoliciesForm initialPolicies={policies} />
      </div>
    </div>
  );
}
