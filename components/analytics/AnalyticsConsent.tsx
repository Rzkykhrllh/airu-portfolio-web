'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { GA_MEASUREMENT_ID } from '@/lib/config';
import { STORAGE_KEYS } from '@/lib/config';

type Consent = 'unknown' | 'granted' | 'denied';

/**
 * GA4, gated behind a consent banner.
 *
 * Nothing here — not the banner, not a single gtag.js request — renders or
 * fires unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (see .env.example),
 * so this is safe to ship even before the property exists. Once the env
 * var is set: first-time visitors see the banner; the GA script only loads
 * after they click Accept. The choice is remembered in localStorage so the
 * banner doesn't reappear. This is a "no tracking before opt-in" approach
 * (stricter than Google's default-denied Consent Mode, which still pings
 * before consent) — simplest way to stay GDPR-safe without pulling in a
 * consent-management library for a low-traffic personal site.
 */
export default function AnalyticsConsent() {
  const [consent, setConsent] = useState<Consent>('unknown');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const stored = localStorage.getItem(STORAGE_KEYS.analyticsConsent);
    if (stored === 'granted' || stored === 'denied') {
      setConsent(stored);
    }
    setHydrated(true);
  }, []);

  if (!GA_MEASUREMENT_ID) return null;

  const decide = (value: 'granted' | 'denied') => {
    localStorage.setItem(STORAGE_KEYS.analyticsConsent, value);
    setConsent(value);
  };

  return (
    <>
      {consent === 'granted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}

      {/* Only decide once hydrated, so this never flashes before we know
          whether a choice was already made. */}
      {hydrated && consent === 'unknown' && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900"
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
              This site uses Google Analytics to understand how visitors find and use it. No data is sold or shared with advertisers.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => decide('denied')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => decide('granted')}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
