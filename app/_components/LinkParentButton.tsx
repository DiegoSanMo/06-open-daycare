"use client";

import { useState } from "react";

import { LinkParentModal } from "./LinkParentModal";

type LinkParentButtonProps = {
  kidName: string;
  childId?: string;
  disabled?: boolean;
};

export function LinkParentButton({
  kidName,
  childId,
  disabled = false,
}: LinkParentButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-disabled={disabled || undefined}
        className={`flex items-center gap-3 pt-2 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
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
      {open ? (
        <LinkParentModal
          childId={childId}
          kidName={kidName}
          onClose={() => setOpen(false)}
          open={open}
        />
      ) : null}
    </>
  );
}
