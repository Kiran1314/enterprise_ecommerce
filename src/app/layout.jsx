import { Providers } from '@/components/Providers';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import './globals.css';

export const metadata = {
  title: 'Super Japan | Premium Quality Parts',
  description: 'Find premium quality automotive spare parts for your vehicle in the UAE.',
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