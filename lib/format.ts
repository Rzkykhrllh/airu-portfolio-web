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

export type DisplayExif = {
  camera?: string;
  lens?: string;
  focal?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
};

// photo.exif is the backend `metadata` JSON passed through as-is, so it comes
// in two shapes: admin-form fields (camera/lens/aperture/shutter/iso) or raw
// exifr output from upload (Make/Model/LensModel/FocalLength/FNumber/
// ExposureTime/ISO). Normalize both into display strings.
export function normalizeExif(raw: unknown): DisplayExif {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : String(v).trim() || undefined);

  const make = str(r.Make);
  const model = str(r.Model);
  const prettyMake = make && make === make.toUpperCase() ? make[0] + make.slice(1).toLowerCase() : make;
  const exifCamera =
    model && prettyMake && !model.toLowerCase().startsWith(prettyMake.toLowerCase())
      ? `${prettyMake} ${model}`
      : model;

  const focalRaw = str(r.focalLength) ?? str(r.FocalLength);
  const focalNum = focalRaw ? parseFloat(focalRaw) : NaN;
  const focal = Number.isFinite(focalNum) ? `${Math.round(focalNum * 10) / 10}mm` : focalRaw;

  const apertureRaw = str(r.aperture) ?? str(r.FNumber);
  const aperture = apertureRaw && /^[\d.]+$/.test(apertureRaw) ? `f/${apertureRaw}` : apertureRaw;

  const shutterRaw = str(r.shutter) ?? str(r.ExposureTime);
  const shutter = shutterRaw && /^[\d/.]+$/.test(shutterRaw) ? `${shutterRaw}s` : shutterRaw;

  const isoRaw = str(r.iso) ?? str(r.ISO);
  const iso = isoRaw ? (/^\d+$/.test(isoRaw) ? `ISO ${isoRaw}` : isoRaw) : undefined;

  return {
    camera: str(r.camera) ?? exifCamera,
    lens: str(r.lens) ?? str(r.LensModel),
    focal,
    aperture,
    shutter,
    iso,
  };
}
