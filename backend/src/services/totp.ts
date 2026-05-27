import { ScureBase32Plugin, NobleCryptoPlugin } from "otplib";

// Shared TOTP config used by both:
//  - accountService (enrollment: generate secret, generate URI for QR, verify enrollment code)
//  - authService (login: verify the 6-digit code during 2FA challenge)
// One source of truth so enrollment and verification can never drift apart.

export const cryptoPlugin = new NobleCryptoPlugin();
export const base32Plugin = new ScureBase32Plugin();

export const otpSecretOptions = {
  base32: base32Plugin,
  crypto: cryptoPlugin,
  length: 20,
};

export const otpUriOptions = {
  digits: 6,
  period: 30,
};

export const otpVerifyOptions = {
  base32: base32Plugin,
  crypto: cryptoPlugin,
  digits: 6,
  period: 30,
  window: 1,
};
