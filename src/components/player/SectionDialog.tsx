"use client";

import { useEffect, useState } from "react";
import { TimeInput } from "@/components/player/TimeInput";
import { Button, Field, Modal, Spinner, cx, inputCls } from "@/components/ui";

export const PRESET_NAMES = ["Intro", "Verse 1", "Chorus", "Verse 2", "Difficult Part", "Ending"];

export type SectionDraft = { name: string; start: number; end: number };

export function SectionDialog({
  open,
  title,
  initial,
  duration,
  confirmLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial: SectionDraft;
  duration: number;
  confirmLabel: string;
  onClose: () => void;
  onSubmit: (d: SectionDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setError(null);
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit() {
    if (!draft.name.trim()) return setError("Give this section a name.");
    if (draft.end - draft.start < 0.2) return setError("End must be after start.");
    if (duration > 0 && draft.end > duration + 0.01) return setError("End is beyond the song length.");
    setBusy(true);
    try {
      await onSubmit({ ...draft, name: draft.name.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Section name">
          <input
            className={inputCls}
            value={draft.name}
            maxLength={80}
            placeholder="e.g. Chorus"
            autoFocus
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_NAMES.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setDraft({ ...draft, name: n })}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                draft.name === n ? "border-accent bg-lav text-lav-ink" : "border-line text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Start</span>
            <TimeInput label="Start time" value={draft.start} max={duration || undefined} onCommit={(v) => setDraft((d) => ({ ...d, start: v }))} />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">End</span>
            <TimeInput label="End time" value={draft.end} max={duration || undefined} onCommit={(v) => setDraft((d) => ({ ...d, end: v }))} />
          </div>
        </div>
        <p className="text-xs text-muted">Format m:ss or m:ss.t — for example 2:15 or 2:15.5</p>
        {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
