import { z } from "zod";

export const betaSignupSchema = z.object({
  full_name: z.string().trim().min(2, "Nombre muy corto").max(255),
  email: z.string().trim().toLowerCase().email("Correo inválido").max(255),
  source: z.string().max(64).optional(),
  utm: z.string().max(255).optional(),
});

export type BetaSignupInput = z.infer<typeof betaSignupSchema>;
