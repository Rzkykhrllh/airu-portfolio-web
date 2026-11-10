import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter_Tight } from 'next/font/google';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import AnalyticsConsent from '@/components/analytics/AnalyticsConsent';
import '@/styles/globals.css';
import ViewCursor from '@/components/ui/ViewCursor';

// Was referenced by name ("'Cormorant Garamond', serif") in the logo and
// nowhere ever loaded — silently falling back to the browser's default
// serif. next/font self-hosts it (no FOUT, no external request) and
// exposes it as a CSS variable everything else can reference.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

// UI / body sans — replaces the system font stack.
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Airu Photography',
  description: 'Photography portfolio by Airu — Based in Tokyo, shooting with Fuji X-S20',
  icons: {
    icon: '/icon',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorantGaramond.variable} ${interTight.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeProvider>
        <ViewCursor />
        <AnalyticsConsent />
      </body>
    </html>
  );
}
