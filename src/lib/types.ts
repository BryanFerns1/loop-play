export type MediaKind = "audio" | "video";

export type Song = {
  id: string;
  title: string;
  kind: MediaKind;
  origin: "library" | "shared";
  mimeType: string;
  fileName: string;
  size: number;
  duration: number;
  playCount: number;
  lastPlayedAt: string | null;
  createdAt: string;
  sectionCount?: number;
};

export type Section = {
  id: string;
  songId: string;
  name: string;
  startTime: number;
  endTime: number;
  createdAt: string;
  songTitle?: string;
  songKind?: MediaKind;
};

export type PracticeSession = {
  id: string;
  songId: string;
  seconds: number;
  loops: number;
  createdAt: string;
  songTitle: string;
  songKind: MediaKind;
};

export type SharedMaterial = {
  id: string;
  songId: string;
  title: string;
  instructor: string;
  notes: string;
  createdAt: string;
  kind: MediaKind;
  duration: number;
};
