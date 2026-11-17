/**
 * Thin client for the ChoirLoop backend. Every page talks to the backend only
 * through this module, so the storage/back-end can be swapped without UI changes.
 */
import type { PracticeSession, Section, SharedMaterial, Song } from "@/lib/types";

export const DATA_EVENT = "choirloop:data-changed";

export function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DATA_EVENT));
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("Network error — please check your connection.");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

async function mutate<T>(url: string, init?: RequestInit): Promise<T> {
  const out = await request<T>(url, init);
  notifyChanged();
  return out;
}

export const songsApi = {
  list: (opts: { q?: string; origin?: "library" | "shared" } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.origin) p.set("origin", opts.origin);
    return request<Song[]>(`/api/songs?${p}`);
  },
  get: (id: string) => request<Song>(`/api/songs/${id}`),
  rename: (id: string, title: string) => mutate<Song>(`/api/songs/${id}`, json("PATCH", { title })),
  setDuration: (id: string, duration: number) => request<Song>(`/api/songs/${id}`, json("PATCH", { duration })),
  markPlayed: (id: string) => mutate<{ ok: boolean }>(`/api/songs/${id}`, { method: "POST" }),
  remove: (id: string) => mutate<{ ok: boolean }>(`/api/songs/${id}`, { method: "DELETE" }),
  fileUrl: (id: string) => `/api/songs/${id}/file`,
  /** Upload with progress reporting. */
  upload: (
    file: File,
    meta: { title: string; duration: number; origin?: "library" | "shared" },
    onProgress?: (pct: number) => void,
  ) =>
    new Promise<Song>((resolve, reject) => {
      const form = new FormData();
      form.set("title", meta.title);
      form.set("duration", String(meta.duration));
      form.set("origin", meta.origin ?? "library");
      form.set("file", file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/songs");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onerror = () => reject(new Error("Upload failed — check your connection."));
      xhr.onload = () => {
        let data: unknown = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* ignore */
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          notifyChanged();
          resolve(data as Song);
        } else {
          reject(new Error((data as { error?: string })?.error ?? `Upload failed (${xhr.status})`));
        }
      };
      xhr.send(form);
    }),
  addSample: (share = false) => mutate<Song>("/api/sample", json("POST", { share })),
};

export const sectionsApi = {
  list: (songId?: string) => request<Section[]>(`/api/sections${songId ? `?songId=${songId}` : ""}`),
  create: (data: { songId: string; name: string; startTime: number; endTime: number }) =>
    mutate<Section>("/api/sections", json("POST", data)),
  update: (id: string, data: Partial<Pick<Section, "name" | "startTime" | "endTime">>) =>
    mutate<Section>(`/api/sections/${id}`, json("PATCH", data)),
  remove: (id: string) => mutate<{ ok: boolean }>(`/api/sections/${id}`, { method: "DELETE" }),
};

export const sessionsApi = {
  list: () => request<PracticeSession[]>("/api/sessions"),
  /** Fire-and-forget; survives page unload. */
  record: (data: { songId: string; seconds: number; loops: number }) => {
    if (data.seconds < 3) return;
    const body = JSON.stringify(data);
    try {
      if (navigator.sendBeacon?.("/api/sessions", new Blob([body], { type: "text/plain" }))) {
        window.setTimeout(notifyChanged, 400);
        return;
      }
    } catch {
      /* fall through */
    }
    fetch("/api/sessions", { method: "POST", body, keepalive: true }).then(notifyChanged, () => {});
  },
};

export const sharedApi = {
  list: () => request<SharedMaterial[]>("/api/shared"),
  create: (data: { songId: string; title: string; instructor: string; notes: string }) =>
    mutate<SharedMaterial>("/api/shared", json("POST", data)),
  remove: (id: string) => mutate<{ ok: boolean }>(`/api/shared/${id}`, { method: "DELETE" }),
};

/** Reads duration + kind from a local file before uploading. */
export function probeFile(file: File): Promise<{ duration: number; kind: "audio" | "video" }> {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith("video/") || /\.(mp4|m4v|mov|webm|mkv|ogv)$/i.test(file.name);
    const el = document.createElement(isVideo ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (duration: number) => {
      URL.revokeObjectURL(url);
      resolve({ duration: Number.isFinite(duration) ? duration : 0, kind: isVideo ? "video" : "audio" });
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done(0);
    window.setTimeout(() => done(0), 8000);
    el.src = url;
  });
}
