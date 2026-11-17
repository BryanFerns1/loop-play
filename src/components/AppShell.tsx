"use client";

import { Clock, Home, Library, Moon, Plus, Share2, Sun, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useApp } from "@/components/AppProvider";
import { ProfileDialog } from "@/components/ProfileDialog";
import { Button, IconButton, cx } from "@/components/ui";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-navy text-on-navy"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 9v6" className="text-white" />
      </svg>
    </span>
  );
}

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "My Songs", icon: Library },
  { href: "/history", label: "History", icon: Clock },
  { href: "/shared", label: "Shared", icon: Share2 },
];

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { name, role, theme, toggleTheme, openUpload } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("") || "C";

  const avatar = (
    <button
      onClick={() => setProfileOpen(true)}
      aria-label="Open profile"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lav text-sm font-bold text-lav-ink transition hover:brightness-95"
    >
      {initials}
    </button>
  );

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <Logo />
          <span className="text-xl font-extrabold tracking-tight">ChoirLoop</span>
        </Link>
        <Button variant="primary" size="lg" className="mb-6 w-full" onClick={openUpload}>
          <Plus className="h-5 w-5" /> Upload song
        </Button>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(path, href) ? "bg-lav text-lav-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
          {avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs capitalize text-muted">{role}</p>
          </div>
          <IconButton label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </IconButton>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo size={34} />
          <span className="text-lg font-extrabold tracking-tight">ChoirLoop</span>
        </Link>
        <div className="flex items-center gap-1">
          <IconButton label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </IconButton>
          {avatar}
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
          <footer className="mt-10 border-t border-line pt-5 text-center text-xs text-muted">
            designed by bryan_ferns1
          </footer>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden" aria-label="Primary">
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          {NAV.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(path, href)} />
          ))}
          <li className="flex justify-center">
            <button
              onClick={openUpload}
              aria-label="Upload song"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg ring-4 ring-bg transition active:scale-95"
            >
              <Plus className="h-7 w-7" />
            </button>
          </li>
          {NAV.slice(2).map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(path, href)} />
          ))}
        </ul>
      </nav>

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: LucideIcon; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition",
          active ? "text-accent" : "text-muted",
        )}
      >
        <Icon className={cx("h-6 w-6 transition", active && "scale-110")} />
        {label}
      </Link>
    </li>
  );
}
