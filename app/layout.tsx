import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Photography Portfolio',
  description: 'A stunning photography portfolio showcasing beautiful moments',
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
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
