import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/dbConnect';
import Brand from '@/models/Brand';
import Settings from '@/models/Settings';

export const getAboutPageBrands = unstable_cache(
  async () => {
    await dbConnect();
    const brands = await Brand.find({}).select('name slug logo').lean();
    return JSON.parse(JSON.stringify(
      brands.filter(brand => brand.name?.trim().toLowerCase() !== 'generic')
    ));
  },
  ['about-page-brands'],
  { revalidate: 3600 }
);

export const getContactPageSettings = unstable_cache(
  async () => {
    await dbConnect();
    const settings = await Settings.findOne({})
      .select('companyName companyAddress companyPhone companyEmail')
      .lean();
    return settings ? JSON.parse(JSON.stringify(settings)) : null;
  },
  ['contact-page-settings'],
  { revalidate: 3600 }
);
