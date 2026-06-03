import rateLimit from "express-rate-limit";

// Per-endpoint limiters. Each protects a specific abuse vector that the global
// limiter is too permissive for (auth brute-force, LLM/storage cost burning,
// password-reset email enumeration).
//
// Keys default to IP. For authenticated endpoints (chat, upload), we'd ideally
// key by user_id, but doing that requires running the limiter after
// `requireAuth`. To keep this simple we key by IP-only for now — fine for MVP.

const tooManyRequests = (msg: string) => ({
  error: "TooManyRequests",
  message: msg,
});

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests("Demasiados registros desde esta IP. Espera unos minutos."),
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count successful logins so legit users aren't punished for typos.
  skipSuccessfulRequests: true,
  message: tooManyRequests("Demasiados intentos. Espera 15 minutos."),
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests("Demasiadas solicitudes de reset. Intenta en una hora."),
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests("Demasiados mensajes en poco tiempo. Espera un minuto."),
});

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests("Demasiados archivos en poco tiempo. Espera unos minutos."),
});

export const guestbookLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests("Has dejado varios mensajes. Espera una hora antes de otro."),
});

export const betaSignupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooManyRequests("Demasiados registros desde esta IP. Intenta en una hora."),
});
