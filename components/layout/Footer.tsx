import Link from 'next/link';

const EMAIL = 'm.rizky.khairullah@gmail.com';

const socials = [
  { label: 'Instagram', href: 'https://instagram.com/frame_by_airu' },
  { label: 'Unsplash', href: 'https://unsplash.com/@airuphotograph' },
  { label: 'Twitter', href: 'https://twitter.com/__airu___' },
];

const label = 'text-[0.6875rem] uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400';
const linkLabel = `${label} hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors`;

export default function Footer() {
  return (
    <footer className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 md:mt-28">
      <div className="border-t border-hairline pt-16 md:pt-20 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12">
          <div>
            <p className={label}>Open for commissions &amp; collaborations</p>
            <Link
              href="/about"
              className="group mt-5 inline-flex items-baseline gap-4 font-display text-5xl sm:text-6xl leading-none text-neutral-900 dark:text-neutral-100"
            >
              Get in touch.
              <svg
                className="w-6 h-6 shrink-0 text-neutral-500 dark:text-neutral-400 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transition-none"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={1}
                aria-hidden="true"
              >
                <path d="M4 12L12 4M5.5 4H12v6.5" />
              </svg>
            </Link>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-5 block text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              {EMAIL}
            </a>
          </div>

          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkLabel}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16 md:mt-20 flex flex-col sm:flex-row sm:justify-between gap-2">
          <p className={label}>© {new Date().getFullYear()} Frame by Airu</p>
          <p className={label}>Tokyo — Fujifilm X-S20</p>
        </div>
      </div>
    </footer>
  );
}
