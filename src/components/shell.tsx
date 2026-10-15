"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClockCounterClockwise,
  Plus,
  Trophy,
  UsersThree,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { useI18n } from "@/i18n/provider";
import { LANGS } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import { useOnForeground } from "@/lib/use-foreground";

function Logo() {
  const { d } = useI18n();
  // Text wordmark until an official HEAR SVG logo is supplied.
  return (
    <Link href="/" className="flex items-baseline gap-2.5 py-2">
      <span className="text-[1.35rem] font-black leading-none tracking-[-0.04em]">HEAR</span>
      <span className="h-4 w-px self-center bg-line" aria-hidden />
      <span className="text-[0.95rem] font-medium leading-none tracking-tight text-muted">
        {d.app.name}
      </span>
    </Link>
  );
}

function LangToggle() {
  const { lang, setLang, d } = useI18n();
  return (
    <div role="group" aria-label={d.lang.label} className="flex rounded-full bg-surface-2 p-0.5">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`min-h-11 min-w-11 rounded-full px-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
            lang === l ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {l}
          <span className="sr-only"> {d.lang[l]}</span>
        </button>
      ))}
    </div>
  );
}

function useIsActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

function OfflineBanner() {
  const { d } = useI18n();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <p className="bg-surface-2 px-4 py-2 text-center text-sm text-muted" role="status">
      {d.common.offline}
    </p>
  );
}

/** Refetch server data when the app returns to the foreground (at most every 5 s). */
function useRefetchOnForeground() {
  const router = useRouter();
  const last = useRef(0);
  useOnForeground(() => {
    const now = Date.now();
    if (now - last.current < 5000) return;
    last.current = now;
    router.refresh();
  });
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { d } = useI18n();
  useRefetchOnForeground();
  const isActive = useIsActive();
  const links = [
    { href: "/", label: d.nav.home, Icon: Trophy },
    { href: "/historik", label: d.nav.history, Icon: ClockCounterClockwise },
    { href: "/h2h", label: d.nav.h2h, Icon: ArrowsLeftRight },
    { href: "/spelare", label: d.nav.players, Icon: UsersThree },
  ];
  const addActive = isActive("/ny");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-box focus:bg-ink focus:px-4 focus:py-3 focus:text-bg"
      >
        {d.nav.skip}
      </a>
      <header className="pt-safe sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-4 px-4">
          <Logo />
          <LangToggle />
        </div>
      </header>
      <OfflineBanner />

      <main id="main" className="mx-auto w-full max-w-lg px-4 pb-32 pt-6">
        {children}
      </main>

      <nav
        aria-label={d.nav.label}
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-md"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center">
          {links.slice(0, 2).map(({ href, label, Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
          ))}
          <li className="flex justify-center">
            <Link
              href="/ny"
              aria-label={d.nav.add}
              aria-current={addActive ? "page" : undefined}
              className="-mt-6 grid size-16 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_6px_20px_rgb(255_144_45/0.35)] ring-4 ring-bg transition-transform active:scale-95"
            >
              <Plus size={28} weight="bold" aria-hidden />
            </Link>
          </li>
          {links.slice(2).map(({ href, label, Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} active={isActive(href)} />
          ))}
        </ul>
      </nav>
    </>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof Trophy;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium ${
          active ? "text-ink" : "text-muted"
        }`}
      >
        <Icon size={22} weight={active ? "fill" : "regular"} aria-hidden />
        <span className="max-w-full truncate px-1">{label}</span>
      </Link>
    </li>
  );
}
