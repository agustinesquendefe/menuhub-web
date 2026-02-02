import { getUser } from '@/lib/db/queries';
import { getCategoriesWithProducts, getUserWithTeam } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
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

  const categoriesWithProducts = await getCategoriesWithProducts(userWithTeam.teamId);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Administrar Menú</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        <MenuManager 
          teamId={userWithTeam.teamId}
          initialCategories={categoriesWithProducts}
        />
      </div>
    </div>
  );
}
