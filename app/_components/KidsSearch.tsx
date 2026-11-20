"use client";

import { useMemo, useState } from "react";
import type { RoomSection } from "../_data/children";
import { KidCard } from "./KidCard";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function KidsSearch({ rooms }: { rooms: RoomSection[] }) {
  const [term, setTerm] = useState("");
  const normalizedTerm = normalize(term.trim());

  const visibleRooms = useMemo(() => {
    if (!normalizedTerm) return rooms;

    return rooms
      .map((room) => ({
        ...room,
        children: room.children.filter((child) =>
          normalize(`${child.name} ${child.allergyBadges.join(" ")}`).includes(
            normalizedTerm,
          ),
        ),
      }))
      .filter((room) => room.children.length > 0);
  }, [rooms, normalizedTerm]);

  const hasResults = visibleRooms.some((room) => room.children.length > 0);

  return (
    <>
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
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar niño…"
          aria-label="Buscar niño"
          className="flex-1 border-none bg-transparent text-[15px] text-ink placeholder:text-[#B6A99B] focus:outline-none"
        />
      </div>

      {hasResults ? (
        <div className="flex flex-col gap-[22px]">
          {visibleRooms.map((room) => (
            <section key={room.id}>
              <div className="mb-[14px] flex items-center gap-3">
                <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
                  {room.name.toUpperCase()}
                </span>
                <span className="text-[13px] text-muted-soft">
                  {room.children.length} niños
                </span>
                <span className="h-px flex-1 bg-line-strong" />
              </div>
              {room.children.length > 0 && (
                <div className="grid grid-cols-2 gap-[14px]">
                  {room.children.map((child) => (
                    <KidCard key={child.id} child={child} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-[14px] border border-line bg-surface px-4 py-8 text-center text-[15px] text-muted-soft">
          No se encontraron niños
        </p>
      )}
    </>
  );
}
