"use client";

import { Bookmark, BookmarkPlus, ChevronDown, Pencil, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { SectionDialog } from "@/components/player/SectionDialog";
import { Button, ConfirmDialog, IconButton, Skeleton, cx } from "@/components/ui";
import { formatDate, formatTime } from "@/lib/format";
import type { Section } from "@/lib/types";
import { sectionsApi } from "@/services/api";

export function SectionsPanel({
  sections,
  loading,
  activeLoop,
  duration,
  onPlay,
  onSave,
}: {
  sections: Section[] | null;
  loading: boolean;
  activeLoop: { start: number; end: number };
  duration: number;
  onPlay: (s: Section) => void;
  onSave: () => void;
}) {
  const { toast } = useApp();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5 lg:cursor-default"
      >
        <span className="flex items-center gap-2 text-base font-bold">
          <Bookmark className="h-5 w-5 text-accent" /> Saved sections
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{sections?.length ?? 0}</span>
        </span>
        <ChevronDown className={cx("h-5 w-5 text-muted transition lg:hidden", open && "rotate-180")} />
      </button>
      <div className={cx("px-4 pb-4 sm:px-5", !open && "hidden lg:block")}>
        {loading && !sections ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : sections && sections.length > 0 ? (
          <ul className="space-y-2">
            {sections.map((s) => {
              const active = Math.abs(s.startTime - activeLoop.start) < 0.05 && Math.abs(s.endTime - activeLoop.end) < 0.05;
              return (
                <li
                  key={s.id}
                  className={cx(
                    "animate-fade-up flex items-center gap-2 rounded-xl border p-2.5 transition",
                    active ? "border-teal bg-teal/10" : "border-line",
                  )}
                >
                  <button
                    onClick={() => onPlay(s)}
                    aria-label={`Play ${s.name}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-on-navy transition active:scale-95"
                  >
                    <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="truncate font-mono text-xs tabular-nums text-muted">
                      {formatTime(s.startTime, true)} – {formatTime(s.endTime, true)} · {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <IconButton label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Delete ${s.name}`} onClick={() => setDeleting(s)} className="hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center">
            <p className="text-sm font-semibold">No saved sections yet</p>
            <p className="mt-1 text-xs text-muted">Select a part of the waveform, then save it as “Chorus”, “Difficult part” and more.</p>
          </div>
        )}
        <Button className="mt-3 w-full" onClick={onSave}>
          <BookmarkPlus className="h-4 w-4" /> Save current selection
        </Button>
      </div>

      {editing && (
        <SectionDialog
          open
          title="Edit section"
          confirmLabel="Save changes"
          duration={duration}
          initial={{ name: editing.name, start: editing.startTime, end: editing.endTime }}
          onClose={() => setEditing(null)}
          onSubmit={async (d) => {
            await sectionsApi.update(editing.id, { name: d.name, startTime: d.start, endTime: d.end });
            toast("Section updated");
            setEditing(null);
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Delete section?"
        message={`“${deleting?.name ?? ""}” will be removed from your saved sections.`}
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          try {
            await sectionsApi.remove(deleting.id);
            toast("Section deleted");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not delete", "error");
          }
          setBusy(false);
          setDeleting(null);
        }}
      />
    </section>
  );
}
