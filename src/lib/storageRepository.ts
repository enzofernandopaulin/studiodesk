import { supabase, isSupabaseConfigured } from './supabase';
import { getWorkspaceId } from './workspaceRepository';

export const STORAGE_BUCKET = 'studiodesk-files';
export const STORAGE_REFERENCE_PREFIX = 'storage://';

const MAX_FILE_SIZE = 500 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'text/plain'
]);

function safeName(name: string) {
  const normalized = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return normalized.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'arquivo';
}

function folderFor(category: string) {
  const clean = category.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return clean || 'files';
}

export function isStorageReference(value?: string | null): boolean {
  return Boolean(value?.startsWith(STORAGE_REFERENCE_PREFIX));
}

export function parseStorageReference(value: string): { bucket: string; path: string } | null {
  if (!isStorageReference(value)) return null;
  const raw = value.slice(STORAGE_REFERENCE_PREFIX.length);
  const separator = raw.indexOf('/');
  if (separator <= 0 || separator === raw.length - 1) return null;
  return { bucket: raw.slice(0, separator), path: raw.slice(separator + 1) };
}

export async function uploadWorkspaceFile(userId: string, file: File, category = 'files'): Promise<string> {
  if (!supabase || !isSupabaseConfigured) throw new Error('Supabase não está configurado.');
  if (!userId) throw new Error('Usuário não autenticado.');
  if (file.size > MAX_FILE_SIZE) throw new Error('O arquivo excede o limite de 500 MB.');
  if (file.type && !allowedMimeTypes.has(file.type)) throw new Error('Tipo de arquivo não permitido para o armazenamento do StudioDesk.');

  const workspaceId = await getWorkspaceId(userId);
  if (!workspaceId) throw new Error('Workspace não encontrado para o usuário autenticado.');

  const extension = safeName(file.name).split('.').pop() || 'bin';
  const baseName = safeName(file.name).replace(/\.[^.]+$/, '');
  const objectName = `${workspaceId}/${folderFor(category)}/${userId}/${crypto.randomUUID()}-${baseName}.${extension}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectName, file, {
    cacheControl: '3600',
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });

  if (error) throw error;
  return `${STORAGE_REFERENCE_PREFIX}${STORAGE_BUCKET}/${objectName}`;
}

export async function createSignedStorageUrl(reference: string, expiresIn = 3600): Promise<string | null> {
  if (!supabase) return null;
  const parsed = parseStorageReference(reference);
  if (!parsed) return reference;
  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeWorkspaceFile(reference?: string | null): Promise<void> {
  if (!supabase || !reference) return;
  const parsed = parseStorageReference(reference);
  if (!parsed) return;
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) throw error;
}
