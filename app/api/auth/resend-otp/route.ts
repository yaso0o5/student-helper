import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createAndSendOtp } from '@/lib/email-otp';

const schema = z.object({ email: z.string().email().transform(v => v.toLowerCase()) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, name: true, email: true, emailVerifiedAt: true } });
    if (!user || user.emailVerifiedAt) return NextResponse.json({ ok: true });
    await createAndSendOtp(user.id, user.email, user.name);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resend code.';
    return NextResponse.json({ error: message }, { status: message.includes('wait before') ? 429 : 500 });
  }
}
