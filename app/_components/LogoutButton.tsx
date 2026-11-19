"use client";

import { useState } from "react";

import { createClient } from "@/utils/supabase/client";

export function LogoutButton() {
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    if (submitting) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSubmitting(false);
        return;
      }
    } catch {
      setSubmitting(false);
      return;
    }

    // Full navigation re-runs the proxy after the session cookies are cleared.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
      className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[10px] bg-app text-muted disabled:opacity-70"
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
    </button>
  );
}
