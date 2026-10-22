export function isSafeResourceUrl(value?: string | null): boolean {
  if (!value) return false;
  if (value.startsWith('storage://')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}
