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
    if (!settings) return null;

    const previousAddress = '21C Street, G Floor, 29733 96054, Naif, Deira, Dubai, Dubai Municipality, Show Entrance, UAE';
    const previousPhone = '+971 549912098';
    const contactDetails = {
      companyAddress: !settings.companyAddress || settings.companyAddress === previousAddress
        ? 'SHARJAH AL KHAN ROD INDUSTRIAL AREA NO 2 BAGLAF BILDING NEAR BAGLAF MOSQUE'
        : settings.companyAddress,
      companyPhone: !settings.companyPhone || settings.companyPhone === previousPhone
        ? '+971507675420'
        : settings.companyPhone,
      companyEmail: !settings.companyEmail || settings.companyEmail === 'sales@superrfjapan.com'
        ? 'Saleemkhan02017@gmail.com'
        : settings.companyEmail
    };

    return JSON.parse(JSON.stringify({ ...settings, ...contactDetails }));
  },
  ['contact-page-settings'],
  { revalidate: 3600 }
);
