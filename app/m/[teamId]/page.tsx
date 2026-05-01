import { getTeamById } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';

type MenuRedirectPageProps = {
  params: Promise<{ teamId: string }>;
};

export default async function MenuRedirectPage({ params }: MenuRedirectPageProps) {
  const { teamId: rawTeamId } = await params;
  const teamId = Number(rawTeamId);

  if (!Number.isInteger(teamId)) {
    notFound();
  }

  const team = await getTeamById(teamId);
  if (!team) {
    notFound();
  }

  redirect(team.username ? `/${team.username}` : `/menu/${team.id}`);
}
