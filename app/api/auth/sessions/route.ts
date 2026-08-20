import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getCurrentSessionId, clearSession } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const currentId = await getCurrentSessionId();
  const sessions = await db.authSession.findMany({ where: { userId: user.id, expiresAt: { gt: new Date() } }, orderBy: { lastUsedAt: 'desc' }, select: { id: true, deviceName: true, userAgent: true, createdAt: true, lastUsedAt: true, expiresAt: true } });
  return NextResponse.json({ sessions: sessions.map(s => ({ ...s, current: s.id === currentId })) });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await db.authSession.deleteMany({ where: { userId: user.id } });
  await clearSession();
  return NextResponse.json({ ok: true });
}
