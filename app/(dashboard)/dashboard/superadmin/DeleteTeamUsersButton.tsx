'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteTeamUsers } from './actions';

type DeleteTeamUsersButtonProps = {
  teamId: number;
  teamName: string;
};

export default function DeleteTeamUsersButton({
  teamId,
  teamName
}: DeleteTeamUsersButtonProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteTeamUsers, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form
      action={action}
      className="flex flex-col items-start gap-1"
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete the users for team "${teamName}"? This action deactivates their accounts.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="teamId" value={teamId} />
      <Button
        type="submit"
        size="sm"
        variant="destructive"
        disabled={pending}
        className="cursor-pointer"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Delete
      </Button>
      {state.error && <p className="max-w-40 text-xs text-red-600">{state.error}</p>}
      {state.success && (
        <p className="max-w-40 text-xs text-green-600">{state.success}</p>
      )}
    </form>
  );
}
