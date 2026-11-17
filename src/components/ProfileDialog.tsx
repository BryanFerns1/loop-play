"use client";

import { GraduationCap, Moon, Music2, Sun } from "lucide-react";
import { useApp } from "@/components/AppProvider";
import { Button, Field, Modal, cx, inputCls } from "@/components/ui";

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { name, setName, role, setRole, theme, toggleTheme } = useApp();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your profile"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-5 pb-2">
        <Field label="Display name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </Field>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">I am a…</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: "member", label: "Choir member", icon: Music2, desc: "Practise & learn" },
                { id: "instructor", label: "Instructor", icon: GraduationCap, desc: "Share material" },
              ] as const
            ).map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setRole(id)}
                className={cx(
                  "rounded-2xl border p-3 text-left transition",
                  role === id ? "border-accent bg-lav" : "border-line hover:bg-surface-2",
                )}
              >
                <Icon className={cx("mb-2 h-5 w-5", role === id ? "text-lav-ink" : "text-muted")} />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted">{desc}</p>
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        </Button>
        <p className="text-xs text-muted">Profile settings are saved on this device.</p>
      </div>
    </Modal>
  );
}
