import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { recordActivity } from '@/lib/activity';
import Customer from '@/models/Customer';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || String(password || '').length < 8) {
      return NextResponse.json({ success: false, error: 'Enter your name, a valid email, and a password of at least 8 characters.' }, { status: 400 });
    }
    await dbConnect();
    if (await Customer.exists({ email: normalizedEmail })) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }
    const customer = await Customer.create({ name: name.trim(), email: normalizedEmail, password: await hashPassword(password) });
    await recordActivity({ actor: customer, actorType: 'Customer', action: 'registered', entityType: 'Customer', entityId: customer._id, description: `${customer.name} registered an account.` });
    const response = NextResponse.json({ success: true, data: { name: customer.name, email: customer.email } }, { status: 201 });
    return setSessionCookie(response, customer, 'customer');
  } catch (error) {
    console.error('Customer registration failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to create account.' }, { status: 500 });
  }
}