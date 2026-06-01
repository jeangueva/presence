import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Shimmer } from "../components/Shimmer";

/**
 * Back-compat redirect. Memorials are no longer a top-level object — they live
 * as the "Memorial público" surface inside their parent vault. Old links like
 * /app/memorials/:id resolve the memorial's vault_id and forward to the vault
 * with that surface preselected. Falls back to the dashboard if it can't.
 */
export const MemorialRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ["memorial", id],
    queryFn: async () =>
      (await api.get<{ vault_id: string }>(`/memorials/${id}`)).data,
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (q.data?.vault_id) {
      navigate(`/app/vaults/${q.data.vault_id}?surface=memorial`, { replace: true });
    } else if (q.isError) {
      navigate("/app", { replace: true });
    }
  }, [q.data, q.isError, navigate]);

  return (
    <div className="card">
      <Shimmer className="h-7 w-1/3 mb-3" />
      <Shimmer className="h-4 w-2/3" />
    </div>
  );
};
