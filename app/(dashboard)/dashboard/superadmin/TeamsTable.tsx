import { getAllTeams } from '@/lib/db/getAllTeams';
import DeleteTeamUsersButton from './DeleteTeamUsersButton';
import TeamEditDialog from './TeamEditDialog';

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'bg-green-50 text-green-700 ring-green-600/20';
    case 'past_due':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
    case 'canceled':
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-red-600/20';
    default:
      return 'bg-gray-50 text-gray-700 ring-gray-600/20';
  }
}

function splitOwnerName(name: string | null) {
  if (!name) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
  return {
    firstName: firstName || '',
    lastName: lastNameParts.join(' ')
  };
}

export default async function TeamsTable() {
  const teams = await getAllTeams();

  if (!teams || teams.length === 0) {
    return (
      <div className="border rounded p-4 bg-white">
        <p>No teams registered.</p>
      </div>
    );
  }

  const isSuperadmin = true;

  return (
    <div className="border rounded p-4 bg-white overflow-x-auto">
      <table className="min-w-full text-sm whitespace-nowrap">
        <thead>
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Username</th>
            <th className="text-left p-2">Owner first name</th>
            <th className="text-left p-2">Owner last name</th>
            <th className="text-left p-2">Owner phone</th>
            <th className="text-left p-2">Owner email</th>
            <th className="text-left p-2">Line 1</th>
            <th className="text-left p-2">Line 2</th>
            <th className="text-left p-2">City</th>
            <th className="text-left p-2">State</th>
            <th className="text-left p-2">Postal code</th>
            <th className="text-left p-2">Country</th>
            <th className="text-left p-2">Bank Name</th>
            <th className="text-left p-2">Routing #</th>
            <th className="text-left p-2">Account #</th>
            <th className="text-left p-2">Stripe Connect Account ID</th>
            <th className="text-left p-2">Created</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Edit</th>
            <th className="text-left p-2">Delete users</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => {
            const status = team.subscriptionStatus || 'pending';
            const owner = {
              firstName: team.ownerFirstName || splitOwnerName(team.ownerName).firstName,
              lastName: team.ownerLastName || splitOwnerName(team.ownerName).lastName
            };

            return (
              <tr className="border-t" key={team.id}>
                <td className="p-2">{team.id}</td>
                <td className="p-2">{team.name}</td>
                <td className="p-2">{team.username}</td>
                <td className="p-2">{owner.firstName}</td>
                <td className="p-2">{owner.lastName}</td>
                <td className="p-2">{team.ownerPhone || ''}</td>
                <td className="p-2">{team.ownerEmail || ''}</td>
                <td className="p-2">{team.line1 || ''}</td>
                <td className="p-2">{team.line2 || ''}</td>
                <td className="p-2">{team.city}</td>
                <td className="p-2">{team.state}</td>
                <td className="p-2">{team.zipcode}</td>
                <td className="p-2">{team.country}</td>
                <td className="p-2">{team.bank_name || ''}</td>
                <td className="p-2">{team.routingNumber || ''}</td>
                <td className="p-2">{team.accountNumber || ''}</td>
                <td className="p-2">{team.stripeConnectAccountId || ''}</td>
                <td className="p-2">{new Date(team.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusBadgeClass(status)}`}
                  >
                    {status.replaceAll('_', ' ')}
                  </span>
                </td>
                <td className="p-2">
                  <TeamEditDialog team={team} isSuperadmin={isSuperadmin} />
                </td>
                <td className="p-2">
                  <DeleteTeamUsersButton teamId={team.id} teamName={team.name} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
