import ContactPageClient from './ContactPageClient';
import { SITE_URL } from '@/lib/siteUrl';
import { getContactPageSettings } from '@/lib/publicPageData';

const title = 'Contact Super RF Japan | Auto Spare Parts UAE';
const description = 'Contact Super RF Japan for automotive spare parts, fitment questions, availability, pricing, and bulk orders. Visit or message our Dubai team.';

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: 'website',
    siteName: 'SUPER RF JAPAN',
    title,
    description,
    url: `${SITE_URL}/contact`
  }
};

function getSingleParam(value) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

export default async function ContactPage({ searchParams = {} }) {
  const [initialSettings, params] = await Promise.all([
    getContactPageSettings(),
    searchParams
  ]);
  return (
    <ContactPageClient
      initialSettings={initialSettings}
      productParam={getSingleParam(params.product)}
      skuParam={getSingleParam(params.sku)}
    />
  );
}
