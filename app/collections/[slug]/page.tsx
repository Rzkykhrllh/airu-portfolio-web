import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getCollectionBySlug,
  getPhotosByCollection,
  getAllCollections,
} from '@/lib/data';
import MasonryGrid from '@/components/gallery/MasonryGrid';

// Feature flag - set to true to hide collections feature
const HIDE_COLLECTIONS = true;

interface CollectionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const collections = getAllCollections();
  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  if (HIDE_COLLECTIONS) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Collections feature is currently under development
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            ← Back to Gallery
          </a>
        </div>
      </div>
    );
  }

  const { slug } = await params;
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    notFound();
  }

  const photos = getPhotosByCollection(slug);

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
          <p className="text-gray-600 dark:text-gray-400 mb-4">{collection.description}</p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-500">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </p>
      </div>
      <MasonryGrid photos={photos} />
    </div>
  );
}
