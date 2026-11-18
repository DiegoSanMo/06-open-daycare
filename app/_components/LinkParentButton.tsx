"use client";

import { useState } from "react";

import { LinkParentModal } from "./LinkParentModal";

type LinkParentButtonProps = {
  kidName: string;
};

export function LinkParentButton({ kidName }: LinkParentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex cursor-pointer items-center gap-3 pt-2 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
          <svg
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="text-[14.5px] font-extrabold text-brand-strong">
          Vincular otro padre
        </span>
      </button>
      <LinkParentModal
        kidName={kidName}
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  );
}
