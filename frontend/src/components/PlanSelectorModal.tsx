import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, CreditCard, Loader2, Sparkles, X } from "lucide-react";
import { api } from "../lib/api";
import { PLAN_ORDER, PLANS, billingLabel, type PlanId } from "../lib/plans";

type Props = {
  open: boolean;
  currentPlanId: PlanId;
  onClose: () => void;
  onRequestCancel: () => void; // owner of the modal handles the actual /billing/cancel call
};

export const PlanSelectorModal = ({ open, currentPlanId, onClose, onRequestCancel }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (planId: PlanId) => {
    // One-time purchases go to our own Bricks checkout; only the subscription
    // still hands off to MercadoPago's hosted page.
    if (PLANS[planId].billing === "one_time") {
      navigate(`/checkout/${planId}`);
      return;
    }
    setError(null);
    setLoading(planId);
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout", {
        plan: planId,
      });
      // Redirect to MercadoPago checkout. After payment MP redirects back to
      // /app/settings?upgrade=success and the webhook updates the tier.
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "No se pudo iniciar el pago. Intenta de nuevo.");
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-warm-plum/40 backdrop-blur-sm flex items-start sm:items-center justify-center px-4 py-8 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-warm-sand p-6 sm:p-8 w-full max-w-4xl my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-warm-silver hover:text-warm-plum p-1.5 rounded-lg hover:bg-warm-fog"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-warm-accent" />
                <p className="eyebrow">
                  Cambiar de plan
                </p>
              </div>
              <h2 className="font-serif text-3xl text-warm-plum">
                Elige el plan que mejor te queda.
              </h2>
              <p className="text-warm-olive text-sm mt-2">
                Pago seguro vía MercadoPago. Tu tarjeta queda guardada en tu cuenta MP
                — la próxima vez será un click. Cancelas cuando quieras.
              </p>
            </div>

            {error && (
              <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {PLAN_ORDER.map((id) => {
                const plan = PLANS[id];
                const isCurrent = id === currentPlanId;
                const featured = id === "legado";
                return (
                  <div
                    key={id}
                    className={`relative rounded-3xl border p-5 flex flex-col ${
                      isCurrent
                        ? "border-warm-accent ring-2 ring-warm-accent/20"
                        : featured
                        ? "border-warm-accent/60"
                        : "border-warm-sand"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-white bg-warm-accent px-3 py-1 rounded-full whitespace-nowrap">
                        Tu plan actual
                      </span>
                    )}
                    {featured && !isCurrent && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-warm-accent bg-white border border-warm-accent/30 px-3 py-1 rounded-full whitespace-nowrap">
                        Más elegido
                      </span>
                    )}
                    <h3 className="font-serif text-2xl text-warm-plum mb-1">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-warm-plum">
                        ${plan.price_usd}
                      </span>
                      <span className="text-sm text-warm-olive ml-1">
                        {billingLabel(plan)}
                      </span>
                    </div>
                    <ul className="space-y-2 mb-5 flex-1 text-sm">
                      {plan.highlights.slice(0, 5).map((h) => (
                        <li key={h} className="flex items-start gap-2 text-warm-plum">
                          <Check size={14} className="text-warm-accent shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <PlanButton
                      planId={id}
                      currentPlanId={currentPlanId}
                      loading={loading === id}
                      anyLoading={loading !== null}
                      onSubscribe={() => subscribe(id)}
                      onRequestCancel={() => {
                        onClose();
                        onRequestCancel();
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-warm-silver text-center mt-6">
              Si cambias entre planes pagos, cancelamos automáticamente tu suscripción
              anterior para no cobrarte dos veces.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PlanButton = ({
  planId,
  currentPlanId,
  loading,
  anyLoading,
  onSubscribe,
  onRequestCancel,
}: {
  planId: PlanId;
  currentPlanId: PlanId;
  loading: boolean;
  anyLoading: boolean;
  onSubscribe: () => void;
  onRequestCancel: () => void;
}) => {
  if (planId === currentPlanId) {
    return (
      <button
        type="button"
        disabled
        className="w-full bg-warm-fog text-warm-olive font-semibold px-4 py-2.5 rounded-2xl cursor-default"
      >
        Plan actual
      </button>
    );
  }

  if (PLANS[planId].billing === "free") {
    // Currently on a paid plan and they want to drop back → cancel.
    return (
      <button
        type="button"
        onClick={onRequestCancel}
        disabled={anyLoading}
        className="w-full bg-warm-fog hover:bg-warm-sand text-warm-plum font-semibold px-4 py-2.5 rounded-2xl transition disabled:opacity-50"
      >
        Cancelar suscripción
      </button>
    );
  }

  // Paid plan, not current → buy / add on. Anything further along
  // PLAN_ORDER than where they are counts as an upgrade.
  const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlanId);
  return (
    <button
      type="button"
      onClick={onSubscribe}
      disabled={anyLoading}
      className={`w-full inline-flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-2xl transition ${
        isUpgrade
          ? "bg-warm-accent hover:bg-warm-accent-hover text-white shadow-sm"
          : "bg-warm-fog hover:bg-warm-sand text-warm-plum"
      }`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Redirigiendo...
        </>
      ) : isUpgrade ? (
        <>
          <Sparkles size={14} />
          Suscribirme
          <ArrowRight size={14} />
        </>
      ) : (
        "Cambiar a este"
      )}
    </button>
  );
};
