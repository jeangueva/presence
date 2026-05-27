import { z } from "zod";

export const createVaultSchema = z.object({
  deceased_name: z.string().min(1).max(255),
  deceased_bio: z.string().max(10_000).optional(),
  deceased_birth_date: z.string().date().optional(),
  deceased_death_date: z.string().date().optional(),
});

export const updateVaultSchema = createVaultSchema.partial();

export const chatSchema = z.object({
  message: z.string().min(1).max(4_000),
  conversation_id: z.string().uuid().optional(),
});

export const grantAccessSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
});

export const updateBiographySchema = z.object({
  text: z.string().min(1).max(20_000),
});
