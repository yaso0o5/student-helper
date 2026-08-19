'use client';

import { FormEvent, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً! أنا ياسين 👋 اسألني عن أي مادة أو موضوع مذاكرة، وأنا أساعدك خطوة بخطوة.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: err instanceof Error ? err.message : 'حصل خطأ، جرّب تاني.' }]);
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen px-5 py-8"><div className="mx-auto flex max-w-3xl flex-col"><a href="/dashboard" className="text-sm text-zinc-500">← Dashboard</a><div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-6"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-300 font-bold text-black">Y</div><div><h1 className="text-2xl font-semibold">Yassin AI</h1><p className="text-sm text-zinc-500">Your study assistant</p></div></div><div className="mt-6 max-h-[60vh] space-y-4 overflow-y-auto pr-1">{messages.map((m, i) => <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${m.role === 'user' ? 'ml-auto bg-cyan-300 text-black' : 'bg-zinc-900 text-zinc-100'}`}>{m.content}</div>)}{loading && <div className="max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-3 text-zinc-400">ياسين بيكتب…</div>}</div><form onSubmit={send} className="mt-5 flex gap-3"><input value={input} onChange={e=>setInput(e.target.value)} maxLength={4000} placeholder="اسأل ياسين عن أي حاجة في المذاكرة…" className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-cyan-400"/><button disabled={!input.trim() || loading} className="rounded-xl bg-cyan-300 px-5 font-semibold text-black disabled:opacity-40">Send</button></form></div></div></main>;
}
