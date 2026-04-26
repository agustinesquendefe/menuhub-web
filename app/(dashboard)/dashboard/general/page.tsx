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
import { OpeningHoursEditor, OpeningHours } from '@/components/ui/OpeningHoursEditor';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
}: {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
}) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">Email</Label>
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

function TeamUsernameForm({ state }: { state: ActionState }) {
  const { data: team } = useSWR<any>('/api/team', fetcher);
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
      <Label htmlFor="username" className="mb-2">Nombre de usuario del equipo</Label>
      <Input
        id="username"
        name="username"
        placeholder="ej. mi-restaurante"
        defaultValue={state.success ?? currentUsername}
      />
      {previewUrl && (
        <p className="mt-1 text-xs text-gray-500">
          Tu menú público:{' '}
          <a href={previewUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">
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

function TeamContactForm({ state, action, pending }: { state: ActionState; action: (formData: FormData) => void; pending: boolean; }) {
  const { data: team } = useSWR<any>('/api/team', fetcher);
  const teamId = team?.id;
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Horarios de atención
  const defaultOpening: OpeningHours = {
    monday: { open: '', close: '', enabled: false },
    tuesday: { open: '', close: '', enabled: false },
    wednesday: { open: '', close: '', enabled: false },
    thursday: { open: '', close: '', enabled: false },
    friday: { open: '', close: '', enabled: false },
    saturday: { open: '', close: '', enabled: false },
    sunday: { open: '', close: '', enabled: false },
  };
  const [openingHours, setOpeningHours] = useState<OpeningHours>(() => {
    if (team?.openingHours) {
      try {
        return typeof team.openingHours === 'string' ? JSON.parse(team.openingHours) : team.openingHours;
      } catch {
        return defaultOpening;
      }
    }
    return defaultOpening;
  });

  useEffect(() => {
    if (team?.profilePictureUrl) {
      setProfilePicturePreview(team.profilePictureUrl);
      setProfilePictureUrl(team.profilePictureUrl);
    }
    if (team?.bannerUrl) {
      setBannerPreview(team.bannerUrl);
      setBannerUrl(team.bannerUrl);
    }
  }, [team?.profilePictureUrl, team?.bannerUrl]);

  async function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;
    setProfilePicturePreview(URL.createObjectURL(file));
    setUploading(true);
    const url = await uploadTeamAsset({ file, teamId, type: 'profile_picture' });
    setProfilePictureUrl(url);
    setUploading(false);
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !teamId) return;
    setBannerPreview(URL.createObjectURL(file));
    setUploading(true);
    const url = await uploadTeamAsset({ file, teamId, type: 'banner' });
    setBannerUrl(url);
    setUploading(false);
  }

  // Wrapper para inyectar las URLs antes de enviar el form
  const customAction = async (formData: FormData) => {
    if (profilePictureUrl) formData.set('profilePictureUrl', profilePictureUrl);
    if (bannerUrl) formData.set('bannerUrl', bannerUrl);
    formData.set('openingHours', JSON.stringify(openingHours));
    await action(formData);
  };

  return (
    <form className="space-y-8" action={customAction}>
      {/* Bloque: Perfil y Banner */}
      <div className="rounded-xl border bg-white p-4 space-y-4"> 
        <h3 className="font-semibold text-gray-800 mb-2">Perfil y Banner</h3>
        <div>
          <Label htmlFor="profilePictureFile" className="mb-2">Foto de perfil</Label>
          <Input id="profilePictureFile" name="profilePictureFile" type="file" accept="image/*" onChange={handleProfilePictureChange} />
          {profilePicturePreview && (
            <img src={profilePicturePreview} alt="Foto de perfil" className="mt-2 max-h-24 rounded bg-gray-50 border p-2" />
          )}
          <p className="mt-1 text-xs text-gray-400">Aparece en el menú público y correos enviados a tus clientes.</p>
        </div>
        <div>
          <Label htmlFor="bannerFile" className="mb-2">Banner / Portada</Label>
          <Input id="bannerFile" name="bannerFile" type="file" accept="image/*" onChange={handleBannerChange} />
          {bannerPreview && (
            <img src={bannerPreview} alt="Banner" className="mt-2 max-h-32 rounded bg-gray-50 border p-2 w-full object-cover" />
          )}
          <p className="mt-1 text-xs text-gray-400">Imagen de portada en el menú público.</p>
        </div>
        <div>
          <Label htmlFor="name" className="mb-2">Nombre del equipo</Label>
          <Input id="name" name="name" placeholder="Ej. Mi Restaurante" defaultValue={team?.name ?? ''} required />
        </div>
        <div>
          <Label htmlFor="description" className="mb-2">Descripción</Label>
          <Input id="description" name="description" placeholder="Ej. Tus comidas favoritas están aquí." defaultValue={team?.description ?? ''} />
        </div>
      </div>

      {/* Bloque: Dirección */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 mb-2">Dirección</h3>
        <div>
          <Label htmlFor="line1" className="mb-2">Dirección (línea 1)</Label>
          <Input id="line1" name="line1" placeholder="Calle y número" defaultValue={team?.line1 ?? ''} />
        </div>
        <div>
          <Label htmlFor="line2" className="mb-2">Dirección (línea 2)</Label>
          <Input id="line2" name="line2" placeholder="Depto, piso, referencia (opcional)" defaultValue={team?.line2 ?? ''} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city" className="mb-2">Ciudad</Label>
            <Input id="city" name="city" placeholder="Ciudad" defaultValue={team?.city ?? ''} />
          </div>
          <div>
            <Label htmlFor="state" className="mb-2">Estado/Provincia</Label>
            <Input id="state" name="state" placeholder="Estado o provincia" defaultValue={team?.state ?? ''} />
          </div>
          <div>
            <Label htmlFor="zipcode" className="mb-2">Código Postal</Label>
            <Input id="zipcode" name="zipcode" placeholder="Código postal" defaultValue={team?.zipcode ?? ''} />
          </div>
        </div>
        <div>
          <Label htmlFor="country" className="mb-2">País</Label>
          <Input id="country" name="country" placeholder="País" defaultValue={team?.country ?? ''} />
        </div>
      </div>

      {/* Bloque: Redes Sociales */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 mb-2">Redes Sociales</h3>
        <div>
          <Label htmlFor="facebookUrl" className="mb-2">Facebook</Label>
          <Input id="facebookUrl" name="facebookUrl" type="url" placeholder="https://facebook.com/tu-pagina" defaultValue={team?.facebookUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="instagramUrl" className="mb-2">Instagram</Label>
          <Input id="instagramUrl" name="instagramUrl" type="url" placeholder="https://instagram.com/tu-cuenta" defaultValue={team?.instagramUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="tiktokUrl" className="mb-2">TikTok</Label>
          <Input id="tiktokUrl" name="tiktokUrl" type="url" placeholder="https://tiktok.com/@tu-cuenta" defaultValue={team?.tiktokUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="youtubeUrl" className="mb-2">YouTube</Label>
          <Input id="youtubeUrl" name="youtubeUrl" type="url" placeholder="https://youtube.com/tu-canal" defaultValue={team?.youtubeUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="whatsappPhone" className="mb-2">WhatsApp</Label>
          <Input id="whatsappPhone" name="whatsappPhone" type="tel" placeholder="Ej. 55 1234 5678" defaultValue={team?.whatsappPhone ?? ''} />
        </div>
        <div>
          <Label htmlFor="callPhone" className="mb-2">Teléfono para llamar</Label>
          <Input id="callPhone" name="callPhone" type="tel" placeholder="Ej. 55 1234 5678" defaultValue={team?.callPhone ?? ''} />
        </div>
        <div>
          <Label htmlFor="contactEmail" className="mb-2">Email de contacto</Label>
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="contacto@mirestaurante.com" defaultValue={team?.contactEmail ?? ''} />
          <p className="mt-1 text-xs text-gray-400">Se incluye en los correos de confirmación de pedido.</p>
        </div>
        <div>
          <Label htmlFor="contactPhone" className="mb-2">Teléfono de contacto</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" placeholder="Ej. 55 1234 5678" defaultValue={team?.contactPhone ?? ''} />
        </div>
      </div>

      {/* Bloque: Horarios */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 mb-2">Horarios de atención</h3>
        <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />
      </div>

      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && <p className="text-green-500 text-sm">{state.success}</p>}

      <Button type="submit" className="bg-orange-500 cursor-pointer hover:bg-orange-600 text-white" disabled={pending || uploading}>
        {pending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>) : 'Guardar'}
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
            <CardTitle>
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={accountFormAction}>
              <Suspense fallback={<AccountForm state={accountState} />}>
                <AccountFormWithData state={accountState} />
              </Suspense>
              {accountState.error && <p className="text-red-500 text-sm">{accountState.error}</p>}
              {accountState.success && <p className="text-green-500 text-sm">{accountState.success}</p>}
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
              {usernameState.error && <p className="text-red-500 text-sm">{usernameState.error}</p>}
              {usernameState.success && <p className="text-green-500 text-sm">{usernameState.success}</p>}
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
