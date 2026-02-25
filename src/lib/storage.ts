import { createClient } from './supabase';

export async function uploadReportPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `reports/${fileName}`;

  const { error } = await supabase.storage
    .from('report-photos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('report-photos')
    .getPublicUrl(path);

  return data.publicUrl;
}
