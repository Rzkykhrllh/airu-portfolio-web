import { SITE_URL } from './config';
import { Photo } from '@/types';

// Shared photographer identity for JSON-LD — keeps author/creator schema
// consistent between the photo detail pages and the About page instead of
// each one inventing its own shape.
export const PHOTOGRAPHER = {
  '@type': 'Person',
  name: 'Airu',
  url: `${SITE_URL}/about`,
  jobTitle: 'Photographer',
  sameAs: [
    'https://instagram.com/frame_by_airu',
    'https://twitter.com/__airu___',
    'https://unsplash.com/@airuphotograph',
  ],
} as const;

// JSON-LD is injected via dangerouslySetInnerHTML — escape `<` so a title
// or description containing a literal "</script>" can't break out of the
// script tag it's embedded in.
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function buildPhotoImageObject(photo: Photo, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: photo.src.full,
    url: pageUrl,
    name: photo.title || 'Photograph by Airu',
    ...(photo.description ? { description: photo.description } : {}),
    caption: photo.title || photo.description || undefined,
    author: PHOTOGRAPHER,
    creator: PHOTOGRAPHER,
    copyrightHolder: PHOTOGRAPHER,
    ...(photo.location
      ? { contentLocation: { '@type': 'Place', name: photo.location } }
      : {}),
    ...(photo.capturedAt ? { dateCreated: photo.capturedAt } : {}),
    datePublished: photo.createdAt,
    ...(photo.tags.length ? { keywords: photo.tags.join(', ') } : {}),
  };
}

export function buildPhotographerProfilePage(portraitUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      ...PHOTOGRAPHER,
      ...(portraitUrl ? { image: portraitUrl } : {}),
      description:
        'Tokyo-based photographer capturing streets, landscapes, travel scenes, and portraits across Japan and beyond.',
    },
  };
}
