import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  quizId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid quiz result.' }, { status: 400 });
    const quiz = await db.quiz.findFirst({ where: { id: parsed.data.quizId, session: { userId: user.id } } });
    if (!quiz) return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    const attempt = await db.quizAttempt.create({
      data: { quizId: quiz.id, userId: user.id, score: parsed.data.score, answers: parsed.data.answers },
    });
    return NextResponse.json({ attemptId: attempt.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not save quiz result.' }, { status: 500 });
  }
}
