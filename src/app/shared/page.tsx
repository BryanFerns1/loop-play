"use client";

import { CalendarDays, GraduationCap, Play, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { SampleButton } from "@/components/SampleButton";
import { ShareDialog } from "@/components/ShareDialog";
import { KindBadge, KindTile } from "@/components/SongCard";
import { Button, ConfirmDialog, EmptyState, ErrorState, IconButton, PageHeader, Skeleton } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { formatDate, formatTime } from "@/lib/format";
import type { SharedMaterial } from "@/lib/types";
import { sharedApi } from "@/services/api";

export default function SharedPage() {
  const { role, toast, setRole } = useApp();
  const shared = useQuery(() => sharedApi.list());
  const [shareOpen, setShareOpen] = useState(false);
  const [removing, setRemoving] = useState<SharedMaterial | null>(null);
  const [busy, setBusy] = useState(false);
  const isInstructor = role === "instructor";

  return (
    <div>
      <PageHeader
        title="Shared Practice"
        subtitle="Material your choir instructor has shared with you."
        actions={
          isInstructor ? (
            <Button variant="primary" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> Share material
            </Button>
          ) : (
            <Button onClick={() => setRole("instructor")}>
              <GraduationCap className="h-4 w-4" /> I’m an instructor
            </Button>
          )
        }
      />

      {shared.loading && !shared.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : shared.error && !shared.data ? (
        <ErrorState message={shared.error} onRetry={shared.reload} />
      ) : shared.data && shared.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {shared.data.map((m) => (
            <article key={m.id} className="animate-fade-up flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
              <div className="flex items-start gap-3">
                <KindTile kind={m.kind} className="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold">{m.title}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
                    <GraduationCap className="h-4 w-4 shrink-0" /> {m.instructor}
                  </p>
                </div>
                {isInstructor && (
                  <IconButton label={`Remove ${m.title}`} className="hover:text-danger" onClick={() => setRemoving(m)}>
                    <Trash2 className="h-5 w-5" />
                  </IconButton>
                )}
              </div>
              {m.notes ? (
                <p className="mt-3 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">{m.notes}</p>
              ) : (
                <p className="mt-3 text-sm text-muted">No notes from the instructor.</p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <KindBadge kind={m.kind} />
                  <span className="tabular-nums">{m.duration ? formatTime(m.duration) : "--:--"}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDate(m.createdAt)}
                  </span>
                </div>
                <Link href={`/player/${m.songId}`}>
                  <Button variant="primary">
                    <Play className="h-4 w-4" fill="currentColor" /> Start practising
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<GraduationCap className="h-7 w-7" />}
          title="Nothing shared yet"
          description={
            isInstructor
              ? "Share a recording with your choir along with notes on what to focus on."
              : "When your instructor shares a song, it will appear here. Switch to instructor mode to share material yourself."
          }
          action={
            <>
              {isInstructor && (
                <Button variant="primary" onClick={() => setShareOpen(true)}>
                  <Share2 className="h-4 w-4" /> Share material
                </Button>
              )}
              <SampleButton share label="Add a sample share" />
            </>
          }
        />
      )}

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} />
      <ConfirmDialog
        open={!!removing}
        title="Stop sharing?"
        message={`“${removing?.title ?? ""}” will no longer be visible to members.`}
        confirmLabel="Remove"
        busy={busy}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (!removing) return;
          setBusy(true);
          try {
            await sharedApi.remove(removing.id);
            toast("Removed from shared");
          } catch (e) {
            toast(e instanceof Error ? e.message : "Could not remove", "error");
          }
          setBusy(false);
          setRemoving(null);
        }}
      />
    </div>
  );
}
