import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';
const COOKIE='student_helper_session';
function secret(){const value=process.env.AUTH_SECRET;if(!value&&process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET is required in production');return value||'development-only-change-me';}
function sign(userId:string){return crypto.createHmac('sha256',secret()).update(userId).digest('hex');}
export async function createSession(userId:string){const store=await cookies();store.set(COOKIE,`${userId}.${sign(userId)}`,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*7});}
export async function getCurrentUser(){const raw=(await cookies()).get(COOKIE)?.value;if(!raw)return null;const [userId,signature]=raw.split('.');if(!userId||!signature)return null;const expected=sign(userId);if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;return db.user.findUnique({where:{id:userId},select:{id:true,name:true,email:true,createdAt:true}});}
export async function requireUser(){const user=await getCurrentUser();if(!user)throw new Error('UNAUTHORIZED');return user;}
export async function clearSession(){(await cookies()).delete(COOKIE);}
