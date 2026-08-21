import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';

const schema = z.object({ email: z.string().trim().email().max(160).transform(v => v.toLowerCase()), password: z.string().min(1).max(128) });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 });
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    await createSession(user.id, req);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
