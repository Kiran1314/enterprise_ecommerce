import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Enquiry from '@/models/Enquiry';
import Product from '@/models/Product';
import Settings from '@/models/Settings';
import { getProductEnquiryMessage } from '@/lib/productEnquiryMessage';
import { sendProductEnquiryEmail } from '@/lib/enquiryEmails';
import { getEnquiryStatuses } from '@/lib/getEnquiryStatuses';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const productSlug = typeof body?.productSlug === 'string' ? body.productSlug.trim() : '';
    const phoneDigits = phone.replace(/\D/g, '');

    if (!name || name.length > 100) {
      return NextResponse.json({ success: false, error: 'Enter your name (up to 100 characters).' }, { status: 400 });
    }
    if (!phone || phone.length > 30 || phoneDigits.length < 7 || phoneDigits.length > 15) {
      return NextResponse.json({ success: false, error: 'Enter a valid phone number.' }, { status: 400 });
    }
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!productSlug || productSlug.length > 200) {
      return NextResponse.json({ success: false, error: 'The product could not be identified.' }, { status: 400 });
    }

    await dbConnect();
    let product = await Product.findOne({ slug: productSlug }).select('title slug sku whatsappNumber').lean();
    if (!product && /^[a-f\d]{24}$/i.test(productSlug)) {
      product = await Product.findById(productSlug).select('title slug sku whatsappNumber').lean();
    }
    if (!product) return NextResponse.json({ success: false, error: 'This product is no longer available.' }, { status: 404 });

    const settings = await Settings.findOne().select('companyPhone').lean();
    const productWhatsappPhone = String(product.whatsappNumber || '').replace(/\D/g, '');
    const storeWhatsappPhone = String(settings?.companyPhone || '+971507675420').replace(/\D/g, '');
    const whatsappPhone = productWhatsappPhone || storeWhatsappPhone || '971507675420';
    const statuses = await getEnquiryStatuses();
    if (!statuses.length) throw new Error('No enquiry statuses are configured.');
    const contact = { name, phone, email };
    const message = getProductEnquiryMessage(product, contact);
    const whatsappUrl = new URL('https://api.whatsapp.com/send');
    whatsappUrl.searchParams.set('phone', whatsappPhone);
    whatsappUrl.searchParams.set('text', message);

    const enquiry = await Enquiry.create({
      name,
      phone,
      email,
      product: product._id,
      productTitle: product.title,
      productSlug: product.slug,
      sku: product.sku,
      message,
      status: statuses[0].label
    });

    let emailSent = false;
    let emailWarning = '';
    try {
      await sendProductEnquiryEmail(enquiry);
      emailSent = true;
    } catch (error) {
      console.error('New product enquiry email failed:', error);
      emailWarning = 'Your enquiry was saved, but its email notification could not be sent. Please continue to WhatsApp.';
    }
    if (emailSent) {
      try {
        await Enquiry.updateOne({ _id: enquiry._id }, { $set: { emailSent: true } });
      } catch (error) {
        console.error('Enquiry email delivery status could not be saved:', error);
        emailWarning = 'Your enquiry was saved and its email was sent, but the delivery status could not be recorded.';
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: enquiry._id },
      whatsappUrl: whatsappUrl.toString(),
      emailSent,
      emailWarning
    }, { status: 201 });
  } catch (error) {
    console.error('Product enquiry submission failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not submit your enquiry.' }, { status: 500 });
  }
}
