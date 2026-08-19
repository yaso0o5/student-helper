'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSession() {
  const router = useRouter();
  const [form, setForm] = useState({ subject: '', topic: '', difficulty: 'Medium', duration: '30', notes: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration: Number(form.duration) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not create session.');
      router.push(`/dashboard/session/${d.sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="text-sm text-zinc-500">← Dashboard</a>
        <h1 className="mt-8 text-4xl font-semibold">New study session</h1>
        <p className="mt-2 text-zinc-500">Give the AI your topic and it will build your notes and quiz.</p>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
          <input required placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3" />
          <input required placeholder="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3" />
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <input type="number" min="5" max="240" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3" />
          </div>
          <textarea maxLength={2000} placeholder="Optional notes or what you are struggling with" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="min-h-32 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3" />
          {error && <p className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-cyan-300 py-3 font-semibold text-black disabled:opacity-50">
            {loading ? 'Gemini is building your study room…' : 'Create with AI'}
          </button>
        </form>
      </div>
    </main>
  );
}
