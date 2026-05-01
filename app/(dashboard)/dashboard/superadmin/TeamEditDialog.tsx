'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type TeamEditDialogProps = {
  team: {
    id: number;
    name: string;
    username: string | null;
    city: string | null;
    country: string | null;
    bank_name: string | null;
    routingNumber: string | null;
    accountNumber: string | null;
    stripeConnectAccountId: string | null;
  };
  isSuperadmin: boolean;
};

export default function TeamEditDialog({
  team,
  isSuperadmin
}: TeamEditDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button size="sm" variant="outline" className="cursor-pointer">
          Edit
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg focus:outline-none">
          <Dialog.Title className="text-lg font-bold mb-4">
            Edit team #{team.id}
          </Dialog.Title>
          <form className="space-y-4">
            <div>
              <Label htmlFor={`name-${team.id}`}>Name</Label>
              <Input id={`name-${team.id}`} name="name" defaultValue={team.name} />
            </div>
            <div>
              <Label htmlFor={`username-${team.id}`}>Username</Label>
              <Input
                id={`username-${team.id}`}
                name="username"
                defaultValue={team.username || ''}
              />
            </div>
            <div>
              <Label htmlFor={`city-${team.id}`}>City</Label>
              <Input id={`city-${team.id}`} name="city" defaultValue={team.city || ''} />
            </div>
            <div>
              <Label htmlFor={`country-${team.id}`}>Country</Label>
              <Input
                id={`country-${team.id}`}
                name="country"
                defaultValue={team.country || ''}
              />
            </div>
            {isSuperadmin && (
              <>
                <div>
                  <Label htmlFor={`bank_name-${team.id}`}>Bank Name</Label>
                  <Input
                    id={`bank_name-${team.id}`}
                    name="bank_name"
                    defaultValue={team.bank_name || ''}
                  />
                </div>
                <div>
                  <Label htmlFor={`routingNumber-${team.id}`}>Routing #</Label>
                  <Input
                    id={`routingNumber-${team.id}`}
                    name="routingNumber"
                    defaultValue={team.routingNumber || ''}
                  />
                </div>
                <div>
                  <Label htmlFor={`accountNumber-${team.id}`}>Account #</Label>
                  <Input
                    id={`accountNumber-${team.id}`}
                    name="accountNumber"
                    defaultValue={team.accountNumber || ''}
                  />
                </div>
                <div>
                  <Label htmlFor={`stripeConnectAccountId-${team.id}`}>
                    Stripe Connect Account ID
                  </Label>
                  <Input
                    id={`stripeConnectAccountId-${team.id}`}
                    name="stripeConnectAccountId"
                    defaultValue={team.stripeConnectAccountId || ''}
                  />
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" variant="default">
                Save
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
