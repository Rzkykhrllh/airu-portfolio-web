import { SITE_URL } from '@/lib/config';
import { getAllPhotos, getAllCollections } from '@/lib/data';
import { Photo, Collection } from '@/types';

// Custom route instead of the app/sitemap.ts convention, since the built-in
// MetadataRoute.Sitemap type only emits plain <url><loc> entries — it has
// no way to add Google's image sitemap extension
// (xmlns:image + <image:image> per <url>), which needs raw XML.
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function staticUrlEntry(loc: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function collectionUrlEntry(collection: Collection): string {
  return staticUrlEntry(`${SITE_URL}/collections/${collection.slug}`, 'weekly', '0.7');
}

function photoUrlEntry(photo: Photo): string {
  const caption = photo.description || photo.title || '';
  const imageTags = [`      <image:loc>${escapeXml(photo.src.full)}</image:loc>`];
  if (photo.title) imageTags.push(`      <image:title>${escapeXml(photo.title)}</image:title>`);
  if (caption) imageTags.push(`      <image:caption>${escapeXml(caption)}</image:caption>`);
  if (photo.location) {
    imageTags.push(`      <image:geo_location>${escapeXml(photo.location)}</image:geo_location>`);
  }

  return (
    `  <url>\n` +
    `    <loc>${escapeXml(`${SITE_URL}/photo/${photo.id}`)}</loc>\n` +
    `    <lastmod>${photo.createdAt}</lastmod>\n` +
    `    <image:image>\n${imageTags.join('\n')}\n    </image:image>\n` +
    `  </url>`
  );
}

export async function GET() {
  const [photos, collections] = await Promise.all([getAllPhotos(), getAllCollections()]);

  const entries = [
    staticUrlEntry(SITE_URL, 'daily', '1.0'),
    staticUrlEntry(`${SITE_URL}/about`, 'monthly', '0.5'),
    staticUrlEntry(`${SITE_URL}/collections`, 'weekly', '0.8'),
    ...collections.map(collectionUrlEntry),
    ...photos.map(photoUrlEntry),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    `${entries.join('\n')}\n` +
    `</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
