import { z } from "zod";

export const dependentSchema = z.object({
  full_name: z.string().min(1).max(255),
  relationship: z.string().max(100).optional(),
  date_of_birth: z.string().date().optional().nullable(),
  caregiver_name: z.string().max(255).optional(),
  caregiver_contact: z.string().max(255).optional(),
  notes: z.string().max(5000).optional(),
});

export const petSchema = z.object({
  name: z.string().min(1).max(255),
  species: z.string().max(100).optional(),
  breed: z.string().max(255).optional(),
  age_years: z.coerce.number().int().min(0).max(100).optional(),
  vet_info: z.string().max(2000).optional(),
  food_routine: z.string().max(2000).optional(),
  caregiver_name: z.string().max(255).optional(),
  caregiver_contact: z.string().max(255).optional(),
  notes: z.string().max(5000).optional(),
});

export const finalWishesSchema = z.object({
  disposition: z.enum(["burial", "cremation", "donation", "other"]).optional().nullable(),
  ceremony_notes: z.string().max(5000).optional().nullable(),
  religious_wishes: z.string().max(2000).optional().nullable(),
  music_readings: z.string().max(2000).optional().nullable(),
  obituary: z.string().max(5000).optional().nullable(),
  special_requests: z.string().max(5000).optional().nullable(),
});

export const estateSchema = z.object({
  summary: z.string().max(5000).optional().nullable(),
  executor_name: z.string().max(255).optional().nullable(),
  executor_email: z.string().email().optional().nullable().or(z.literal("")),
  executor_phone: z.string().max(32).optional().nullable(),
  notary_info: z.string().max(2000).optional().nullable(),
});

export const heirSchema = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email().optional().or(z.literal("")),
  relationship: z.string().max(100).optional(),
  inheritance_share: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export const assetSchema = z.object({
  name: z.string().min(1).max(255),
  asset_type: z.enum(["property", "account", "investment", "digital", "other"]).optional(),
  description: z.string().max(2000).optional(),
  approximate_value: z.string().max(100).optional(),
  location: z.string().max(500).optional(),
});

export const willSchema = z.object({
  testator_full_name: z.string().max(255).optional().nullable(),
  testator_id_number: z.string().max(100).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  declarations: z.string().max(20_000).optional().nullable(),
  // Rich authored document (HTML). Generous cap: inline base64 images/signature.
  body_html: z.string().max(5_000_000).optional().nullable(),
  template_id: z.string().max(50).optional().nullable(),
});

export const posthumousMessageSchema = z.object({
  recipient_email: z.string().email(),
  subject: z.string().min(1).max(255),
  text_content: z.string().min(1).max(10_000),
  message_type: z.enum(["text", "audio", "video"]).default("text"),
});
