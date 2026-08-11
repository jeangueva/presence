import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PLANS, type PlanId } from "../lib/plans";
import {
  loadMercadoPagoSdk,
  tokenColor,
  type BrickController,
  type BrickFormData,
} from "../lib/mercadopago";

type LivePricing = {
  enabled: boolean;
  currency: string;
  public_key: string | null;
  plans: Record<PlanId, { billing: string; amount: number | null; purchasable: boolean }>;
};

type Phase = "loading" | "ready" | "approved" | "pending" | "error";

const CONTAINER_ID = "presence-payment-brick";

/**
 * Checkout on Presence's own page, using MercadoPago's Payment Brick.
 *
 * The card fields live inside MercadoPago-controlled iframes, so the raw card
 * number never touches our JavaScript, our servers or our logs — we only ever
 * see the single-use token the Brick hands back.
 */
export const Checkout = () => {
  const { plan: planParam } = useParams<{ plan: string }>();
  const planId = (planParam ?? "") as PlanId;
  const plan = PLANS[planId];

  useDocumentTitle(plan ? `Comprar ${plan.name}` : "Checkout");
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [phase, setPhase] = useState<Phase>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const controllerRef = useRef<BrickController | null>(null);

  useEffect(() => {
    if (!plan || plan.billing !== "one_time") {
      navigate("/pricing", { replace: true });
      return;
    }

    let cancelled = false;

    const boot = async () => {
      try {
        const { data: pricing } = await api.get<LivePricing>("/billing/pricing");
        if (cancelled) return;

        const amount = pricing.plans[planId]?.amount;
        if (!pricing.enabled || !pricing.public_key || amount == null) {
          setPhase("error");
          setMessage(
            "Los pagos no están configurados en este servidor todavía. Escríbenos y lo resolvemos."
          );
          return;
        }

        await loadMercadoPagoSdk();
        if (cancelled || !window.MercadoPago) return;

        const mp = new window.MercadoPago(pricing.public_key, { locale: "es-CO" });
        const controller = await mp.bricks().create("payment", CONTAINER_ID, {
          initialization: {
            amount,
            payer: { email: user?.email },
          },
          customization: {
            visual: {
              hideFormTitle: true,
              style: {
                // Pulled from tokens.css so the Brick restyles with the rest of
                // the system instead of drifting into MercadoPago's blue.
                customVariables: {
                  baseColor: tokenColor("--ink", "#000000"),
                  baseColorFirstVariant: tokenColor("--ink-hover", "#2b2b2b"),
                  textPrimaryColor: tokenColor("--ink", "#000000"),
                  textSecondaryColor: tokenColor("--muted", "#6F6F6F"),
                  inputBackgroundColor: tokenColor("--canvas", "#ffffff"),
                  formBackgroundColor: tokenColor("--canvas", "#ffffff"),
                  borderColor: tokenColor("--hairline", "#E8E8E8"),
                  fontSizeExtraSmall: "12px",
                  fontSizeSmall: "14px",
                  fontSizeMedium: "16px",
                  formPadding: "0px",
                  borderRadiusSmall: "12px",
                  borderRadiusMedium: "16px",
                  borderRadiusLarge: "9999px",
                },
              },
            },
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              // Colombia runs on PSE and cash vouchers as much as on cards —
              // leaving these off would quietly cost a chunk of conversions.
              bankTransfer: "all",
              ticket: "all",
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setPhase("ready");
            },
            onSubmit: async ({ formData }: { formData: BrickFormData }) => {
              setMessage(null);

              let status: string;
              try {
                const { data } = await api.post<{
                  status: string;
                  status_detail: string | null;
                }>("/billing/process-payment", { plan: planId, formData });
                status = data.status;
              } catch (err) {
                const e = err as AxiosError<{ error?: string }>;
                setMessage(e.response?.data?.error ?? "No pudimos procesar el pago.");
                // Re-throw so the Brick clears its own loading state.
                throw err;
              }

              if (status === "approved") {
                setPhase("approved");
                return;
              }
              if (status === "in_process" || status === "pending") {
                setPhase("pending");
                return;
              }

              // Declined. The rejection has to happen outside the catch above,
              // or that catch would replace this specific message with the
              // generic network one. The Brick reads a resolved promise as
              // success, so rejecting is what re-enables the form for a retry.
              setMessage("El pago fue rechazado. Revisa los datos o prueba con otro medio.");
              throw new Error(`payment_${status}`);
            },
            onError: (error: unknown) => {
              console.error("[checkout] brick error:", error);
              if (!cancelled) {
                setMessage("Algo falló en el formulario de pago. Recarga e intenta de nuevo.");
              }
            },
          },
        });

        if (cancelled) {
          controller.unmount();
          return;
        }
        controllerRef.current = controller;
      } catch (err) {
        console.error("[checkout] init failed:", err);
        if (!cancelled) {
          setPhase("error");
          setMessage("No pudimos abrir el checkout. Revisa tu conexión e intenta de nuevo.");
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      // Bricks leak their iframes across route changes if not unmounted.
      controllerRef.current?.unmount();
      controllerRef.current = null;
    };
  }, [planId, plan, navigate, user?.email]);

  if (!plan) return null;

  if (phase === "approved" || phase === "pending") {
    const approved = phase === "approved";
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-6 animate-page-fade">
        <div className="max-w-md w-full text-center">
          <CheckCircle2 size={40} className="mx-auto text-warm-plum" />
          <h1 className="font-serif text-4xl text-warm-plum mt-6 leading-tight">
            {approved ? "Listo. Legado es tuyo." : "Tu pago está en proceso."}
          </h1>
          <p className="text-warm-olive mt-4 leading-relaxed">
            {approved
              ? "Un solo pago, sin suscripción. Ya puedes empezar a dejar todo dicho."
              : "Algunos medios de pago tardan unas horas en confirmarse. Te escribiremos en cuanto se acredite y el acceso se activa solo."}
          </p>
          <Link to="/app/legacy" className="btn-primary inline-block mt-8">
            {approved ? "Empezar mi legado" : "Ir a mi cuenta"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas animate-page-fade">
      <div className="max-w-lg mx-auto px-6 py-10">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum transition"
        >
          <ArrowLeft size={16} /> Volver a precios
        </Link>

        <div className="mt-8">
          <p className="eyebrow mb-2">Pago único</p>
          <h1 className="font-serif text-4xl text-warm-plum leading-tight">
            {plan.name}
          </h1>
          <p className="text-warm-olive mt-2">{plan.tagline}</p>
        </div>

        {message && (
          <p className="text-sm text-danger bg-danger-fill border border-danger-hairline rounded-card px-4 py-3 mt-6">
            {message}
          </p>
        )}

        {phase === "loading" && (
          <div className="flex items-center gap-3 text-warm-olive mt-10">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm">Preparando el pago seguro…</span>
          </div>
        )}

        {/* Kept mounted across phases — the Brick attaches to this node and
            unmounting it mid-flow would tear the iframe out from under it. */}
        <div id={CONTAINER_ID} className="mt-8" />

        {phase !== "error" && (
          <p className="text-xs text-warm-silver flex items-start gap-1.5 mt-8 leading-relaxed">
            <Lock size={12} className="mt-0.5 shrink-0" />
            Los datos de tu tarjeta se procesan directamente con MercadoPago.
            Presence nunca los ve ni los guarda.
          </p>
        )}
      </div>
    </div>
  );
};
