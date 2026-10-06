import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getSession } from '@/lib/auth';
import Customer from '@/models/Customer';
import { recordActivity } from '@/lib/activity';

export async function GET(request) {
  const session = getSession(request, 'customer');
  if (!session) return NextResponse.json({ success: false, error: 'Sign in required.' }, { status: 401 });
  await dbConnect();
  const customer = await Customer.findById(session.id).select('name email phone addresses');
  if (!customer) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
  return NextResponse.json({ success: true, data: customer });
}

export async function PATCH(request) {
  const session = getSession(request, 'customer');
  if (!session) return NextResponse.json({ success: false, error: 'Sign in required.' }, { status: 401 });
  const { name, phone, addresses } = await request.json();
  if (!name?.trim() || !Array.isArray(addresses)) {
    return NextResponse.json({ success: false, error: 'Customer name and addresses are required.' }, { status: 400 });
  }
  await dbConnect();
  const customer = await Customer.findByIdAndUpdate(session.id, {
    $set: { name: name.trim(), phone: String(phone || '').trim(), addresses }
  }, { new: true, runValidators: true }).select('name email phone addresses');
  if (!customer) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
  await recordActivity({ actor: customer, actorType: 'Customer', action: 'updated_profile', entityType: 'Customer', entityId: customer._id, description: `${customer.name} updated their profile or shipping addresses.` });
  return NextResponse.json({ success: true, data: customer });
}