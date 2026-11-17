"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.js";
import { sessionsApi, songsApi } from "@/services/api";

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const MIN_LOOP = 0.2;
const MAX_ZOOM = 600;

export type LoopRange = { start: number; end: number };

type Options = {
  songId: string;
  songDuration: number;
  /** The <audio> or <video> element that actually plays the file (shared by WaveSurfer). */
  mediaRef: RefObject<HTMLMediaElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  theme: "light" | "dark";
  initialLoop?: (LoopRange & { enabled: boolean }) | null;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function cssVar(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Core practice engine: waveform + region selection (WaveSurfer.js) on top of a plain
 * HTML media element, plus a high-frequency loop watcher that jumps back to the loop
 * start a few milliseconds before the loop end for a seamless repeat.
 */
export function useWaveformPlayer({ songId, songDuration, mediaRef, containerRef, theme, initialLoop }: Options) {
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<ReturnType<typeof RegionsPlugin.create> | null>(null);
  const regionRef = useRef<Region | null>(null);
  const loopRef = useRef({ enabled: false, start: 0, end: 0 });
  const insideRef = useRef(false);
  const practiceRef = useRef({ seconds: 0, loops: 0, last: 0 });
  const durationRef = useRef(songDuration);
  const zoomRef = useRef(0);
  const initialLoopRef = useRef(initialLoop);

  const [fallback, setFallback] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(songDuration);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMutedState] = useState(false);
  const [rate, setRateState] = useState(1);
  const [loopEnabled, setLoopEnabledState] = useState(false);
  const [loop, setLoopState] = useState<LoopRange>({ start: 0, end: 0 });
  const [loopCount, setLoopCount] = useState(0);
  const [zoom, setZoomState] = useState(0);

  // reset fallback when switching songs
  useEffect(() => {
    setFallback(false);
  }, [songId]);

  /* ---------- practice-time tracking ---------- */
  const flushPractice = useCallback(() => {
    const p = practiceRef.current;
    if (p.seconds >= 3) sessionsApi.record({ songId, seconds: p.seconds, loops: p.loops });
    p.seconds = 0;
    p.loops = 0;
  }, [songId]);

  /* ---------- create / destroy WaveSurfer ---------- */
  useEffect(() => {
    const media = mediaRef.current;
    const container = containerRef.current;
    if (!media || !container) return;

    setReady(false);
    setError(null);
    setPlaying(false);
    setCurrentTime(0);
    setLoopCount(0);
    setZoomState(0);
    zoomRef.current = 0;
    loopRef.current = { enabled: false, start: 0, end: 0 };
    insideRef.current = false;
    regionRef.current = null;
    setLoopEnabledState(false);

    const regions = RegionsPlugin.create();
    regionsRef.current = regions;

    const dur0 = durationRef.current;
    const ws = WaveSurfer.create({
      container,
      media,
      url: songsApi.fileUrl(songId),
      height: 132,
      waveColor: cssVar("--muted", "#888"),
      progressColor: cssVar("--accent", "#6240f0"),
      cursorColor: cssVar("--ink", "#111"),
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      normalize: true,
      autoScroll: true,
      autoCenter: false,
      minPxPerSec: 0,
      plugins: [regions],
      ...(fallback && dur0 > 0
        ? {
            peaks: [Array.from({ length: 1600 }, (_, i) => 0.25 + 0.2 * Math.abs(Math.sin(i / 9)) * Math.abs(Math.cos(i / 41)))],
            duration: dur0,
          }
        : {}),
    });
    wsRef.current = ws;

    const regionColor = "rgba(15, 165, 151, 0.28)";

    const syncFromRegion = (r: Region) => {
      loopRef.current.start = r.start;
      loopRef.current.end = r.end;
      setLoopState({ start: r.start, end: r.end });
      const t = media.currentTime;
      insideRef.current = t >= r.start - 0.05 && t < r.end;
    };

    const stopDragSelection =
      window.matchMedia?.("(pointer: fine)").matches
        ? regions.enableDragSelection({ color: regionColor, minLength: MIN_LOOP } as never)
        : undefined;

    regions.on("region-created", (r) => {
      if (r.id === "loop") return;
      // a region drawn by dragging on the waveform replaces the current one
      const old = regionRef.current;
      regionRef.current = r;
      old?.remove();
      r.setOptions({ id: "loop" });
      syncFromRegion(r);
    });
    regions.on("region-update", (r) => syncFromRegion(r));
    regions.on("region-updated", (r) => syncFromRegion(r));

    const createRegion = (start: number, end: number) => {
      if (regionRef.current) {
        regionRef.current.setOptions({ start, end });
        syncFromRegion(regionRef.current);
        return;
      }
      const r = regions.addRegion({
        id: "loop",
        start,
        end,
        color: regionColor,
        drag: true,
        resize: true,
        minLength: MIN_LOOP,
      });
      regionRef.current = r;
      syncFromRegion(r);
    };

    const onReady = (d: number) => {
      const total = d && Number.isFinite(d) ? d : durationRef.current;
      durationRef.current = total;
      setDuration(total);
      setReady(true);
      const il = initialLoopRef.current;
      if (il && il.end > il.start) {
        createRegion(clamp(il.start, 0, total), clamp(il.end, 0, total));
        loopRef.current.enabled = il.enabled;
        setLoopEnabledState(il.enabled);
        media.currentTime = clamp(il.start, 0, total);
        setCurrentTime(media.currentTime);
      } else {
        createRegion(0, Math.min(total, Math.max(MIN_LOOP * 2, Math.min(10, total / 3 || 10))));
      }
      if (!songDuration && total) songsApi.setDuration(songId, total).catch(() => {});
    };
    ws.on("ready", onReady);
    ws.on("error", (e) => {
      if (!fallback && durationRef.current > 0) {
        // waveform decoding failed (e.g. very large video) – retry with a placeholder waveform
        setFallback(true);
      } else {
        setError(e instanceof Error ? e.message : "This file can’t be played in your browser.");
      }
    });
    ws.on("timeupdate", (t) => setCurrentTime(t));
    ws.on("audioprocess", (t) => setCurrentTime(t));
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => setPlaying(false));
    ws.on("finish", () => {
      if (loopRef.current.enabled && loopRef.current.end > loopRef.current.start) {
        media.currentTime = loopRef.current.start;
        void media.play();
      } else {
        setPlaying(false);
      }
    });

    /* ----- loop watcher: runs on rAF and on a timer (works in background tabs too) ----- */
    const tick = () => {
      const now = performance.now();
      const p = practiceRef.current;
      if (!media.paused && !media.ended) {
        if (p.last) p.seconds += Math.min(1.5, (now - p.last) / 1000);
        p.last = now;
      } else {
        p.last = 0;
      }
      const L = loopRef.current;
      if (!L.enabled || media.paused || media.seeking || L.end - L.start < MIN_LOOP) return;
      const lead = 0.01 + 0.012 * media.playbackRate;
      const t = media.currentTime;
      if (t >= L.start - 0.05 && t < L.end - lead) {
        insideRef.current = true;
      } else if (t >= L.end - lead && insideRef.current) {
        media.currentTime = L.start;
        p.loops += 1;
        setLoopCount((c) => c + 1);
      }
    };
    let raf = 0;
    const frame = () => {
      tick();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const timer = window.setInterval(tick, 20);

    const onSeeking = () => {
      const L = loopRef.current;
      const t = media.currentTime;
      const lead = 0.01 + 0.012 * media.playbackRate;
      insideRef.current = t >= L.start - 0.05 && t < L.end - lead;
    };
    const onPlay = () => {
      const L = loopRef.current;
      const t = media.currentTime;
      // pressing play when the playhead is already at/after the loop end restarts the loop
      if (L.enabled && L.end - L.start >= MIN_LOOP && t >= L.end - 0.02) media.currentTime = L.start;
    };
    media.addEventListener("seeking", onSeeking);
    media.addEventListener("play", onPlay);

    const onHide = () => {
      if (document.visibilityState === "hidden") flushPractice();
    };
    window.addEventListener("pagehide", flushPractice);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      flushPractice();
      cancelAnimationFrame(raf);
      window.clearInterval(timer);
      media.removeEventListener("seeking", onSeeking);
      media.removeEventListener("play", onPlay);
      window.removeEventListener("pagehide", flushPractice);
      document.removeEventListener("visibilitychange", onHide);
      stopDragSelection?.();
      try {
        media.pause();
      } catch {
        /* ignore */
      }
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
      regionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId, fallback]);

  /* ---------- theme ---------- */
  useEffect(() => {
    // wait a tick so the <html> "dark" class (toggled by AppProvider's effect) is applied first
    const t = window.setTimeout(() => {
      wsRef.current?.setOptions({
        waveColor: cssVar("--muted", "#888"),
        progressColor: cssVar("--accent", "#6240f0"),
        cursorColor: cssVar("--ink", "#111"),
      });
    }, 30);
    return () => window.clearTimeout(t);
  }, [theme, ready]);

  /* ---------- actions ---------- */
  const media = () => mediaRef.current;

  const play = useCallback(() => {
    const m = media();
    if (!m) return;
    m.play().catch(() => setError("Playback was blocked. Tap play again."));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pause = useCallback(() => media()?.pause(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const togglePlay = useCallback(() => {
    const m = media();
    if (!m) return;
    if (m.paused) play();
    else m.pause();
  }, [play]); // eslint-disable-line react-hooks/exhaustive-deps

  const seek = useCallback((t: number) => {
    const m = media();
    if (!m) return;
    const total = durationRef.current || m.duration || 0;
    m.currentTime = clamp(t, 0, total);
    setCurrentTime(m.currentTime);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const seekBy = useCallback((d: number) => seek((media()?.currentTime ?? 0) + d), [seek]); // eslint-disable-line react-hooks/exhaustive-deps

  const setVolume = useCallback((v: number) => {
    const val = clamp(v, 0, 1);
    wsRef.current?.setVolume(val);
    setVolumeState(val);
    if (val > 0) {
      wsRef.current?.setMuted(false);
      setMutedState(false);
    }
  }, []);
  const toggleMute = useCallback(() => {
    const m = media();
    if (!m) return;
    m.muted = !m.muted;
    setMutedState(m.muted);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setRate = useCallback((r: number) => {
    wsRef.current?.setPlaybackRate(r, true);
    const m = media();
    if (m) m.playbackRate = r;
    setRateState(r);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLoopEnabled = useCallback((on: boolean) => {
    loopRef.current.enabled = on;
    setLoopEnabledState(on);
    const m = media();
    if (on && m) {
      const L = loopRef.current;
      insideRef.current = m.currentTime >= L.start - 0.05 && m.currentTime < L.end;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Set the loop region (seconds). Values are clamped and kept at least MIN_LOOP apart. */
  const setLoop = useCallback((start: number, end: number) => {
    const total = durationRef.current || Infinity;
    let s = clamp(start, 0, total);
    let e = clamp(end, 0, total);
    if (e - s < MIN_LOOP) {
      if (s + MIN_LOOP <= total) e = s + MIN_LOOP;
      else s = Math.max(0, e - MIN_LOOP);
    }
    const r = regionRef.current;
    if (r) r.setOptions({ start: s, end: e });
    loopRef.current.start = s;
    loopRef.current.end = e;
    setLoopState({ start: s, end: e });
    const m = media();
    if (m) insideRef.current = m.currentTime >= s - 0.05 && m.currentTime < e;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Jump to the start of the loop and play with looping enabled. */
  const playLoop = useCallback(
    (range?: LoopRange) => {
      if (range) setLoop(range.start, range.end);
      setLoopEnabled(true);
      const m = media();
      if (!m) return;
      m.currentTime = range?.start ?? loopRef.current.start;
      insideRef.current = true;
      play();
    },
    [play, setLoop, setLoopEnabled], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const applyZoom = useCallback((px: number) => {
    const val = px <= 0 ? 0 : clamp(px, 1, MAX_ZOOM);
    zoomRef.current = val;
    setZoomState(val);
    wsRef.current?.zoom(val);
  }, []);
  const fitPx = () => {
    const w = containerRef.current?.clientWidth ?? 600;
    return w / Math.max(1, durationRef.current);
  };
  const zoomIn = useCallback(() => applyZoom((zoomRef.current || fitPx()) * 1.7), [applyZoom]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomOut = useCallback(() => {
    const next = (zoomRef.current || fitPx()) / 1.7;
    applyZoom(next <= fitPx() * 1.05 ? 0 : next);
  }, [applyZoom]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoomFit = useCallback(() => applyZoom(0), [applyZoom]);
  const zoomToLoop = useCallback(() => {
    const L = loopRef.current;
    const w = containerRef.current?.clientWidth ?? 600;
    applyZoom(clamp((w * 0.8) / Math.max(1, L.end - L.start), fitPx(), MAX_ZOOM));
    requestAnimationFrame(() => wsRef.current?.setScrollTime(Math.max(0, L.start - (L.end - L.start) * 0.1)));
  }, [applyZoom]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ready,
    error,
    fallback,
    playing,
    currentTime,
    duration,
    volume,
    muted,
    rate,
    loopEnabled,
    loop,
    loopCount,
    zoom,
    play,
    pause,
    togglePlay,
    seek,
    seekBy,
    setVolume,
    toggleMute,
    setRate,
    setLoopEnabled,
    setLoop,
    playLoop,
    zoomIn,
    zoomOut,
    zoomFit,
    zoomToLoop,
  };
}
