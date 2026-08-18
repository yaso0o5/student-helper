# Student Helper

A full-stack AI study workspace built with Next.js, TypeScript, Prisma and PostgreSQL.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add a PostgreSQL `DATABASE_URL`.
4. Add a strong `AUTH_SECRET`.
5. Add your own `AI_API_KEY`.
6. Run `npx prisma db push`.
7. Run `npm run dev`.

The AI endpoint is intentionally server-side so the provider key is never exposed to the browser. The provider-specific request still needs to be connected to the AI service you choose.
