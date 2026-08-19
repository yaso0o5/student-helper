'use client';
import { useState } from 'react';

type Question = { question: string; options: string[]; answer: number; explanation: string };

export default function QuizClient({ questions, quizId }: { questions: Question[]; quizId: string }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!questions.length) return <p className="text-zinc-500">No quiz was generated for this session.</p>;

  const score = questions.reduce((sum, q, i) => sum + (selected[i] === q.answer ? 1 : 0), 0);

  async function submit() {
    if (Object.keys(selected).length !== questions.length) return;
    setSubmitted(true);
    setSaving(true);
    try {
      const response = await fetch('/api/quiz/attempts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, score, answers: selected }),
      });
      if (response.ok) setSaved(true);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => (
        <article key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="font-medium leading-7">{i + 1}. {q.question}</p>
          <div className="mt-4 grid gap-3">
            {q.options.map((option, j) => {
              const chosen = selected[i] === j;
              const correct = submitted && q.answer === j;
              const wrong = submitted && chosen && q.answer !== j;
              return <button key={j} type="button" disabled={submitted} onClick={() => setSelected({ ...selected, [i]: j })} className={`rounded-xl border px-4 py-3 text-left transition ${correct ? 'border-emerald-500 bg-emerald-500/10' : wrong ? 'border-red-500 bg-red-500/10' : chosen ? 'border-cyan-400 bg-cyan-400/10' : 'border-zinc-700 hover:border-zinc-500'}`}>{option}</button>;
            })}
          </div>
          {submitted && <p className="mt-4 text-sm leading-6 text-zinc-400">{q.explanation}</p>}
        </article>
      ))}

      {!submitted ? (
        <button disabled={Object.keys(selected).length !== questions.length || saving} onClick={submit} className="w-full rounded-xl bg-cyan-300 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">Submit quiz</button>
      ) : (
        <div className="rounded-2xl border border-cyan-900 bg-cyan-950/20 p-6 text-center"><p className="text-sm text-cyan-300">Your score</p><p className="mt-2 text-4xl font-semibold">{score}/{questions.length}</p><p className="mt-2 text-sm text-zinc-400">{saved ? 'Saved to your progress.' : saving ? 'Saving your result…' : 'Result calculated.'}</p></div>
      )}
    </div>
  );
}
