import HomePageClient from './HomePageClient';
import { getHomePageData } from '@/lib/homePageData';
import { SITE_URL } from '@/lib/siteUrl';

export async function generateMetadata() {
  const title = 'SUPER RF JAPAN | Premium Quality Parts in UAE';
  const description = 'Find premium quality automotive spare parts for your vehicle in the UAE.';

  return {
    title,
    description,
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: 'website',
      siteName: 'SUPER RF JAPAN',
      title,
      description,
      url: SITE_URL
    }
  };
}

function getSingleParam(value) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function shuffleProducts(products) {
  const shuffled = [...products];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export default async function HomePage({ searchParams = {} }) {
  const [cachedData, params] = await Promise.all([
    getHomePageData(),
    searchParams
  ]);
  const fitmentSearch = {
    make: getSingleParam(params.make),
    model: getSingleParam(params.model),
    year: getSingleParam(params.year)
  };
  const hasFitmentSearch = Boolean(fitmentSearch.make && fitmentSearch.model && fitmentSearch.year);
  const initialData = hasFitmentSearch
    ? cachedData
    : { ...cachedData, products: shuffleProducts(cachedData.products) };
  const initialFitmentProducts = hasFitmentSearch
    ? cachedData.products.filter(product => product.fitments?.some(fitment =>
      fitment.make === fitmentSearch.make &&
      fitment.model === fitmentSearch.model &&
      fitment.year === fitmentSearch.year &&
      Number(fitment.stock) > 0
    ))
    : null;

  return (
    <HomePageClient
      key={`${fitmentSearch.make}:${fitmentSearch.model}:${fitmentSearch.year}`}
      initialData={initialData}
      initialFitmentProducts={initialFitmentProducts}
      fitmentSearch={fitmentSearch}
    />
  );
}
