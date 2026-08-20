import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';

const COOKIE = 'student_helper_session';
const MAX_AGE = 60 * 60 * 24 * 30;

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must be set to a random value of at least 32 characters.');
  return value;
}

function hashToken(token: string) {
  return crypto.createHmac('sha256', getSecret()).update(token).digest('hex');
}

function randomToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export async function createSession(userId: string, request?: Request) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  await db.authSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      userAgent: request?.headers.get('user-agent')?.slice(0, 500) || null,
      deviceName: request?.headers.get('user-agent')?.slice(0, 120) || 'This device',
    },
  });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  await db.authSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  return { id: session.user.id, name: session.user.name, email: session.user.email, createdAt: session.user.createdAt };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(COOKIE);
}
