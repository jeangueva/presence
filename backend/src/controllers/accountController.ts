import type { Request, Response } from "express";
import {
  changePasswordSchema,
  deleteAccountSchema,
  twoFactorDisableSchema,
  twoFactorVerifySchema,
  updateProfileSchema,
} from "../schemas/account.js";
import {
  changePassword,
  deleteAccount,
  disableTwoFactor,
  getMe,
  startTwoFactor,
  updateProfile,
  verifyTwoFactor,
} from "../services/accountService.js";
import { auditMeta, logAudit } from "../services/auditService.js";
import { unauthorized } from "../utils/errors.js";

const getUser = (req: Request) => {
  if (!req.user) throw unauthorized();
  return req.user;
};

export const me = async (req: Request, res: Response) => {
  const user = getUser(req);
  const account = await getMe(user.id);
  res.json(account);
};

export const profileUpdate = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = updateProfileSchema.parse(req.body);
  const updated = await updateProfile(user.id, body);
  res.json(updated);
};

export const passwordChange = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = changePasswordSchema.parse(req.body);
  await changePassword(user.id, body.current_password, body.new_password);
  void logAudit({
    userId: user.id,
    resourceType: "user",
    resourceId: user.id,
    action: "password_changed",
    ...auditMeta(req),
  });
  res.json({ ok: true });
};

export const accountDelete = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = deleteAccountSchema.parse(req.body);
  await deleteAccount(user.id, body.password);
  void logAudit({
    userId: user.id,
    resourceType: "user",
    resourceId: user.id,
    action: "account_deleted",
    ...auditMeta(req),
  });
  res.status(204).send();
};

export const twoFaStart = async (req: Request, res: Response) => {
  const user = getUser(req);
  const data = await startTwoFactor(user.id, user.email);
  res.json(data);
};

export const twoFaVerify = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = twoFactorVerifySchema.parse(req.body);
  await verifyTwoFactor(user.id, body.code);
  void logAudit({
    userId: user.id,
    resourceType: "user",
    resourceId: user.id,
    action: "two_fa_enabled",
    ...auditMeta(req),
  });
  res.json({ ok: true });
};

export const twoFaDisable = async (req: Request, res: Response) => {
  const user = getUser(req);
  const body = twoFactorDisableSchema.parse(req.body);
  await disableTwoFactor(user.id, body.password);
  void logAudit({
    userId: user.id,
    resourceType: "user",
    resourceId: user.id,
    action: "two_fa_disabled",
    ...auditMeta(req),
  });
  res.json({ ok: true });
};
