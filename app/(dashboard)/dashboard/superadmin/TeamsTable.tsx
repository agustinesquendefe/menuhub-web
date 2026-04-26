// Componente para mostrar la tabla de equipos registrados

import { getAllTeams } from '@/lib/db/getAllTeams';
import * as React from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';

export default async function TeamsTable() {
  const teams = await getAllTeams();

  if (!teams || teams.length === 0) {
    return (
      <div className="border rounded p-4 bg-white">
        <p>No hay equipos registrados.</p>
      </div>
    );
  }

  // For demo, assume isSuperadmin is always true. Replace with real role check.
  const isSuperadmin = true;

  return (
    <div className="border rounded p-4 bg-white overflow-x-auto">
      <table className="min-w-full text-sm whitespace-nowrap">
        <thead>
          <tr>
            <th className="text-left p-2">ID</th>
            <th className="text-left p-2">Nombre</th>
            <th className="text-left p-2">Username</th>
            <th className="text-left p-2">Ciudad</th>
            <th className="text-left p-2">País</th>
            <th className="text-left p-2">Bank Name</th>
            <th className="text-left p-2">Routing #</th>
            <th className="text-left p-2">Account #</th>
            <th className="text-left p-2">Stripe Connect Account ID</th>
            <th className="text-left p-2">Creado</th>
            <th className="text-left p-2">Editar</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <Dialog.Root key={team.id}>
              <tr className="border-t">
                <td className="p-2">{team.id}</td>
                <td className="p-2">{team.name}</td>
                <td className="p-2">{team.username}</td>
                <td className="p-2">{team.city}</td>
                <td className="p-2">{team.country}</td>
                <td className="p-2">{team.bank_name || ''}</td>
                <td className="p-2">{team.routingNumber || ''}</td>
                <td className="p-2">{team.accountNumber || ''}</td>
                <td className="p-2">{team.stripeConnectAccountId || ''}</td>
                <td className="p-2">{new Date(team.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <Dialog.Trigger asChild>
                    <Button size="sm" variant="outline" className='cursor-pointer'>Editar</Button>
                  </Dialog.Trigger>
                </td>
              </tr>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg focus:outline-none">
                  <Dialog.Title className="text-lg font-bold mb-4">Editar equipo #{team.id}</Dialog.Title>
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${team.id}`}>Nombre</Label>
                      <Input id={`name-${team.id}`} name="name" defaultValue={team.name} />
                    </div>
                    <div>
                      <Label htmlFor={`username-${team.id}`}>Username</Label>
                      <Input id={`username-${team.id}`} name="username" defaultValue={team.username!} />
                    </div>
                    <div>
                      <Label htmlFor={`city-${team.id}`}>Ciudad</Label>
                      <Input id={`city-${team.id}`} name="city" defaultValue={team.city!} />
                    </div>
                    <div>
                      <Label htmlFor={`country-${team.id}`}>País</Label>
                      <Input id={`country-${team.id}`} name="country" defaultValue={team.country!} />
                    </div>
                    {isSuperadmin && (
                      <>
                        <div>
                          <Label htmlFor={`bank_name-${team.id}`}>Bank Name</Label>
                          <Input id={`bank_name-${team.id}`} name="bank_name" defaultValue={team.bank_name || ''} />
                        </div>
                        <div>
                          <Label htmlFor={`routingNumber-${team.id}`}>Routing #</Label>
                          <Input id={`routingNumber-${team.id}`} name="routingNumber" defaultValue={team.routingNumber || ''} />
                        </div>
                        <div>
                          <Label htmlFor={`accountNumber-${team.id}`}>Account #</Label>
                          <Input id={`accountNumber-${team.id}`} name="accountNumber" defaultValue={team.accountNumber || ''} />
                        </div>
                        <div>
                          <Label htmlFor={`stripeConnectAccountId-${team.id}`}>Stripe Connect Account ID</Label>
                          <Input id={`stripeConnectAccountId-${team.id}`} name="stripeConnectAccountId" defaultValue={team.stripeConnectAccountId || ''} />
                        </div>
                      </>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                      <Dialog.Close asChild>
                        <Button type="button" variant="ghost">Cancelar</Button>
                      </Dialog.Close>
                      <Button type="submit" variant="default">Guardar</Button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ))}
        </tbody>
      </table>
    </div>
  );
}
