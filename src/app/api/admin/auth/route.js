import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { getAdmin } from '@/lib/adminAuth';
import {
  clearSessionCookie,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';

function publicAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

function adminBootstrapCredentials() {
  const email = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEFAULT_SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';
  // Never allow a hard-coded production default credential.
  if (process.env.NODE_ENV === 'production' && (!email || !password)) return null;
  if (process.env.NODE_ENV !== 'production') {
    return {
      email: email || 'admin@autospareparts.com',
      password: password || 'admin123',
    };
  }
  return { email, password };
}

export async function GET(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, authenticated: false, isAuthenticated: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const user = publicAdmin(admin);
    return NextResponse.json({
      success: true,
      authenticated: true,
      isAuthenticated: true,
      user,
      admin: user,
      data: user,
    });
  } catch (error) {
    console.error('Admin session verification failed:', error);
    return NextResponse.json(
      { success: false, authenticated: false, isAuthenticated: false, error: 'Unable to verify session' },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    await dbConnect();
    let admin = await Admin.findOne({ email }).select('+password');

    // One-time bootstrap: create the initial SuperAdmin from server-only env vars.
    // After the record exists, all logins are verified against the Admin collection.
    if (!admin) {
      const bootstrap = adminBootstrapCredentials();
      if (!bootstrap || email !== bootstrap.email || password !== bootstrap.password) {
        return NextResponse.json({ success: false, error: 'Invalid email or password.' }, { status: 401 });
      }

      try {
        admin = await Admin.create({
          name: 'Administrator',
          email: bootstrap.email,
          password: await hashPassword(bootstrap.password),
          role: 'SuperAdmin',
          isActive: true,
        });
      } catch (error) {
        // Handle a simultaneous first login without creating duplicate admins.
        if (error?.code !== 11000) throw error;
        admin = await Admin.findOne({ email }).select('+password');
      }
    }

    if (!admin || !admin.isActive || !(await verifyPassword(password, admin.password))) {
      return NextResponse.json({ success: false, error: 'Invalid email or password, or account disabled.' }, { status: 401 });
    }

    // Upgrade legacy plaintext passwords to scrypt after a successful login.
    if (!String(admin.password).startsWith('scrypt:')) {
      admin.password = await hashPassword(password);
      await admin.save();
    }

    const user = publicAdmin(admin);
    const response = NextResponse.json({
      success: true,
      authenticated: true,
      isAuthenticated: true,
      user,
      admin: user,
      data: user,
    });
    return setSessionCookie(response, admin, 'admin');
  } catch (error) {
    console.error('Admin login failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to sign in. Please try again.' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, authenticated: false, message: 'Logged out' });
  return clearSessionCookie(response);
}
