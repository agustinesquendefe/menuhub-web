import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadTeamAsset({
  file,
  teamId,
  type, // 'logo' | 'banner'
}: {
  file: File;
  teamId: number | string;
  type: 'logo' | 'banner';
}): Promise<string | null> {
  if (!file) return null;
  const ext = file.name.split('.').pop() || 'png';
  const path = `${teamId}/settings-assets/${type}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('team-images').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });
  if (error) return null;
  const { data } = supabase.storage.from('team-images').getPublicUrl(path);
  return data?.publicUrl || null;
}
