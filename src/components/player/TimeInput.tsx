"use client";

import { useEffect, useState } from "react";
import { cx, inputCls } from "@/components/ui";
import { formatTime, parseTime } from "@/lib/format";

/** Text input for timestamps like 2:15 or 2:15.5. Commits on blur / Enter. */
export function TimeInput({
  value,
  onCommit,
  max,
  label,
  className,
}: {
  value: number;
  onCommit: (v: number) => void;
  max?: number;
  label: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(formatTime(value, true));
  const [focused, setFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(formatTime(value, true));
  }, [value, focused]);

  function commit() {
    const parsed = parseTime(draft);
    if (parsed === null || (max !== undefined && parsed > max + 0.001)) {
      setInvalid(true);
      setDraft(formatTime(value, true));
      window.setTimeout(() => setInvalid(false), 1200);
      return;
    }
    setInvalid(false);
    onCommit(parsed);
    setDraft(formatTime(parsed, true));
  }

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={draft}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onBlur={() => {
        setFocused(false);
        commit();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(formatTime(value, true));
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cx(inputCls, "text-center font-mono text-base tabular-nums", invalid && "border-danger ring-2 ring-danger/25", className)}
    />
  );
}
