import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoriesWithProducts, getTeamByUsername } from '@/lib/db/queries';
import { getTeamPolicies } from '@/lib/db/policy-actions';
import PublicMenu from '@/app/menu/[teamId]/public-menu';
import { getTeamMenuMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const team = await getTeamByUsername(username);

  if (!team) {
    return {
      title: 'Menu not found',
      description: 'The requested menu is not available.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return getTeamMenuMetadata(team);
}

export default async function TeamPublicMenuPage({ params }: Props) {
  const { username } = await params;

  const team = await getTeamByUsername(username);
  if (!team) notFound();

  const [categories, policies] = await Promise.all([
    getCategoriesWithProducts(team.id),
    getTeamPolicies(team.id),
  ]);

  const activeCategories = categories
    .filter(c => c.isActive)
    .map(c => ({
      ...c,
      products: c.products.filter(p => p.isActive),
    }))
    .filter(c => c.products.length > 0);

  return <PublicMenu team={team} categories={activeCategories} policies={policies} />;
}
