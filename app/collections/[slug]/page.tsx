import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionBySlug } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import { buildCollectionPageObject, toJsonLdScript } from "@/lib/structuredData";
import { pluralize } from "@/lib/format";
import CollectionView from "@/components/collections/CollectionView";
import { Photo } from "@/types";

export const dynamic = 'force-dynamic';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return { title: 'Collection not found — Airu Photography' };
  }

  const title = `${collection.title} — Airu Photography`;
  const description =
    collection.description || `${pluralize(collection.photos?.length ?? collection.photoCount, 'photograph')} from ${collection.title}.`;
  const pageUrl = `${SITE_URL}/collections/${slug}`;
  const coverPhoto = collection.photos?.[0];

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      ...(coverPhoto ? { images: [{ url: coverPhoto.src.medium }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(coverPhoto ? { images: [coverPhoto.src.medium] } : {}),
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) notFound();

  const photos: Photo[] = (collection as any).photos || [];
  const jsonLd = buildCollectionPageObject(collection, `${SITE_URL}/collections/${slug}`, photos[0]?.src.medium);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(jsonLd) }}
      />
      <CollectionView collection={collection} photos={photos} slug={slug} />
    </div>
  );
}
