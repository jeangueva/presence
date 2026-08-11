import type { QuotaInfo } from "../components/UpgradeModal";
import { DEFAULT_PLAN } from "./plans";

/**
 * If `err` is an axios 402 from our backend's QuotaExceededError, return
 * the parsed quota info (with message). Otherwise return null.
 */
export const extractQuota = (err: unknown): QuotaInfo | null => {
  type Shape = {
    response?: {
      status?: number;
      data?: {
        error?: string;
        details?: {
          reason?: string;
          current_plan?: string;
          required_plan?: string;
          limit?: number;
          used?: number;
        };
      };
    };
  };
  const r = (err as Shape)?.response;
  if (!r || r.status !== 402) return null;
  const d = r.data?.details;
  if (!d?.reason) return null;
  return {
    reason: d.reason,
    current_plan: d.current_plan ?? DEFAULT_PLAN,
    required_plan: d.required_plan ?? "legado",
    limit: d.limit ?? 0,
    used: d.used ?? 0,
    message: r.data?.error ?? "Has alcanzado un límite de tu plan.",
  };
};
