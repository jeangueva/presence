import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessPayload = { sub: string; email: string; type: "access" };
export type RefreshPayload = { sub: string; type: "refresh" };
export type TwoFaChallengePayload = { sub: string; type: "2fa_challenge" };

const signOpts = (expiresIn: string): SignOptions =>
  ({ expiresIn } as SignOptions);

export const signAccessToken = (userId: string, email: string) =>
  jwt.sign({ sub: userId, email, type: "access" }, env.JWT_SECRET, signOpts(env.JWT_EXPIRES_IN));

export const signRefreshToken = (userId: string) =>
  jwt.sign({ sub: userId, type: "refresh" }, env.JWT_SECRET, signOpts(env.JWT_REFRESH_EXPIRES_IN));

export const verifyAccessToken = (token: string): AccessPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || decoded.type !== "access") {
    throw new Error("Invalid access token");
  }
  return decoded as AccessPayload;
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || decoded.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return decoded as RefreshPayload;
};

export const sign2faChallengeToken = (userId: string) =>
  jwt.sign({ sub: userId, type: "2fa_challenge" }, env.JWT_SECRET, signOpts("5m"));

export const verify2faChallengeToken = (token: string): TwoFaChallengePayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || decoded.type !== "2fa_challenge") {
    throw new Error("Invalid 2FA challenge token");
  }
  return decoded as TwoFaChallengePayload;
};
