import type { Metadata } from 'next';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import '@/styles/globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ConditionalLayout>{children}</ConditionalLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
