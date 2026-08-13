import { getGalleryPage, getFeaturedPhotos } from '@/lib/data';
import GalleryView from '@/components/gallery/GalleryView';
import { SITE_URL } from '@/lib/config';
import { buildWebSiteObject, toJsonLdScript } from '@/lib/structuredData';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const TITLE = 'Gallery — Airu Photography';
const DESCRIPTION =
  'A growing collection of photographs — Tokyo streets, Japanese festivals, and landscapes across Japan and Indonesia.';

export async function generateMetadata(): Promise<Metadata> {
  const featured = await getFeaturedPhotos();
  const cover = featured[0];

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: SITE_URL },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: SITE_URL,
      type: 'website',
      ...(cover ? { images: [{ url: cover.src.medium }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      ...(cover ? { images: [cover.src.medium] } : {}),
    },
  };
}

export default async function HomePage() {
  const { photos, total, hasMore } = await getGalleryPage(1);
  const jsonLd = buildWebSiteObject();

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(jsonLd) }}
      />
      <GalleryView initialPhotos={photos} totalCount={total} initialHasMore={hasMore} />
    </div>
  );
}
