import { notFound } from 'next/navigation';
import CategoryProductsClient from './CategoryProductsClient';
import { getCategoryPageData } from '@/lib/catalogPageData';
import { SITE_URL } from '@/lib/siteUrl';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);
  const category = data?.subcategory || data?.category;
  if (!category) return { title: 'Category Not Found', robots: { index: false, follow: true } };

  const title = `${category.name} Auto Parts in UAE | Super RF Japan`;
  const description = String(category.description || `Browse ${category.name} automotive spare parts at Super RF Japan in the UAE.`)
    .replace(/\s+/g, ' ')
    .slice(0, 160);
  const canonicalUrl = `${SITE_URL}/categories/${encodeURIComponent(category.slug || slug)}`;

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
      ...(category.icon ? { images: [category.icon] } : {})
    }
  };
}

export default async function CategoryProductsPage({ params }) {
  const { slug } = await params;
  const initialData = await getCategoryPageData(slug);
  if (!initialData?.category) notFound();

  return <CategoryProductsClient slug={slug} initialData={initialData} />;
}
