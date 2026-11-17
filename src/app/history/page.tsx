"use client";

import { History, Repeat, Timer } from "lucide-react";
import Link from "next/link";
import { LoopCard } from "@/components/LoopCard";
import { KindTile, SongCard } from "@/components/SongCard";
import { Button, Card, EmptyState, ErrorState, PageHeader, SectionTitle, Skeleton } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { formatDate, formatPracticeTime, timeAgo } from "@/lib/format";
import { sectionsApi, sessionsApi, songsApi } from "@/services/api";

export default function HistoryPage() {
  const songs = useQuery(() => songsApi.list({ origin: "library" }));
  const shared = useQuery(() => songsApi.list({ origin: "shared" }));
  const sections = useQuery(() => sectionsApi.list());
  const sessions = useQuery(() => sessionsApi.list());

  const played = [...(songs.data ?? []), ...(shared.data ?? [])]
    .filter((s) => s.lastPlayedAt)
    .sort((a, b) => +new Date(b.lastPlayedAt!) - +new Date(a.lastPlayedAt!))
    .slice(0, 8);

  const loading = songs.loading && !songs.data;
  const totalSeconds = (sessions.data ?? []).reduce((n, s) => n + s.seconds, 0);
  const totalLoops = (sessions.data ?? []).reduce((n, s) => n + s.loops, 0);

  // group sessions by day
  const groups = new Map<string, NonNullable<typeof sessions.data>>();
  for (const s of sessions.data ?? []) {
    const key = formatDate(s.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  if (songs.error && !songs.data) return <ErrorState message={songs.error} onRetry={songs.reload} />;

  const nothing = !loading && played.length === 0 && !(sections.data?.length) && !(sessions.data?.length);

  return (
    <div className="space-y-8">
      <PageHeader title="Practice History" subtitle="Everything you’ve practised, at a glance." />

      {nothing ? (
        <EmptyState
          icon={<History className="h-7 w-7" />}
          title="No practice yet"
          description="Open a song and press play — your sessions and saved sections will appear here."
          action={
            <Link href="/library">
              <Button variant="primary">Open My Songs</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3.5 sm:p-4">
              <p className="text-xl font-extrabold tabular-nums sm:text-2xl">{formatPracticeTime(totalSeconds)}</p>
              <p className="text-xs text-muted">Total practice</p>
            </Card>
            <Card className="p-3.5 sm:p-4">
              <p className="text-xl font-extrabold tabular-nums sm:text-2xl">{sessions.data?.length ?? 0}</p>
              <p className="text-xs text-muted">Sessions</p>
            </Card>
            <Card className="p-3.5 sm:p-4">
              <p className="text-xl font-extrabold tabular-nums sm:text-2xl">{totalLoops}</p>
              <p className="text-xs text-muted">Loops repeated</p>
            </Card>
          </div>

          <section>
            <SectionTitle icon={<History className="h-5 w-5" />} title="Recently practised" />
            {loading ? (
              <Skeleton className="h-24" />
            ) : played.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {played.map((s) => (
                  <SongCard key={s.id} song={s} showPlayed />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No songs played yet.</p>
            )}
          </section>

          <section>
            <SectionTitle icon={<Repeat className="h-5 w-5" />} title="Saved sections" />
            {sections.data?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.data.slice(0, 9).map((s) => (
                  <LoopCard key={s.id} section={s} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No saved sections yet.</p>
            )}
          </section>

          <section>
            <SectionTitle icon={<Timer className="h-5 w-5" />} title="Session log" />
            {sessions.loading && !sessions.data ? (
              <Skeleton className="h-32" />
            ) : groups.size ? (
              <div className="space-y-4">
                {[...groups.entries()].map(([day, items]) => (
                  <div key={day}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{day}</p>
                    <Card className="divide-y divide-line">
                      {items.map((s) => (
                        <Link key={s.id} href={`/player/${s.songId}`} className="flex items-center gap-3 p-3.5 transition hover:bg-surface-2">
                          <KindTile kind={s.songKind} className="h-10 w-10" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{s.songTitle}</p>
                            <p className="text-xs text-muted">
                              {formatPracticeTime(s.seconds)} · {s.loops} loop{s.loops === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted">{timeAgo(s.createdAt)}</span>
                        </Link>
                      ))}
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Sessions are recorded after you practise for a few seconds.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
