import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifyOtp } from '@/lib/email-otp';

const schema = z.object({ email: z.string().email().transform(v => v.toLowerCase()), code: z.string().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, emailVerifiedAt: true } });
    if (!user) return NextResponse.json({ error: 'Verification failed.' }, { status: 400 });
    if (!user.emailVerifiedAt) await verifyOtp(user.id, parsed.data.code);
    await createSession(user.id, req);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
