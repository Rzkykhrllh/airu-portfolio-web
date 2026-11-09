import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  getPhotoById,
  getNextPhoto,
  getPreviousPhoto,
  getRelatedPhotos,
} from '@/lib/data';
import { SITE_URL } from '@/lib/config';
import { buildPhotoImageObject, toJsonLdScript } from '@/lib/structuredData';
import PhotoDetailClient from '@/components/photo/PhotoDetailClient';
import RelatedPhotos from '@/components/photo/RelatedPhotos';
import BackLink from '@/components/photo/BackLink';
import { normalizeExif } from '@/lib/format';

// Force dynamic rendering (don't pre-generate at build time)
export const dynamic = 'force-dynamic';

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    collection?: string;
  }>;
}

// Remove generateStaticParams - pages generated on-demand
// export async function generateStaticParams() {
//   const photos = await getAllPhotos();
//   return photos.map((photo) => ({
//     id: photo.id,
//   }));
// }

export async function generateMetadata({ params }: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = await getPhotoById(id);

  if (!photo) {
    return { title: 'Photo not found — Airu Photography' };
  }

  const title = photo.title ? `${photo.title} — Airu Photography` : 'Airu Photography';
  const description =
    photo.description ||
    [photo.location, photo.capturedAt ? new Date(photo.capturedAt).getFullYear().toString() : null]
      .filter(Boolean)
      .join(' · ') ||
    'Photography portfolio by Airu — Based in Tokyo, shooting with Fuji X-S20';
  const pageUrl = `${SITE_URL}/photo/${photo.id}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'article',
      images: [{ url: photo.src.medium }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [photo.src.medium],
    },
  };
}

export default async function PhotoPage({ params, searchParams }: PhotoPageProps) {
  const { id } = await params;
  const { collection: collectionSlug } = await searchParams;
  const photo = await getPhotoById(id);

  if (!photo) {
    notFound();
  }

  // Pass collectionSlug for scoped navigation within collection
  const nextPhoto = await getNextPhoto(id, collectionSlug);
  const prevPhoto = await getPreviousPhoto(id, collectionSlug);
  const relatedPhotos = await getRelatedPhotos(photo);
  const relatedHeading =
    photo.collections.length === 1 ? `More from ${photo.collections[0].name}` : 'Related Photos';

  // photo.exif is raw backend metadata in one of two shapes — see
  // normalizeExif (lib/format.ts). Only rows with real values render.
  const exif = normalizeExif(photo.exif);
  const settings = [exif.focal, exif.aperture, exif.shutter, exif.iso].filter(Boolean).join(' · ');

  const capturedDate = photo.capturedAt
    ? new Date(photo.capturedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const eyebrow = [photo.location, capturedDate].filter(Boolean).join(' — ');
  const heading = photo.title || photo.location || 'Untitled';

  // Build URLs with collection context preserved
  const buildPhotoUrl = (photoId: string) =>
    collectionSlug ? `/photo/${photoId}?collection=${collectionSlug}` : `/photo/${photoId}`;
  const backUrl = collectionSlug ? `/collections/${collectionSlug}` : '/';
  const backName = collectionSlug
    ? photo.collections.find((c) => c.slug === collectionSlug)?.name ?? 'Collection'
    : 'Gallery';

  const jsonLd = buildPhotoImageObject(photo, `${SITE_URL}/photo/${photo.id}`);

  const label = 'text-[0.6875rem] uppercase tracking-[0.22em] tabular-nums text-neutral-500 dark:text-neutral-400';
  const labelLink = `${label} hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors`;
  const value = 'mt-2 text-[0.9375rem] leading-relaxed text-neutral-900 dark:text-neutral-100';

  const specs: Array<{ term: string; content: React.ReactNode }> = [];
  if (exif.camera) specs.push({ term: 'Camera', content: exif.camera });
  if (exif.lens) specs.push({ term: 'Lens', content: exif.lens });
  if (settings) specs.push({ term: 'Settings', content: settings });
  if (photo.collections.length > 0) {
    specs.push({
      term: photo.collections.length === 1 ? 'Collection' : 'Collections',
      content: (
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          {photo.collections.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.slug}`}
              className="underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4 hover:decoration-current transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </span>
      ),
    });
  }
  if (photo.tags.length > 0) {
    specs.push({
      term: 'Tags',
      content: (
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {photo.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </span>
      ),
    });
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(jsonLd) }}
      />

      {/* Top bar — text only */}
      <nav className="flex items-center justify-between pt-8 md:pt-10" aria-label="Photo navigation">
        <BackLink href={backUrl} className={labelLink}>
          ← {backName}
        </BackLink>
        <div className="flex items-center gap-6">
          {prevPhoto && (
            <Link href={buildPhotoUrl(prevPhoto.id)} className={labelLink} aria-label="Previous photograph">
              ← Prev
            </Link>
          )}
          {nextPhoto && (
            <Link href={buildPhotoUrl(nextPhoto.id)} className={labelLink} aria-label="Next photograph">
              Next →
            </Link>
          )}
        </div>
      </nav>

      {/* Hero + lightbox + arrow-key navigation */}
      <PhotoDetailClient
        photo={photo}
        nextPhotoId={nextPhoto?.id}
        prevPhotoId={prevPhoto?.id}
      />

      {/* Title / description + spec sheet */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-14 pt-14 md:pt-20">
        <div className="lg:col-span-7">
          {eyebrow && <p className={label}>{eyebrow}</p>}
          <h1 className="mt-5 font-display font-normal text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.01em] text-neutral-900 dark:text-neutral-100">
            {heading}
          </h1>
          {photo.description && (
            <p className="mt-8 max-w-2xl text-base md:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              {photo.description}
            </p>
          )}
        </div>

        {specs.length > 0 && (
          <dl className="lg:col-span-4 lg:col-start-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-10 gap-y-7 lg:pt-2">
            {specs.map((s) => (
              <div key={s.term}>
                <dt className={label}>{s.term}</dt>
                <dd className={value}>{s.content}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Previous / next */}
      {(prevPhoto || nextPhoto) && (
        <nav className="grid grid-cols-2 gap-8 pt-24 md:pt-32" aria-label="More photographs">
          <div>
            {prevPhoto && (
              <Link href={buildPhotoUrl(prevPhoto.id)} className="group block">
                <span className={label}>← Previous</span>
                <span className="mt-3 block font-display text-2xl md:text-3xl leading-tight text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                  {prevPhoto.title || prevPhoto.location || 'Untitled'}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {nextPhoto && (
              <Link href={buildPhotoUrl(nextPhoto.id)} className="group block">
                <span className={label}>Next →</span>
                <span className="mt-3 block font-display text-2xl md:text-3xl leading-tight text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                  {nextPhoto.title || nextPhoto.location || 'Untitled'}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}

      <RelatedPhotos photos={relatedPhotos} heading={relatedHeading} />
    </div>
  );
}
