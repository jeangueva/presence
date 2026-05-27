import bcrypt from "bcryptjs";
import { generateSecret, generateURI, verifySync } from "otplib";
import qrcode from "qrcode";
import { supabase } from "../config/supabase.js";
import { badRequest, notFound, unauthorized } from "../utils/errors.js";
import { otpSecretOptions, otpUriOptions, otpVerifyOptions } from "./totp.js";

export const getMe = async (userId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, subscription_tier, two_fa_enabled, email_verified, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound("User not found");
  return data;
};

export const updateProfile = async (userId: string, patch: { full_name?: string }) => {
  const update: Record<string, unknown> = {};
  if (patch.full_name !== undefined) update.full_name = patch.full_name || null;
  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", userId)
    .select("id, email, full_name, subscription_tier")
    .single();
  if (error) throw error;
  return data;
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  if (newPassword.length < 8) throw badRequest("La nueva contraseña debe tener al menos 8 caracteres");
  const { data: user, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw notFound("User not found");
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw unauthorized("La contraseña actual no es correcta");
  const newHash = await bcrypt.hash(newPassword, 12);
  const { error: updErr } = await supabase
    .from("users")
    .update({ password_hash: newHash })
    .eq("id", userId);
  if (updErr) throw updErr;
};

export const deleteAccount = async (userId: string, password: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw notFound("User not found");
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw unauthorized("Contraseña incorrecta");
  const { error: delErr } = await supabase.from("users").delete().eq("id", userId);
  if (delErr) throw delErr;
};

// ---------- 2FA TOTP ----------

export const startTwoFactor = async (userId: string, accountLabel: string) => {
  const secret = generateSecret(otpSecretOptions);
  const otpauth = generateURI({
    secret,
    label: accountLabel,
    issuer: "Presence",
    ...otpUriOptions,
  });
  const qrDataUrl = await qrcode.toDataURL(otpauth);
  const { error } = await supabase
    .from("users")
    .update({ two_fa_secret: secret, two_fa_enabled: false })
    .eq("id", userId);
  if (error) throw error;
  return { secret, otpauth, qrDataUrl };
};

export const verifyTwoFactor = async (userId: string, code: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("two_fa_secret")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user?.two_fa_secret) throw badRequest("Primero inicia el enrolamiento de 2FA");
  const valid = verifySync({
    token: code,
    secret: user.two_fa_secret,
    ...otpVerifyOptions,
  });
  if (!valid) throw badRequest("Código inválido");
  const { error: updErr } = await supabase
    .from("users")
    .update({ two_fa_enabled: true })
    .eq("id", userId);
  if (updErr) throw updErr;
};

export const disableTwoFactor = async (userId: string, password: string) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!user) throw notFound("User not found");
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw unauthorized("Contraseña incorrecta");
  const { error: updErr } = await supabase
    .from("users")
    .update({ two_fa_enabled: false, two_fa_secret: null })
    .eq("id", userId);
  if (updErr) throw updErr;
};
