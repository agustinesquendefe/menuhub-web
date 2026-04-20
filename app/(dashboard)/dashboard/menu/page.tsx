import { getUser } from '@/lib/db/queries';
import { getCategoriesWithProducts, getUserWithTeam, getTeamCatalog, getTeamById } from '@/lib/db/queries';
import { getTeamPolicies } from '@/lib/db/policy-actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { MenuManager } from './menu-manager';

export const metadata = {
  title: 'Administrar Menú',
};

export default async function MenuPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) {
    redirect('/dashboard');
  }

  const [categoriesWithProducts, teamCatalog, teamPolicies, team] = await Promise.all([
    getCategoriesWithProducts(userWithTeam.teamId),
    getTeamCatalog(userWithTeam.teamId),
    getTeamPolicies(userWithTeam.teamId),
    getTeamById(userWithTeam.teamId),
  ]);

  const previewHref = team?.username
    ? `/${team.username}`
    : `/menu/${userWithTeam.teamId}`;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Administrar Menú</h1>
          <Link
            href={previewHref}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Vista pública
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <MenuManager 
          teamId={userWithTeam.teamId}
          initialCategories={categoriesWithProducts}
          teamCatalog={teamCatalog}
          initialPolicies={teamPolicies}
        />
      </div>
    </div>
  );
}
