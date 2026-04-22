// Componente para mostrar la tabla de equipos registrados
import { getAllTeams } from '@/lib/db/getAllTeams';

export default async function TeamsTable() {
  const teams = await getAllTeams();

  if (!teams || teams.length === 0) {
    return (
      <div className="border rounded p-4 bg-white">
        <p>No hay equipos registrados.</p>
      </div>
    );
  }

  return (
    <div className="border rounded p-4 bg-white">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Nombre</th>
            <th className="text-left p-2">Username</th>
            <th className="text-left p-2">Ciudad</th>
            <th className="text-left p-2">País</th>
            <th className="text-left p-2">Creado</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id} className="border-t">
              <td className="p-2">{team.id}</td>
              <td className="p-2">{team.name}</td>
              <td className="p-2">{team.username}</td>
              <td className="p-2">{team.city}</td>
              <td className="p-2">{team.country}</td>
              <td className="p-2">{new Date(team.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
