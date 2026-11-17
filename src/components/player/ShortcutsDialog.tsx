"use client";

import { Button, Modal } from "@/components/ui";

const SHORTCUTS: [string, string][] = [
  ["Space / K", "Play or pause"],
  ["L", "Turn loop on / off"],
  ["[  and  ]", "Set loop start / end at the playhead"],
  ["← / →", "Back / forward 5 s (hold Shift for 1 s)"],
  ["Home", "Jump to loop start"],
  ["↑ / ↓", "Volume up / down"],
  ["M", "Mute"],
  [",  and  .", "Slower / faster"],
  ["Z", "Zoom to the loop"],
  ["S", "Save the selection as a section"],
  ["?", "Show this help"],
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      footer={
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <ul className="divide-y divide-line pb-2">
        {SHORTCUTS.map(([k, d]) => (
          <li key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span className="text-muted">{d}</span>
            <kbd className="shrink-0 rounded-lg border border-line bg-surface-2 px-2 py-1 font-mono text-xs font-semibold">{k}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
