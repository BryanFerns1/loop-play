"use client";

import { Library, Plus, Search, SearchX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { SampleButton } from "@/components/SampleButton";
import { SongCard } from "@/components/SongCard";
import { Button, ConfirmDialog, EmptyState, ErrorState, PageHeader, Skeleton, cx, inputCls } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import type { Song } from "@/lib/types";
import { songsApi } from "@/services/api";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "recent", label: "Recently added" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
] as const;

export default function LibraryPage() {
  const { openUpload, toast } = useApp();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [deleting, setDeleting] = useState<Song | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const songs = useQuery(() => songsApi.list({ q: debounced, origin: "library" }), [debounced]);

  const weekAgo = Date.now() - 7 * 86400000;
  const visible = (songs.data ?? []).filter((s) => {
    if (filter === "audio" || filter === "video") return s.kind === filter;
    if (filter === "recent") return +new Date(s.createdAt) > weekAgo;
    return true;
  });
  const hasAny = (songs.data?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="My Songs"
        subtitle="Your uploaded audio and video recordings."
        actions={
          <Button variant="primary" onClick={openUpload} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Upload song
          </Button>
        }
      />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search songs…"
            aria-label="Search songs"
            className={cx(inputCls, "h-12 pl-11 pr-11")}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={cx(
                "h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
                filter === f.id ? "border-navy bg-navy text-on-navy" : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {songs.loading && !songs.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : songs.error && !songs.data ? (
        <ErrorState message={songs.error} onRetry={songs.reload} />
      ) : !hasAny && !debounced ? (
        <EmptyState
          icon={<Library className="h-7 w-7" />}
          title="Your library is empty"
          description="Upload an MP3, WAV, MP4 or any other audio/video file to start looping."
          action={
            <>
              <Button variant="primary" onClick={openUpload}>
                <Plus className="h-4 w-4" /> Upload song
              </Button>
              <SampleButton />
            </>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-7 w-7" />}
          title="No songs found"
          description={debounced ? `Nothing matches “${debounced}”.` : "No songs match this filter."}
          action={
            <Button
              onClick={() => {
                setQ("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-muted">
            {visible.length} song{visible.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => (
              <SongCard key={s.id} song={s} onDelete={setDeleting} />
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete this song?"
        message={`“${deleting?.title ?? ""}” and all of its saved sections and practice history will be permanently deleted.`}
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await songsApi.remove(deleting.id);
            toast("Song deleted");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not delete", "error");
          }
          setBusy(false);
          setDeleting(null);
        }}
      />
    </div>
  );
}
