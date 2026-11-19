import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { requireUser } from "@/utils/supabase/auth";

export const instant = false;

async function AuthGuard({ children }: { children: ReactNode }) {
  // Supabase's token refresh uses Date.now(); defer the guard to request time
  // so it never runs inside the prerendered shell.
  await connection();
  await requireUser();
  return children;
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AuthGuard>{children}</AuthGuard>
    </Suspense>
  );
}
