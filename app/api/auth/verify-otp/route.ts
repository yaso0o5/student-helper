import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { verifyOtp } from '@/lib/email-otp';

const schema = z.object({ email: z.string().trim().email().max(160).transform(v => v.toLowerCase()), code: z.string().regex(/^\d{6}$/) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, emailVerifiedAt: true } });
    if (!user || user.emailVerifiedAt) return NextResponse.json({ error: 'This email is already verified. Please log in.' }, { status: 400 });

    await verifyOtp(user.id, parsed.data.code);
    await createSession(user.id, req);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
