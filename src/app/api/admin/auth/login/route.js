import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import crypto from 'crypto';

function createSessionToken(email) {
  const secret = process.env.JWT_SECRET || 'ecommerce-admin-secret-key-2026';
  const payload = JSON.stringify({ email, role: 'admin', exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@autospareparts.com').toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let isAuthenticated = false;

    // 1. Check Environment / Default Admin Credentials
    if (normalizedEmail === envAdminEmail && password === envAdminPassword) {
      isAuthenticated = true;
    }

    // 2. Check MongoDB 'users' collection if available
    if (!isAuthenticated && process.env.MONGODB_URI) {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
      }
      const db = mongoose.connection.db;
      const adminUser = await db.collection('users').findOne({ 
        email: normalizedEmail,
        $or: [{ role: 'admin' }, { isAdmin: true }]
      });

      if (adminUser && adminUser.password === password) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Invalid admin email or password.' }, { status: 401 });
    }

    const token = createSessionToken(normalizedEmail);
    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      user: { email: normalizedEmail, role: 'admin' }
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}