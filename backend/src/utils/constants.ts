import { CookieOptions } from "express";

export const COOKIE_NAME = "auth_token";

/**
 * Returns cross-origin compatible cookie configuration.
 * In production: sameSite="none" and secure=true (required for cross-site cookies)
 * In development: sameSite="lax" and secure=false
 */
export const getCookieOptions = (expires?: Date): CookieOptions => {
  const isProduction = process.env.NODE_ENV === "production";
  const options: CookieOptions = {
    path: "/",
    httpOnly: true,
    signed: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  if (expires) {
    options.expires = expires;
  }

  return options;
};
