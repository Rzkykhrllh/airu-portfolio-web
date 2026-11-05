import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getGalleryPage } from '@/lib/data';
import { SITE_URL } from '@/lib/config';
import GalleryView from '@/components/gallery/GalleryView';

export const dynamic = 'force-dynamic';

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

// Dynamic segments arrive still URL-encoded ("Street%20Photography"), so a
// tag with a space or non-ASCII character never matched and 404'd.
async function readTag(params: TagPageProps['params']): Promise<string> {
  const { tag } = await params;
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag; // malformed escape, use as-is
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = await readTag(params);
  const { photos } = await getGalleryPage(1, { tag });

  if (photos.length === 0) {
    return { title: 'Tag not found — Airu Photography' };
  }

  const title = `Tagged: ${tag} — Airu Photography`;
  const description = `Photographs tagged "${tag}" by Airu.`;
  const pageUrl = `${SITE_URL}/tags/${encodeURIComponent(tag)}`;
  const cover = photos[0];

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      images: [{ url: cover.src.medium }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [cover.src.medium],
    },
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const tag = await readTag(params);
  const { photos, total, hasMore } = await getGalleryPage(1, { tag });

  // No natural way to tell "unknown tag" from "tag exists, no PUBLIC photos
  // right now" apart — both mean nothing to show, so both 404 the same way,
  // same call the collections page makes for a missing slug.
  if (photos.length === 0) notFound();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <GalleryView initialPhotos={photos} totalCount={total} initialHasMore={hasMore} lockedTag={tag} />
    </div>
  );
}
