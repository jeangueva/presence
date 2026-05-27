import { HttpError } from "./errors.js";

/**
 * 402 Payment Required — thrown when a user hits a plan limit. Frontend uses
 * the `reason` to display a precise upgrade prompt ("Has alcanzado el límite
 * de vaults", "Has gastado tus biografías de este mes", etc.) and the
 * `required_plan` to point them at the cheapest plan that unblocks them.
 */
export class QuotaExceededError extends HttpError {
  reason: string;
  current_plan: string;
  required_plan: string;
  limit: number;
  used: number;
  constructor(params: {
    reason: string;
    current_plan: string;
    required_plan: string;
    limit: number;
    used: number;
    message?: string;
  }) {
    super(402, params.message ?? "Quota exceeded", {
      reason: params.reason,
      current_plan: params.current_plan,
      required_plan: params.required_plan,
      limit: params.limit,
      used: params.used,
    });
    this.reason = params.reason;
    this.current_plan = params.current_plan;
    this.required_plan = params.required_plan;
    this.limit = params.limit;
    this.used = params.used;
  }
}
