import { notFound } from 'next/navigation';
import { getCategoriesWithProducts, getTeamById } from '@/lib/db/queries';
import { getTeamPolicies } from '@/lib/db/policy-actions';
import PublicMenu from './public-menu';

interface Props {
  params: Promise<{ teamId: string }>;
}

export default async function PublicMenuPage({ params }: Props) {
  const { teamId: rawId } = await params;
  const teamId = parseInt(rawId);
  if (isNaN(teamId)) notFound();

  const [team, categories, policies] = await Promise.all([
    getTeamById(teamId),
    getCategoriesWithProducts(teamId),
    getTeamPolicies(teamId),
  ]);

  if (!team) notFound();

  // Only show active categories and active products
  const activeCategories = categories
    .filter(c => c.isActive)
    .map(c => ({
      ...c,
      products: c.products.filter(p => p.isActive),
    }))
    .filter(c => c.products.length > 0);

  return <PublicMenu team={team} categories={activeCategories} policies={policies} />;
}
