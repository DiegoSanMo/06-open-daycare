import Link from "next/link";
import type { ReactNode } from "react";
import { teacher } from "../_data/teacher";
import { NewPostButton } from "./NewPostButton";

type ActiveNav = "feed" | "kids" | "avisos" | "account" | null;

type AppShellProps = {
  active: ActiveNav;
  contentMaxWidth: number;
  children: ReactNode;
};

function NavItem({
  active,
  href,
  icon,
  label,
}: {
  active: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
}) {
  const className = active
    ? "flex items-center gap-3 rounded-xl bg-brand-soft px-3 py-[11px] text-[14.5px] font-extrabold text-brand"
    : "flex items-center gap-3 rounded-xl bg-transparent px-3 py-[11px] text-[14.5px] font-semibold text-nav";

  if (href) {
    return (
      <Link href={href} className={className}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <a aria-disabled="true" className={className}>
      {icon}
      {label}
    </a>
  );
}

export function AppShell({ active, contentMaxWidth, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-app">
      <aside className="sticky top-0 flex h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6">
        <a
          aria-disabled="true"
          className="flex items-center gap-[11px] px-2 pb-[22px] pt-1"
        >
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-linear-[155deg,#F8C3A8,#F2937A]">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </div>
          <div>
            <div className="font-display text-[17px] font-semibold leading-none text-ink">
              OpenDayCare
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-soft">
              {teacher.room}
            </div>
          </div>
        </a>

        <NewPostButton variant="sidebar" />

        <nav className="flex flex-1 flex-col gap-1">
          <NavItem
            active={active === "feed"}
            href="/"
            label="Feed"
            icon={
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
              </svg>
            }
          />
          <NavItem
            active={active === "kids"}
            href="/kids"
            label="Niños"
            icon={
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="7" r="3" />
                <circle cx="17" cy="9" r="2.4" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
              </svg>
            }
          />
          <NavItem
            active={active === "avisos"}
            label="Avisos"
            icon={
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            }
          />
          <NavItem
            active={active === "account"}
            label="Mi cuenta"
            icon={
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </nav>

        <div className="mt-2.5 border-t border-line pt-3.5">
          <div className="flex items-center gap-[11px] px-2 py-1.5">
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-avatar-teacher font-display text-[16px] font-semibold text-white">
              {teacher.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-ink">
                {teacher.name}
              </div>
              <div className="text-[12px] text-muted-soft">{teacher.role}</div>
            </div>
            <a
              aria-disabled="true"
              title="Cerrar sesión"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-app text-muted"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </a>
          </div>
        </div>
      </aside>

      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div
          className="mx-auto w-full px-10 pb-20 pt-[34px]"
          style={{ maxWidth: contentMaxWidth }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
