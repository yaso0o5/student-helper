import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import QuizClient from './quiz-client';
import Flashcards from './flashcards';

export default async function StudyRoom({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;

  const session = await db.studySession.findFirst({ where: { id, userId: user.id }, include: { quiz: true } });
  if (!session) notFound();

  const material = session.material as { summary: string; keyConcepts: string[]; importantPoints: string[]; examples: string[]; studyPlan: string[] } | null;
  const questions = Array.isArray((session.quiz?.questions as unknown)) ? (session.quiz?.questions as Array<{ question: string; options: string[]; answer: number; explanation: string }>) : [];

  return (
    <main className="min-h-screen px-5 py-8 md:px-10"><div className="mx-auto max-w-5xl"><a href="/dashboard" className="text-sm text-zinc-500">← Dashboard</a>
      <header className="mt-8 border-b border-zinc-800 pb-6"><p className="text-sm text-cyan-300">{session.subject} · {session.difficulty}</p><h1 className="mt-2 text-4xl font-semibold">{session.topic}</h1><p className="mt-2 text-zinc-500">{session.duration} minute study session</p></header>
      {material && <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]"><section className="space-y-6">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><p className="text-sm uppercase tracking-widest text-cyan-300">AI summary</p><p className="mt-4 leading-7 text-zinc-200">{material.summary}</p></article>
        <Flashcards items={material.keyConcepts} />
        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><h2 className="text-2xl font-semibold">Key concepts</h2><ul className="mt-5 space-y-3">{material.keyConcepts.map((x, i) => <li key={i} className="rounded-xl bg-zinc-900 p-4 text-zinc-300">{x}</li>)}</ul></article>
        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><h2 className="text-2xl font-semibold">Important points</h2><ul className="mt-5 list-disc space-y-3 pl-5 text-zinc-300">{material.importantPoints.map((x, i) => <li key={i}>{x}</li>)}</ul></article>
        {material.examples.length > 0 && <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><h2 className="text-2xl font-semibold">Examples</h2><ul className="mt-5 space-y-3 text-zinc-300">{material.examples.map((x, i) => <li key={i}>{x}</li>)}</ul></article>}
      </section><aside className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 h-fit lg:sticky lg:top-6"><h2 className="text-xl font-semibold">Study plan</h2><ol className="mt-5 space-y-4">{material.studyPlan.map((x, i) => <li key={i} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm font-bold text-black">{i + 1}</span><span className="text-sm leading-6 text-zinc-300">{x}</span></li>)}</ol></aside></div>}
      <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><div><p className="text-sm uppercase tracking-widest text-cyan-300">Practice</p><h2 className="mt-2 text-3xl font-semibold">Test yourself</h2><p className="mt-2 text-zinc-500">Answer the AI-generated questions and see your score.</p></div><div className="mt-6"><QuizClient questions={questions} quizId={session.quiz?.id ?? ''} /></div></section>
    </div></main>
  );
}
