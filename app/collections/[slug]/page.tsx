import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/lib/data";
import CollectionView from "@/components/collections/CollectionView";
import { Photo } from "@/types";

export const dynamic = 'force-dynamic';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);

  if (!collection) notFound();

  const photos: Photo[] = (collection as any).photos || [];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <CollectionView collection={collection} photos={photos} slug={slug} />
    </div>
  );
}
