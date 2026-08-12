import { Metadata } from "next";
import { getPhotoById } from "@/lib/data";
import AboutHero from "@/components/about/AboutHero";
import ContactForm from "@/components/about/ContactForm";

const PORTRAIT_PHOTO_ID = "fb96d8e1-e8b1-40cd-b2c0-8f301b8cbb8e";

// Force dynamic rendering — this page now fetches from the backend
// (portrait photo), which isn't reachable at build time in this deploy
// setup (same reason app/page.tsx, app/photo/[id]/page.tsx, and
// app/collections/page.tsx are all force-dynamic already).
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const portrait = await getPhotoById(PORTRAIT_PHOTO_ID);

  return {
    title: "About — Airu Photography",
    description: "Airu — Tokyo-based photographer. Shooting with Fujifilm X-S20.",
    openGraph: {
      title: "About — Airu Photography",
      description: "Tokyo-based photographer capturing everyday moments.",
      type: "profile",
      images: portrait ? [{ url: portrait.src.medium }] : undefined,
    },
  };
}

const links = [
  { label: "Email", href: "mailto:m.rizky.khairullah@gmail.com", display: "m.rizky.khairullah@gmail.com", external: false },
  { label: "Instagram", href: "https://instagram.com/frame_by_airu", display: "@frame_by_airu", external: true },
  { label: "Twitter", href: "https://twitter.com/__airu___", display: "@__airu___", external: true },
  { label: "Unsplash", href: "https://unsplash.com/@airuphotograph", display: "@airuphotograph", external: true },
];

export default async function AboutPage() {
  const portrait = await getPhotoById(PORTRAIT_PHOTO_ID);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Heading — same pattern as Gallery / Collections */}
      <div className="pt-10 pb-7 border-b border-gray-200 dark:border-white/10">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          About
        </h1>
      </div>

      <AboutHero photo={portrait} />

      <div className="max-w-xl pb-16 space-y-16">
        {/* Contact links */}
        <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
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

        {/* Contact form */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <p
            className="text-2xl italic text-gray-900 dark:text-white mb-6"
            style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}
          >
            Get in touch.
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
