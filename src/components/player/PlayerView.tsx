"use client";

import { AlertCircle, ArrowLeft, Keyboard, Music2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWaveformPlayer, type LoopRange } from "@/audio/useWaveformPlayer";
import { useApp } from "@/components/AppProvider";
import { LoopPanel, WaveToolbar } from "@/components/player/LoopPanel";
import { SectionDialog } from "@/components/player/SectionDialog";
import { SectionsPanel } from "@/components/player/SectionsPanel";
import { ShortcutsDialog } from "@/components/player/ShortcutsDialog";
import { Transport } from "@/components/player/Transport";
import { IconButton, Spinner, cx } from "@/components/ui";
import { usePlayerShortcuts } from "@/hooks/usePlayerShortcuts";
import { useQuery } from "@/hooks/useQuery";
import { formatBytes, formatDate, formatTime } from "@/lib/format";
import type { Song } from "@/lib/types";
import { sectionsApi, songsApi } from "@/services/api";
import { VideoStage } from "@/video/VideoStage";

export function PlayerView({
  song,
  initialLoop,
}: {
  song: Song;
  initialLoop: (LoopRange & { enabled: boolean }) | null;
}) {
  const { theme, toast } = useApp();
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const p = useWaveformPlayer({
    songId: song.id,
    songDuration: song.duration,
    mediaRef,
    containerRef,
    theme,
    initialLoop,
  });
  const sections = useQuery(() => sectionsApi.list(song.id), [song.id]);

  useEffect(() => {
    songsApi.markPlayed(song.id).catch(() => {});
  }, [song.id]);

  const openSave = useCallback(() => setSaveOpen(true), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  usePlayerShortcuts(p, { onSave: openSave, onHelp: openHelp });

  const setMediaEl = useCallback((el: HTMLMediaElement | null) => {
    mediaRef.current = el;
  }, []);

  const isVideo = song.kind === "video";

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/library"
          aria-label="Back to library"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{song.title}</h1>
          <p className="truncate text-xs text-muted">
            {isVideo ? "Video" : "Audio"} · {formatBytes(song.size)} · added {formatDate(song.createdAt)}
          </p>
        </div>
        <IconButton label="Keyboard shortcuts (?)" onClick={openHelp} className="hidden sm:inline-flex">
          <Keyboard className="h-5 w-5" />
        </IconButton>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {isVideo ? (
            <VideoStage setEl={setMediaEl} playing={p.playing} onToggle={p.togglePlay} />
          ) : (
            <>
              <audio ref={setMediaEl} preload="auto" className="hidden" />
              <div className="flex items-center gap-4 rounded-2xl bg-navy p-4 text-on-navy shadow-card sm:p-5">
                <span
                  className={cx(
                    "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10",
                    p.playing && "animate-pulse",
                  )}
                >
                  <Music2 className="h-8 w-8" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Now practising</p>
                  <p className="truncate text-lg font-bold">{song.title}</p>
                  <p className="font-mono text-sm text-white/70 tabular-nums">
                    {formatTime(p.currentTime)} / {formatTime(p.duration)}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Waveform */}
          <div className="rounded-2xl border border-line bg-surface p-3 shadow-card sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted">
                <span className="hidden sm:inline">Drag the teal handles or drag on the waveform to select a section. </span>
                <span className="sm:hidden">Drag the teal handles to select. Zoom to scroll.</span>
              </p>
              <WaveToolbar p={p} />
            </div>
            <div className="relative min-h-[132px]">
              <div ref={containerRef} className="wave-host w-full overflow-hidden rounded-xl" />
              {!p.ready && !p.error && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-surface/80 text-sm font-medium text-muted">
                  <Spinner /> Preparing waveform…
                </div>
              )}
              {p.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-surface px-4 text-center">
                  <AlertCircle className="h-6 w-6 text-danger" />
                  <p className="text-sm font-semibold">Can’t play this file</p>
                  <p className="text-xs text-muted">{p.error} Try re-uploading it as MP3, WAV or MP4.</p>
                </div>
              )}
            </div>
            {p.fallback && (
              <p className="mt-2 text-xs text-muted">Waveform preview isn’t available for this large file, but looping works as normal.</p>
            )}
          </div>

          {/* Mobile: transport sits above the bottom nav */}
          <div className="sticky bottom-[4.75rem] z-20 lg:bottom-4">
            <Transport p={p} />
          </div>

          <LoopPanel p={p} onSave={openSave} />
        </div>

        <div className="min-w-0 lg:sticky lg:top-6">
          <SectionsPanel
            sections={sections.data}
            loading={sections.loading}
            activeLoop={p.loop}
            duration={p.duration}
            onSave={openSave}
            onPlay={(s) => {
              p.playLoop({ start: s.startTime, end: s.endTime });
              toast(`Looping “${s.name}”`);
            }}
          />
          <button
            onClick={openHelp}
            className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-muted hover:text-ink lg:flex"
          >
            <Keyboard className="h-4 w-4" /> Press ? for keyboard shortcuts
          </button>
        </div>
      </div>

      <SectionDialog
        open={saveOpen}
        title="Save practice section"
        confirmLabel="Save section"
        duration={p.duration}
        initial={{ name: "", start: p.loop.start, end: p.loop.end }}
        onClose={() => setSaveOpen(false)}
        onSubmit={async (d) => {
          await sectionsApi.create({ songId: song.id, name: d.name, startTime: d.start, endTime: d.end });
          toast(`Saved “${d.name}”`);
          setSaveOpen(false);
        }}
      />
      <ShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
