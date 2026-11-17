"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { UploadDialog } from "@/components/UploadDialog";

type Role = "member" | "instructor";
type Toast = { id: number; message: string; kind: "success" | "error"; action?: { label: string; href: string } };

type Ctx = {
  name: string;
  role: Role;
  setName: (n: string) => void;
  setRole: (r: Role) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  toast: (message: string, kind?: Toast["kind"], action?: Toast["action"]) => void;
  openUpload: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [name, setName] = useLocalStorage("cl-name", "Choir Member");
  const [role, setRoleRaw] = useLocalStorage("cl-role", "member");
  const [themeRaw, setTheme] = useLocalStorage("cl-theme", "light");
  const theme = themeRaw === "dark" ? "dark" : "light";
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toast = useCallback<Ctx["toast"]>((message, kind = "success", action) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3500);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      name,
      role: role === "instructor" ? "instructor" : "member",
      setName,
      setRole: (r) => setRoleRaw(r),
      theme,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
      toast,
      openUpload: () => setUploadOpen(true),
    }),
    [name, role, theme, setName, setRoleRaw, setTheme, toast],
  );

  return (
    <AppCtx.Provider value={value}>
      {children}
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(song) => {
          setUploadOpen(false);
          toast(`“${song.title}” uploaded`, "success", { label: "Practice now", href: `/player/${song.id}` });
          router.refresh();
        }}
      />
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-fade-up pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-sm font-medium text-on-navy shadow-xl"
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-teal" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
            )}
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action && (
              <button
                className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold hover:bg-white/25"
                onClick={() => {
                  setToasts((x) => x.filter((y) => y.id !== t.id));
                  router.push(t.action!.href);
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
