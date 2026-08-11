import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { UpgradeModal, type QuotaInfo } from "../components/UpgradeModal";
import { extractQuota } from "../lib/quota";

export const VaultCreate = () => {
  useDocumentTitle("Nuevo vault");
  const navigate = useNavigate();
  const [form, setForm] = useState({
    deceased_name: "",
    deceased_bio: "",
    deceased_birth_date: "",
    deceased_death_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        deceased_name: form.deceased_name,
        deceased_bio: form.deceased_bio || undefined,
        deceased_birth_date: form.deceased_birth_date || undefined,
        deceased_death_date: form.deceased_death_date || undefined,
      };
      const { data } = await api.post("/vaults", payload);
      navigate(`/app/vaults/${data.id}`);
    } catch (err: unknown) {
      const q = extractQuota(err);
      if (q) {
        setQuota(q);
      } else {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "No se pudo crear el vault");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum mb-6 transition"
      >
        <ArrowLeft size={16} /> Volver al dashboard
      </Link>

      <div className="mb-8">
        <p className="eyebrow mb-2">
          Nueva memoria
        </p>
        <h1 className="font-serif text-4xl text-warm-plum mb-3">Crea un Memory Vault</h1>
        <p className="text-warm-olive">
          Cuéntanos sobre la persona que quieres honrar. La biografía es la base sobre la
          que se construye toda la conversación — sé tan rico en detalle como puedas.
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Nombre completo *
          </label>
          <input
            className="input"
            placeholder="Ej. María Elena González"
            value={form.deceased_name}
            onChange={(e) => setForm({ ...form, deceased_name: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              className="input"
              value={form.deceased_birth_date}
              onChange={(e) => setForm({ ...form, deceased_birth_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
              Fecha de fallecimiento
            </label>
            <input
              type="date"
              className="input"
              value={form.deceased_death_date}
              onChange={(e) => setForm({ ...form, deceased_death_date: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Biografía
          </label>
          <textarea
            className="input min-h-[180px] resize-y"
            rows={8}
            placeholder="Describe su vida, personalidad, forma de hablar, anécdotas que siempre contaba, qué lo hacía único..."
            value={form.deceased_bio}
            onChange={(e) => setForm({ ...form, deceased_bio: e.target.value })}
          />
          <p className="mt-2 text-xs text-warm-silver flex items-start gap-1.5">
            <Sparkles size={12} className="text-warm-accent mt-0.5 shrink-0" />
            <span>
              Tip: cuanto más rica la biografía, más auténtica se sentirá la conversación. Detalles
              pequeños como "siempre decía 'mi cielo'" hacen la diferencia.
            </span>
          </p>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2"
          >
            {error}
          </motion.p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
        >
          {loading ? "Creando..." : "Crear Memory Vault"}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>
      <UpgradeModal open={!!quota} quota={quota} onClose={() => setQuota(null)} />
    </motion.div>
  );
};
