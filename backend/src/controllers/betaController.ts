import type { Request, Response } from "express";
import { betaSignupSchema } from "../schemas/beta.js";
import { addBetaSignup } from "../services/betaService.js";

export const signup = async (req: Request, res: Response) => {
  const body = betaSignupSchema.parse(req.body);
  const { created } = await addBetaSignup(body, {
    ip: req.ip ?? null,
    userAgent: req.get("user-agent") ?? null,
  });
  res.status(created ? 201 : 200).json({
    ok: true,
    created,
    message: created
      ? "¡Estás en la lista! Te escribiremos cuando abramos la beta."
      : "Ya estabas en la lista — te avisaremos pronto.",
  });
};
