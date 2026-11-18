"use client";

import { useCallback, useState } from "react";

import { teacher } from "../_data/teacher";
import { NewPostModal } from "./NewPostModal";

type NewPostButtonProps = {
  variant: "sidebar" | "compose";
};

export function NewPostButton({ variant }: NewPostButtonProps) {
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      {variant === "sidebar" ? (
        <button
          className="mb-[18px] flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-linear-[180deg,#F4977E,#EE8164] p-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
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
          Nueva publicación
        </button>
      ) : (
        <button
          className="mb-6 flex cursor-pointer items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-[14px] text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
          onClick={() => setOpen(true)}
          type="button"
        >
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-avatar-teacher font-display text-[16px] font-semibold text-white">
            {teacher.initial}
          </div>
          <span className="flex-1 text-[15px] text-muted-soft">
            Compartí un momento…
          </span>
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-brand-soft text-coral">
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
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </button>
      )}
      <NewPostModal onClose={handleClose} open={open} />
    </>
  );
}
