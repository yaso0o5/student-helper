import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(160).transform(v => v.toLowerCase()),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine(v => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Please check your information.' }, { status: 400 });
    const { name, email, password } = parsed.data;
    const exists = await db.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Unable to create this account.' }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, passwordHash, emailVerifiedAt: new Date() },
      select: { id: true, name: true, email: true },
    });
    await createSession(user.id, req);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
