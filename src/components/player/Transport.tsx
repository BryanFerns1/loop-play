"use client";

import { Pause, Play, Repeat, RotateCcw, RotateCw, Volume1, Volume2, VolumeX } from "lucide-react";
import type { useWaveformPlayer } from "@/audio/useWaveformPlayer";
import { SpeedMenu } from "@/components/player/SpeedControl";
import { IconButton, cx } from "@/components/ui";
import { formatTime } from "@/lib/format";

type Player = ReturnType<typeof useWaveformPlayer>;

export function Transport({ p }: { p: Player }) {
  const dur = Math.max(p.duration, 0.01);
  const fill = Math.min(100, (p.currentTime / dur) * 100);
  const loopLeft = (p.loop.start / dur) * 100;
  const loopWidth = ((p.loop.end - p.loop.start) / dur) * 100;
  const VolIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="rounded-2xl border border-line bg-surface/95 p-3 shadow-card backdrop-blur sm:p-4">
      {/* timeline */}
      <div className="flex items-center gap-3">
        <span className="w-11 shrink-0 text-right font-mono text-xs tabular-nums text-muted">{formatTime(p.currentTime)}</span>
        <div className="relative flex h-8 flex-1 items-center">
          <input
            type="range"
            aria-label="Playback position"
            className="range relative z-10 w-full"
            style={{ ["--fill" as string]: `${fill}%` }}
            min={0}
            max={dur}
            step={0.01}
            value={Math.min(p.currentTime, dur)}
            disabled={!p.ready}
            onChange={(e) => p.seek(Number(e.target.value))}
          />
          {p.ready && p.loop.end > p.loop.start && (
            <span
              aria-hidden
              className={cx(
                "pointer-events-none absolute top-1/2 z-0 h-3 -translate-y-1/2 rounded-full border-x-2 border-teal bg-teal/30 transition-opacity",
                p.loopEnabled ? "opacity-100" : "opacity-50",
              )}
              style={{ left: `${loopLeft}%`, width: `${loopWidth}%` }}
            />
          )}
        </div>
        <span className="w-11 shrink-0 font-mono text-xs tabular-nums text-muted">{formatTime(p.duration)}</span>
      </div>

      {/* controls */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          onClick={() => p.setLoopEnabled(!p.loopEnabled)}
          aria-pressed={p.loopEnabled}
          aria-label="Toggle loop"
          title="Toggle loop (L)"
          className={cx(
            "flex h-12 items-center justify-center gap-1.5 rounded-2xl px-3.5 text-sm font-bold transition active:scale-95",
            p.loopEnabled ? "bg-teal text-white shadow-sm" : "bg-surface-2 text-ink",
          )}
        >
          <Repeat className="h-5 w-5" />
          <span className="hidden min-[400px]:inline">{p.loopEnabled ? "Loop on" : "Loop"}</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-3">
          <IconButton label="Back 5 seconds (←)" className="h-12 w-12" onClick={() => p.seekBy(-5)}>
            <RotateCcw className="h-6 w-6" />
          </IconButton>
          <button
            onClick={p.togglePlay}
            disabled={!p.ready}
            aria-label={p.playing ? "Pause" : "Play"}
            title="Play / pause (Space)"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-on-navy shadow-lg transition hover:brightness-125 active:scale-95 disabled:opacity-50"
          >
            {p.playing ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="ml-0.5 h-7 w-7" fill="currentColor" />}
          </button>
          <IconButton label="Forward 5 seconds (→)" className="h-12 w-12" onClick={() => p.seekBy(5)}>
            <RotateCw className="h-6 w-6" />
          </IconButton>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <IconButton label={p.muted ? "Unmute (M)" : "Mute (M)"} onClick={p.toggleMute}>
              <VolIcon className="h-5 w-5" />
            </IconButton>
            <input
              type="range"
              aria-label="Volume"
              className="range w-20"
              style={{ ["--fill" as string]: `${(p.muted ? 0 : p.volume) * 100}%` }}
              min={0}
              max={1}
              step={0.01}
              value={p.muted ? 0 : p.volume}
              onChange={(e) => p.setVolume(Number(e.target.value))}
            />
          </div>
          <div className="lg:hidden">
            <SpeedMenu rate={p.rate} onChange={p.setRate} />
          </div>
        </div>
      </div>
    </div>
  );
}
