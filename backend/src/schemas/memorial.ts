import { z } from "zod";

export const createMemorialSchema = z.object({
  vault_id: z.string().uuid(),
});

export const updateMemorialSchema = z.object({
  deceased_name: z.string().min(1).max(255).optional(),
  deceased_bio: z.string().max(10_000).optional(),
  birth_date: z.string().date().optional().nullable(),
  death_date: z.string().date().optional().nullable(),
  profile_photo_url: z.string().url().optional().nullable(),
  cover_photo_url: z.string().url().optional().nullable(),
});

export const togglePublicSchema = z.object({
  public: z.boolean(),
});

export const guestbookSubmitSchema = z.object({
  visitor_name: z.string().min(1).max(255),
  visitor_email: z.string().email().optional(),
  message: z.string().min(1).max(2000),
});
