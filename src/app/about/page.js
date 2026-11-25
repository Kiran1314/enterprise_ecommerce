import AboutPageClient from './AboutPageClient';
import { SITE_URL } from '@/lib/siteUrl';
import { getAboutPageBrands } from '@/lib/publicPageData';

const title = 'About Super RF Japan | Auto Spare Parts in UAE';
const description = 'Learn about Super RF Japan, a UAE supplier of genuine and aftermarket automotive spare parts with expert fitment support and dependable service.';

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: 'website',
    siteName: 'SUPER RF JAPAN',
    title,
    description,
    url: `${SITE_URL}/about`
  }
};

export default async function AboutPage() {
  const initialBrands = await getAboutPageBrands();
  return <AboutPageClient initialBrands={initialBrands} />;
}
