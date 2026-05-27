import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareHeart,
  PawPrint,
  Plus,
  Scroll,
  ScrollText,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type TabKey = "dependents" | "pets" | "wishes" | "estate" | "messages";

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: "dependents", label: "Dependientes", icon: Users },
  { key: "pets", label: "Mascotas", icon: PawPrint },
  { key: "wishes", label: "Últimos deseos", icon: Scroll },
  { key: "estate", label: "Patrimonio", icon: ScrollText },
  { key: "messages", label: "Mensajes póstumos", icon: MessageSquareHeart },
];

export const Legacy = () => {
  useDocumentTitle("Plan de legado");
  const [tab, setTab] = useState<TabKey>("dependents");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-warm-silver mb-2">
          Pilares 3 + 4
        </p>
        <h1 className="font-serif text-4xl text-warm-plum">Mi plan de legado</h1>
        <p className="text-warm-olive mt-2 max-w-2xl">
          Documenta lo que tu familia necesitará saber el día que no estés. Todo se
          guarda cifrado. Tú decides cuándo y cómo se libera.
        </p>
      </div>

      <div className="flex gap-1 border-b border-warm-sand overflow-x-auto pb-px">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
                tab === t.key
                  ? "border-warm-accent text-warm-plum"
                  : "border-transparent text-warm-olive hover:text-warm-plum"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "dependents" && <DependentsTab />}
          {tab === "pets" && <PetsTab />}
          {tab === "wishes" && <WishesTab />}
          {tab === "estate" && <EstateTab />}
          {tab === "messages" && <MessagesTab />}
        </motion.div>
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
