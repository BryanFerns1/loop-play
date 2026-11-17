"use client";

import { Repeat } from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/format";
import type { Section } from "@/lib/types";

export function loopHref(s: Section) {
  return `/player/${s.songId}?start=${s.startTime}&end=${s.endTime}`;
}

export function LoopCard({ section }: { section: Section }) {
  return (
    <Link
      href={loopHref(section)}
      className="animate-fade-up group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-teal/60"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal/15 text-teal transition group-hover:bg-teal group-hover:text-white">
        <Repeat className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{section.name}</p>
        <p className="truncate text-xs text-muted">{section.songTitle}</p>
        <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
          {formatTime(section.startTime, true)} – {formatTime(section.endTime, true)}
          <span className="font-sans"> · {formatDate(section.createdAt)}</span>
        </p>
      </div>
    </Link>
  );
}
