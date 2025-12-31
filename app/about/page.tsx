import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Airu Photography',
  description: 'Hi, I\'m Airu — a photographer based in Tokyo. Shooting with Fuji X-S20, capturing the beauty and stories of everyday life.',
  openGraph: {
    title: 'About Airu - Tokyo Photographer',
    description: 'Photographer based in Tokyo, shooting with Fuji X-S20. Open for all opportunities.',
    type: 'profile',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-4">About</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Hi, I'm Airu — Photographer based in Tokyo
          </p>
        </div>

        {/* Bio */}
        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mb-4">Biography</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            I'm Airu, a photographer based in Tokyo, capturing the beauty and stories
            of everyday life through my lens. Photography is my way of seeing the world —
            finding beauty in the ordinary and preserving moments that matter.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            I shoot with a Fuji X-S20, exploring the streets, landscapes, and people
            of Tokyo and beyond. Always looking for new perspectives and stories to tell.
          </p>
        </div>

        {/* Equipment */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Equipment</h2>
          <div className="text-gray-700 dark:text-gray-300">
            <p className="mb-2">
              <span className="text-gray-600 dark:text-gray-400">Camera:</span>{' '}
              <span className="font-medium">Fujifilm X-S20</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A versatile APS-C camera that delivers stunning image quality and portability —
              perfect for capturing Tokyo's dynamic street life and landscapes.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p>
              <span className="text-gray-600 dark:text-gray-400">Email:</span>{' '}
              <a
                href="mailto:m.rizky.khairullah@gmail.com"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                m.rizky.khairullah@gmail.com
              </a>
            </p>
            <p>
              <span className="text-gray-600 dark:text-gray-400">Twitter:</span>{' '}
              <a
                href="https://twitter.com/__airu___"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                @__airu___
              </a>
            </p>
            <p>
              <span className="text-gray-600 dark:text-gray-400">Instagram:</span>{' '}
              <a
                href="https://instagram.com/frame_by_airu"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                @frame_by_airu
              </a>
            </p>
            <p>
              <span className="text-gray-600 dark:text-gray-400">Unsplash:</span>{' '}
              <a
                href="https://unsplash.com/@airuphotograph"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                @airuphotograph
              </a>
            </p>
          </div>
        </div>

        {/* Availability */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Open for Opportunities
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            I'm open for all opportunities — whether it's commercial work, editorial projects,
            collaborations, or creative ventures. Let's create something together.
          </p>
          <a
            href="mailto:m.rizky.khairullah@gmail.com"
            className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
          >
            Contact Me
          </a>
        </div>
      </div>
    </div>
  );
}
