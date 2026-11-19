import { Suspense, type ReactNode } from "react";

import { requireUser } from "@/utils/supabase/auth";

export const instant = false;

async function AuthGuard({ children }: { children: ReactNode }) {
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
