import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FileText,
  Lock,
  MessageSquareHeart,
  Plus,
  Scroll,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type TabKey = "wishes" | "estate" | "messages" | "will";

/**
 * Three ordered steps and a terminal one. The previous version was six
 * independent tabs with no order and no end state — you could fill everything
 * and still never reach a moment where the product said "listo". People buying
 * estate planning are buying that moment, so the flow now has one.
 */
const STEPS: {
  key: TabKey;
  step: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
}[] = [
  {
    key: "wishes",
    step: "01",
    label: "Tus deseos",
    blurb: "Cómo quieres ser recordada/o: ceremonia, música, despedida.",
    icon: Scroll,
  },
  {
    key: "estate",
    step: "02",
    label: "Tu patrimonio",
    blurb: "Bienes, herederos y albacea de confianza.",
    icon: ScrollText,
  },
  {
    key: "messages",
    step: "03",
    label: "Tus mensajes",
    blurb: "Cartas que se entregan a personas concretas después.",
    icon: MessageSquareHeart,
  },
];

const FINAL_STEP = {
  key: "will" as const,
  label: "Tu documento",
  blurb: "Se arma solo con lo que escribiste en los tres pasos.",
  icon: FileText,
};

const ALL_SECTIONS = [...STEPS, FINAL_STEP];

/**
 * Status for each legacy module, derived from the *same* react-query keys the
 * module tabs use — so the cache is shared and the hub shows real completeness
 * without duplicate fetches.
 */
const useLegacyStatus = (): Record<TabKey, boolean> => {
  const wishes = useQuery({
    queryKey: ["legacy-wishes"],
    queryFn: async () =>
      (await api.get<Record<string, unknown> | null>("/legacy/final-wishes")).data,
  });
  const estate = useQuery({
    queryKey: ["legacy-estate"],
    queryFn: async () =>
      (await api.get<Record<string, unknown> | null>("/legacy/estate")).data,
  });
  const heirs = useQuery({
    queryKey: ["legacy-heirs"],
    queryFn: async () =>
      (await api.get<{ entries: unknown[] }>("/legacy/estate/heirs")).data.entries,
  });
  const assets = useQuery({
    queryKey: ["legacy-assets"],
    queryFn: async () =>
      (await api.get<{ entries: unknown[] }>("/legacy/estate/assets")).data.entries,
  });
  const messages = useQuery({
    queryKey: ["legacy-posthumous"],
    queryFn: async () =>
      (await api.get<{ entries: unknown[] }>("/legacy/posthumous-messages")).data.entries,
  });
  const will = useQuery({
    queryKey: ["legacy-will"],
    queryFn: async () =>
      (await api.get<{ status?: string } | null>("/legacy/will")).data,
  });

  const hasAnyValue = (obj: Record<string, unknown> | null | undefined) =>
    !!obj && Object.values(obj).some((v) => v !== null && v !== undefined && v !== "");

  return {
    wishes: hasAnyValue(wishes.data),
    estate:
      hasAnyValue(estate.data) ||
      (heirs.data?.length ?? 0) > 0 ||
      (assets.data?.length ?? 0) > 0,
    messages: (messages.data?.length ?? 0) > 0,
    will: will.data?.status === "sealed",
  };
};

export const Legacy = () => {
  useDocumentTitle("Mi legado");
  const [section, setSection] = useState<TabKey | null>(null);
  const status = useLegacyStatus();

  // Progress counts the three input steps only. The document is the reward for
  // finishing them, not a fourth chore — including it would leave the bar at
  // 75% for someone who has actually said everything they wanted to say.
  const doneCount = STEPS.filter((s) => status[s.key]).length;
  const pct = Math.round((doneCount / STEPS.length) * 100);
  const allStepsDone = doneCount === STEPS.length;
  const sealed = status.will;
  const active = ALL_SECTIONS.find((s) => s.key === section);
  const nextStep = STEPS.find((s) => !status[s.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <p className="eyebrow mb-2">
          Para prepararte tú
        </p>
        <h1 className="font-serif text-4xl text-warm-plum">Mi legado</h1>
        <p className="text-warm-olive mt-2 max-w-2xl">
          Lo que tu familia necesitará saber el día que no estés. Todo se guarda
          cifrado. Tú decides cuándo y cómo se libera.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!section && (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Progress + the single next action */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-warm-plum">
                  {sealed
                    ? "Tu legado está listo y sellado"
                    : allStepsDone
                      ? "Ya contaste todo. Falta generar tu documento."
                      : `Paso ${doneCount + 1} de ${STEPS.length}`}
                </p>
                <span className="text-xs text-warm-silver">{pct}%</span>
              </div>
              <div className="h-2.5 rounded-pill bg-warm-fog overflow-hidden">
                <motion.div
                  className="h-full rounded-pill bg-warm-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              {!sealed && (
                <button
                  type="button"
                  onClick={() => setSection(allStepsDone ? "will" : nextStep!.key)}
                  className="btn-primary mt-5 inline-flex items-center gap-2"
                >
                  {allStepsDone
                    ? "Generar mi documento"
                    : doneCount === 0
                      ? "Empezar"
                      : `Continuar con ${nextStep!.label.toLowerCase()}`}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {/* The three steps, in order */}
            <ol className="space-y-3">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const done = status[s.key];
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setSection(s.key)}
                      className="w-full text-left card flex items-start gap-4 hover:border-warm-silver transition group"
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition ${
                          done
                            ? "bg-warm-accent text-on-ink"
                            : "bg-warm-light text-warm-plum"
                        }`}
                      >
                        {done ? <Check size={20} /> : <Icon size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-warm-silver tabular-nums">
                            {s.step}
                          </span>
                          <h3 className="font-serif text-xl text-warm-plum">{s.label}</h3>
                        </div>
                        <p className="text-sm text-warm-olive mt-1 leading-relaxed">
                          {s.blurb}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-warm-silver group-hover:text-warm-accent transition shrink-0 mt-1"
                      />
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* The terminal step reads as the payoff, not a fourth chore */}
            <button
              type="button"
              onClick={() => setSection("will")}
              disabled={!allStepsDone && !sealed}
              className={`w-full text-left rounded-panel p-6 flex items-start gap-4 transition group ${
                allStepsDone || sealed
                  ? "bg-warm-dark text-on-ink hover:scale-[1.005]"
                  : "border border-dashed border-warm-sand text-warm-silver cursor-not-allowed"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  allStepsDone || sealed ? "bg-white/10" : "bg-warm-fog"
                }`}
              >
                {sealed ? <Lock size={20} /> : <FileText size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-serif text-xl ${
                    allStepsDone || sealed ? "text-on-ink" : "text-warm-silver"
                  }`}
                >
                  {FINAL_STEP.label}
                </h3>
                <p
                  className={`text-sm mt-1 leading-relaxed ${
                    allStepsDone || sealed ? "text-white/60" : "text-warm-silver"
                  }`}
                >
                  {sealed
                    ? "Sellado. Puedes descargarlo o volver a generarlo cuando cambies algo."
                    : allStepsDone
                      ? FINAL_STEP.blurb
                      : "Se desbloquea cuando completes los tres pasos."}
                </p>
              </div>
            </button>

            <p className="text-xs text-warm-silver flex items-center gap-1.5">
              <Lock size={12} /> Cifrado en reposo. Solo se libera según tus instrucciones.
            </p>
          </motion.div>
        )}

        {section && (
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={() => setSection(null)}
              className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum transition"
            >
              <ArrowLeft size={16} /> Volver a Mi legado
            </button>
            {active && (
              <h2 className="font-serif text-3xl text-warm-plum flex items-center gap-2">
                <active.icon size={22} className="text-warm-accent" />
                {active.label}
              </h2>
            )}
            {section === "wishes" && <WishesTab />}
            {section === "estate" && <EstateTab />}
            {section === "messages" && <MessagesTab />}
            {section === "will" && <WillTab />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------- Generic helpers ----------

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
      {label}
    </label>
    {children}
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <p className="text-sm text-warm-silver italic text-center py-6">{message}</p>
);

// ---------- Final wishes ----------

type FinalWishes = {
  disposition?: "burial" | "cremation" | "donation" | "other" | null;
  ceremony_notes?: string | null;
  religious_wishes?: string | null;
  music_readings?: string | null;
  obituary?: string | null;
  special_requests?: string | null;
};

const dispLabel: Record<string, string> = {
  burial: "Entierro",
  cremation: "Cremación",
  donation: "Donación al cuerpo médico",
  other: "Otro",
};

const WishesTab = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["legacy-wishes"],
    queryFn: async () => (await api.get<FinalWishes | null>("/legacy/final-wishes")).data,
  });
  const [form, setForm] = useState<FinalWishes>({});
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: async () => api.put("/legacy/final-wishes", form),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ["legacy-wishes"] });
    },
  });

  // Hydrate from the server once the query resolves. The previous version
  // did `Object.assign(form, q.data)` during render — that mutates state in
  // place without scheduling a re-render, so saved answers only appeared if
  // something else happened to re-render the form.
  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  return (
    <form
      className="card space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <div>
        <h3 className="font-serif text-2xl text-warm-plum">Cómo quieres ser recordada/o</h3>
        <p className="text-sm text-warm-olive mt-1">
          Todo es opcional. Llena lo que te resuene; lo demás puede quedar en blanco.
        </p>
      </div>

      <Field label="Disposición del cuerpo">
        <select
          className="input"
          value={form.disposition ?? ""}
          onChange={(e) => setForm({ ...form, disposition: (e.target.value || null) as FinalWishes["disposition"] })}
        >
          <option value="">— Sin definir —</option>
          {Object.entries(dispLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Notas sobre la ceremonia">
        <textarea className="input min-h-[80px] resize-y" value={form.ceremony_notes ?? ""} onChange={(e) => setForm({ ...form, ceremony_notes: e.target.value })} />
      </Field>
      <Field label="Aspectos religiosos / espirituales">
        <textarea className="input min-h-[80px] resize-y" value={form.religious_wishes ?? ""} onChange={(e) => setForm({ ...form, religious_wishes: e.target.value })} />
      </Field>
      <Field label="Música y lecturas">
        <textarea className="input min-h-[80px] resize-y" value={form.music_readings ?? ""} onChange={(e) => setForm({ ...form, music_readings: e.target.value })} />
      </Field>
      <Field label="Obituario sugerido">
        <textarea className="input min-h-[80px] resize-y" value={form.obituary ?? ""} onChange={(e) => setForm({ ...form, obituary: e.target.value })} />
      </Field>
      <Field label="Solicitudes especiales">
        <textarea className="input min-h-[80px] resize-y" value={form.special_requests ?? ""} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
      </Field>
      <div className="flex items-center gap-3 justify-end">
        {saved && <span className="text-sm text-warm-accent">Guardado</span>}
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? "Guardando..." : "Guardar últimos deseos"}
        </button>
      </div>
    </form>
  );
};

// ---------- Estate (summary + heirs + assets) ----------

type Estate = {
  summary?: string | null;
  executor_name?: string | null;
  executor_email?: string | null;
  executor_phone?: string | null;
  notary_info?: string | null;
};
type Heir = {
  id: string;
  full_name: string;
  email?: string | null;
  relationship?: string | null;
  inheritance_share?: string | null;
  notes?: string | null;
};
type Asset = {
  id: string;
  name: string;
  asset_type?: string | null;
  description?: string | null;
  approximate_value?: string | null;
  location?: string | null;
};

const EstateTab = () => {
  const qc = useQueryClient();
  const estateQ = useQuery({
    queryKey: ["legacy-estate"],
    queryFn: async () => (await api.get<Estate | null>("/legacy/estate")).data,
  });
  const heirsQ = useQuery({
    queryKey: ["legacy-heirs"],
    queryFn: async () => (await api.get<{ entries: Heir[] }>("/legacy/estate/heirs")).data.entries,
  });
  const assetsQ = useQuery({
    queryKey: ["legacy-assets"],
    queryFn: async () => (await api.get<{ entries: Asset[] }>("/legacy/estate/assets")).data.entries,
  });

  const [form, setForm] = useState<Estate>({});
  const [savedEstate, setSavedEstate] = useState(false);
  // hydrate once when estate loads
  // Same in-place-mutation bug as WishesTab had: assigning during render never
  // schedules an update, so the saved estate silently failed to populate.
  useEffect(() => {
    if (estateQ.data) setForm(estateQ.data);
  }, [estateQ.data]);
  const saveEstate = useMutation({
    mutationFn: async () => api.put("/legacy/estate", form),
    onSuccess: () => {
      setSavedEstate(true);
      setTimeout(() => setSavedEstate(false), 2000);
      qc.invalidateQueries({ queryKey: ["legacy-estate"] });
    },
  });

  // heir form
  const [showHeirForm, setShowHeirForm] = useState(false);
  const [heirForm, setHeirForm] = useState<Partial<Heir>>({});
  const createHeir = useMutation({
    mutationFn: async () => api.post("/legacy/estate/heirs", heirForm),
    onSuccess: () => {
      setHeirForm({});
      setShowHeirForm(false);
      qc.invalidateQueries({ queryKey: ["legacy-heirs"] });
    },
  });
  const delHeir = useMutation({
    mutationFn: async (id: string) => api.delete(`/legacy/estate/heirs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-heirs"] }),
  });

  // asset form
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetForm, setAssetForm] = useState<Partial<Asset>>({});
  const createAsset = useMutation({
    mutationFn: async () => api.post("/legacy/estate/assets", assetForm),
    onSuccess: () => {
      setAssetForm({});
      setShowAssetForm(false);
      qc.invalidateQueries({ queryKey: ["legacy-assets"] });
    },
  });
  const delAsset = useMutation({
    mutationFn: async (id: string) => api.delete(`/legacy/estate/assets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-assets"] }),
  });

  return (
    <div className="space-y-6">
      <form
        className="card space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveEstate.mutate();
        }}
      >
        <h3 className="font-serif text-2xl text-warm-plum">Información general del patrimonio</h3>
        <Field label="Resumen / contexto">
          <textarea className="input min-h-[80px] resize-y" value={form.summary ?? ""} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Albacea (nombre)">
            <input className="input" value={form.executor_name ?? ""} onChange={(e) => setForm({ ...form, executor_name: e.target.value })} />
          </Field>
          <Field label="Albacea (email)">
            <input type="email" className="input" value={form.executor_email ?? ""} onChange={(e) => setForm({ ...form, executor_email: e.target.value })} />
          </Field>
          <Field label="Albacea (teléfono)">
            <input className="input" value={form.executor_phone ?? ""} onChange={(e) => setForm({ ...form, executor_phone: e.target.value })} />
          </Field>
        </div>
        <Field label="Información notarial">
          <textarea className="input min-h-[80px] resize-y" value={form.notary_info ?? ""} onChange={(e) => setForm({ ...form, notary_info: e.target.value })} />
        </Field>
        <div className="flex items-center gap-3 justify-end">
          {savedEstate && <span className="text-sm text-warm-accent">Guardado</span>}
          <button type="submit" disabled={saveEstate.isPending} className="btn-primary">
            {saveEstate.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-warm-plum">Herederos</h3>
          <button onClick={() => setShowHeirForm((s) => !s)} className="btn-primary inline-flex items-center gap-2">
            {showHeirForm ? <X size={16} /> : <Plus size={16} />}
            {showHeirForm ? "Cerrar" : "Añadir"}
          </button>
        </div>
        <AnimatePresence>
          {showHeirForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              onSubmit={(e) => { e.preventDefault(); if (heirForm.full_name?.trim()) createHeir.mutate(); }}
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <Field label="Nombre *"><input className="input" value={heirForm.full_name ?? ""} onChange={(e) => setHeirForm({ ...heirForm, full_name: e.target.value })} required /></Field>
                <Field label="Email"><input type="email" className="input" value={heirForm.email ?? ""} onChange={(e) => setHeirForm({ ...heirForm, email: e.target.value })} /></Field>
                <Field label="Relación"><input className="input" value={heirForm.relationship ?? ""} onChange={(e) => setHeirForm({ ...heirForm, relationship: e.target.value })} /></Field>
                <Field label="Asignación"><input className="input" placeholder='ej. "30%" o "casa de Bogotá"' value={heirForm.inheritance_share ?? ""} onChange={(e) => setHeirForm({ ...heirForm, inheritance_share: e.target.value })} /></Field>
              </div>
              <Field label="Notas"><textarea className="input min-h-[60px] resize-y mt-4" value={heirForm.notes ?? ""} onChange={(e) => setHeirForm({ ...heirForm, notes: e.target.value })} /></Field>
              <div className="flex justify-end mt-4">
                <button type="submit" disabled={createHeir.isPending} className="btn-primary">{createHeir.isPending ? "Guardando..." : "Guardar"}</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        <div className="space-y-2">
          {heirsQ.data?.length === 0 && <EmptyState message="Aún no añadiste herederos." />}
          {heirsQ.data?.map((h) => (
            <div key={h.id} className="border border-warm-sand rounded-2xl px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-warm-plum">{h.full_name}</p>
                <p className="text-xs text-warm-silver">
                  {[h.relationship, h.email].filter(Boolean).join(" · ")}
                </p>
                {h.inheritance_share && <p className="text-sm text-warm-accent font-semibold mt-1">{h.inheritance_share}</p>}
                {h.notes && <p className="text-sm text-warm-plum/80 mt-1 whitespace-pre-wrap">{h.notes}</p>}
              </div>
              <button onClick={() => confirm(`¿Eliminar a ${h.full_name}?`) && delHeir.mutate(h.id)} className="text-warm-silver hover:text-warm-accent p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-warm-plum">Bienes y cuentas</h3>
          <button onClick={() => setShowAssetForm((s) => !s)} className="btn-primary inline-flex items-center gap-2">
            {showAssetForm ? <X size={16} /> : <Plus size={16} />}
            {showAssetForm ? "Cerrar" : "Añadir"}
          </button>
        </div>
        <AnimatePresence>
          {showAssetForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
              onSubmit={(e) => { e.preventDefault(); if (assetForm.name?.trim()) createAsset.mutate(); }}
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <Field label="Nombre *"><input className="input" value={assetForm.name ?? ""} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} required /></Field>
                <Field label="Tipo">
                  <select className="input" value={assetForm.asset_type ?? ""} onChange={(e) => setAssetForm({ ...assetForm, asset_type: e.target.value })}>
                    <option value="">— Tipo —</option>
                    <option value="property">Propiedad</option>
                    <option value="account">Cuenta bancaria</option>
                    <option value="investment">Inversión</option>
                    <option value="digital">Activo digital</option>
                    <option value="other">Otro</option>
                  </select>
                </Field>
                <Field label="Valor aproximado"><input className="input" placeholder="ej. 100.000.000 COP" value={assetForm.approximate_value ?? ""} onChange={(e) => setAssetForm({ ...assetForm, approximate_value: e.target.value })} /></Field>
                <Field label="Ubicación"><input className="input" value={assetForm.location ?? ""} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} /></Field>
              </div>
              <Field label="Descripción"><textarea className="input min-h-[60px] resize-y mt-4" value={assetForm.description ?? ""} onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })} /></Field>
              <div className="flex justify-end mt-4">
                <button type="submit" disabled={createAsset.isPending} className="btn-primary">{createAsset.isPending ? "Guardando..." : "Guardar"}</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        <div className="space-y-2">
          {assetsQ.data?.length === 0 && <EmptyState message="Aún no añadiste bienes." />}
          {assetsQ.data?.map((a) => (
            <div key={a.id} className="border border-warm-sand rounded-2xl px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-warm-plum">{a.name}</p>
                <p className="text-xs text-warm-silver">{[a.asset_type, a.location].filter(Boolean).join(" · ")}</p>
                {a.approximate_value && <p className="text-sm text-warm-accent font-semibold mt-1">{a.approximate_value}</p>}
                {a.description && <p className="text-sm text-warm-plum/80 mt-1 whitespace-pre-wrap">{a.description}</p>}
              </div>
              <button onClick={() => confirm(`¿Eliminar ${a.name}?`) && delAsset.mutate(a.id)} className="text-warm-silver hover:text-warm-accent p-1.5">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- Posthumous messages ----------

type PostMessage = {
  id: string;
  recipient_email: string;
  subject: string;
  text_content: string;
  message_type: "text" | "audio" | "video";
  sent: boolean;
  sent_at?: string | null;
  created_at: string;
};

const MessagesTab = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    recipient_email: "",
    subject: "",
    text_content: "",
    message_type: "text" as "text" | "audio" | "video",
  });
  const q = useQuery({
    queryKey: ["legacy-posthumous"],
    queryFn: async () => (await api.get<{ entries: PostMessage[] }>("/legacy/posthumous-messages")).data.entries,
  });
  const create = useMutation({
    mutationFn: async () => api.post("/legacy/posthumous-messages", form),
    onSuccess: () => {
      setForm({ recipient_email: "", subject: "", text_content: "", message_type: "text" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["legacy-posthumous"] });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/legacy/posthumous-messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-posthumous"] }),
  });

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-warm-plum">Mensajes para entregar después</h3>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary inline-flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cerrar" : "Nuevo mensaje"}
        </button>
      </div>
      <div className="border border-warm-accent/30 bg-warm-accent/5 rounded-2xl px-4 py-3 text-sm text-warm-plum/90 leading-relaxed">
        <p className="font-bold mb-1">⚠ Función en beta</p>
        <p>
          Hoy la entrega requiere <strong>verificación manual</strong> de fallecimiento
          por nuestro equipo (tu albacea nos contacta con documentación). No hay entrega
          automática todavía. Si necesitas garantía absoluta, deja también copia con tu
          albacea o notario.
        </p>
      </div>
      <p className="text-sm text-warm-olive">
        Los mensajes se guardan cifrados hasta que verifiquemos el fallecimiento. Por
        ahora solo texto; audio y video llegan en próximas iteraciones.
      </p>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.recipient_email.trim() || !form.subject.trim() || !form.text_content.trim()) return;
              create.mutate();
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Field label="Email del destinatario *">
                <input type="email" className="input" value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} required />
              </Field>
              <Field label="Asunto *">
                <input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </Field>
            </div>
            <Field label="Mensaje *">
              <textarea className="input min-h-[180px] resize-y mt-4" value={form.text_content} onChange={(e) => setForm({ ...form, text_content: e.target.value })} required />
            </Field>
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={create.isPending} className="btn-primary">
                {create.isPending ? "Guardando..." : "Guardar mensaje"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {q.data?.length === 0 && <EmptyState message="Aún no escribiste mensajes." />}
        {q.data?.map((m) => (
          <div key={m.id} className="border border-warm-sand rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-warm-plum truncate">{m.subject}</p>
              <p className="text-xs text-warm-silver">
                Para: <strong>{m.recipient_email}</strong>
                {m.sent ? (
                  <span className="ml-2 text-warm-accent">· Enviado</span>
                ) : (
                  <span className="ml-2 text-warm-olive">· Pendiente de entrega</span>
                )}
              </p>
              <p className="text-sm text-warm-plum/80 mt-2 whitespace-pre-wrap line-clamp-4">{m.text_content}</p>
            </div>
            {!m.sent && (
              <button onClick={() => confirm("¿Eliminar este mensaje?") && del.mutate(m.id)} className="text-warm-silver hover:text-warm-accent p-1.5">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Digital will (composed server-side, not authored) ----------

type WillIdentity = {
  testator_full_name?: string | null;
  testator_id_number?: string | null;
  city?: string | null;
  declarations?: string | null;
};

type WillDocument = {
  body_html: string;
  content_hash: string;
  has_content: boolean;
  seal: {
    status: string;
    document_hash: string | null;
    document_version: number;
    sealed_at: string | null;
    valid: boolean;
  };
  generated_at: string;
};

const WillTab = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<WillIdentity>({});
  const [saved, setSaved] = useState(false);

  const willQ = useQuery({
    queryKey: ["legacy-will"],
    queryFn: async () => (await api.get<WillIdentity | null>("/legacy/will")).data,
  });

  // The document is recomposed from the underlying records on every fetch, so
  // it must never be served from a stale cache after an edit elsewhere.
  const docQ = useQuery({
    queryKey: ["legacy-will-document"],
    queryFn: async () => (await api.get<WillDocument>("/legacy/will/document")).data,
    staleTime: 0,
  });

  useEffect(() => {
    if (willQ.data) setForm(willQ.data);
  }, [willQ.data]);

  const save = useMutation({
    mutationFn: async () => api.put("/legacy/will", form),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      qc.invalidateQueries({ queryKey: ["legacy-will"] });
      qc.invalidateQueries({ queryKey: ["legacy-will-document"] });
    },
  });

  const seal = useMutation({
    mutationFn: async () => api.post("/legacy/will/seal"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legacy-will"] });
      qc.invalidateQueries({ queryKey: ["legacy-will-document"] });
    },
  });

  const doc = docQ.data;

  // Print-to-PDF beats a bundled PDF library here: the browser already renders
  // this exact markup, and the user picks "Save as PDF" from the native dialog.
  const printDoc = () => {
    if (!doc) return;
    const w = window.open("", "_blank", "width=820,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"/>
      <title>Disposiciones — Presence</title>
      <style>
        body{font-family:Georgia,serif;max-width:42rem;margin:3rem auto;padding:0 1.5rem;color:#000;line-height:1.65}
        h1{font-size:1.9rem;margin:0 0 1.5rem}
        h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:#6F6F6F;margin:2rem 0 .5rem}
        p{margin:.5rem 0}
        .disclaimer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #E8E8E8;font-size:.8rem;color:#6F6F6F}
        .seal{margin-top:1rem;font-size:.7rem;color:#A3A3A3;word-break:break-all}
      </style></head><body>${DOMPurify.sanitize(doc.body_html)}
      <p class="seal">Huella SHA-256: ${doc.content_hash}${
        doc.seal.sealed_at
          ? ` · Sellado el ${new Date(doc.seal.sealed_at).toLocaleString("es")} (v${doc.seal.document_version})`
          : ""
      }</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="space-y-4">
      <form
        className="card space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div>
          <h3 className="font-serif text-2xl text-warm-plum">Tus datos como otorgante</h3>
          <p className="text-sm text-warm-olive mt-1">
            El resto del documento se arma solo con lo que ya escribiste en
            Últimos deseos y Patrimonio. No tienes que redactar nada.
          </p>
        </div>

        <Field label="Nombre completo">
          <input
            className="input"
            value={form.testator_full_name ?? ""}
            onChange={(e) => setForm({ ...form, testator_full_name: e.target.value })}
          />
        </Field>
        <Field label="Documento de identidad">
          <input
            className="input"
            value={form.testator_id_number ?? ""}
            onChange={(e) => setForm({ ...form, testator_id_number: e.target.value })}
          />
        </Field>
        <Field label="Ciudad">
          <input
            className="input"
            value={form.city ?? ""}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </Field>
        <Field label="Declaraciones adicionales (opcional)">
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Cualquier cosa que quieras dejar dicha y que no encaje en las otras secciones."
            value={form.declarations ?? ""}
            onChange={(e) => setForm({ ...form, declarations: e.target.value })}
          />
        </Field>

        <div className="flex items-center gap-3 justify-end">
          {saved && <span className="text-sm text-warm-accent">Guardado</span>}
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? "Guardando..." : "Guardar mis datos"}
          </button>
        </div>
      </form>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-2xl text-warm-plum">Tu documento</h3>
            <p className="text-sm text-warm-olive mt-1">
              Generado a partir de tus datos. Cada vez que cambias algo, se
              vuelve a componer.
            </p>
          </div>
          {doc?.seal.valid ? (
            <span className="text-xs font-medium px-3 py-1.5 rounded-pill bg-warm-accent/10 text-warm-accent inline-flex items-center gap-1.5 shrink-0">
              <Lock size={12} /> Sellado · v{doc.seal.document_version}
            </span>
          ) : (
            <span className="text-xs font-medium px-3 py-1.5 rounded-pill bg-warm-fog text-warm-silver shrink-0">
              Borrador
            </span>
          )}
        </div>

        {docQ.isLoading && <div className="h-40 rounded-panel shimmer" />}

        {doc && !doc.has_content && (
          <EmptyState message="Todavía no hay nada que componer. Empieza por Últimos deseos o Patrimonio." />
        )}

        {doc && doc.has_content && (
          <>
            {/* The backend escapes every interpolated value, so this markup is
                already safe. Sanitizing again is cheap insurance against a
                future regression in the composer leaking raw user input. */}
            <div
              className="will-doc border border-warm-sand rounded-panel p-6 max-h-[420px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.body_html) }}
            />
            <p className="text-xs text-warm-silver break-all">
              Huella SHA-256: {doc.content_hash}
            </p>
            {doc.seal.document_hash && !doc.seal.valid && (
              <p className="text-sm text-warm-olive bg-warm-fog rounded-card px-4 py-3">
                Cambiaste algo desde el último sello, así que ya no coincide.
                Vuelve a sellar cuando termines.
              </p>
            )}
            <div className="flex items-center gap-3 justify-end flex-wrap">
              <button type="button" onClick={printDoc} className="btn-secondary">
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={() => seal.mutate()}
                disabled={seal.isPending || doc.seal.valid}
                className="btn-primary"
              >
                {seal.isPending
                  ? "Sellando..."
                  : doc.seal.valid
                    ? "Ya está sellado"
                    : "Sellar documento"}
              </button>
            </div>
          </>
        )}

        <p className="text-xs text-warm-silver flex items-start gap-1.5">
          <Lock size={12} className="mt-0.5 shrink-0" />
          El sello acredita que el contenido no cambió desde que lo firmaste, no
          su validez legal. Para efectos legales, llévalo ante notario.
        </p>
      </div>
    </div>
  );
};
