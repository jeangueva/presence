import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Archive } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { UpgradeModal, type QuotaInfo } from "../components/UpgradeModal";
import { extractQuota } from "../lib/quota";

type Vault = {
  id: string;
  deceased_name: string;
  deceased_bio?: string | null;
  deceased_birth_date?: string | null;
  deceased_death_date?: string | null;
};

export const MemorialCreate = () => {
  useDocumentTitle("Nuevo memorial");
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const vaultsQ = useQuery({
    queryKey: ["vaults"],
    queryFn: async () =>
      (await api.get<{ vaults: Vault[] }>("/vaults")).data.vaults,
  });

  const submit = async () => {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/memorials", { vault_id: selected });
      navigate(`/app/memorials/${data.id}`);
    } catch (err: unknown) {
      const q = extractQuota(err);
      if (q) {
        setQuota(q);
      } else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error;
        setError(msg ?? "No se pudo crear el memorial");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedVault = vaultsQ.data?.find((v) => v.id === selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <Link
        to="/app/memorials"
        className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum mb-6 transition"
      >
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-warm-silver mb-2">
          Nuevo memorial
        </p>
        <h1 className="font-serif text-4xl text-warm-plum mb-3">
          Crea un memorial
        </h1>
        <p className="text-warm-olive">
          Selecciona un Memory Vault. El memorial heredará el nombre, biografía y fechas, y
          después podrás añadir fotos, hacerlo público y recibir mensajes en el libro de
          visitas.
        </p>
      </div>

      {vaultsQ.isLoading && (
        <div className="card animate-pulse">
          <div className="h-6 w-1/3 bg-warm-fog rounded mb-3" />
          <div className="h-4 w-2/3 bg-warm-fog rounded" />
        </div>
      )}

      {vaultsQ.data && vaultsQ.data.length === 0 && (
        <div className="card text-center py-10">
          <h3 className="font-serif text-2xl text-warm-plum mb-2">
            Necesitas un vault primero
          </h3>
          <p className="text-warm-olive mb-5 max-w-md mx-auto">
            Los memoriales se construyen a partir de un Memory Vault. Crea uno y
            después vuelve aquí.
          </p>
          <Link to="/app/vaults/new" className="btn-primary inline-flex items-center gap-2">
            Crear Memory Vault <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {vaultsQ.data && vaultsQ.data.length > 0 && (
        <>
          <div className="space-y-2 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
              Tus vaults
            </p>
            {vaultsQ.data.map((v) => {
              const lifespan = [v.deceased_birth_date, v.deceased_death_date]
                .filter(Boolean)
                .join(" – ");
              const isSel = selected === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelected(v.id)}
                  className={`w-full text-left card flex items-start gap-3 transition ${
                    isSel
                      ? "border-warm-accent ring-2 ring-warm-accent/20"
                      : "hover:border-warm-silver"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-warm-light flex items-center justify-center shrink-0">
                    <Archive size={18} className="text-warm-plum" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-warm-plum truncate">{v.deceased_name}</h4>
                    {lifespan && (
                      <p className="text-xs text-warm-silver">{lifespan}</p>
                    )}
                    {v.deceased_bio && (
                      <p className="text-sm text-warm-olive line-clamp-2 mt-1">
                        {v.deceased_bio}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition ${
                      isSel ? "bg-warm-accent border-warm-accent" : "border-warm-silver"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {selectedVault && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-warm-fog/50 mb-4"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                Vista previa
              </p>
              <h3 className="font-serif text-2xl text-warm-plum">
                {selectedVault.deceased_name}
              </h3>
              <p className="text-sm text-warm-olive mt-3">
                Empezará <strong>privado</strong>. Podrás hacerlo público desde la pantalla
                de gestión y compartir el link.
              </p>
            </motion.div>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4"
            >
              {error}
            </motion.p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!selected || loading}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            {loading ? "Creando..." : "Crear memorial"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </>
      )}
      <UpgradeModal open={!!quota} quota={quota} onClose={() => setQuota(null)} />
    </motion.div>
  );
};
