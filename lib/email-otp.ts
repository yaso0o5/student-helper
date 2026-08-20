import crypto from 'crypto';
import { db } from './db';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return crypto.createHash('sha256').update(`${code}:${process.env.AUTH_SECRET || ''}`).digest('hex');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function createAndSendOtp(userId: string, email: string, name: string) {
  const existing = await db.emailVerification.findUnique({ where: { userId } });
  if (existing && Date.now() - existing.sentAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new Error('Please wait before requesting another code.');
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'Yassin AI Study <onboarding@resend.dev>';
  if (!apiKey) throw new Error('Email service is not configured.');

  const code = generateOtp();
  const safeName = escapeHtml(name);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your Yassin AI Study verification code',
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#09090b;color:#f4f4f5;border-radius:20px"><p style="color:#67e8f9">Yassin AI Study</p><h1>Verify your email</h1><p>Hi ${safeName}, use this code to finish creating your account:</p><div style="font-size:36px;font-weight:700;letter-spacing:10px;padding:20px 0">${code}</div><p style="color:#a1a1aa">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p></div>`,
    }),
  });

  if (!response.ok) {
    let detail = '';
    try { detail = await response.text(); } catch { /* ignore response parsing errors */ }
    console.error('Resend email error:', response.status, detail);
    throw new Error('Unable to send verification email.');
  }

  await db.emailVerification.upsert({
    where: { userId },
    create: { userId, codeHash: hashCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, sentAt: new Date() },
    update: { codeHash: hashCode(code), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, sentAt: new Date() },
  });
}

export async function verifyOtp(userId: string, code: string) {
  const record = await db.emailVerification.findUnique({ where: { userId } });
  if (!record || record.expiresAt.getTime() <= Date.now()) throw new Error('This code has expired.');
  if (record.attempts >= MAX_ATTEMPTS) throw new Error('Too many attempts. Request a new code.');

  const valid = crypto.timingSafeEqual(Buffer.from(record.codeHash), Buffer.from(hashCode(code)));
  if (!valid) {
    await db.emailVerification.update({ where: { userId }, data: { attempts: { increment: 1 } } });
    throw new Error('Invalid verification code.');
  }

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
    db.emailVerification.delete({ where: { userId } }),
  ]);
}
