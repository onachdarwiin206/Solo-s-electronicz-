import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required for upload");

    const extension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    const fullPath = `${path}/${fileName}`.replace(/\/+/g, '/');

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    return fullPath;
  } catch (error) {
    console.error(`[Storage] Upload error in ${bucket}:`, error);
    return null;
  }
}

export function getPublicUrl(bucket: string, path: string): string | null {
  if (!path || path.trim() === '') return null;
  const cleanPath = path.replace(/^\/+/, '');
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  if (!path || path.trim() === '') return true;
  try {
    const cleanPath = path.replace(/^\/+/, '');
    const { error } = await supabase.storage.from(bucket).remove([cleanPath]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`[Storage] Delete error in ${bucket}:`, error);
    return false;
  }
}
