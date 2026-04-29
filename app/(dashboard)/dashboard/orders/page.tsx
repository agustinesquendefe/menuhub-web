import { getUser, getUserWithTeam, getTeamById } from '@/lib/db/queries';
import { getOrdersByTeam } from '@/lib/db/order-actions';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const userWithTeam = await getUserWithTeam(user.id);
  if (!userWithTeam?.teamId) redirect('/dashboard');
  const team = await getTeamById(userWithTeam.teamId);
  if (!team) return <div>Equipo no encontrado</div>;
  const orders = await getOrdersByTeam(team.id);

  return <OrdersClient orders={orders} team={team} />;
}
