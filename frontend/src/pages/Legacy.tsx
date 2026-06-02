import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Lock,
  MessageSquareHeart,
  PawPrint,
  Plus,
  Scroll,
  ScrollText,
  ShieldCheck,
  Stamp,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type TabKey = "dependents" | "pets" | "wishes" | "estate" | "messages" | "will";

const MODULES: {
  key: TabKey;
  label: string;
  blurb: string;
  icon: LucideIcon;
}[] = [
  {
    key: "dependents",
    label: "Dependientes",
    blurb: "Quién cuida a hijos, padres o personas a tu cargo.",
    icon: Users,
  },
  {
    key: "pets",
    label: "Mascotas",
    blurb: "Cuidador, veterinario y rutinas de tus mascotas.",
    icon: PawPrint,
  },
  {
    key: "wishes",
    label: "Últimos deseos",
    blurb: "Cómo quieres ser recordada/o: ceremonia, música, despedida.",
    icon: Scroll,
  },
  {
    key: "estate",
    label: "Patrimonio",
    blurb: "Bienes, herederos y albacea de confianza.",
    icon: ScrollText,
  },
  {
    key: "messages",
    label: "Mensajes póstumos",
    blurb: "Mensajes que se entregan a personas concretas después.",
    icon: MessageSquareHeart,
  },
  {
    key: "will",
    label: "Testamento Digital",
    blurb: "Compila todo en un documento y séllalo con huella de integridad.",
    icon: FileText,
  },
];

/**
 * Status for each legacy module, derived from the *same* react-query keys the
 * module tabs use — so the cache is shared and the hub shows real completeness
 * without duplicate fetches.
 */
const useLegacyStatus = (): Record<TabKey, boolean> => {
  const dependents = useQuery({
    queryKey: ["legacy-dependents"],
    queryFn: async () =>
      (await api.get<{ entries: unknown[] }>("/legacy/dependents")).data.entries,
  });
  const pets = useQuery({
    queryKey: ["legacy-pets"],
    queryFn: async () => (await api.get<{ entries: unknown[] }>("/legacy/pets")).data.entries,
  });
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
    dependents: (dependents.data?.length ?? 0) > 0,
    pets: (pets.data?.length ?? 0) > 0,
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

  const doneCount = MODULES.filter((m) => status[m.key]).length;
  const pct = Math.round((doneCount / MODULES.length) * 100);
  const active = MODULES.find((m) => m.key === section);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-warm-silver mb-2">
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
            {/* Progress */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-warm-plum">
                  Tu plan está {pct}% completo
                </p>
                <span className="text-xs text-warm-silver">
                  {doneCount} de {MODULES.length} secciones
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-warm-fog overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-warm-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            {/* Module cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MODULES.map((m) => {
                const Icon = m.icon;
                const done = status[m.key];
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSection(m.key)}
                    className="text-left card flex items-start gap-4 hover:border-warm-silver transition group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-warm-light flex items-center justify-center shrink-0">
                      <Icon size={20} className="text-warm-plum" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-xl text-warm-plum">{m.label}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            done
                              ? "bg-warm-accent/10 text-warm-accent"
                              : "bg-warm-fog text-warm-silver"
                          }`}
                        >
                          {done ? <Check size={10} /> : null}
                          {done ? "Listo" : "Pendiente"}
                        </span>
                      </div>
                      <p className="text-sm text-warm-olive mt-1 leading-relaxed">
                        {m.blurb}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-warm-silver group-hover:text-warm-accent transition shrink-0 mt-1"
                    />
                  </button>
                );
              })}
            </div>

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
            {section === "dependents" && <DependentsTab />}
            {section === "pets" && <PetsTab />}
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

// ---------- Dependents ----------

type Dependent = {
  id: string;
  full_name: string;
  relationship?: string | null;
  date_of_birth?: string | null;
  caregiver_name?: string | null;
  caregiver_contact?: string | null;
  notes?: string | null;
};

const DependentsTab = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Dependent>>({});
  const q = useQuery({
    queryKey: ["legacy-dependents"],
    queryFn: async () =>
      (await api.get<{ entries: Dependent[] }>("/legacy/dependents")).data.entries,
  });
  const create = useMutation({
    mutationFn: async () => api.post("/legacy/dependents", form),
    onSuccess: () => {
      setForm({});
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["legacy-dependents"] });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/legacy/dependents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-dependents"] }),
  });

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-warm-plum">Personas que dependen de ti</h3>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="btn-primary inline-flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cerrar" : "Añadir"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.full_name?.trim()) return;
              create.mutate();
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Field label="Nombre completo *">
                <input
                  className="input"
                  value={form.full_name ?? ""}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Relación">
                <input
                  className="input"
                  placeholder="hijo, padre, hermana..."
                  value={form.relationship ?? ""}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                />
              </Field>
              <Field label="Fecha de nacimiento">
                <input
                  type="date"
                  className="input"
                  value={form.date_of_birth ?? ""}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
              </Field>
              <Field label="Cuidador asignado">
                <input
                  className="input"
                  value={form.caregiver_name ?? ""}
                  onChange={(e) => setForm({ ...form, caregiver_name: e.target.value })}
                />
              </Field>
              <Field label="Contacto del cuidador">
                <input
                  className="input"
                  placeholder="teléfono o email"
                  value={form.caregiver_contact ?? ""}
                  onChange={(e) => setForm({ ...form, caregiver_contact: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Notas">
              <textarea
                className="input min-h-[100px] resize-y mt-4"
                placeholder="médicos, escuela, rutinas, alergias..."
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={create.isPending} className="btn-primary">
                {create.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {q.data?.length === 0 && (
          <EmptyState message="Aún no añadiste dependientes." />
        )}
        {q.data?.map((d) => (
          <div key={d.id} className="border border-warm-sand rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-warm-plum">{d.full_name}</p>
              <p className="text-xs text-warm-silver">
                {d.relationship}
                {d.date_of_birth ? ` · n. ${d.date_of_birth}` : ""}
              </p>
              {d.caregiver_name && (
                <p className="text-sm text-warm-olive mt-1">
                  Cuidador: <strong>{d.caregiver_name}</strong>
                  {d.caregiver_contact ? ` · ${d.caregiver_contact}` : ""}
                </p>
              )}
              {d.notes && <p className="text-sm text-warm-plum/80 mt-1 whitespace-pre-wrap">{d.notes}</p>}
            </div>
            <button
              onClick={() => confirm(`¿Eliminar a ${d.full_name}?`) && del.mutate(d.id)}
              className="text-warm-silver hover:text-warm-accent p-1.5"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Pets ----------

type Pet = {
  id: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  age_years?: number | null;
  vet_info?: string | null;
  food_routine?: string | null;
  caregiver_name?: string | null;
  caregiver_contact?: string | null;
  notes?: string | null;
};

const PetsTab = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Pet>>({});
  const q = useQuery({
    queryKey: ["legacy-pets"],
    queryFn: async () =>
      (await api.get<{ entries: Pet[] }>("/legacy/pets")).data.entries,
  });
  const create = useMutation({
    mutationFn: async () => api.post("/legacy/pets", form),
    onSuccess: () => {
      setForm({});
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["legacy-pets"] });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => api.delete(`/legacy/pets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["legacy-pets"] }),
  });

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-warm-plum">Tus mascotas</h3>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary inline-flex items-center gap-2">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cerrar" : "Añadir"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name?.trim()) return;
              create.mutate();
            }}
          >
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Field label="Nombre *">
                <input className="input" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Especie">
                <input className="input" placeholder="perro, gato..." value={form.species ?? ""} onChange={(e) => setForm({ ...form, species: e.target.value })} />
              </Field>
              <Field label="Raza">
                <input className="input" value={form.breed ?? ""} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
              </Field>
              <Field label="Edad (años)">
                <input type="number" min={0} className="input" value={form.age_years ?? ""} onChange={(e) => setForm({ ...form, age_years: e.target.value ? Number(e.target.value) : undefined })} />
              </Field>
              <Field label="Cuidador asignado">
                <input className="input" value={form.caregiver_name ?? ""} onChange={(e) => setForm({ ...form, caregiver_name: e.target.value })} />
              </Field>
              <Field label="Contacto del cuidador">
                <input className="input" value={form.caregiver_contact ?? ""} onChange={(e) => setForm({ ...form, caregiver_contact: e.target.value })} />
              </Field>
            </div>
            <Field label="Veterinario / salud">
              <textarea className="input min-h-[80px] resize-y mt-4" value={form.vet_info ?? ""} onChange={(e) => setForm({ ...form, vet_info: e.target.value })} />
            </Field>
            <Field label="Comida / rutinas">
              <textarea className="input min-h-[80px] resize-y mt-4" value={form.food_routine ?? ""} onChange={(e) => setForm({ ...form, food_routine: e.target.value })} />
            </Field>
            <Field label="Notas">
              <textarea className="input min-h-[80px] resize-y mt-4" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex justify-end mt-4">
              <button type="submit" disabled={create.isPending} className="btn-primary">
                {create.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {q.data?.length === 0 && <EmptyState message="Aún no añadiste mascotas." />}
        {q.data?.map((p) => (
          <div key={p.id} className="border border-warm-sand rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-warm-plum">{p.name}</p>
              <p className="text-xs text-warm-silver">
                {[p.species, p.breed, p.age_years ? `${p.age_years} años` : null].filter(Boolean).join(" · ")}
              </p>
              {p.caregiver_name && (
                <p className="text-sm text-warm-olive mt-1">Cuidador: <strong>{p.caregiver_name}</strong>{p.caregiver_contact ? ` · ${p.caregiver_contact}` : ""}</p>
              )}
              {p.vet_info && <p className="text-sm text-warm-plum/80 mt-1 whitespace-pre-wrap"><strong>Vet:</strong> {p.vet_info}</p>}
              {p.food_routine && <p className="text-sm text-warm-plum/80 mt-1 whitespace-pre-wrap"><strong>Rutina:</strong> {p.food_routine}</p>}
              {p.notes && <p className="text-sm text-warm-plum/80 mt-1 whitespace-pre-wrap">{p.notes}</p>}
            </div>
            <button onClick={() => confirm(`¿Eliminar a ${p.name}?`) && del.mutate(p.id)} className="text-warm-silver hover:text-warm-accent p-1.5">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

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

  // hydrate form when query data loads
  useState(() => {
    // noop initializer; we re-sync via effect below
  });
  // simple sync: when q.data changes, update form once
  if (q.data && !form.disposition && !form.ceremony_notes && !form.religious_wishes && !form.music_readings && !form.obituary && !form.special_requests) {
    // hydrate once
    if (
      q.data.disposition || q.data.ceremony_notes || q.data.religious_wishes ||
      q.data.music_readings || q.data.obituary || q.data.special_requests
    ) {
      Object.assign(form, q.data);
    }
  }

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
  if (
    estateQ.data &&
    !form.summary && !form.executor_name && !form.executor_email &&
    !form.executor_phone && !form.notary_info
  ) {
    if (
      estateQ.data.summary || estateQ.data.executor_name || estateQ.data.executor_email ||
      estateQ.data.executor_phone || estateQ.data.notary_info
    ) {
      Object.assign(form, estateQ.data);
    }
  }
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

// ---------- Digital will (capstone document + integrity seal) ----------

type WillRow = {
  testator_full_name?: string | null;
  testator_id_number?: string | null;
  city?: string | null;
  declarations?: string | null;
  status?: "draft" | "sealed";
  document_hash?: string | null;
  document_version?: number;
  sealed_at?: string | null;
};

type WillDoc = {
  content: {
    testator: { testator_full_name?: string | null; testator_id_number?: string | null; city?: string | null };
    declarations?: string | null;
    executor: { executor_name?: string | null; executor_email?: string | null; executor_phone?: string | null };
    estate_summary?: string | null;
    notary_info?: string | null;
    heirs: { full_name?: string | null; email?: string | null; relationship?: string | null; inheritance_share?: string | null; notes?: string | null }[];
    assets: { name?: string | null; asset_type?: string | null; approximate_value?: string | null; location?: string | null; description?: string | null }[];
    final_wishes: Record<string, string | null>;
    dependents: { full_name?: string | null; relationship?: string | null; caregiver_name?: string | null; caregiver_contact?: string | null; notes?: string | null }[];
  };
  content_hash: string;
  seal: {
    status: "draft" | "sealed";
    document_hash: string | null;
    document_version: number;
    sealed_at: string | null;
    valid: boolean;
  };
  generated_at: string;
};

const escapeHtml = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const buildPrintHtml = (doc: WillDoc): string => {
  const c = doc.content;
  const t = c.testator;
  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("es") : "—";
  const block = (title: string, body: string) =>
    body.trim()
      ? `<h2>${escapeHtml(title)}</h2>${body}`
      : "";
  const heirsHtml = c.heirs.length
    ? `<ul>${c.heirs
        .map(
          (h) =>
            `<li><strong>${escapeHtml(h.full_name)}</strong>${h.relationship ? ` (${escapeHtml(h.relationship)})` : ""}${h.inheritance_share ? ` — ${escapeHtml(h.inheritance_share)}` : ""}${h.email ? `<br/><small>${escapeHtml(h.email)}</small>` : ""}${h.notes ? `<br/><em>${escapeHtml(h.notes)}</em>` : ""}</li>`
        )
        .join("")}</ul>`
    : "";
  const assetsHtml = c.assets.length
    ? `<ul>${c.assets
        .map(
          (a) =>
            `<li><strong>${escapeHtml(a.name)}</strong>${a.asset_type ? ` · ${escapeHtml(a.asset_type)}` : ""}${a.approximate_value ? ` · ${escapeHtml(a.approximate_value)}` : ""}${a.location ? ` · ${escapeHtml(a.location)}` : ""}${a.description ? `<br/><em>${escapeHtml(a.description)}</em>` : ""}</li>`
        )
        .join("")}</ul>`
    : "";
  const depsHtml = c.dependents.length
    ? `<ul>${c.dependents
        .map(
          (d) =>
            `<li><strong>${escapeHtml(d.full_name)}</strong>${d.relationship ? ` (${escapeHtml(d.relationship)})` : ""}${d.caregiver_name ? ` — cuidador: ${escapeHtml(d.caregiver_name)}${d.caregiver_contact ? ` (${escapeHtml(d.caregiver_contact)})` : ""}` : ""}${d.notes ? `<br/><em>${escapeHtml(d.notes)}</em>` : ""}</li>`
        )
        .join("")}</ul>`
    : "";
  const w = c.final_wishes;
  const wishesParts = [
    w.disposition ? `<p><strong>Disposición:</strong> ${escapeHtml(dispLabel[w.disposition] ?? w.disposition)}</p>` : "",
    w.ceremony_notes ? `<p><strong>Ceremonia:</strong> ${escapeHtml(w.ceremony_notes)}</p>` : "",
    w.religious_wishes ? `<p><strong>Aspectos religiosos:</strong> ${escapeHtml(w.religious_wishes)}</p>` : "",
    w.music_readings ? `<p><strong>Música y lecturas:</strong> ${escapeHtml(w.music_readings)}</p>` : "",
    w.obituary ? `<p><strong>Obituario:</strong> ${escapeHtml(w.obituary)}</p>` : "",
    w.special_requests ? `<p><strong>Solicitudes:</strong> ${escapeHtml(w.special_requests)}</p>` : "",
  ].join("");
  const executorParts = [
    c.executor.executor_name ? `<p><strong>Albacea:</strong> ${escapeHtml(c.executor.executor_name)}</p>` : "",
    c.executor.executor_email ? `<p><strong>Email:</strong> ${escapeHtml(c.executor.executor_email)}</p>` : "",
    c.executor.executor_phone ? `<p><strong>Teléfono:</strong> ${escapeHtml(c.executor.executor_phone)}</p>` : "",
    c.estate_summary ? `<p>${escapeHtml(c.estate_summary)}</p>` : "",
    c.notary_info ? `<p><strong>Información notarial:</strong> ${escapeHtml(c.notary_info)}</p>` : "",
  ].join("");

  const sealedBadge = doc.seal.valid
    ? `Sellado (v${doc.seal.document_version}) el ${fmtDate(doc.seal.sealed_at)}`
    : "BORRADOR — sin sellar o modificado tras el último sello";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8" />
<title>Testamento Digital${t.testator_full_name ? ` — ${escapeHtml(t.testator_full_name)}` : ""}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #211922; max-width: 760px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
  h1 { font-size: 26px; border-bottom: 2px solid #7e238b; padding-bottom: 8px; }
  h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #7e238b; margin-top: 28px; }
  ul { padding-left: 20px; } li { margin-bottom: 8px; }
  .meta { color: #62625b; font-size: 13px; }
  .seal { margin-top: 40px; border: 1px solid #e5e5e0; border-radius: 10px; padding: 16px; background: #faf9f7; font-family: -apple-system, system-ui, sans-serif; font-size: 12px; color: #62625b; }
  .seal code { word-break: break-all; color: #211922; }
  .disclaimer { margin-top: 16px; font-size: 11px; color: #91918c; }
</style></head><body>
<h1>Declaración de última voluntad</h1>
<p class="meta">${t.testator_full_name ? `Otorgada por <strong>${escapeHtml(t.testator_full_name)}</strong>` : "Testador sin nombre"}${t.testator_id_number ? ` · ID: ${escapeHtml(t.testator_id_number)}` : ""}${t.city ? ` · ${escapeHtml(t.city)}` : ""}</p>
${c.declarations ? `<p>${escapeHtml(c.declarations).replace(/\n/g, "<br/>")}</p>` : ""}
${block("Herederos", heirsHtml)}
${block("Bienes y cuentas", assetsHtml)}
${block("Albacea y patrimonio", executorParts)}
${block("Personas a mi cargo", depsHtml)}
${block("Últimos deseos", wishesParts)}
<div class="seal">
  <strong>Sello de integridad</strong><br/>
  Estado: ${escapeHtml(sealedBadge)}<br/>
  Huella SHA-256 del contenido: <code>${escapeHtml(doc.content_hash)}</code><br/>
  Generado: ${fmtDate(doc.generated_at)}
  <div class="disclaimer">
    Este sello acredita la integridad del contenido (cualquier cambio altera la huella), no su validez legal.
    Para efectos legales, lleva este documento ante notario. El anclaje en blockchain es un paso opcional futuro.
  </div>
</div>
</body></html>`;
};

const WillTab = () => {
  const qc = useQueryClient();
  const willQ = useQuery({
    queryKey: ["legacy-will"],
    queryFn: async () => (await api.get<WillRow | null>("/legacy/will")).data,
  });
  const docQ = useQuery({
    queryKey: ["legacy-will-document"],
    queryFn: async () => (await api.get<WillDoc>("/legacy/will/document")).data,
  });

  const [form, setForm] = useState<Partial<WillRow>>({});
  const [hydrated, setHydrated] = useState(false);
  if (!hydrated && willQ.data) {
    setForm({
      testator_full_name: willQ.data.testator_full_name ?? "",
      testator_id_number: willQ.data.testator_id_number ?? "",
      city: willQ.data.city ?? "",
      declarations: willQ.data.declarations ?? "",
    });
    setHydrated(true);
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["legacy-will"] });
    qc.invalidateQueries({ queryKey: ["legacy-will-document"] });
  };

  const save = useMutation({
    mutationFn: async () => api.put("/legacy/will", form),
    onSuccess: invalidate,
  });
  const seal = useMutation({
    mutationFn: async () => api.post("/legacy/will/seal"),
    onSuccess: invalidate,
  });

  const doc = docQ.data;
  const sealValid = doc?.seal.valid ?? false;

  const onPrint = () => {
    if (!doc) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildPrintHtml(doc));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-warm-accent/10 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-warm-accent" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-warm-plum">Tu documento, compilado y sellado</h3>
            <p className="text-sm text-warm-olive mt-1 leading-relaxed">
              Reúne herederos, bienes, albacea, últimos deseos y personas a tu cargo en
              un solo documento. Al sellarlo calculamos una huella SHA-256: si algo cambia
              después, la huella deja de coincidir y lo sabrás.
            </p>
          </div>
        </div>
      </div>

      {/* Testator form */}
      <form
        className="card space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h3 className="font-serif text-2xl text-warm-plum">Datos del testador</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre legal completo">
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
        </div>
        <Field label="Declaraciones / cláusulas generales">
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Ej. revoco cualquier testamento anterior; expreso mi voluntad de que..."
            value={form.declarations ?? ""}
            onChange={(e) => setForm({ ...form, declarations: e.target.value })}
          />
        </Field>
        <div className="flex items-center justify-end gap-3">
          <span className="text-xs text-warm-silver">
            Guardar cambios invalida el sello anterior.
          </span>
          <button type="submit" disabled={save.isPending} className="btn-primary">
            {save.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      {/* Seal status + actions */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                sealValid ? "bg-warm-accent/10" : "bg-warm-fog"
              }`}
            >
              {sealValid ? (
                <ShieldCheck size={20} className="text-warm-accent" />
              ) : (
                <Stamp size={20} className="text-warm-silver" />
              )}
            </div>
            <div>
              <p className="font-semibold text-warm-plum">
                {sealValid ? "Documento sellado" : "Sin sellar"}
              </p>
              <p className="text-xs text-warm-silver">
                {sealValid && doc
                  ? `Versión ${doc.seal.document_version} · ${
                      doc.seal.sealed_at
                        ? new Date(doc.seal.sealed_at).toLocaleString("es")
                        : ""
                    }`
                  : doc?.seal.document_hash
                  ? "El contenido cambió tras el último sello. Vuelve a sellar."
                  : "Aún no has sellado este documento."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrint}
              disabled={!doc}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download size={16} /> Descargar / Imprimir
            </button>
            <button
              type="button"
              onClick={() => seal.mutate()}
              disabled={seal.isPending || !doc}
              className="btn-primary inline-flex items-center gap-2"
            >
              {seal.isPending ? <Loader2 size={16} className="animate-spin" /> : <Stamp size={16} />}
              {sealValid ? "Re-sellar" : "Sellar documento"}
            </button>
          </div>
        </div>
        {doc && (
          <div className="border border-warm-sand rounded-2xl px-4 py-3 bg-warm-fog/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-warm-silver mb-1">
              Huella SHA-256 del contenido actual
            </p>
            <p className="text-xs font-mono text-warm-plum break-all">{doc.content_hash}</p>
          </div>
        )}
      </div>

      {/* Live preview of compiled content */}
      {doc && (
        <div className="card space-y-4">
          <h3 className="font-serif text-2xl text-warm-plum">Contenido compilado</h3>
          <WillPreviewRow label="Herederos" count={doc.content.heirs.length} />
          <WillPreviewRow label="Bienes y cuentas" count={doc.content.assets.length} />
          <WillPreviewRow label="Personas a tu cargo" count={doc.content.dependents.length} />
          <WillPreviewRow
            label="Albacea"
            ok={!!doc.content.executor.executor_name}
          />
          <WillPreviewRow
            label="Últimos deseos"
            ok={Object.values(doc.content.final_wishes).some((v) => !!v)}
          />
          <p className="text-xs text-warm-silver flex items-center gap-1.5 pt-1">
            <Lock size={12} /> Cifrado en reposo. El sello acredita integridad, no validez legal —
            para eso, lleva el documento ante notario.
          </p>
        </div>
      )}
    </div>
  );
};

const WillPreviewRow = ({
  label,
  count,
  ok,
}: {
  label: string;
  count?: number;
  ok?: boolean;
}) => {
  const filled = count !== undefined ? count > 0 : !!ok;
  return (
    <div className="flex items-center justify-between border-b border-warm-sand/60 pb-2 last:border-0">
      <span className="text-sm text-warm-plum">{label}</span>
      <span
        className={`text-xs font-bold inline-flex items-center gap-1.5 ${
          filled ? "text-warm-accent" : "text-warm-silver"
        }`}
      >
        {count !== undefined ? `${count} ${count === 1 ? "registro" : "registros"}` : filled ? "Completo" : "Vacío"}
        {filled && <Check size={12} />}
      </span>
    </div>
  );
};
