import { query } from "./db";
import { ensureAuthSchema } from "./ensureAuthSchema";

function getAdminEmailSet() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return new Set(
    String(raw)
      .split(/[,\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Admin guard.
 * Admin can be either:
 * - a DB user with role='admin', OR
 * - a user whose email is in ADMIN_EMAILS / ADMIN_EMAIL env var.
 */
export async function assertAdmin(userId) {
  await ensureAuthSchema();

  if (userId == null || userId === "") {
    throw new Error("UNAUTHORIZED");
  }

  const result = await query("SELECT role, email FROM users WHERE id = $1 LIMIT 1", [userId]);
  const row = result.rows[0];
  if (!row) throw new Error("UNAUTHORIZED");

  const admins = getAdminEmailSet();
  const email = String(row.email || "").toLowerCase();
  if (row.role === "admin") return;
  if (email && admins.has(email)) return;

  throw new Error("FORBIDDEN");
}

