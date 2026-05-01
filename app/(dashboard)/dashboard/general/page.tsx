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
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
  success?: string;
  suggestions?: string[];
};

function AccountForm({
  state,
  firstNameValue = '',
  lastNameValue = '',
  emailValue = '',
  phoneValue = '',
}: {
  state: ActionState;
  firstNameValue?: string;
  lastNameValue?: string;
  emailValue?: string;
  phoneValue?: string;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className="mb-2">Owner first name</Label>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Enter owner first name"
            defaultValue={state.firstName || firstNameValue}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="mb-2">Owner last name</Label>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Enter owner last name"
            defaultValue={state.lastName || lastNameValue}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">Owner email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone" className="mb-2">Owner phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Enter owner phone"
          defaultValue={phoneValue}
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const [fallbackFirstName, ...fallbackLastNameParts] = (user?.name ?? '').trim().split(/\s+/);
  return (
    <AccountForm
      state={state}
      firstNameValue={user?.firstName ?? fallbackFirstName ?? ''}
      lastNameValue={user?.lastName ?? fallbackLastNameParts.join(' ')}
      emailValue={user?.email ?? ''}
      phoneValue={user?.phone ?? ''}
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
      <Label htmlFor="username" className="mb-2">Team username</Label>
      <Input
        id="username"
        name="username"
        placeholder="e.g. my-restaurant"
        defaultValue={state.success ?? currentUsername}
      />
      {previewUrl && (
        <p className="mt-1 text-xs text-gray-500">
          Your public menu:{' '}
          <a href={previewUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">
            {previewUrl}
          </a>
        </p>
      )}
      <p className="mt-1 text-xs text-gray-400">
        Only lowercase letters, numbers, and hyphens. Minimum 3 characters.
      </p>
      {state.suggestions && state.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600">
            Available suggestions:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {state.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                onClick={() => {
                  const input = document.getElementById('username');
                  if (input instanceof HTMLInputElement) {
                    input.value = suggestion;
                    input.focus();
                  }
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
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
      {/* Section: Profile and Banner */}
      <div className="rounded-xl border bg-white p-4 space-y-4"> 
        <h3 className="font-semibold text-gray-800 mb-2">Profile & Banner</h3>
        <div>
          <Label htmlFor="profilePictureFile" className="mb-2">Profile picture</Label>
          <Input id="profilePictureFile" name="profilePictureFile" type="file" accept="image/*" onChange={handleProfilePictureChange} />
          {profilePicturePreview && (
            <img src={profilePicturePreview} alt="Profile picture" className="mt-2 max-h-24 rounded bg-gray-50 border p-2" />
          )}
          <p className="mt-1 text-xs text-gray-400">Appears on the public menu and in emails sent to your customers.</p>
        </div>
        <div>
          <Label htmlFor="bannerFile" className="mb-2">Banner / Cover</Label>
          <Input id="bannerFile" name="bannerFile" type="file" accept="image/*" onChange={handleBannerChange} />
          {bannerPreview && (
            <img src={bannerPreview} alt="Banner" className="mt-2 max-h-32 rounded bg-gray-50 border p-2 w-full object-cover" />
          )}
          <p className="mt-1 text-xs text-gray-400">Cover image for the public menu.</p>
        </div>
        <div>
          <Label htmlFor="name" className="mb-2">Team name</Label>
          <Input id="name" name="name" placeholder="e.g. My Restaurant" defaultValue={team?.name ?? ''} required />
        </div>
        <div>
          <Label htmlFor="description" className="mb-2">Description</Label>
          <Input id="description" name="description" placeholder="e.g. Your favorite meals are here." defaultValue={team?.description ?? ''} />
        </div>
      </div>

      {/* Section: Address */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 mb-2">Address</h3>
        <div>
          <Label htmlFor="line1" className="mb-2">Address (line 1)</Label>
          <Input id="line1" name="line1" placeholder="Street and number" defaultValue={team?.line1 ?? ''} />
        </div>
        <div>
          <Label htmlFor="line2" className="mb-2">Address (line 2)</Label>
          <Input id="line2" name="line2" placeholder="Apt, floor, reference (optional)" defaultValue={team?.line2 ?? ''} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city" className="mb-2">City</Label>
            <Input id="city" name="city" placeholder="City" defaultValue={team?.city ?? ''} />
          </div>
          <div>
            <Label htmlFor="state" className="mb-2">State/Province</Label>
            <Input id="state" name="state" placeholder="State or province" defaultValue={team?.state ?? ''} />
          </div>
          <div>
            <Label htmlFor="zipcode" className="mb-2">Postal Code</Label>
            <Input id="zipcode" name="zipcode" placeholder="Postal code" defaultValue={team?.zipcode ?? ''} />
          </div>
        </div>
        <div>
          <Label htmlFor="country" className="mb-2">Country</Label>
          <Input id="country" name="country" placeholder="Country" defaultValue={team?.country ?? ''} />
        </div>
      </div>

      {/* Section: Social Media */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 mb-2">Social Media</h3>
        <div>
          <Label htmlFor="facebookUrl" className="mb-2">Facebook</Label>
          <Input id="facebookUrl" name="facebookUrl" type="url" placeholder="https://facebook.com/your-page" defaultValue={team?.facebookUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="instagramUrl" className="mb-2">Instagram</Label>
          <Input id="instagramUrl" name="instagramUrl" type="url" placeholder="https://instagram.com/your-account" defaultValue={team?.instagramUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="tiktokUrl" className="mb-2">TikTok</Label>
          <Input id="tiktokUrl" name="tiktokUrl" type="url" placeholder="https://tiktok.com/@your-account" defaultValue={team?.tiktokUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="youtubeUrl" className="mb-2">YouTube</Label>
          <Input id="youtubeUrl" name="youtubeUrl" type="url" placeholder="https://youtube.com/your-channel" defaultValue={team?.youtubeUrl ?? ''} />
        </div>
        <div>
          <Label htmlFor="whatsappPhone" className="mb-2">WhatsApp</Label>
          <Input id="whatsappPhone" name="whatsappPhone" type="tel" placeholder="e.g. 55 1234 5678" defaultValue={team?.whatsappPhone ?? ''} />
        </div>
        <div>
          <Label htmlFor="callPhone" className="mb-2">Phone for calls</Label>
          <Input id="callPhone" name="callPhone" type="tel" placeholder="e.g. 55 1234 5678" defaultValue={team?.callPhone ?? ''} />
        </div>
        <div>
          <Label htmlFor="contactEmail" className="mb-2">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" placeholder="contact@myrestaurant.com" defaultValue={team?.contactEmail ?? ''} />
          <p className="mt-1 text-xs text-gray-400">Included in order confirmation emails.</p>
        </div>
        <div>
          <Label htmlFor="contactPhone" className="mb-2">Contact phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" placeholder="e.g. 55 1234 5678" defaultValue={team?.contactPhone ?? ''} />
        </div>
      </div>

      {/* Section: Opening Hours */}
      <div className="rounded-xl border bg-white p-4 space-y-4">
        <h3 className="font-semibold text-gray-800 mb-2">Opening Hours</h3>
        <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} hourFormat="12h" />
      </div>

      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && <p className="text-green-500 text-sm">{state.success}</p>}

      <Button type="submit" className="bg-orange-500 cursor-pointer hover:bg-orange-600 text-white" disabled={pending || uploading}>
        {pending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : 'Save'}
      </Button>
    </form>
  );
}

export default function GeneralPage() {
  const router = useRouter();
  const { data: user } = useSWR<User>('/api/user', fetcher);
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

  useEffect(() => {
    if (user?.role === 'manager') {
      router.replace('/dashboard/orders');
    }
  }, [router, user?.role]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        General Settings
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Account Settings / Owner
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
            <CardTitle>Public Menu URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={usernameFormAction}>
              <Suspense fallback={
                <div>
                  <Label htmlFor="username" className="mb-2">Team username</Label>
                  <Input id="username" name="username" placeholder="e.g. my-restaurant" />
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
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restaurant Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-sm text-gray-400">Loading...</div>}>
              <TeamContactForm state={contactState} action={contactFormAction} pending={isContactPending} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
