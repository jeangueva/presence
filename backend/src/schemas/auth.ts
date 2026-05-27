import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(255).optional(),
  gdpr_consent: z.boolean().refine((v) => v === true, "GDPR consent required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const requestResetSchema = z.object({
  email: z.string().email(),
});

export const confirmResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const twoFaLoginSchema = z.object({
  two_fa_token: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Código debe ser de 6 dígitos"),
});
