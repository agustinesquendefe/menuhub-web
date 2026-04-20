"use client";

import { useActionState, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { updateTeamUsername, updateTeamContact } from '@/lib/db/team-actions';
import { uploadTeamAsset } from '@/lib/supabase/upload-team-asset';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = ''
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

type TeamData = { username: string | null; contactEmail: string | null; contactPhone: string | null; address: string | null; logoUrl: string | null };

function TeamUsernameForm({ state }: { state: ActionState }) {

  const { data: team } = useSWR<TeamData>('/api/team', fetcher);
  const currentUsername = team?.username ?? '';
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (currentUsername && typeof window !== 'undefined') {
      setPreviewUrl(`${window.location.origin}/${currentUsername}`);
    } else {
      setPreviewUrl(null);
    }
  }, [currentUsername]);

  return (
    <div>
      <Label htmlFor="username" className="mb-2">
        Nombre de usuario del equipo
      </Label>
      <Input
        id="username"
        name="username"
        placeholder="ej. mi-restaurante"
        defaultValue={state.success ?? currentUsername}
      />
      {previewUrl && (
        <p className="mt-1 text-xs text-gray-500">
          Tu menú público:{' '}
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-orange-500 hover:underline"
          >
            {previewUrl}
          </a>
        </p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
      </p>
    </div>
  );
}

function TeamContactForm({ state, action, pending }: { state: ActionState; action: (formData: FormData) => void; pending: boolean }) {
  const { data: team } = useSWR<any>('/api/team', fetcher);
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logoUrl ?? null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(team?.bannerUrl ?? null);

  return (
    <form className="space-y-4" action={action}>
      <div>
        <Label htmlFor="logoFile" className="mb-2">Logo</Label>
        <Input
          id="logoFile"
          name="logoFile"
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) setLogoPreview(URL.createObjectURL(file));
          }}
        />
        {logoPreview && (
          <img src={logoPreview} alt="Logo preview" className="mt-2 max-h-24 rounded bg-gray-50 border p-2" />
        )}
        <p className="mt-1 text-xs text-gray-400">Aparece en el menú público y correos enviados a tus clientes.</p>
      </div>
      <div>
        <Label htmlFor="bannerFile" className="mb-2">Banner / Portada</Label>
        <Input
          id="bannerFile"
          name="bannerFile"
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) setBannerPreview(URL.createObjectURL(file));
          }}
        />
        {bannerPreview && (
          <img src={bannerPreview} alt="Banner preview" className="mt-2 max-h-32 rounded bg-gray-50 border p-2 w-full object-cover" />
        )}
        <p className="mt-1 text-xs text-gray-400">Imagen de portada en el menú público.</p>
      </div>
      <div>
        <Label htmlFor="description" className="mb-2">Descripción</Label>
        <Input
          id="description"
          name="description"
          placeholder="Ej. Tus comidas favoritas están aquí."
          defaultValue={team?.description ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="facebookUrl" className="mb-2">Facebook</Label>
        <Input
          id="facebookUrl"
          name="facebookUrl"
          type="url"
          placeholder="https://facebook.com/tu-pagina"
          defaultValue={team?.facebookUrl ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="instagramUrl" className="mb-2">Instagram</Label>
        <Input
          id="instagramUrl"
          name="instagramUrl"
          type="url"
          placeholder="https://instagram.com/tu-cuenta"
          defaultValue={team?.instagramUrl ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="whatsappPhone" className="mb-2">WhatsApp</Label>
        <Input
          id="whatsappPhone"
          name="whatsappPhone"
          type="tel"
          placeholder="Ej. 55 1234 5678"
          defaultValue={team?.whatsappPhone ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="callPhone" className="mb-2">Teléfono para llamar</Label>
        <Input
          id="callPhone"
          name="callPhone"
          type="tel"
          placeholder="Ej. 55 1234 5678"
          defaultValue={team?.callPhone ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="contactEmail" className="mb-2">Email de contacto</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="contacto@mirestaurante.com"
          defaultValue={team?.contactEmail ?? ''}
        />
        <p className="mt-1 text-xs text-gray-400">Se incluye en los correos de confirmación de pedido.</p>
      </div>
      <div>
        <Label htmlFor="contactPhone" className="mb-2">Teléfono de contacto</Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          placeholder="Ej. 55 1234 5678"
          defaultValue={team?.contactPhone ?? ''}
        />
      </div>
      <div>
        <Label htmlFor="address" className="mb-2">Dirección</Label>
        <Input
          id="address"
          name="address"
          placeholder="Calle, número, colonia, ciudad"
          defaultValue={team?.address ?? ''}
        />
      </div>
      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && <p className="text-green-500 text-sm">{state.success}</p>}
      <Button
        type="submit"
        className="bg-orange-500 hover:bg-orange-600 text-white"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          'Guardar'
        )}
      </Button>
    </form>
  );

}

export default function GeneralPage() {
  const [accountState, accountFormAction, isAccountPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );
  const [usernameState, usernameFormAction, isUsernamePending] = useActionState<ActionState, FormData>(
    updateTeamUsername,
    {}
  );
  const [contactState, contactFormAction, isContactPending] = useActionState<ActionState, FormData>(
    updateTeamContact,
    {}
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        General Settings
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={accountFormAction}>
              <Suspense fallback={<AccountForm state={accountState} />}>
                <AccountFormWithData state={accountState} />
              </Suspense>
              {accountState.error && (
                <p className="text-red-500 text-sm">{accountState.error}</p>
              )}
              {accountState.success && (
                <p className="text-green-500 text-sm">{accountState.success}</p>
              )}
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isAccountPending}
              >
                {isAccountPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URL del Menú Público</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={usernameFormAction}>
              <Suspense fallback={
                <div>
                  <Label htmlFor="username" className="mb-2">Nombre de usuario del equipo</Label>
                  <Input id="username" name="username" placeholder="ej. mi-restaurante" />
                </div>
              }>
                <TeamUsernameForm state={usernameState} />
              </Suspense>
              {usernameState.error && (
                <p className="text-red-500 text-sm">{usernameState.error}</p>
              )}
              {usernameState.success && (
                <p className="text-green-500 text-sm">{usernameState.success}</p>
              )}
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isUsernamePending}
              >
                {isUsernamePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de contacto del restaurante</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-sm text-gray-400">Cargando...</div>}>
              <TeamContactForm state={contactState} action={contactFormAction} pending={isContactPending} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
