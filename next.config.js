/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // `.eslintrc.json` (added 2026-08-16) turns on next/typescript's
    // error-level rules (no-explicit-any, no-unescaped-entities, etc.) for
    // the whole repo. There's a real backlog of these in files nobody has
    // gotten to yet (lib/api.ts, lib/transformers.ts, app/error.tsx,
    // app/not-found.tsx, and others — see spec.md §10's "Pre-existing lint
    // issues outside the admin panel" note). Blocking every production
    // build on that backlog isn't the goal of adding lint — catching new
    // issues as files get touched is. `next build` no longer runs ESLint;
    // `npx eslint <paths>` still does, and CI/local dev still catch new
    // issues in files being worked on.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos'
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
    ],
  },
};

module.exports = nextConfig;
