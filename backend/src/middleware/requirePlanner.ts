import type { NextFunction, Request, Response } from "express";
import { enforceCanUseLegacyPlanner } from "../services/entitlementsService.js";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Gate the legacy planner behind the paid tier — but only for writes.
 *
 * Reads stay open on purpose: someone on the free Memorial tier should be able
 * to open the planner, see the three steps and understand exactly what they
 * would be buying. Blocking the read would just show them an empty paywall.
 */
export const requirePlanner = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (READ_METHODS.has(req.method)) return next();
  try {
    await enforceCanUseLegacyPlanner(req.user!.id);
    next();
  } catch (err) {
    next(err);
  }
};
