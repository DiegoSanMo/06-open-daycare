import { connection } from "next/server";

import { getCurrentUserProfile } from "@/utils/supabase/user";
import { teacher } from "../_data/teacher";

const ROLE_LABELS: Record<string, string> = {
  parent: "Familiar",
  staff: teacher.role,
  admin: "Administración",
};

export function UserIdentityFallback() {
  return (
    <>
      <div className="h-[38px] w-[38px] flex-none rounded-full bg-avatar-teacher" />
      <div className="min-w-0 flex-1">
        <div className="h-[14px] w-24 rounded bg-[#E7DAC8]" />
        <div className="mt-1 h-[12px] w-20 rounded bg-[#E7DAC8]" />
      </div>
    </>
  );
}

export async function UserIdentity() {
  await connection();
  const { fullName, initial, role } = await getCurrentUserProfile();
  const roleLabel = (role && ROLE_LABELS[role]) || teacher.role;

  return (
    <>
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-avatar-teacher font-display text-[16px] font-semibold text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-extrabold text-ink">
          {fullName}
        </div>
        <div className="text-[12px] text-muted-soft">{roleLabel}</div>
      </div>
    </>
  );
}
