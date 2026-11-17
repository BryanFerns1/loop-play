"use client";

import { Gauge } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SPEEDS } from "@/audio/useWaveformPlayer";
import { cx } from "@/components/ui";

export function SpeedChips({ rate, onChange }: { rate: number; onChange: (r: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Playback speed" className="grid grid-cols-6 gap-1 rounded-xl bg-surface-2 p-1">
      {SPEEDS.map((s) => (
        <button
          key={s}
          role="radio"
          aria-checked={rate === s}
          onClick={() => onChange(s)}
          className={cx(
            "h-9 rounded-lg text-sm font-semibold tabular-nums transition",
            rate === s ? "bg-surface text-accent shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}

/** Compact popover version used inside the sticky mobile transport. */
export function SpeedMenu({ rate, onChange }: { rate: number; onChange: (r: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Playback speed ${rate}x`}
        className={cx(
          "flex h-12 min-w-14 items-center justify-center gap-1 rounded-2xl px-2 text-sm font-bold tabular-nums transition active:scale-95",
          rate !== 1 ? "bg-lav text-lav-ink" : "bg-surface-2 text-ink",
        )}
      >
        <Gauge className="h-4 w-4" />
        {rate}x
      </button>
      {open && (
        <ul
          role="listbox"
          className="animate-fade-up absolute bottom-14 right-0 z-30 w-28 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-xl"
        >
          {[...SPEEDS].reverse().map((s) => (
            <li key={s}>
              <button
                role="option"
                aria-selected={rate === s}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={cx(
                  "flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                  rate === s ? "bg-lav text-lav-ink" : "hover:bg-surface-2",
                )}
              >
                {s}x
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
