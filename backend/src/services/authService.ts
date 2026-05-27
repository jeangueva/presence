import bcrypt from "bcryptjs";
import { verifySync } from "otplib";
import { supabase } from "../config/supabase.js";
import {
  sign2faChallengeToken,
  signAccessToken,
  signRefreshToken,
  verify2faChallengeToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { conflict, unauthorized } from "../utils/errors.js";
import { otpVerifyOptions } from "./totp.js";
import { sendVerificationEmail } from "./emailVerificationService.js";

type RegisterInput = {
  email: string;
  password: string;
  full_name?: string;
  gdpr_consent: boolean;
};

export const registerUser = async (input: RegisterInput) => {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", input.email)
    .maybeSingle();
  if (existing) throw conflict("Email already registered");

  const password_hash = await bcrypt.hash(input.password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: input.email,
      password_hash,
      full_name: input.full_name ?? null,
      gdpr_consent: input.gdpr_consent,
    })
    .select("id, email, full_name, subscription_tier")
    .single();
  if (error) throw error;

  // Fire-and-forget verification email.
  void sendVerificationEmail(data.id, data.email).catch((e) =>
    console.error("[register] verification email failed:", e)
  );

  return {
    user: data,
    access_token: signAccessToken(data.id, data.email),
    refresh_token: signRefreshToken(data.id),
  };
};

type FullSession = {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    subscription_tier: string | null;
  };
  access_token: string;
  refresh_token: string;
};

type TwoFaChallenge = {
  requires_2fa: true;
  two_fa_token: string;
};

const buildSession = (user: {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string | null;
}): FullSession => ({
  user: {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    subscription_tier: user.subscription_tier,
  },
  access_token: signAccessToken(user.id, user.email),
  refresh_token: signRefreshToken(user.id),
});

export const loginUser = async (
  email: string,
  password: string
): Promise<FullSession | TwoFaChallenge> => {
  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, password_hash, subscription_tier, two_fa_enabled, two_fa_secret"
    )
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw unauthorized("Invalid credentials");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw unauthorized("Invalid credentials");

  if (user.two_fa_enabled && user.two_fa_secret) {
    return { requires_2fa: true, two_fa_token: sign2faChallengeToken(user.id) };
  }

  return buildSession(user);
};

export const complete2faLogin = async (
  twoFaToken: string,
  code: string
): Promise<FullSession> => {
  let payload;
  try {
    payload = verify2faChallengeToken(twoFaToken);
  } catch {
    throw unauthorized("Token de 2FA inválido o expirado");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, subscription_tier, two_fa_enabled, two_fa_secret")
    .eq("id", payload.sub)
    .maybeSingle();
  if (error) throw error;
  if (!user || !user.two_fa_enabled || !user.two_fa_secret) {
    throw unauthorized("2FA no está activo en esta cuenta");
  }

  const valid = verifySync({
    token: code,
    secret: user.two_fa_secret,
    ...otpVerifyOptions,
  });
  if (!valid) throw unauthorized("Código incorrecto");

  return buildSession(user);
};

export const refreshSession = async (refreshToken: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw unauthorized("Invalid refresh token");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", payload.sub)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw unauthorized("User no longer exists");

  return {
    access_token: signAccessToken(user.id, user.email),
    refresh_token: signRefreshToken(user.id),
  };
};
