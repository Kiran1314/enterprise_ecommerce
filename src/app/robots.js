import { SITE_URL } from '@/lib/siteUrl';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/account/', '/cart/', '/checkout/', '/signup/']
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}