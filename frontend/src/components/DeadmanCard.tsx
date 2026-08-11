import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, HeartPulse, Plus, Trash2, X } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../lib/api";

type DeadmanConfig = {
  enabled: boolean;
  interval_days: number;
  grace_days: number;
  required_confirmations: number;
  state: "active" | "overdue" | "grace" | "triggered" | "paused";
  last_checkin_at: string | null;
  next_checkin_due_at: string | null;
};

type Contact = {
  id: string;
  full_name: string;
  email: string;
  relationship: string | null;
  confirmed_at: string | null;
};

type Status = {
  config: DeadmanConfig | null;
  contacts: Contact[];
  confirmations: number;
};

const STATE_COPY: Record<DeadmanConfig["state"], { label: string; tone: string }> = {
  active: { label: "Activo", tone: "bg-warm-accent/10 text-warm-accent" },
  overdue: { label: "Esperando tu respuesta", tone: "bg-warm-fog text-warm-olive" },
  grace: { label: "Consultando a tus contactos", tone: "bg-danger-fill text-danger" },
  triggered: { label: "Mensajes entregados", tone: "bg-warm-fog text-warm-olive" },
  paused: { label: "En pausa", tone: "bg-warm-fog text-warm-silver" },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "—";

/**
 * The dead-man's switch. This is what makes posthumous delivery work without a
 * registry integration or a human verifying a death certificate: the user
 * proves they are alive on their own schedule, and prolonged silence plus
 * confirmation from their own nominated contacts is the trigger.
 */
export const DeadmanCard = () => {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ full_name: "", email: "", relationship: "" });
  const [settings, setSettings] = useState({
    interval_days: 90,
    grace_days: 30,
    required_confirmations: 2,
  });

  const statusQ = useQuery({
    queryKey: ["deadman"],
    queryFn: async () => (await api.get<Status>("/deadman")).data,
  });

  useEffect(() => {
    if (statusQ.data?.config) {
      const c = statusQ.data.config;
      setSettings({
        interval_days: c.interval_days,
        grace_days: c.grace_days,
        required_confirmations: c.required_confirmations,
      });
    }
  }, [statusQ.data?.config]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["deadman"] });
  const onError = (err: unknown) =>
    setError(
      (err as AxiosError<{ error?: string }>).response?.data?.error ??
        "No se pudo guardar el cambio."
    );

  const saveConfig = useMutation({
    mutationFn: async (patch: Partial<DeadmanConfig>) => api.put("/deadman", patch),
    onSuccess: () => {
      setError(null);
      refresh();
    },
    onError,
  });

  const checkin = useMutation({
    mutationFn: async () => api.post("/deadman/checkin"),
    onSuccess: refresh,
  });

  const addContact = useMutation({
    mutationFn: async () => api.post("/deadman/contacts", contactForm),
    onSuccess: () => {
      setContactForm({ full_name: "", email: "", relationship: "" });
      setShowContactForm(false);
      setError(null);
      refresh();
    },
    onError,
  });

  const removeContact = useMutation({
    mutationFn: async (id: string) => api.delete(`/deadman/contacts/${id}`),
    onSuccess: refresh,
  });

  const config = statusQ.data?.config;
  const contacts = statusQ.data?.contacts ?? [];
  const enabled = !!config?.enabled;
  const state = config?.state ?? "paused";

  return (
    <div className="card space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-2">
          <HeartPulse size={20} className="text-warm-accent mt-1 shrink-0" />
          <div>
            <h3 className="font-serif text-2xl text-warm-plum">Check-in de vida</h3>
            <p className="text-sm text-warm-olive mt-1 max-w-md">
              Te escribimos cada cierto tiempo. Si dejas de responder, preguntamos
              a tus contactos de confianza — y solo si ellos confirman, entregamos
              tus mensajes póstumos.
            </p>
          </div>
        </div>
        {enabled && (
          <span
            className={`text-xs font-medium px-3 py-1.5 rounded-pill shrink-0 ${STATE_COPY[state].tone}`}
          >
            {STATE_COPY[state].label}
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger-fill border border-danger-hairline rounded-card px-4 py-3">
          {error}
        </p>
      )}

      {/* Contacts first: the switch cannot be armed without them, so asking for
          the schedule before the people would be a dead end. */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-eyebrow text-warm-olive">
            Contactos de confianza
          </p>
          <button
            type="button"
            onClick={() => setShowContactForm((v) => !v)}
            className="text-sm text-warm-olive hover:text-warm-plum transition inline-flex items-center gap-1"
          >
            {showContactForm ? <X size={14} /> : <Plus size={14} />}
            {showContactForm ? "Cancelar" : "Añadir"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showContactForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              onSubmit={(e) => {
                e.preventDefault();
                addContact.mutate();
              }}
            >
              <div className="space-y-2 pb-4">
                <input
                  className="input"
                  placeholder="Nombre completo"
                  required
                  value={contactForm.full_name}
                  onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })}
                />
                <input
                  className="input"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Relación (hermana, amigo, abogado…)"
                  value={contactForm.relationship}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, relationship: e.target.value })
                  }
                />
                <button
                  type="submit"
                  disabled={addContact.isPending}
                  className="btn-primary w-full"
                >
                  {addContact.isPending ? "Guardando…" : "Añadir contacto"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {contacts.length === 0 ? (
          <p className="text-sm text-warm-silver italic">
            Nadie designado todavía. Elige personas que no hereden nada — quien
            recibe algo no debería ser quien confirma.
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 border border-warm-sand rounded-panel px-4 py-2.5"
              >
                <div className="w-9 h-9 rounded-full bg-warm-light text-warm-plum font-medium text-sm flex items-center justify-center shrink-0">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-plum truncate">{c.full_name}</p>
                  <p className="text-xs text-warm-silver truncate">
                    {c.email}
                    {c.relationship ? ` · ${c.relationship}` : ""}
                  </p>
                </div>
                {c.confirmed_at && <Check size={16} className="text-danger shrink-0" />}
                <button
                  type="button"
                  onClick={() => removeContact.mutate(c.id)}
                  disabled={removeContact.isPending}
                  className="text-warm-silver hover:text-warm-plum transition p-1.5 shrink-0"
                  aria-label={`Quitar a ${c.full_name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-eyebrow text-warm-olive">
            Cada
          </span>
          <select
            className="input mt-2"
            value={settings.interval_days}
            onChange={(e) =>
              saveConfig.mutate({ interval_days: Number(e.target.value) })
            }
          >
            <option value={30}>30 días</option>
            <option value={90}>3 meses</option>
            <option value={180}>6 meses</option>
            <option value={365}>1 año</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-eyebrow text-warm-olive">
            Margen
          </span>
          <select
            className="input mt-2"
            value={settings.grace_days}
            onChange={(e) => saveConfig.mutate({ grace_days: Number(e.target.value) })}
          >
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-eyebrow text-warm-olive">
            Confirmaciones
          </span>
          <select
            className="input mt-2"
            value={settings.required_confirmations}
            onChange={(e) =>
              saveConfig.mutate({ required_confirmations: Number(e.target.value) })
            }
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n} disabled={n > contacts.length && contacts.length > 0}>
                {n} persona{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {enabled && (
        <div className="flex items-center justify-between gap-4 flex-wrap bg-warm-fog rounded-panel px-4 py-3">
          <div className="text-sm">
            <p className="text-warm-plum">
              Último check-in: <strong>{fmt(config?.last_checkin_at ?? null)}</strong>
            </p>
            <p className="text-warm-silver text-xs mt-0.5">
              Próximo aviso: {fmt(config?.next_checkin_due_at ?? null)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => checkin.mutate()}
            disabled={checkin.isPending}
            className="btn-secondary"
          >
            {checkin.isPending ? "Registrando…" : "Estoy bien"}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
        <p className="text-xs text-warm-silver max-w-sm">
          {enabled
            ? "Puedes pausarlo cuando quieras. En pausa no se envía nada."
            : "Necesitas al menos un mensaje póstumo escrito y tantos contactos como confirmaciones pidas."}
        </p>
        <button
          type="button"
          onClick={() => saveConfig.mutate({ enabled: !enabled, ...settings })}
          disabled={saveConfig.isPending}
          className={enabled ? "btn-secondary" : "btn-primary"}
        >
          {saveConfig.isPending
            ? "Guardando…"
            : enabled
              ? "Pausar check-in"
              : "Activar check-in"}
        </button>
      </div>
    </div>
  );
};
