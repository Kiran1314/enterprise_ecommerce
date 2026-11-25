import { Providers } from '@/components/Providers';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { SITE_URL } from '@/lib/siteUrl';
import './globals.css';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'SUPER RF JAPAN | Premium Quality Parts in UAE',
  description: 'Find premium quality automotive spare parts for your vehicle in the UAE.',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    siteName: 'SUPER RF JAPAN',
    title: 'SUPER RF JAPAN | Premium Quality Parts in UAE',
    description: 'Find premium quality automotive spare parts for your vehicle in the UAE.',
    url: SITE_URL
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}