import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
const schema=z.object({subject:z.string().min(1).max(80),topic:z.string().min(1).max(160),notes:z.string().max(2000).optional()});
export async function POST(req:Request){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});if(!process.env.AI_API_KEY)return NextResponse.json({error:'AI is not configured yet. Add AI_API_KEY on the server.'},{status:503});try{const p=schema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:'Invalid AI request.'},{status:400});return NextResponse.json({error:'AI provider adapter is ready, but no provider-specific request has been configured. Add your provider request here without exposing AI_API_KEY.'},{status:501})}catch{return NextResponse.json({error:'AI request failed.'},{status:500})}}
