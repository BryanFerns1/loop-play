"use client";

import { BookmarkPlus, Crosshair, Minus, Plus, Repeat, Maximize2, ZoomIn } from "lucide-react";
import type { useWaveformPlayer } from "@/audio/useWaveformPlayer";
import { SpeedChips } from "@/components/player/SpeedControl";
import { TimeInput } from "@/components/player/TimeInput";
import { Button, IconButton, cx } from "@/components/ui";
import { formatTime } from "@/lib/format";

type Player = ReturnType<typeof useWaveformPlayer>;

export function LoopPanel({ p, onSave }: { p: Player; onSave: () => void }) {
  const length = Math.max(0, p.loop.end - p.loop.start);
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Repeat className="h-5 w-5 text-teal" /> Loop section
        </h2>
        <span className="rounded-full bg-lav px-2.5 py-1 text-xs font-semibold text-lav-ink tabular-nums">
          {formatTime(length, true)} long
          {p.loopCount > 0 && ` · ${p.loopCount}×`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Start</span>
          <div className="flex items-center gap-1.5">
            <IconButton label="Start earlier by 0.5s" className="h-11 w-9 bg-surface-2" onClick={() => p.setLoop(p.loop.start - 0.5, p.loop.end)}>
              <Minus className="h-4 w-4" />
            </IconButton>
            <TimeInput label="Loop start" value={p.loop.start} max={p.duration} onCommit={(v) => p.setLoop(v, Math.max(p.loop.end, v + 0.2))} className="min-w-0 px-1" />
            <IconButton label="Start later by 0.5s" className="h-11 w-9 bg-surface-2" onClick={() => p.setLoop(p.loop.start + 0.5, p.loop.end)}>
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">End</span>
          <div className="flex items-center gap-1.5">
            <IconButton label="End earlier by 0.5s" className="h-11 w-9 bg-surface-2" onClick={() => p.setLoop(p.loop.start, p.loop.end - 0.5)}>
              <Minus className="h-4 w-4" />
            </IconButton>
            <TimeInput label="Loop end" value={p.loop.end} max={p.duration} onCommit={(v) => p.setLoop(Math.min(p.loop.start, v - 0.2), v)} className="min-w-0 px-1" />
            <IconButton label="End later by 0.5s" className="h-11 w-9 bg-surface-2" onClick={() => p.setLoop(p.loop.start, p.loop.end + 0.5)}>
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => p.setLoop(p.currentTime, Math.max(p.loop.end, p.currentTime + 0.2))} title="Shortcut: [">
          <Crosshair className="h-4 w-4" /> Start = playhead
        </Button>
        <Button onClick={() => p.setLoop(Math.min(p.loop.start, p.currentTime - 0.2), p.currentTime)} title="Shortcut: ]">
          <Crosshair className="h-4 w-4" /> End = playhead
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={() => p.playLoop()} disabled={!p.ready}>
          <Repeat className="h-4 w-4" /> Play loop
        </Button>
        <Button onClick={onSave} disabled={!p.ready}>
          <BookmarkPlus className="h-4 w-4" /> Save section
        </Button>
      </div>

      <div className="hidden lg:block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Speed</span>
        <SpeedChips rate={p.rate} onChange={p.setRate} />
      </div>
    </div>
  );
}

export function WaveToolbar({ p }: { p: Player }) {
  return (
    <div className="flex items-center gap-1">
      <IconButton label="Zoom out" onClick={p.zoomOut} className="h-9 w-9">
        <Minus className="h-4 w-4" />
      </IconButton>
      <IconButton label="Zoom in" onClick={p.zoomIn} className="h-9 w-9">
        <Plus className="h-4 w-4" />
      </IconButton>
      <IconButton label="Zoom to loop (Z)" onClick={p.zoomToLoop} className="h-9 w-9">
        <ZoomIn className="h-4 w-4" />
      </IconButton>
      <IconButton label="Fit whole song" onClick={p.zoomFit} active={p.zoom === 0} className={cx("h-9 w-9")}>
        <Maximize2 className="h-4 w-4" />
      </IconButton>
    </div>
  );
}
