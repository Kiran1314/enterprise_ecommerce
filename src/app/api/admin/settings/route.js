import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { getAdmin } from '@/lib/adminAuth';
import { encryptSetting } from '@/lib/settingsSecrets';
import { recordActivity } from '@/lib/activity';

const paymentFields = [
  'gateway', 'region', 'stripeSecretKey', 'checkoutComSecretKey', 'checkoutComBaseUrl',
  'networkInternationalApiKey', 'networkInternationalOutletId', 'networkInternationalApiUrl',
  'razorpayKeyId', 'razorpayKeySecret', 'paypalClientId', 'paypalClientSecret', 'paypalEnvironment',
  'paypalSandboxUsername', 'paypalSandboxPassword'
];
const paymentSecrets = new Set(['stripeSecretKey', 'checkoutComSecretKey', 'networkInternationalApiKey', 'razorpayKeySecret', 'paypalClientSecret', 'paypalSandboxUsername', 'paypalSandboxPassword']);
const emailFields = ['smtpHost', 'smtpPort', 'smtpSecure', 'smtpUser', 'smtpPassword', 'fromEmail', 'adminEmail'];

function getSafeSettings(settings) {
  const payment = Object.fromEntries(paymentFields.filter(field => !paymentSecrets.has(field)).map(field => [field, settings.paymentSettings?.[field] || '']));
  for (const field of paymentSecrets) payment[`${field}Configured`] = Boolean(settings.paymentSettings?.[field]);
  const email = Object.fromEntries(emailFields.filter(field => field !== 'smtpPassword').map(field => [field, settings.emailSettings?.[field] ?? (field === 'smtpPort' ? 587 : '')]));
  email.smtpPasswordConfigured = Boolean(settings.emailSettings?.smtpPassword);
  return { payment, email };
}

export async function GET(request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  try {
    await dbConnect();
    const settings = await Settings.findOne() || await Settings.create({});
    return NextResponse.json({ success: true, data: getSafeSettings(settings) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  try {
    await dbConnect();
    const body = await request.json();
    if (body.payment?.gateway && !['auto', 'stripe', 'network_international', 'checkout_com', 'razorpay', 'paypal'].includes(body.payment.gateway)) {
      return NextResponse.json({ success: false, error: 'Select a supported payment gateway.' }, { status: 400 });
    }
    if (body.payment?.paypalEnvironment && !['sandbox', 'live'].includes(body.payment.paypalEnvironment)) {
      return NextResponse.json({ success: false, error: 'Select PayPal sandbox or live mode.' }, { status: 400 });
    }
    if (body.payment?.region && !['UAE', 'INDIA', 'INTERNATIONAL'].includes(body.payment.region)) {
      return NextResponse.json({ success: false, error: 'Select a supported payment region.' }, { status: 400 });
    }
    if (body.email?.smtpPort !== undefined && (!Number.isInteger(Number(body.email.smtpPort)) || Number(body.email.smtpPort) < 1 || Number(body.email.smtpPort) > 65535)) {
      return NextResponse.json({ success: false, error: 'SMTP port must be between 1 and 65535.' }, { status: 400 });
    }
    const settings = await Settings.findOne() || await Settings.create({});
    const clearSecrets = new Set(body.clearSecrets || []);
    const payment = {};
    for (const field of paymentFields) {
      if (body.payment?.[field] === undefined && !clearSecrets.has(field)) continue;
      const value = body.payment?.[field];
      payment[field] = paymentSecrets.has(field) ? (value ? encryptSetting(String(value)) : clearSecrets.has(field) ? '' : settings.paymentSettings?.[field] || '') : value;
    }
    const email = {};
    for (const field of emailFields) {
      if (body.email?.[field] === undefined && !clearSecrets.has(field)) continue;
      const value = body.email?.[field];
      email[field] = field === 'smtpPassword' ? (value ? encryptSetting(String(value)) : clearSecrets.has(field) ? '' : settings.emailSettings?.smtpPassword || '') : value;
    }
    if (Object.keys(payment).length) settings.set(Object.fromEntries(Object.entries(payment).map(([field, value]) => [`paymentSettings.${field}`, value])));
    if (Object.keys(email).length) settings.set(Object.fromEntries(Object.entries(email).map(([field, value]) => [`emailSettings.${field}`, value])));
    await settings.save();
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Settings', entityId: settings._id, description: `${admin.name} changed payment or email notification settings.` });
    return NextResponse.json({ success: true, data: getSafeSettings(settings) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}