import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { setSessionCookie, verifyPassword } from '@/lib/auth';
import Customer from '@/models/Customer';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    await dbConnect();
    const customer = await Customer.findOne({ email: String(email || '').trim().toLowerCase() }).select('+password');
    if (!customer || !(await verifyPassword(String(password || ''), customer.password))) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }
    const response = NextResponse.json({ success: true, data: { name: customer.name, email: customer.email } });
    return setSessionCookie(response, customer, 'customer');
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to sign in.' }, { status: 500 });
  }
}