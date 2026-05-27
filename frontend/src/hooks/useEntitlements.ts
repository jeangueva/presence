import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Plan, PlanId, PlanLimits } from "../lib/plans";

export type UsageSnapshot = {
  plan: PlanId;
  limits: PlanLimits;
  usage: {
    vaults: number;
    memorials: number;
    biography_generations_this_month: number;
    chat_messages_this_month: number;
    storage_mb: number;
  };
  plan_meta: Plan;
  billing_enabled: boolean;
};

export const useEntitlements = (opts: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ["billing-me"],
    queryFn: async () => (await api.get<UsageSnapshot>("/billing/me")).data,
    enabled: opts.enabled ?? true,
    staleTime: 60_000,
  });
