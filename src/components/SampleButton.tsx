"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Spinner } from "@/components/ui";
import { songsApi } from "@/services/api";

/** One-tap demo content so people can try the player without a file. */
export function SampleButton({ share = false, label = "Try a sample song", openAfter = false }: { share?: boolean; label?: string; openAfter?: boolean }) {
  const [busy, setBusy] = useState(false);
  const { toast } = useApp();
  const router = useRouter();
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const song = await songsApi.addSample(share);
          toast(`Added “${song.title}”`, "success", { label: "Practice now", href: `/player/${song.id}` });
          if (openAfter) router.push(`/player/${song.id}`);
        } catch (e) {
          toast(e instanceof Error ? e.message : "Could not add sample", "error");
        }
        setBusy(false);
      }}
    >
      {busy ? <Spinner className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </Button>
  );
}
