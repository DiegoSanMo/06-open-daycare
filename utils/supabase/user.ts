import { cache } from "react";

import { requireUser } from "./auth";
import { createClient } from "./server";

export type CurrentUserProfile = {
  fullName: string;
  initial: string;
};

export const getCurrentUserProfile = cache(
  async (): Promise<CurrentUserProfile> => {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const fullName =
      (!error && data?.full_name?.trim()) ||
      user.app_metadata?.full_name?.trim() ||
      user.email ||
      "Usuario";

    return { fullName, initial: fullName.charAt(0).toUpperCase() };
  },
);
