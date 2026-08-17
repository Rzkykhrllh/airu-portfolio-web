import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import AnalyticsConsent from '@/components/analytics/AnalyticsConsent';
import '@/styles/globals.css';

// Was referenced by name ("'Cormorant Garamond', serif") in the logo and
// nowhere ever loaded — silently falling back to the browser's default
// serif. next/font self-hosts it (no FOUT, no external request) and
// exposes it as a CSS variable everything else can reference.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
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
    <html lang="en" suppressHydrationWarning className={cormorantGaramond.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeProvider>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
