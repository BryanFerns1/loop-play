"use client";

import { FileAudio, FileVideo, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Field, Modal, Spinner, inputCls } from "@/components/ui";
import { formatBytes, formatTime } from "@/lib/format";
import type { Song } from "@/lib/types";
import { probeFile, songsApi } from "@/services/api";

const ACCEPT = "audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.mp4,.m4v,.mov,.webm";

export function UploadDialog({
  open,
  onClose,
  onUploaded,
  origin = "library",
  title = "Upload a song",
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (song: Song) => void;
  origin?: "library" | "shared";
  title?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [info, setInfo] = useState<{ duration: number; kind: "audio" | "video" } | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setName("");
      setInfo(null);
      setProgress(0);
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const pick = useCallback(async (f: File | undefined | null) => {
    if (!f) return;
    setError(null);
    const looksMedia = f.type.startsWith("audio/") || f.type.startsWith("video/") || /\.(mp3|wav|m4a|aac|ogg|oga|flac|opus|mp4|m4v|mov|webm|mkv)$/i.test(f.name);
    if (!looksMedia) {
      setError("That doesn’t look like an audio or video file.");
      return;
    }
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));
    setInfo(null);
    setInfo(await probeFile(f));
  }, []);

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const song = await songsApi.upload(
        file,
        { title: name.trim() || file.name, duration: info?.duration ?? 0, origin },
        setProgress,
      );
      onUploaded(song);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!file || busy}>
            {busy ? <Spinner className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
            {busy ? `Uploading ${progress}%` : "Upload"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
              drag ? "border-accent bg-lav" : "border-line bg-surface-2/50 hover:border-accent/60"
            }`}
          >
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-lav text-lav-ink">
              <UploadCloud className="h-7 w-7" />
            </span>
            <span className="font-semibold">Tap to choose a file, or drop it here</span>
            <span className="mt-1 text-sm text-muted">MP3, WAV, M4A, OGG, FLAC · MP4, MOV, WebM</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lav text-lav-ink">
              {info?.kind === "video" ? <FileVideo className="h-6 w-6" /> : <FileAudio className="h-6 w-6" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted">
                {formatBytes(file.size)}
                {info ? ` · ${info.duration ? formatTime(info.duration) : "duration unknown"}` : " · reading…"}
              </p>
            </div>
            {!busy && (
              <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                Change
              </Button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {file && (
          <Field label="Song title">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={160} disabled={busy} />
          </Field>
        )}
        {busy && (
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
