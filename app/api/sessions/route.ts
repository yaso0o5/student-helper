import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  subject: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(160),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  duration: z.number().int().min(5).max(240),
  notes: z.string().max(2000).optional(),
});

const aiSchema = z.object({
  summary: z.string(),
  keyConcepts: z.array(z.string()).min(3).max(8),
  importantPoints: z.array(z.string()).min(3).max(10),
  examples: z.array(z.string()).max(6),
  studyPlan: z.array(z.string()).min(3).max(8),
  quiz: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    answer: z.number().int().min(0).max(3),
    explanation: z.string(),
  })).length(5),
});

async function generateMaterial(subject: string, topic: string, difficulty: string, notes?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('AI is not configured yet. Add GEMINI_API_KEY in Vercel.');

  const prompt = `You are an expert study tutor. Create accurate, age-appropriate study material.
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Student notes: ${notes || 'None'}

Return ONLY valid JSON with exactly this shape:
{
  "summary":"string",
  "keyConcepts":["string"],
  "importantPoints":["string"],
  "examples":["string"],
  "studyPlan":["string"],
  "quiz":[{"question":"string","options":["A","B","C","D"],"answer":0,"explanation":"string"}]
}

Create exactly 5 multiple-choice questions. Each question must have exactly 4 distinct options and exactly one correct answer. The answer field is the zero-based index of the correct option. Make the questions directly about the requested topic. Do not invent facts. Keep the explanations concise.`;

  // Prefer the main Flash model. Use the currently recommended Lite model only as fallback.
  const models = ['gemini-2.5-flash', 'gemini-3.5-flash-lite'];
  let lastError = 'AI provider request failed.';

  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      let providerMessage = '';
      try {
        const body = await response.json();
        providerMessage = typeof body?.error?.message === 'string' ? body.error.message : '';
      } catch {}
      lastError = `Gemini ${model} failed (${response.status}).${providerMessage ? ` ${providerMessage}` : ''}`;
      continue;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      lastError = `Gemini ${model} returned no text.`;
      continue;
    }

    try {
      const parsed = JSON.parse(text);
      const result = aiSchema.safeParse(parsed);
      if (result.success) return result.data;
      lastError = `Gemini ${model} returned data in an unexpected format.`;
    } catch {
      lastError = `Gemini ${model} returned invalid JSON.`;
    }
  }

  throw new Error(lastError);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid session details.' }, { status: 400 });

    const { subject, topic, difficulty, duration, notes } = parsed.data;
    const material = await generateMaterial(subject, topic, difficulty, notes);

    const session = await db.studySession.create({
      data: {
        subject,
        topic,
        difficulty,
        duration,
        notes,
        summary: material.summary,
        material,
        userId: user.id,
        quiz: { create: { questions: material.quiz } },
      },
      select: { id: true },
    });

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create session.';
    const status = message.startsWith('Gemini') || message.startsWith('AI') ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sessions = await db.studySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, subject: true, topic: true, difficulty: true, duration: true, createdAt: true },
  });
  return NextResponse.json({ sessions });
}
