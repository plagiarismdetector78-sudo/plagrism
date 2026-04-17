// lib/session.js
import { getIronSession } from "iron-session";

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD,
  cookieName: "skill_scanner_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function getSession(req, res) {
  return getIronSession(req, res, sessionOptions);
}
