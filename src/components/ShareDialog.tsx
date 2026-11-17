"use client";

import { FileAudio, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Field, Modal, Spinner, cx, inputCls } from "@/components/ui";
import { useQuery } from "@/hooks/useQuery";
import { formatBytes } from "@/lib/format";
import { probeFile, sharedApi, songsApi } from "@/services/api";

export function ShareDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { name, toast } = useApp();
  const songs = useQuery(() => songsApi.list({ origin: "library" }));
  const [mode, setMode] = useState<"upload" | "library">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [songId, setSongId] = useState("");
  const [title, setTitle] = useState("");
  const [instructor, setInstructor] = useState(name);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setSongId("");
      setTitle("");
      setNotes("");
      setInstructor(name);
      setError(null);
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit() {
    setError(null);
    if (mode === "upload" && !file) return setError("Choose an audio or video file to share.");
    if (mode === "library" && !songId) return setError("Choose a song from your library.");
    if (!title.trim()) return setError("Add a title for this material.");
    if (!instructor.trim()) return setError("Add the instructor’s name.");
    setBusy(true);
    try {
      let id = songId;
      if (mode === "upload" && file) {
        const info = await probeFile(file);
        const s = await songsApi.upload(file, { title: title.trim(), duration: info.duration, origin: "shared" });
        id = s.id;
      }
      await sharedApi.create({ songId: id, title: title.trim(), instructor: instructor.trim(), notes });
      toast("Shared with your choir");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not share");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Share practice material"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Share
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
          {(["upload", "library"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx(
                "h-9 rounded-lg text-sm font-semibold transition",
                mode === m ? "bg-surface text-accent shadow-sm" : "text-muted",
              )}
            >
              {m === "upload" ? "Upload new file" : "From my songs"}
            </button>
          ))}
        </div>

        {mode === "upload" ? (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-line p-4 text-left transition hover:border-accent/60"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lav text-lav-ink">
                {file ? <FileAudio className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{file ? file.name : "Choose audio or video"}</span>
                <span className="block text-xs text-muted">{file ? formatBytes(file.size) : "MP3, WAV, MP4…"}</span>
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.mov,.webm,.ogg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
                }
                e.target.value = "";
              }}
            />
          </>
        ) : (
          <Field label="Song">
            <select
              className={inputCls}
              value={songId}
              onChange={(e) => {
                setSongId(e.target.value);
                const s = songs.data?.find((x) => x.id === e.target.value);
                if (s && !title) setTitle(s.title);
              }}
            >
              <option value="">{songs.loading ? "Loading…" : "Select a song"}</option>
              {songs.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Title">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
        </Field>
        <Field label="Instructor name">
          <input className={inputCls} value={instructor} onChange={(e) => setInstructor(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Instructions / notes">
          <textarea
            className={cx(inputCls, "h-28 resize-none py-3")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            placeholder="What should members focus on?"
          />
        </Field>
        {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
