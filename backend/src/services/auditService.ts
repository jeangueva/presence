import { supabase } from "../config/supabase.js";

export type AuditAction =
  | "user_registered"
  | "user_login"
  | "user_login_failed"
  | "user_logout"
  | "password_changed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "two_fa_enabled"
  | "two_fa_disabled"
  | "account_deleted"
  | "subscription_created"
  | "subscription_cancelled"
  | "memorial_published"
  | "memorial_unpublished"
  | "vault_shared"
  | "vault_access_revoked"
  | "posthumous_message_dispatched";

/**
 * Lightweight audit logging. Fire-and-forget by design — auditing should never
 * block the primary flow. Errors are swallowed and logged to stderr.
 */
export const logAudit = async (params: {
  userId?: string | null;
  resourceType: string;
  resourceId?: string | null;
  action: AuditAction;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}) => {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: params.userId ?? null,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      action: params.action,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
      metadata: params.metadata ?? null,
    });
    if (error) console.error("[audit] insert failed:", error);
  } catch (e) {
    console.error("[audit] unexpected error:", e);
  }
};

/**
 * Extract IP + user-agent from an Express request in a TS-safe way.
 */
export const auditMeta = (req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}) => {
  const ua = req.headers["user-agent"];
  return {
    ipAddress: req.ip ?? null,
    userAgent: typeof ua === "string" ? ua : Array.isArray(ua) ? ua[0] : null,
  };
};
