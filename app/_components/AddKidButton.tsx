"use client";

import { useState } from "react";

import type { RoomOptionItem } from "@/app/_data/children";

import { AddKidModal } from "./AddKidModal";

export function AddKidButton({ rooms }: { rooms: RoomOptionItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-linear-[180deg,#F4977E,#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar niño
      </button>
      <AddKidModal onClose={() => setOpen(false)} open={open} rooms={rooms} />
    </>
  );
}
