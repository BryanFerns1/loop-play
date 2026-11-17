"use client";

import { Pause, Play } from "lucide-react";

/**
 * Visible video surface. The <video> element itself is the shared media element
 * that WaveSurfer + the loop engine control, so video loops exactly like audio.
 */
export function VideoStage({
  setEl,
  playing,
  onToggle,
}: {
  setEl: (el: HTMLVideoElement | null) => void;
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-black shadow-card">
      <video
        ref={setEl}
        playsInline
        preload="auto"
        className="mx-auto max-h-[46dvh] w-full bg-black object-contain sm:max-h-[56dvh]"
        onClick={onToggle}
      />
      <button
        onClick={onToggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className={`absolute inset-0 flex items-center justify-center transition ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
          {playing ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="ml-1 h-7 w-7" fill="currentColor" />}
        </span>
      </button>
    </div>
  );
}
