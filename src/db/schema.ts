import type { MediaKind } from "@/lib/types";

/**
 * MongoDB documents. Each document carries its own string `id` (a UUID) so the
 * REST layer keeps the same shape the UI already expects; MongoDB still adds an
 * internal `_id` which is stripped by `pub()` before responses are sent.
 */

export type SongDoc = {
  id: string;
  title: string;
  kind: MediaKind;
  origin: "library" | "shared";
  mimeType: string;
  fileName: string;
  storageKey: string;
  size: number;
  duration: number;
  playCount: number;
  lastPlayedAt: Date | null;
  createdAt: Date;
};

export type SectionDoc = {
  id: string;
  songId: string;
  name: string;
  startTime: number;
  endTime: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PracticeSessionDoc = {
  id: string;
  songId: string;
  seconds: number;
  loops: number;
  createdAt: Date;
};

export type SharedMaterialDoc = {
  id: string;
  songId: string;
  title: string;
  instructor: string;
  notes: string;
  createdAt: Date;
};

/** Strips the Mongo `_id` field so documents serialize to the UI's shape. */
export function pub<T extends object>(doc: T): T {
  if (!doc || typeof doc !== "object" || !("_id" in doc)) return doc;
  const { _id, ...rest } = doc as T & { _id?: unknown };
  void _id;
  return rest as T;
}

export function pubMany<T extends object>(docs: T[]): T[] {
  return docs.map(pub);
}