"use client";

import { ArrowRight, Clock, GraduationCap, Library, Play, Plus, Repeat, Timer, Upload } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { LoopCard } from "@/components/LoopCard";
import { SampleButton } from "@/components/SampleButton";
import { KindTile, SongCard } from "@/components/SongCard";
import { Button, Card, EmptyState, ErrorState, SectionTitle, Skeleton } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { formatPracticeTime, greeting, timeAgo } from "@/lib/format";
import { sectionsApi, sessionsApi, sharedApi, songsApi } from "@/services/api";

export default function DashboardPage() {
  const { name, openUpload } = useApp();
  const songs = useQuery(() => songsApi.list({ origin: "library" }));
  const sections = useQuery(() => sectionsApi.list());
  const sessions = useQuery(() => sessionsApi.list());
  const shared = useQuery(() => sharedApi.list());

  const loading = songs.loading && !songs.data;
  const list = songs.data ?? [];
  const recent = [...list]
    .filter((s) => s.lastPlayedAt)
    .sort((a, b) => +new Date(b.lastPlayedAt!) - +new Date(a.lastPlayedAt!))
    .slice(0, 4);
  const startTarget = recent[0] ?? list[0];

  const weekAgo = Date.now() - 7 * 86400000;
  const weekSeconds = (sessions.data ?? [])
    .filter((s) => +new Date(s.createdAt) > weekAgo)
    .reduce((n, s) => n + s.seconds, 0);

  const firstName = name.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="animate-fade-up relative overflow-hidden rounded-3xl bg-navy p-6 text-on-navy shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-6 top-1/2 flex -translate-y-1/2 items-end gap-1.5 opacity-[0.12]" aria-hidden>
          {[40, 70, 110, 60, 130, 90, 50, 100, 70, 40].map((h, i) => (
            <span key={i} className="w-3 rounded-full bg-white" style={{ height: h }} />
          ))}
        </div>
        <p className="text-sm font-medium text-white/70">{greeting()},</p>
        <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight sm:text-4xl">{firstName} 👋</h1>
        <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">Practice Every Note. Perfect Every Harmony.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {startTarget ? (
            <Link href={`/player/${startTarget.id}`}>
              <Button variant="primary" size="lg" className="shadow-lg">
                <Play className="h-5 w-5" fill="currentColor" /> Start practicing
              </Button>
            </Link>
          ) : (
            <Button variant="primary" size="lg" onClick={openUpload} className="shadow-lg">
              <Play className="h-5 w-5" fill="currentColor" /> Start practicing
            </Button>
          )}
          <Button size="lg" onClick={openUpload} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <Upload className="h-5 w-5" /> Upload new song
          </Button>
        </div>
        {startTarget && (
          <p className="mt-4 truncate text-xs text-white/60">
            {startTarget.lastPlayedAt ? "Pick up where you left off:" : "Start with:"} {startTarget.title}
          </p>
        )}
      </section>

      {songs.error && <ErrorState message={songs.error} onRetry={songs.reload} />}

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Library, label: "Songs", value: String(list.length) },
          { icon: Repeat, label: "Saved loops", value: String(sections.data?.length ?? 0) },
          { icon: Timer, label: "Practised this week", value: formatPracticeTime(weekSeconds) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-3.5 sm:p-4">
            <Icon className="mb-2 h-5 w-5 text-accent" />
            <p className="text-xl font-extrabold tabular-nums sm:text-2xl">{loading ? "–" : value}</p>
            <p className="text-xs text-muted">{label}</p>
          </Card>
        ))}
      </section>

      {!loading && list.length === 0 && !songs.error ? (
        <EmptyState
          icon={<Upload className="h-7 w-7" />}
          title="Upload your first song"
          description="Add an audio or video recording from your choir director, select a tricky passage and let ChoirLoop repeat it for you."
          action={
            <>
              <Button variant="primary" onClick={openUpload}>
                <Plus className="h-4 w-4" /> Upload a song
              </Button>
              <SampleButton openAfter />
            </>
          }
        />
      ) : (
        <>
          <section>
            <SectionTitle icon={<Clock className="h-5 w-5" />} title="Recently played" action={<SeeAll href="/library" label="All songs" />} />
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            ) : recent.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {recent.map((s) => (
                  <SongCard key={s.id} song={s} showPlayed />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                Songs you open will show up here.
              </p>
            )}
          </section>

          <section>
            <SectionTitle icon={<Repeat className="h-5 w-5" />} title="Saved loops" />
            {sections.loading && !sections.data ? (
              <Skeleton className="h-20" />
            ) : sections.data?.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.data.slice(0, 6).map((s) => (
                  <LoopCard key={s.id} section={s} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
                Open a song, select a section and tap <strong>Save section</strong> to keep it here.
              </p>
            )}
          </section>
        </>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle icon={<Timer className="h-5 w-5" />} title="My practice sessions" action={<SeeAll href="/history" label="History" />} />
          {sessions.loading && !sessions.data ? (
            <Skeleton className="h-32" />
          ) : sessions.data?.length ? (
            <Card className="divide-y divide-line">
              {sessions.data.slice(0, 4).map((s) => (
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
          ) : (
            <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              Your practice sessions are logged automatically while you listen.
            </p>
          )}
        </section>

        <section>
          <SectionTitle icon={<GraduationCap className="h-5 w-5" />} title="Shared by instructor" action={<SeeAll href="/shared" label="View all" />} />
          {shared.loading && !shared.data ? (
            <Skeleton className="h-32" />
          ) : shared.data?.length ? (
            <Card className="divide-y divide-line">
              {shared.data.slice(0, 3).map((s) => (
                <Link key={s.id} href={`/player/${s.songId}`} className="flex items-center gap-3 p-3.5 transition hover:bg-surface-2">
                  <KindTile kind={s.kind} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <p className="truncate text-xs text-muted">From {s.instructor}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              ))}
            </Card>
          ) : (
            <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center">
              <p className="text-sm text-muted">Nothing shared yet.</p>
              <div className="mt-3 flex justify-center">
                <SampleButton share label="Add instructor sample" />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
      {label} <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
