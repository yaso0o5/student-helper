import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';

const schema = z.object({
  subject: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000).optional(),
});

const outputSchema = z.object({
  summary: z.string(),
  keyConcepts: z.array(z.string()),
  importantPoints: z.array(z.string()),
  examples: z.array(z.string()),
  studyPlan: z.array(z.string()),
  practiceQuestions: z.array(z.string()),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI is not configured yet.' }, { status: 503 });

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid study request.' }, { status: 400 });

    const { subject, topic, notes } = parsed.data;
    const prompt = `You are a helpful study tutor. Create study material for a student. Return ONLY valid JSON matching this exact shape: {"summary":"string","keyConcepts":["string"],"importantPoints":["string"],"examples":["string"],"studyPlan":["string"],"practiceQuestions":["string"]}. Subject: ${subject}. Topic: ${topic}. Notes: ${notes || 'None'}. Keep it accurate, clear, age-appropriate, and useful for studying.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
        cache: 'no-store',
      },
    );

    if (!response.ok) return NextResponse.json({ error: 'AI provider request failed.' }, { status: 502 });
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') return NextResponse.json({ error: 'AI returned an invalid response.' }, { status: 502 });

    let parsedOutput: unknown;
    try {
      parsedOutput = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON.' }, { status: 502 });
    }

    const output = outputSchema.safeParse(parsedOutput);
    if (!output.success) return NextResponse.json({ error: 'AI returned an unexpected response.' }, { status: 502 });

    return NextResponse.json({ material: output.data });
  } catch {
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 });
  }
}
