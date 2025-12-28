import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionBySlug, getAllCollections } from "@/lib/data";
import MasonryGrid from "@/components/gallery/MasonryGrid";
import { Photo } from "@/types";

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const collections = await getAllCollections();
  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  console.log(collection);

  if (!collection) {
    notFound();
  }

  const photos: Photo[] = collection.photos ?? [];
  console.log(photos);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/collections"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4 inline-block"
        >
          ← Back to Collections
        </Link>
        <h1 className="text-4xl font-bold mb-2">{collection.title}</h1>
        {collection.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {collection.description}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </div>
      <MasonryGrid photos={photos} />
    </div>
  );
}
