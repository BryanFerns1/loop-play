"use client";

import { useEffect, useRef } from "react";
import { SPEEDS, type useWaveformPlayer } from "@/audio/useWaveformPlayer";

type Player = ReturnType<typeof useWaveformPlayer>;

function isEditable(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") return (el as HTMLInputElement).type !== "range";
  return false;
}

/** Global practice keyboard shortcuts for the player page. */
export function usePlayerShortcuts(p: Player, handlers: { onSave: () => void; onHelp: () => void }) {
  const ref = useRef({ p, handlers });
  ref.current = { p, handlers };

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isEditable(e.target)) return;
      if ((e.target as HTMLElement | null)?.closest?.("[role=dialog]")) return;
      const { p, handlers } = ref.current;
      const idx = SPEEDS.indexOf(p.rate as (typeof SPEEDS)[number]);
      const key = e.key;
      const onRange = (e.target as HTMLInputElement | null)?.type === "range";
      let handled = true;
      switch (key) {
        case " ":
        case "k":
        case "K":
          p.togglePlay();
          break;
        case "l":
        case "L":
          p.setLoopEnabled(!p.loopEnabled);
          break;
        case "[":
          p.setLoop(p.currentTime, Math.max(p.loop.end, p.currentTime + 0.2));
          break;
        case "]":
          p.setLoop(Math.min(p.loop.start, p.currentTime - 0.2), p.currentTime);
          break;
        case "ArrowLeft":
          if (onRange) return handled = false, undefined;
          p.seekBy(e.shiftKey ? -1 : -5);
          break;
        case "ArrowRight":
          if (onRange) return handled = false, undefined;
          p.seekBy(e.shiftKey ? 1 : 5);
          break;
        case "ArrowUp":
          if (onRange) return handled = false, undefined;
          p.setVolume(p.volume + 0.1);
          break;
        case "ArrowDown":
          if (onRange) return handled = false, undefined;
          p.setVolume(p.volume - 0.1);
          break;
        case "Home":
          p.seek(p.loopEnabled ? p.loop.start : 0);
          break;
        case "m":
        case "M":
          p.toggleMute();
          break;
        case ",":
          p.setRate(SPEEDS[Math.max(0, idx - 1)]);
          break;
        case ".":
          p.setRate(SPEEDS[Math.min(SPEEDS.length - 1, idx + 1)]);
          break;
        case "z":
        case "Z":
          p.zoomToLoop();
          break;
        case "s":
        case "S":
          handlers.onSave();
          break;
        case "?":
          handlers.onHelp();
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };
    // Prevent Space from also "clicking" a focused button on key release
    const onUp = (e: KeyboardEvent) => {
      if (e.key === " " && !isEditable(e.target) && !(e.target as HTMLElement | null)?.closest?.("[role=dialog]")) e.preventDefault();
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);
}
