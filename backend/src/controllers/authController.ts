import type { Request, Response } from "express";
import {
  confirmResetSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  requestResetSchema,
  twoFaLoginSchema,
} from "../schemas/auth.js";
import { z } from "zod";
import { auditMeta, logAudit } from "../services/auditService.js";
import {
  complete2faLogin,
  loginUser,
  refreshSession,
  registerUser,
} from "../services/authService.js";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "../services/passwordResetService.js";
import {
  resendVerificationEmail,
  verifyEmailToken,
} from "../services/emailVerificationService.js";

export const register = async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);
  const result = await registerUser(body);
  void logAudit({
    userId: result.user.id,
    resourceType: "user",
    resourceId: result.user.id,
    action: "user_registered",
    ...auditMeta(req),
  });
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);
  try {
    const result = await loginUser(email, password);
    if ("user" in result) {
      void logAudit({
        userId: result.user.id,
        resourceType: "user",
        resourceId: result.user.id,
        action: "user_login",
        ...auditMeta(req),
      });
    }
    res.json(result);
  } catch (err) {
    void logAudit({
      userId: null,
      resourceType: "user",
      action: "user_login_failed",
      metadata: { email },
      ...auditMeta(req),
    });
    throw err;
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refresh_token } = refreshSchema.parse(req.body);
  const tokens = await refreshSession(refresh_token);
  res.json(tokens);
};

export const twoFaLogin = async (req: Request, res: Response) => {
  const { two_fa_token, code } = twoFaLoginSchema.parse(req.body);
  const result = await complete2faLogin(two_fa_token, code);
  res.json(result);
};

export const me = async (req: Request, res: Response) => {
  res.json({ user: req.user });
};

export const requestReset = async (req: Request, res: Response) => {
  const { email } = requestResetSchema.parse(req.body);
  await requestPasswordReset(email);
  // Always 200, even if email doesn't exist — never leak account existence.
  res.json({
    ok: true,
    message:
      "Si existe una cuenta con ese email, enviamos un link para restablecer la contraseña.",
  });
};

export const confirmReset = async (req: Request, res: Response) => {
  const { token, password } = confirmResetSchema.parse(req.body);
  await confirmPasswordReset(token, password);
  res.json({ ok: true });
};

const verifyEmailSchema = z.object({ token: z.string().min(1) });

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = verifyEmailSchema.parse(req.body);
  const result = await verifyEmailToken(token);
  res.json(result);
};

export const resendVerification = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const result = await resendVerificationEmail(req.user.id);
  res.json(result);
};
