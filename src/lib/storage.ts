import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[Storage] No Supabase session found. You must be signed in via Google to upload files.");
      throw new Error("Supabase Authentication required for storage operations. Please sign in via Google.");
    }

    const extension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${extension}`;
    const fullPath = `${path}/${fileName}`.replace(/\/+/g, '/');

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      if (uploadError.message.includes('bucket_not_found') || uploadError.message.includes('not found')) {
        throw new Error(`Storage bucket '${bucket}' not found. Please create it in Supabase.`);
      }
      throw uploadError;
    }

    return fullPath;
  } catch (error: any) {
    console.error(`[Storage] Upload error in ${bucket}:`, error);
    throw error; // Re-throw to allow component to handle specific error
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
