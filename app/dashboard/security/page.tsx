'use client';
import { useEffect, useState } from 'react';

type Session={id:string;deviceName:string|null;createdAt:string;lastUsedAt:string;current:boolean};
export default function SecurityPage(){
 const [sessions,setSessions]=useState<Session[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 async function load(){const r=await fetch('/api/auth/sessions',{cache:'no-store'});const d=await r.json();if(r.ok)setSessions(d.sessions||[]);else setError(d.error||'Could not load devices.');setLoading(false)}
 useEffect(()=>{load()},[]);
 async function logoutAll(){setBusy(true);await fetch('/api/auth/sessions',{method:'DELETE'});window.location.href='/login'}
 return <main className="min-h-screen px-5 py-8"><div className="mx-auto max-w-3xl"><a href="/dashboard" className="text-sm text-zinc-500">← Dashboard</a><div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-7"><p className="text-sm text-cyan-300">Security</p><h1 className="mt-2 text-3xl font-semibold">Your devices</h1><p className="mt-2 text-zinc-400">Your login stays active across refreshes. Review the devices that have access to your account.</p>{error&&<p className="mt-5 text-sm text-red-300">{error}</p>}<div className="mt-7 space-y-3">{loading?<p className="text-zinc-500">Loading devices…</p>:sessions.map(s=><div key={s.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">{s.current?'This device':(s.deviceName||'Unknown device')}</p><p className="mt-1 text-xs text-zinc-500">Last active {new Date(s.lastUsedAt).toLocaleString()}</p></div>{s.current&&<span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-300">Current</span>}</div></div>)}</div><button onClick={logoutAll} disabled={busy} className="mt-7 rounded-xl border border-red-500/30 px-5 py-3 text-sm text-red-300 disabled:opacity-50">{busy?'Signing out…':'Sign out of all devices'}</button></div></div></main>
}
