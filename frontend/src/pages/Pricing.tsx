import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { PLAN_ORDER, PLANS, type PlanId } from "../lib/plans";
import { useMeta } from "../hooks/useMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import { buildPricingSchema } from "../lib/seo";

type LivePricing = {
  enabled: boolean;
  currency: string;
  plans: Record<PlanId, { billing: string; amount: number | null; purchasable: boolean }>;
};

export const Pricing = () => {
  useMeta({
    title: "Precios",
    description:
      "Memorial gratis para siempre. Legado por $99 en un pago único. Vault IA por $12/mes. Exporta tus datos siempre.",
    canonical: "/pricing",
  });
  useStructuredData(
    buildPricingSchema(
      PLAN_ORDER.filter((id) => PLANS[id].billing !== "free").map((id) => ({
        name: PLANS[id].name,
        description: PLANS[id].tagline,
        priceMonthlyUsd: PLANS[id].price_usd,
      }))
    )
  );
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The USD figures in plans.ts are for copy and structured data; MercadoPago
  // charges in the account's local currency. Show what will actually be
  // charged — a page that quotes one number and bills another is how you earn
  // chargebacks. Falls back to USD if billing isn't configured yet.
  const [pricing, setPricing] = useState<LivePricing | null>(null);
  useEffect(() => {
    api
      .get<LivePricing>("/billing/pricing")
      .then((r) => setPricing(r.data.enabled ? r.data : null))
      .catch(() => setPricing(null));
  }, []);

  const priceFor = (id: PlanId) => {
    const plan = PLANS[id];
    // Never run the free tier through currency formatting — "0 COP" reads like
    // a broken price where "$0" reads like the offer.
    if (plan.billing === "free") return { text: "$0", suffix: "" };
    const live = pricing?.plans[id];
    if (!live || live.amount == null) {
      return { text: `$${plan.price_usd}`, suffix: "USD" };
    }
    return {
      text: new Intl.NumberFormat("es", {
        style: "currency",
        currency: pricing!.currency,
        maximumFractionDigits: 0,
      }).format(live.amount),
      suffix: "",
    };
  };

  const subscribe = async (planId: PlanId) => {
    if (PLANS[planId].billing === "free") {
      navigate(isAuthed ? "/app" : "/register");
      return;
    }
    if (!isAuthed) {
      navigate(`/register?from=pricing&plan=${planId}`);
      return;
    }
    // One-time purchases run on our own page via Checkout Bricks. Only the
    // subscription still needs MercadoPago's hosted flow — preapproval has no
    // Brick equivalent.
    if (PLANS[planId].billing === "one_time") {
      navigate(`/checkout/${planId}`);
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
    <div className="min-h-screen bg-white text-warm-plum animate-page-fade">
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
            <p className="eyebrow mb-3">
              Precios simples
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl text-warm-plum mb-4">
              Elige el plan a tu medida.
            </h1>
            <p className="text-warm-olive text-lg max-w-xl mx-auto">
              El memorial es gratis para siempre. Legado se paga una sola vez.
              Solo el chat con IA es mensual, porque es lo único que cuesta cada
              vez que lo usas.
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
              // Legado is the product we actually want people to buy.
              const featured = id === "legado";
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
                      {priceFor(id).text}
                    </span>
                    <span className="text-warm-olive ml-1">
                      {[
                        priceFor(id).suffix,
                        plan.billing === "one_time"
                          ? "· pago único"
                          : plan.billing === "monthly"
                            ? "/mes"
                            : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </span>
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
                    disabled={loading !== null || pricing?.plans[id].purchasable === false}
                    className={
                      featured
                        ? "btn-primary w-full inline-flex items-center justify-center gap-2"
                        : "btn-secondary w-full inline-flex items-center justify-center gap-2"
                    }
                  >
                    {loading === id
                      ? "Cargando..."
                      : pricing?.plans[id].purchasable === false
                        ? "Próximamente"
                        : plan.billing === "free"
                        ? isAuthed
                          ? "Tu plan actual"
                          : "Empezar gratis"
                        : plan.billing === "one_time"
                          ? "Comprar Legado"
                          : "Añadir Vault IA"}
                    {plan.billing !== "free" && loading !== id && <Sparkles size={16} />}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ / fine print */}
          <div className="max-w-3xl mx-auto mt-20 text-center">
            <p className="eyebrow mb-3">
              Lo que importa saber
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-sm text-warm-olive mt-6">
              <div>
                <p className="font-bold text-warm-plum mb-1">Legado no caduca</p>
                <p>Lo pagas una vez y es tuyo. Si cancelas el Vault IA mensual, conservas Legado completo.</p>
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
