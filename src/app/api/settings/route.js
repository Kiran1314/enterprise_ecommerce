import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    } else {
      const updates = {};
      if (!settings.companyName || settings.companyName === 'EnterpriseStore') updates.companyName = 'Super RF Japan Auto Spare Parts Company';
      if (!settings.companyPhone || settings.companyPhone === '+1 (555) 019-2834') updates.companyPhone = '+971 549912098';
      if (!settings.companyAddress || settings.companyAddress === '123 Business Rd, Suite 100, Tech City') updates.companyAddress = '21C Street, G Floor, 29733 96054, Naif, Deira, Dubai, Dubai Municipality, Show Entrance, UAE';
      if (settings.companyEmail === 'support@enterprisestore.com') updates.companyEmail = '';
      if (settings.taxId === 'TX-9843210') updates.taxId = '';
      if (Object.keys(updates).length > 0) {
        settings = await Settings.findByIdAndUpdate(settings._id, { $set: updates }, { new: true });
      }
    }
    const { currencySymbol, currencyCode, companyName, companyEmail, companyPhone, companyAddress, taxId } = settings;
    return NextResponse.json({ success: true, data: { currencySymbol, currencyCode, companyName, companyEmail, companyPhone, companyAddress, taxId } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    const allowedFields = ['currencySymbol', 'currencyCode', 'companyName', 'companyEmail', 'companyPhone', 'companyAddress', 'taxId'];
    const updates = Object.fromEntries(allowedFields.filter(field => body[field] !== undefined).map(field => [field, body[field]]));
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      settings = await Settings.findOneAndUpdate({}, { $set: updates }, { new: true, runValidators: true });
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated', entityType: 'Settings', entityId: settings._id, description: `${admin.name} changed store settings.` });
    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}