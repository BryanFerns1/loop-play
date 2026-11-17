"use client";

import { Clapperboard, Music2, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { cx } from "@/components/ui";
import { formatBytes, formatDate, formatTime, timeAgo } from "@/lib/format";
import type { MediaKind, Song } from "@/lib/types";

export function KindTile({ kind, className }: { kind: MediaKind; className?: string }) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-xl",
        kind === "video" ? "bg-navy text-on-navy" : "bg-lav text-lav-ink",
        className ?? "h-12 w-12",
      )}
    >
      {kind === "video" ? <Clapperboard className="h-1/2 w-1/2" /> : <Music2 className="h-1/2 w-1/2" />}
    </span>
  );
}

export function KindBadge({ kind }: { kind: MediaKind }) {
  return (
    <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
      {kind}
    </span>
  );
}

export function SongCard({
  song,
  onDelete,
  showPlayed,
}: {
  song: Song;
  onDelete?: (s: Song) => void;
  showPlayed?: boolean;
}) {
  return (
    <div className="group animate-fade-up relative rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-accent/40">
      <Link href={`/player/${song.id}`} className="flex items-center gap-3.5 p-3.5 pr-14">
        <div className="relative">
          <KindTile kind={song.kind} className="h-14 w-14" />
          <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-accent text-on-accent opacity-0 transition group-hover:opacity-100">
            <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{song.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <KindBadge kind={song.kind} />
            <span className="tabular-nums">{song.duration ? formatTime(song.duration) : "--:--"}</span>
            <span>·</span>
            <span>{showPlayed ? `Played ${timeAgo(song.lastPlayedAt)}` : formatDate(song.createdAt)}</span>
            {!showPlayed && song.size > 0 && (
              <>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{formatBytes(song.size)}</span>
              </>
            )}
          </div>
          {(song.sectionCount ?? 0) > 0 && (
            <p className="mt-1 text-xs font-medium text-accent">
              {song.sectionCount} saved section{song.sectionCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={() => onDelete(song)}
          aria-label={`Delete ${song.title}`}
          className="absolute right-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-muted transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
