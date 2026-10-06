import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
export const SESSION_COOKIE = 'store_session';

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET must be set in production.');
  return 'development-only-session-secret-change-before-deployment';
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password, storedPassword) {
  if (!storedPassword?.startsWith('scrypt:')) return password === storedPassword;
  const [, salt, storedHash] = storedPassword.split(':');
  const candidate = await scrypt(password, salt, 64);
  const expected = Buffer.from(storedHash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function sign(value) {
  return crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');
}

export function createSessionToken(user, type) {
  const payload = Buffer.from(JSON.stringify({
    id: String(user._id),
    type,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14
  })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function getSession(request, expectedType) {
  const cookieHeader = request.headers.get('cookie') || '';
  const value = cookieHeader.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!value) return null;

  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expectedSignature = sign(payload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (session.exp < Date.now() || (expectedType && session.type !== expectedType)) return null;
    return session;
  } catch {
    return null;
  }
}

export function setSessionCookie(response, user, type) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(user, type), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}