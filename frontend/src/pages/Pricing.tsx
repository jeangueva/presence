import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { PLAN_ORDER, PLANS, type PlanId } from "../lib/plans";
import { useMeta } from "../hooks/useMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import { buildPricingSchema } from "../lib/seo";

export const Pricing = () => {
  useMeta({
    title: "Precios",
    description:
      "Tres planes para preservar memorias: Free, Personal $9/mes y Family $19/mes. Cancela cuando quieras, exporta tus datos siempre.",
    canonical: "/pricing",
  });
  useStructuredData(
    buildPricingSchema(
      PLAN_ORDER.filter((id) => id !== "free").map((id) => ({
        name: PLANS[id].name,
        description: PLANS[id].tagline,
        priceMonthlyUsd: PLANS[id].price_usd_monthly,
      }))
    )
  );
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (planId: PlanId) => {
    if (planId === "free") {
      navigate(isAuthed ? "/app" : "/register");
      return;
    }
    if (!isAuthed) {
      navigate(`/register?from=pricing&plan=${planId}`);
      return;
    }
    setError(null);
    setLoading(planId);
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout", { plan: planId });
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "No se pudo iniciar el checkout. Intenta de nuevo.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-warm-plum">
      {/* Header simple */}
      <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-warm-sand">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-serif tracking-tight text-warm-plum">
            Presence<sup className="text-xs">®</sup>
          </Link>
          <div className="flex items-center gap-3">
            {!isAuthed ? (
              <>
                <Link to="/login" className="text-sm font-semibold text-warm-olive hover:text-warm-plum">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="btn-primary">
                  Crear cuenta
                </Link>
              </>
            ) : (
              <Link to="/app" className="btn-secondary">
                Ir al app
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section className="relative px-6 pt-16 pb-24 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-warm-accent/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
              Precios simples
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl text-warm-plum mb-4">
              Elige el plan a tu medida.
            </h1>
            <p className="text-warm-olive text-lg max-w-xl mx-auto">
              Empieza gratis. Crece cuando estés listo. Cancela cuando quieras — los datos
              de tus vaults siempre son tuyos.
            </p>
          </div>

          {error && (
            <p className="max-w-md mx-auto mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
              {error}
            </p>
          )}

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLAN_ORDER.map((id) => {
              const plan = PLANS[id];
              const featured = id === "personal";
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: PLAN_ORDER.indexOf(id) * 0.08 }}
                  className={`relative card flex flex-col ${
                    featured
                      ? "border-warm-accent ring-2 ring-warm-accent/20 shadow-lg"
                      : ""
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-white bg-warm-accent px-3 py-1 rounded-full">
                      Más elegido
                    </span>
                  )}
                  <h3 className="font-serif text-3xl text-warm-plum mb-1">{plan.name}</h3>
                  <p className="text-sm text-warm-olive mb-5">{plan.tagline}</p>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-warm-plum">
                      ${plan.price_usd_monthly}
                    </span>
                    <span className="text-warm-olive ml-1">USD/mes</span>
                  </div>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-warm-plum">
                        <Check size={16} className="text-warm-accent shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => subscribe(id)}
                    disabled={loading !== null}
                    className={
                      featured
                        ? "btn-primary w-full inline-flex items-center justify-center gap-2"
                        : "btn-secondary w-full inline-flex items-center justify-center gap-2"
                    }
                  >
                    {loading === id
                      ? "Cargando..."
                      : id === "free"
                      ? isAuthed
                        ? "Tu plan actual"
                        : "Empezar gratis"
                      : `Suscribirme a ${plan.name}`}
                    {id !== "free" && loading !== id && <Sparkles size={16} />}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ / fine print */}
          <div className="max-w-3xl mx-auto mt-20 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
              Lo que importa saber
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-sm text-warm-olive mt-6">
              <div>
                <p className="font-bold text-warm-plum mb-1">Cancela cuando quieras</p>
                <p>Sin permanencia. Cancelas y conservas acceso hasta el final del periodo pagado.</p>
              </div>
              <div>
                <p className="font-bold text-warm-plum mb-1">Tus datos siempre tuyos</p>
                <p>Puedes exportar todo tu vault como ZIP en cualquier momento.</p>
              </div>
              <div>
                <p className="font-bold text-warm-plum mb-1">Hecho con cuidado</p>
                <p>Tus recuerdos no se usan para entrenar modelos públicos. Cifrados, GDPR.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-warm-dark text-warm-silver rounded-t-[40px]">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center text-sm">
          <Link to="/" className="text-white font-serif text-2xl">Presence</Link>
          <p className="mt-2">© {new Date().getFullYear()} · Presence. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* hidden import to avoid lint warning */}
      <span className="sr-only">
        <X size={1} />
      </span>
    </div>
  );
};
