import { supabase } from "../config/supabase.js";
import type { BetaSignupInput } from "../schemas/beta.js";

type SignupMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Idempotent waitlist insert. Re-submitting the same email is treated as a
 * success ("already on the list") instead of an error, so the fake-door form
 * never punishes an eager early adopter who clicks twice.
 *
 * Returns whether this call created a new row, useful for analytics on the
 * landing side ("already_in" vs first-time interest).
 */
export const addBetaSignup = async (
  input: BetaSignupInput,
  meta: SignupMeta = {}
): Promise<{ created: boolean }> => {
  const { data: existing } = await supabase
    .from("beta_signups")
    .select("id")
    .eq("email", input.email)
    .maybeSingle();

  if (existing) return { created: false };

  const { error } = await supabase.from("beta_signups").insert({
    full_name: input.full_name,
    email: input.email,
    source: input.source ?? "landing",
    utm: input.utm ?? null,
    ip: meta.ip ?? null,
    user_agent: meta.userAgent ?? null,
  });

  // Unique-index race: another request inserted the same email between our
  // check and write. Postgres unique-violation code 23505 → still a success.
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return { created: false };
    }
    throw error;
  }

  return { created: true };
};
