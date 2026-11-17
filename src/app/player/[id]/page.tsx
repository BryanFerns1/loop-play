"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { PlayerView } from "@/components/player/PlayerView";
import { Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { songsApi } from "@/services/api";

function PlayerLoader() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const song = useQuery(() => songsApi.get(id), [id]);

  const initialLoop = useMemo(() => {
    const s = Number(search.get("start"));
    const e = Number(search.get("end"));
    if (search.get("start") !== null && Number.isFinite(s) && Number.isFinite(e) && e > s) {
      return { start: s, end: e, enabled: true };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (song.loading && !song.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40" />
        <Skeleton className="h-52" />
      </div>
    );
  }
  if (song.error?.includes("Not found")) {
    return (
      <EmptyState
        icon={<FileQuestion className="h-7 w-7" />}
        title="Song not found"
        description="It may have been deleted. Head back to your library to pick another one."
        action={
          <Link href="/library">
            <Button variant="primary">Go to My Songs</Button>
          </Link>
        }
      />
    );
  }
  if (song.error && !song.data) return <ErrorState message={song.error} onRetry={song.reload} />;
  if (!song.data) return null;
  return <PlayerView key={song.data.id} song={song.data} initialLoop={initialLoop} />;
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <PlayerLoader />
    </Suspense>
  );
}
