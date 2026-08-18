import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';

const COOKIE = 'student_helper_session';
const secret = () => process.env.AUTH_SECRET || 'development-only-change-me';

export async function createSession(userId: string) {
  const value = crypto.createHmac('sha256', secret()).update(`${userId}:${Date.now()}:${crypto.randomUUID()}`).digest('hex');
  const store = await cookies();
  store.set(COOKIE, `${userId}.${value}`, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
}

export async function getCurrentUser() {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;
  const [userId] = raw.split('.');
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, createdAt: true } });
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
