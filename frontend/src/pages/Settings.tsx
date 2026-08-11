import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useEntitlements } from "../hooks/useEntitlements";
import { DEFAULT_PLAN, PLANS, type PlanId } from "../lib/plans";
import { PlanSelectorModal } from "../components/PlanSelectorModal";
import { DeadmanCard } from "../components/DeadmanCard";

type Account = {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: string;
  two_fa_enabled: boolean;
  created_at: string;
};

type TwoFaSetup = { secret: string; otpauth: string; qrDataUrl: string };

export const Settings = () => {
  useDocumentTitle("Ajustes");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const accountQ = useQuery({
    queryKey: ["account"],
    queryFn: async () => (await api.get<Account>("/account/me")).data,
  });

  if (accountQ.isLoading) {
    return <div className="card">Cargando...</div>;
  }
  if (!accountQ.data) {
    return <div className="card border-red-100 bg-red-50">No se pudo cargar la cuenta.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum transition"
      >
        <ArrowLeft size={16} /> Volver
      </Link>
      <div>
        <p className="eyebrow mb-2">
          Cuenta
        </p>
        <h1 className="font-serif text-4xl text-warm-plum">Ajustes</h1>
      </div>

      <BillingCard />
      <ProfileCard
        account={accountQ.data}
        onUpdated={() => qc.invalidateQueries({ queryKey: ["account"] })}
      />
      <PasswordCard />
      <DeadmanCard />
      <TwoFactorCard
        enabled={accountQ.data.two_fa_enabled}
        onChanged={() => qc.invalidateQueries({ queryKey: ["account"] })}
      />
      <DangerZone
        onDeleted={() => {
          logout();
          navigate("/login");
        }}
      />
    </motion.div>
  );
};

const formatLimit = (n: number) => (n === -1 ? "∞" : n.toLocaleString("es"));

const UsageBar = ({ label, used, limit, unit }: { label: string; used: number; limit: number; unit?: string }) => {
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const isUnlimited = limit === -1;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span className="text-warm-olive">{label}</span>
        <span className="font-mono text-xs text-warm-plum">
          {used.toLocaleString("es")}{unit ?? ""} / {isUnlimited ? "∞" : `${formatLimit(limit)}${unit ?? ""}`}
        </span>
      </div>
      <div className="h-1.5 bg-warm-fog rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isUnlimited
              ? "bg-warm-accent/60 w-full"
              : pct >= 90
              ? "bg-red-500"
              : pct >= 70
              ? "bg-amber-500"
              : "bg-warm-accent"
          }`}
          style={isUnlimited ? undefined : { width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const BillingCard = () => {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<
    null | "pending" | "applied" | "canceled"
  >(null);
  const pollingRef = useRef<number | null>(null);
  const planAtConfirmStart = useRef<PlanId | null>(null);

  const entQ = useEntitlements();
  const cancelMutation = useMutation({
    mutationFn: async () => api.post("/billing/cancel"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billing-me"] }),
  });
  const onCancel = () => {
    if (
      confirm(
        "¿Cancelar tu suscripción? Conservarás acceso hasta el final del periodo pagado."
      )
    ) {
      cancelMutation.mutate();
    }
  };

  // When we come back from MercadoPago, poll until the webhook lands and the
  // user's plan reflects the new tier.
  useEffect(() => {
    const upgrade = params.get("upgrade");
    if (!upgrade) return;
    if (upgrade === "success") {
      planAtConfirmStart.current = (entQ.data?.plan as PlanId) ?? DEFAULT_PLAN;
      setConfirmation("pending");
      // Drop the query param right away; we keep `confirmation` in local state.
      const next = new URLSearchParams(params);
      next.delete("upgrade");
      setParams(next, { replace: true });

      // Poll every 2s for up to 40s.
      let attempts = 0;
      const tick = window.setInterval(() => {
        attempts += 1;
        qc.invalidateQueries({ queryKey: ["billing-me"] });
        if (attempts >= 20) {
          window.clearInterval(tick);
          setConfirmation("applied");
        }
      }, 2000);
      pollingRef.current = tick;
    } else if (upgrade === "canceled") {
      setConfirmation("canceled");
      const next = new URLSearchParams(params);
      next.delete("upgrade");
      setParams(next, { replace: true });
    }
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect when polling sees a plan change → flip confirmation to "applied".
  useEffect(() => {
    if (
      confirmation === "pending" &&
      entQ.data?.plan &&
      planAtConfirmStart.current &&
      entQ.data.plan !== planAtConfirmStart.current
    ) {
      setConfirmation("applied");
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    }
  }, [confirmation, entQ.data?.plan]);

  if (entQ.isLoading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-warm-accent" />
          <h3 className="font-serif text-2xl text-warm-plum">Plan y uso</h3>
        </div>
        <p className="text-warm-olive text-sm">Cargando...</p>
      </div>
    );
  }

  if (!entQ.data) {
    const errMsg =
      (entQ.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
      (entQ.error as { message?: string })?.message ??
      "Error desconocido";
    return (
      <div className="card border-red-100 bg-red-50">
        <p className="text-red-700 text-sm font-semibold mb-1">No se pudo cargar el plan.</p>
        <p className="text-red-700 text-xs font-mono break-all">{errMsg}</p>
        <p className="text-red-700 text-xs mt-2">
          La causa más común: falta aplicar la migración 0006 en Supabase, o el backend
          no fue reiniciado después de añadir las rutas de billing. Mira la terminal del
          backend para el error completo.
        </p>
      </div>
    );
  }

  const { plan, limits, usage } = entQ.data;
  const planMeta = PLANS[plan];

  return (
    <>
      <ConfirmationBanner
        state={confirmation}
        currentPlanName={planMeta.name}
        onDismiss={() => setConfirmation(null)}
      />

      <div className="card relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-warm-accent/5 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-warm-accent" />
              <h3 className="font-serif text-2xl text-warm-plum">Plan y uso</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-warm-accent bg-warm-accent/10 px-3 py-1 rounded-full">
              {planMeta.name}
            </span>
          </div>
          <p className="text-warm-olive text-sm mb-6">{planMeta.tagline}</p>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <UsageBar label="Memory Vaults" used={usage.vaults} limit={limits.vaults} />
            <UsageBar label="Memoriales" used={usage.memorials} limit={limits.memorials} />
            <UsageBar
              label="Biografías IA (mes)"
              used={usage.biography_generations_this_month}
              limit={limits.biography_generations_per_month}
            />
            <UsageBar
              label="Mensajes de chat (mes)"
              used={usage.chat_messages_this_month}
              limit={limits.chat_messages_per_month}
            />
            <UsageBar
              label="Almacenamiento"
              used={usage.storage_mb}
              limit={limits.storage_mb}
              unit=" MB"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Sparkles size={16} />
              {PLANS[plan as PlanId].billing === "free" ? "Elegir un plan" : "Cambiar de plan"}
              <ArrowRight size={14} />
            </button>
            {PLANS[plan as PlanId].billing === "monthly" && (
              <button
                onClick={onCancel}
                disabled={cancelMutation.isPending}
                className="btn-secondary inline-flex items-center gap-2"
              >
                {cancelMutation.isPending ? "Cancelando..." : "Cancelar suscripción"}
              </button>
            )}
          </div>
        </div>
      </div>

      <PlanSelectorModal
        open={selectorOpen}
        currentPlanId={plan}
        onClose={() => setSelectorOpen(false)}
        onRequestCancel={onCancel}
      />
    </>
  );
};

const ConfirmationBanner = ({
  state,
  currentPlanName,
  onDismiss,
}: {
  state: null | "pending" | "applied" | "canceled";
  currentPlanName: string;
  onDismiss: () => void;
}) => {
  return (
    <AnimatePresence>
      {state === "pending" && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="card border-warm-accent/40 bg-warm-accent/5 mb-2 flex items-center gap-3"
        >
          <motion.div
            className="w-10 h-10 rounded-2xl bg-warm-accent/15 flex items-center justify-center shrink-0"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={20} className="text-warm-accent" />
          </motion.div>
          <div className="flex-1">
            <p className="font-bold text-warm-plum">Estamos verificando tu pago...</p>
            <p className="text-sm text-warm-olive">
              Tu plan se actualizará automáticamente en unos segundos.
            </p>
          </div>
        </motion.div>
      )}
      {state === "applied" && (
        <motion.div
          key="applied"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className="card border-warm-accent/50 bg-warm-accent/10 mb-2 flex items-center gap-3 relative"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 text-warm-silver hover:text-warm-plum p-1 rounded-lg"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-warm-accent/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} className="text-warm-accent" />
          </div>
          <div className="flex-1 pr-6">
            <p className="font-bold text-warm-plum">¡Pago confirmado!</p>
            <p className="text-sm text-warm-olive">
              Tu plan ahora es <strong>{currentPlanName}</strong>. Gracias por apoyar Presence.
            </p>
          </div>
        </motion.div>
      )}
      {state === "canceled" && (
        <motion.div
          key="canceled"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="card border-warm-sand bg-warm-fog/40 mb-2 flex items-center gap-3 relative"
        >
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 text-warm-silver hover:text-warm-plum p-1 rounded-lg"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
          <div className="flex-1 pr-6">
            <p className="font-bold text-warm-plum">Pago cancelado</p>
            <p className="text-sm text-warm-olive">
              No se realizó ningún cobro. Puedes intentarlo otra vez cuando quieras.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProfileCard = ({ account, onUpdated }: { account: Account; onUpdated: () => void }) => {
  const [fullName, setFullName] = useState(account.full_name ?? "");
  const [saved, setSaved] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      await api.put("/account/profile", { full_name: fullName });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      onUpdated();
    },
  });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <UserCog size={18} className="text-warm-accent" />
        <h3 className="font-serif text-2xl text-warm-plum">Perfil</h3>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Email
          </label>
          <input className="input bg-warm-fog/50 cursor-not-allowed" value={account.email} disabled />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Nombre completo
          </label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </button>
          {saved && <span className="text-sm text-warm-accent">Guardado</span>}
        </div>
      </form>
    </div>
  );
};

const PasswordCard = () => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.put("/account/password", { current_password: current, new_password: next });
    },
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setMsg({ type: "ok", text: "Contraseña actualizada." });
    },
    onError: (err: unknown) => {
      const text =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo cambiar.";
      setMsg({ type: "err", text });
    },
  });

  return (
    <div className="card">
      <h3 className="font-serif text-2xl text-warm-plum mb-4">Contraseña</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          if (next.length < 8) {
            setMsg({ type: "err", text: "La nueva debe tener al menos 8 caracteres." });
            return;
          }
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Contraseña actual
          </label>
          <div className="relative">
            <input
              className="input pr-12"
              type={show1 ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow1((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-silver hover:text-warm-plum"
            >
              {show1 ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              className="input pr-12"
              type={show2 ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow2((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-silver hover:text-warm-plum"
            >
              {show2 ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        {msg && (
          <p
            className={`text-sm px-3 py-2 rounded-xl ${
              msg.type === "ok"
                ? "bg-warm-accent/10 text-warm-accent"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {msg.text}
          </p>
        )}
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
};

const TwoFactorCard = ({ enabled, onChanged }: { enabled: boolean; onChanged: () => void }) => {
  const [setup, setSetup] = useState<TwoFaSetup | null>(null);
  const [code, setCode] = useState("");
  const [disablePwd, setDisablePwd] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const startMutation = useMutation({
    mutationFn: async () => (await api.post<TwoFaSetup>("/account/2fa/start")).data,
    onSuccess: (data) => setSetup(data),
  });
  const verifyMutation = useMutation({
    mutationFn: async () => api.post("/account/2fa/verify", { code }),
    onSuccess: () => {
      setSetup(null);
      setCode("");
      setMsg({ type: "ok", text: "2FA activado. La próxima vez te pedirá el código." });
      onChanged();
    },
    onError: () => setMsg({ type: "err", text: "Código inválido. Vuelve a intentar." }),
  });
  const disableMutation = useMutation({
    mutationFn: async () => api.post("/account/2fa/disable", { password: disablePwd }),
    onSuccess: () => {
      setDisablePwd("");
      setShowDisable(false);
      setMsg({ type: "ok", text: "2FA desactivado." });
      onChanged();
    },
    onError: () => setMsg({ type: "err", text: "Contraseña incorrecta." }),
  });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-warm-accent" />
        <h3 className="font-serif text-2xl text-warm-plum">Autenticación de 2 factores</h3>
      </div>
      <p className="text-sm text-warm-olive mb-4">
        Añade una capa extra de seguridad con una app autenticadora (Google Authenticator, 1Password, Authy).
      </p>

      {enabled ? (
        <>
          <p className="inline-flex items-center gap-2 text-sm font-bold text-warm-accent bg-warm-accent/10 px-3 py-1.5 rounded-full mb-4">
            <Shield size={14} /> Activado
          </p>
          {!showDisable ? (
            <button
              type="button"
              onClick={() => setShowDisable(true)}
              className="btn-secondary"
            >
              Desactivar 2FA
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                disableMutation.mutate();
              }}
              className="space-y-3"
            >
              <input
                className="input"
                type="password"
                placeholder="Confirma tu contraseña"
                value={disablePwd}
                onChange={(e) => setDisablePwd(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  Confirmar desactivar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDisable(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </>
      ) : !setup ? (
        <button type="button" onClick={() => startMutation.mutate()} className="btn-primary">
          {startMutation.isPending ? "Generando..." : "Activar 2FA"}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-warm-olive">
            Escanea este QR con tu app autenticadora, o ingresa el secret manualmente.
          </p>
          <img
            src={setup.qrDataUrl}
            alt="QR de 2FA"
            className="w-48 h-48 border border-warm-sand rounded-2xl p-2 bg-white"
          />
          <p className="text-xs font-mono text-warm-silver break-all">
            Secret: {setup.secret}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyMutation.mutate();
            }}
            className="space-y-3"
          >
            <input
              className="input"
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              required
            />
            <button type="submit" disabled={verifyMutation.isPending} className="btn-primary">
              {verifyMutation.isPending ? "Verificando..." : "Verificar y activar"}
            </button>
          </form>
        </div>
      )}

      {msg && (
        <p
          className={`mt-4 text-sm px-3 py-2 rounded-xl ${
            msg.type === "ok"
              ? "bg-warm-accent/10 text-warm-accent"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
};

const DangerZone = ({ onDeleted }: { onDeleted: () => void }) => {
  const [password, setPassword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.delete("/account", { data: { password } });
    },
    onSuccess: onDeleted,
    onError: () => setError("Contraseña incorrecta."),
  });

  return (
    <div className="card border-red-200">
      <div className="flex items-center gap-2 mb-4">
        <Trash2 size={18} className="text-red-700" />
        <h3 className="font-serif text-2xl text-red-700">Zona peligrosa</h3>
      </div>
      <p className="text-sm text-warm-olive mb-4">
        Eliminar tu cuenta es permanente. Se borran todos tus vaults, archivos, memoriales,
        conversaciones y accesos compartidos. No hay vuelta atrás.
      </p>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-5 py-2.5 rounded-2xl transition border border-red-200"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            if (
              confirm(
                "Confirmas eliminar tu cuenta? Esta acción es PERMANENTE."
              )
            ) {
              mutation.mutate();
            }
          }}
          className="space-y-3"
        >
          <input
            className="input"
            type="password"
            placeholder="Confirma con tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-700 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-2xl transition"
            >
              Sí, eliminar permanentemente
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
