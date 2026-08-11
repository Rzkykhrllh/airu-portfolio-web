import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { getAllPhotos, getAllCollections } from '@/lib/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [photos, collections] = await Promise.all([getAllPhotos(), getAllCollections()]);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/collections`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const collectionUrls: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${SITE_URL}/collections/${collection.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const photoUrls: MetadataRoute.Sitemap = photos.map((photo) => ({
    url: `${SITE_URL}/photo/${photo.id}`,
    lastModified: photo.createdAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticUrls, ...collectionUrls, ...photoUrls];
}
