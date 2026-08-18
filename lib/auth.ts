import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';

const COOKIE = 'student_helper_session';
const MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET must be set to a random value of at least 32 characters.');
  }
  return value;
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function createToken(userId: string, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  if (!userId || !expiresAtRaw || !signature) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) return null;
  const payload = `${userId}.${expiresAtRaw}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + MAX_AGE * 1000;
  const store = await cookies();
  store.set(COOKIE, createToken(userId, expiresAt), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const userId = verifyToken(raw);
  if (!userId) return null;
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
