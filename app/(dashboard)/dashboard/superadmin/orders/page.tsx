import { getOrdersByTeam } from '@/lib/db/order-actions';
import { getTeamById } from '@/lib/db/queries';

export default async function OrdersPage({ params }: { params: { teamId: string } }) {
  const teamId = Number(params.teamId);
  const team = await getTeamById(teamId);
    if (!team) return <div>Team not found</div>;
  const orders = await getOrdersByTeam(teamId);

  return (
    <div>
         <h1>
                        Orders for {team.name}
        </h1>
        <table className="min-w-full border mt-4">
            <thead>
                <tr>
                    <th className="border px-2 py-1">ID</th>
                                        <th className="border px-2 py-1">Products</th>
                    <th className="border px-2 py-1">Subtotal</th>
                                        <th className="border px-2 py-1">Taxes</th>
                    <th className="border px-2 py-1">Total</th>
                                        <th className="border px-2 py-1">Type</th>
                                        <th className="border px-2 py-1">Payment</th>
                                        <th className="border px-2 py-1">Status</th>
                                        <th className="border px-2 py-1">Date</th>
                </tr>
            </thead>
            <tbody>
                {orders.map(order => (
                    <tr key={order.id}>
                        <td className="border px-2 py-1">{order.id}</td>
                        <td className="border px-2 py-1">
                            <pre className="whitespace-pre-wrap text-xs max-w-xs overflow-x-auto">{JSON.stringify(JSON.parse(order.products), null, 2)}</pre>
                        </td>
                        <td className="border px-2 py-1">${order.subtotal}</td>
                        <td className="border px-2 py-1">${order.taxes}</td>
                        <td className="border px-2 py-1 font-bold">${order.total}</td>
                        <td className="border px-2 py-1">{order.type}</td>
                        <td className="border px-2 py-1">{order.payment}</td>
                        <td className="border px-2 py-1">{order.status}</td>
                        <td className="border px-2 py-1">{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}
