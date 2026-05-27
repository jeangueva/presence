import { z } from "zod";

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().min(6).max(8),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1),
});
