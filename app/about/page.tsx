import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Airu Photography",
  description: "Airu — Tokyo-based photographer. Shooting with Fujifilm X-S20.",
  openGraph: {
    title: "About — Airu Photography",
    description: "Tokyo-based photographer capturing everyday moments.",
    type: "profile",
  },
};

const links = [
  { label: "Email", href: "mailto:m.rizky.khairullah@gmail.com", display: "m.rizky.khairullah@gmail.com", external: false },
  { label: "Instagram", href: "https://instagram.com/frame_by_airu", display: "@frame_by_airu", external: true },
  { label: "Twitter", href: "https://twitter.com/__airu___", display: "@__airu___", external: true },
  { label: "Unsplash", href: "https://unsplash.com/@airuphotograph", display: "@airuphotograph", external: true },
];

export default function AboutPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading — same pattern as Gallery / Collections */}
      <div className="pt-10 pb-7 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          About
        </h1>
      </div>

      <div className="py-12 max-w-xl space-y-12">
        {/* Bio */}
        <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            Hi, I'm Airu — a photographer based in Tokyo, shooting with a Fujifilm X-S20.
          </p>
          <p>
            Through my camera, I try to preserve simple scenes, quiet details,
            and moments that feel meaningful in everyday life. I explore streets,
            landscapes, travel scenes, and portraits across Japan and beyond.
          </p>
          <p>
            Open for commercial work, editorial projects, and collaborations.
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          {links.map(({ label, href, display, external }) => (
            <div key={label} className="flex items-baseline gap-6">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">
                {label}
              </span>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {display}
              </a>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="mailto:m.rizky.khairullah@gmail.com"
          className="inline-block px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Get in touch
        </a>
      </div>
    </div>
  );
}
