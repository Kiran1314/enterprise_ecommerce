import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { clearSessionCookie, getSession, hashPassword, setSessionCookie, verifyPassword } from '@/lib/auth';
import { recordActivity } from '@/lib/activity';

export async function POST(request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();
    const defaultEmail = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || 'superjapan@gmail.com').toLowerCase();
    const defaultPassword = process.env.DEFAULT_SUPER_ADMIN_PASSWORD || 'admin2026';
    let defaultAdmin = await Admin.findOne({ email: defaultEmail });
    if (!defaultAdmin) {
      defaultAdmin = await Admin.create({
        name: 'Super Japan Administrator',
        email: defaultEmail,
        password: await hashPassword(defaultPassword),
        role: 'SuperAdmin',
        isActive: true
      });
    }

    const admin = await Admin.findOne({ email: String(email || '').toLowerCase() });
    if (!admin || !admin.isActive || !(await verifyPassword(String(password || ''), admin.password))) {
      return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
    }
    if (!admin.password.startsWith('scrypt:')) {
      admin.password = await hashPassword(String(password));
      await admin.save();
    }
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'signed_in', entityType: 'Admin', entityId: admin._id, description: `${admin.name} signed in to the admin console.` });

    const response = NextResponse.json({ success: true, data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
    return setSessionCookie(response, admin, 'admin');
  } catch (error) {
    console.error('Admin sign-in failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to sign in.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = getSession(request, 'admin');
    if (!session) return NextResponse.json({ success: false }, { status: 401 });
    await dbConnect();
    const admin = await Admin.findById(session.id).select('name email role isActive');
    if (!admin?.isActive) return NextResponse.json({ success: false }, { status: 401 });
    return NextResponse.json({ success: true, data: admin });
  } catch {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}

export async function DELETE() {
  return clearSessionCookie(NextResponse.json({ success: true }));
}