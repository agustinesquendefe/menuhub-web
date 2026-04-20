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
    label: 'Aviso de ingredientes crudos',
    description: 'Algunos platillos pueden contener ingredientes crudos o semicrudos (huevo, carne, pescado, etc.).',
  },
  {
    key: 'warnAllergens',
    label: 'Aviso general de alérgenos',
    description: 'Informe a su mesero sobre cualquier alergia o intolerancia alimentaria antes de ordenar.',
  },
  {
    key: 'warnAlcohol',
    label: 'Aviso de contenido de alcohol',
    description: 'Algunos productos contienen alcohol. Prohibida la venta a menores de edad.',
  },
  {
    key: 'warnGluten',
    label: 'Aviso de gluten',
    description: 'Algunos productos contienen gluten. No apto para personas con enfermedad celiaca.',
  },
  {
    key: 'warnNuts',
    label: 'Aviso de frutos secos',
    description: 'Algunos productos pueden contener o haber estado en contacto con frutos secos.',
  },
  {
    key: 'warnDairy',
    label: 'Aviso de lácteos',
    description: 'Algunos productos contienen leche o derivados lácteos.',
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
        <h2 className="font-semibold text-lg">Avisos y advertencias</h2>
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
        {pending ? 'Guardando...' : 'Guardar políticas'}
      </Button>
    </form>
  );
}
