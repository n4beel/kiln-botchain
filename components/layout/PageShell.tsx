"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "@/components/ui/ConnectButton";
import NetworkBadge from "@/components/botchain/NetworkBadge";
import BuiltOnBotChain from "@/components/botchain/BuiltOnBotChain";
import { app } from "@/lib/app-config";

export type NavItem = { href: string; label: string };

interface PageShellProps {
  children: React.ReactNode;
  nav?: NavItem[];
  title?: string;
  description?: string;
}

/**
 * Gallery shell: true black, hairline rules, oversized thin display type.
 *
 * The work is the page. Chrome is reduced to two hairlines and a wordmark, the title is set very
 * large and very light so it reads as a wall label rather than a heading, and nothing on the
 * surface carries colour — every piece Kiln mints supplies its own, and competing with it would
 * be the one real design mistake available here.
 */
export default function PageShell({ children, nav = [], title, description }: PageShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col" style={{ minHeight: "100dvh" }}>
      <header
        className="flex-shrink-0 flex items-center justify-between gap-4 px-5 md:px-10 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Link href="/" className="flex items-baseline gap-3 no-underline">
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            style={{ width: "18px", height: "18px", alignSelf: "center", flexShrink: 0 }}
          >
            <path d="M50 10 L86 50 L50 90 L14 50 Z" fill="none" stroke="var(--accent)" strokeWidth="6" />
            <path d="M50 28 L72 50 L50 72 L28 50 Z" fill="var(--accent)" opacity="0.65" />
            <circle cx="50" cy="50" r="8" fill="var(--bg-base)" />
          </svg>
          <span className="text-[16px] font-medium tracking-[0.3em] uppercase">{app.name}</span>
        </Link>

        <div className="flex items-center gap-4">
          {nav.length > 1 && (
            <nav className="hidden sm:flex items-center gap-5">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                    className="nav-link text-[12px] uppercase tracking-[0.18em] no-underline"
                    style={{ color: active ? "#FFF" : "var(--text-tertiary)" }}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
          <NetworkBadge />
          <div style={{ width: "150px" }}><ConnectButton /></div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-5 md:px-10 py-12" style={{ maxWidth: "1100px" }}>
        {title && (
          <h1 className="text-[56px] md:text-[88px]" style={{ color: "#FFF" }}>
            {title}
          </h1>
        )}
        {description && (
          <p className="mt-5 text-[15px]" style={{ color: "var(--text-secondary)", maxWidth: "46ch" }}>
            {description}
          </p>
        )}
        <div className={title || description ? "mt-14" : ""}>{children}</div>
      </main>

      <footer
        className="flex-shrink-0 w-full mx-auto px-5 md:px-10 py-6 flex flex-wrap items-center gap-x-6 gap-y-2"
        style={{ maxWidth: "1100px", borderTop: "1px solid var(--border-subtle)" }}
      >
        <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>
          Rendered entirely on chain
        </span>
        <div className="flex-1" />
        <BuiltOnBotChain className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-secondary)" }} />
        <a href="https://botchain.ai" target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>botchain.ai</a>
        <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer" className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>Explorer</a>
      </footer>
    </div>
  );
}
