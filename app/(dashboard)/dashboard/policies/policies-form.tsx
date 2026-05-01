'use client';

import { useActionState, useEffect, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { upsertTeamPolicies } from '@/lib/db/policy-actions';
import { TeamPolicy } from '@/lib/db/schema';
import { ActionState } from '@/lib/auth/middleware';

const POLICIES: {
  key: keyof Omit<TeamPolicy, 'id' | 'teamId' | 'createdAt' | 'updatedAt'>;
  label: string;
  description: string;
}[] = [
  {
    key: 'warnRawIngredients',
    label: 'Raw ingredients notice',
    description: 'Some dishes may contain raw or undercooked ingredients (egg, meat, fish, etc.).',
  },
  {
    key: 'warnAllergens',
    label: 'General allergen notice',
    description: 'Tell your server about any food allergies or intolerances before ordering.',
  },
  {
    key: 'warnAlcohol',
    label: 'Alcohol content notice',
    description: 'Some products contain alcohol. Sale to minors is prohibited.',
  },
  {
    key: 'warnGluten',
    label: 'Gluten notice',
    description: 'Some products contain gluten. Not suitable for people with celiac disease.',
  },
  {
    key: 'warnNuts',
    label: 'Nut notice',
    description: 'Some products may contain or have been in contact with nuts.',
  },
  {
    key: 'warnDairy',
    label: 'Dairy notice',
    description: 'Some products contain milk or dairy derivatives.',
  },
];

export default function PoliciesForm({
  initialPolicies,
}: {
  initialPolicies: TeamPolicy | null;
}) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(upsertTeamPolicies, { error: '' });
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData();
    POLICIES.forEach(({ key }) => {
      const el = form.elements.namedItem(key) as HTMLInputElement;
      fd.set(key, el?.checked ? 'true' : 'false');
    });
    startTransition(() => dispatch(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-5">
        <h2 className="font-semibold text-lg">Notices and warnings</h2>
        {POLICIES.map(({ key, label, description }) => (
          <div key={key} className="flex items-start gap-4 py-2 border-b last:border-0">
            <input
              id={key}
              name={key}
              type="checkbox"
              className="mt-1 accent-black cursor-pointer h-4 w-4 shrink-0"
              defaultChecked={initialPolicies?.[key] ?? false}
            />
            <div className="flex-1">
              <Label htmlFor={key} className="font-medium cursor-pointer">
                {label}
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            </div>
          </div>
        ))}
      </Card>

      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-sm">{state.success}</p>}

      <Button type="submit" disabled={pending} className="cursor-pointer">
        <Save className="w-4 h-4 mr-2" />
        {pending ? 'Saving...' : 'Save policies'}
      </Button>
    </form>
  );
}
