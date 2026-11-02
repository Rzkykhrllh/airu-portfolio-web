// Small formatting helpers shared across pages/components.

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Year a photo was taken (falls back to upload date). null if unparseable.
export function photoYear(photo: { capturedAt?: string; createdAt?: string }): number | null {
  const iso = photo.capturedAt || photo.createdAt;
  if (!iso) return null;
  const year = new Date(iso).getFullYear();
  return Number.isNaN(year) ? null : year;
}
