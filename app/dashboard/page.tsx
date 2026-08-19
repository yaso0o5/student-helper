import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sessions = await db.studySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      subject: true,
      topic: true,
      difficulty: true,
      duration: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen px-5 py-8 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div>
            <p className="text-sm text-cyan-300">Student Helper</p>
            <h1 className="mt-2 text-3xl font-semibold">Good to see you, {user.name.split(' ')[0]}.</h1>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300">Log out</button>
          </form>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-500">Study sessions</p>
            <p className="mt-3 text-3xl font-semibold">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-500">Quiz average</p>
            <p className="mt-3 text-3xl font-semibold">—</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="text-sm text-zinc-500">Current streak</p>
            <p className="mt-3 text-3xl font-semibold">0 days</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-cyan-300">Your sessions</p>
              <h2 className="mt-2 text-2xl font-semibold">Recent study sessions</h2>
            </div>
            <a href="/dashboard/new" className="inline-block rounded-xl bg-cyan-300 px-5 py-3 text-center font-semibold text-black">New study session</a>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
              <p className="text-lg font-medium">No study sessions yet.</p>
              <p className="mt-2 text-sm text-zinc-500">Create your first session to start learning.</p>
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{session.subject}</p>
                    <p className="mt-1 text-sm text-zinc-400">{session.topic}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>{session.difficulty}</span>
                    <span>•</span>
                    <span>{session.duration} min</span>
                    <span>•</span>
                    <span>{session.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
