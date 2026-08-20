'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmail(){
  const router=useRouter();
  const params=useSearchParams();
  const email=params.get('email')||'';
  const [code,setCode]=useState<string[]>(Array(6).fill(''));
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [resending,setResending]=useState(false);
  const inputs=useRef<Array<HTMLInputElement|null>>([]);

  useEffect(()=>inputs.current[0]?.focus(),[]);
  function update(index:number,value:string){
    const digit=value.replace(/\D/g,'').slice(-1); const next=[...code]; next[index]=digit; setCode(next);
    if(digit && index<5) inputs.current[index+1]?.focus();
  }
  function keyDown(index:number,e:React.KeyboardEvent<HTMLInputElement>){
    if(e.key==='Backspace'&&!code[index]&&index>0) inputs.current[index-1]?.focus();
    if(e.key==='ArrowLeft'&&index>0) inputs.current[index-1]?.focus();
    if(e.key==='ArrowRight'&&index<5) inputs.current[index+1]?.focus();
  }
  function paste(e:React.ClipboardEvent){
    const digits=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6); if(!digits)return; e.preventDefault();
    const next=Array(6).fill(''); digits.split('').forEach((d,i)=>next[i]=d); setCode(next); inputs.current[Math.min(digits.length,5)]?.focus();
  }
  async function verify(e:React.FormEvent){
    e.preventDefault(); setError(''); const otp=code.join(''); if(otp.length!==6)return setError('Enter all 6 digits.');
    setLoading(true); try{const r=await fetch('/api/auth/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,code:otp})});const d=await r.json();if(!r.ok)throw new Error(d.error);router.replace('/dashboard')}catch(err){setError(err instanceof Error?err.message:'Verification failed.');setCode(Array(6).fill(''));inputs.current[0]?.focus()}finally{setLoading(false)}
  }
  async function resend(){setError('');setResending(true);try{const r=await fetch('/api/auth/resend-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const d=await r.json();if(!r.ok)throw new Error(d.error);setError('A new code was sent.');}catch(err){setError(err instanceof Error?err.message:'Could not resend the code.')}finally{setResending(false)}}
  return <main className="flex min-h-screen items-center justify-center px-5"><div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl"><Link href="/signup" className="text-sm text-zinc-500">← Back</Link><div className="mt-8 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-300/10 text-3xl">✉️</div><h1 className="mt-6 text-3xl font-semibold">Check your email</h1><p className="mt-2 text-sm leading-6 text-zinc-400">We sent a 6-digit verification code to<br/><span className="text-zinc-200">{email||'your email'}</span></p></div><form onSubmit={verify} onPaste={paste} className="mt-8"><div className="flex justify-center gap-2 sm:gap-3">{code.map((digit,i)=><input key={i} ref={el=>{inputs.current[i]=el}} inputMode="numeric" maxLength={1} value={digit} onChange={e=>update(i,e.target.value)} onKeyDown={e=>keyDown(i,e)} aria-label={`Verification digit ${i+1}`} className={`h-14 w-11 rounded-xl border bg-zinc-900 text-center text-2xl font-semibold outline-none transition-all duration-200 ${digit?'border-cyan-300 scale-105':'border-zinc-800'} focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/10`}/>)}</div>{error&&<p className="mt-5 text-center text-sm text-zinc-300">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-cyan-300 py-3 font-semibold text-black disabled:opacity-50">{loading?'Verifying…':'Verify email'}</button></form><div className="mt-5 text-center text-sm text-zinc-500">Didn't get it? <button onClick={resend} disabled={resending} className="text-cyan-300 disabled:opacity-50">{resending?'Sending…':'Resend code'}</button></div><p className="mt-4 text-center text-xs text-zinc-600">The code expires in 10 minutes.</p></div></main>
}
