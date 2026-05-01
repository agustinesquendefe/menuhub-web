import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoriesWithProducts, getTeamById } from '@/lib/db/queries';
import { getTeamPolicies } from '@/lib/db/policy-actions';
import PublicMenu from './public-menu';
import { getSecondaryTeamMenuMetadata } from '@/lib/seo';

interface Props {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId: rawId } = await params;
  const teamId = parseInt(rawId, 10);

  if (Number.isNaN(teamId)) {
    return {
      title: 'Menu not found',
      description: 'The requested menu is not available.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const team = await getTeamById(teamId);

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

  return getSecondaryTeamMenuMetadata(team);
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
