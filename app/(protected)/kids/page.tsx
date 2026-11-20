import { Suspense } from "react";
import { AddKidButton } from "../../_components/AddKidButton";
import { AppShell } from "../../_components/AppShell";
import { getKidsWithRooms } from "../../_data/children";

export const instant = false;

async function KidsList() {
  const { rooms, error } = await getKidsWithRooms();

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-[14px] border border-line bg-surface px-4 py-3 text-[14px] text-brand"
      >
        {error}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-[10px]">
      {rooms.flatMap((room) =>
        room.children.map((child) => (
          <li
            key={child.id}
            className="rounded-[14px] border border-line bg-surface px-4 py-3 text-[14px] text-ink-body"
          >
            {child.name} · {child.ageLabel} · {child.roomName}
          </li>
        )),
      )}
    </ul>
  );
}

function KidsListSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="mb-[14px] flex items-center gap-3">
        <div className="h-[13px] w-24 rounded bg-line-strong" />
        <div className="h-[13px] w-16 rounded bg-line-strong" />
        <span className="h-px flex-1 bg-line-strong" />
      </div>
      <div className="grid grid-cols-2 gap-[14px]">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex h-[80px] items-center gap-[14px] rounded-[18px] border border-line bg-surface p-4"
          >
            <div className="h-12 w-12 flex-none rounded-full bg-line" />
            <div className="flex-1 space-y-2">
              <div className="h-[14px] w-2/3 rounded bg-line" />
              <div className="h-[11px] w-1/2 rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KidsPage() {
  return (
    <AppShell active="kids" contentMaxWidth={880}>
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold tracking-[0.8px] text-brand">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold text-ink">
            Niños
          </h1>
        </div>
        <AddKidButton />
      </div>

      <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          placeholder="Buscar niño…"
          readOnly
          aria-disabled="true"
          className="flex-1 border-none bg-transparent text-[15px] text-ink placeholder:text-[#B6A99B] focus:outline-none"
        />
      </div>

      <Suspense fallback={<KidsListSkeleton />}>
        <KidsList />
      </Suspense>
    </AppShell>
  );
}
