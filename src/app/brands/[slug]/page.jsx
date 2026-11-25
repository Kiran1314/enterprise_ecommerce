import { notFound } from 'next/navigation';
import BrandProductsClient from './BrandProductsClient';
import { getBrandPageData } from '@/lib/catalogPageData';
import { SITE_URL } from '@/lib/siteUrl';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getBrandPageData(slug);
  if (!data) return { title: 'Brand Not Found', robots: { index: false, follow: true } };

  const title = `${data.brand.name} Auto Parts in UAE | Super RF Japan`;
  const description = String(data.brand.description || `Browse ${data.brand.name} automotive spare parts at Super RF Japan in the UAE.`)
    .replace(/\s+/g, ' ')
    .slice(0, 160);
  const canonicalUrl = `${SITE_URL}/brands/${encodeURIComponent(data.brand.slug)}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      siteName: 'SUPER RF JAPAN',
      title,
      description,
      url: canonicalUrl,
      ...(data.brand.logo ? { images: [data.brand.logo] } : {})
    }
  };
}

export default async function BrandProductsPage({ params }) {
  const { slug } = await params;
  const initialData = await getBrandPageData(slug);
  if (!initialData) notFound();

  return <BrandProductsClient slug={slug} initialData={initialData} />;
}
