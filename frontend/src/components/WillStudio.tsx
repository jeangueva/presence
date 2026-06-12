import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import DOMPurify from "dompurify";
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  FilePlus,
  ListChecks,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Stamp,
  Trash2,
} from "lucide-react";
import { api } from "../lib/api";
import { WillEditor } from "./WillEditor";
import {
  WILL_TEMPLATES,
  BLANK_TEMPLATE_HTML,
  generateWillHtml,
  emptyWillForm,
  type WillFormData,
} from "../lib/willTemplates";

type WillRow = {
  body_html?: string | null;
  template_id?: string | null;
  status?: "draft" | "sealed";
  document_hash?: string | null;
  document_version?: number;
  sealed_at?: string | null;
};

type WillDoc = {
  body_html: string;
  template_id: string | null;
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

type View = "start" | "form" | "editor";

const printDocument = (html: string, doc: WillDoc | undefined) => {
  const clean = DOMPurify.sanitize(html, { ADD_ATTR: ["style"] });
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("es") : "—");
  const sealLine =
    doc && doc.seal.valid
      ? `Sellado (v${doc.seal.document_version}) el ${fmt(doc.seal.sealed_at)}`
      : "BORRADOR — sin sellar o modificado tras el último sello";
  const hash = doc?.content_hash ?? "";
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Testamento Digital</title><style>
  body { font-family: Georgia, 'Times New Roman', serif; color:#000000; max-width:760px; margin:40px auto; padding:0 24px; line-height:1.65; }
  h1 { font-size:26px; border-bottom:2px solid #000000; padding-bottom:8px; }
  h2 { font-size:14px; text-transform:uppercase; letter-spacing:1px; color:#6F6F6F; margin-top:24px; }
  ul,ol { padding-left:22px; } li { margin:6px 0; }
  img { max-width:100%; height:auto; }
  .seal { margin-top:40px; border:1px solid #E8E8E8; border-radius:10px; padding:16px; background:#FAFAFA; font-family:-apple-system,system-ui,sans-serif; font-size:12px; color:#6F6F6F; }
  .seal code { word-break:break-all; color:#000000; }
  .disclaimer { margin-top:12px; font-size:11px; color:#A3A3A3; }
</style></head><body>
${clean}
<div class="seal"><strong>Sello de integridad</strong><br/>
Estado: ${sealLine}<br/>
Huella SHA-256: <code>${hash}</code>
<div class="disclaimer">El sello acredita integridad del contenido (cualquier cambio altera la huella), no su validez legal. Para efectos legales, lleva este documento ante notario. El anclaje en blockchain es un paso opcional futuro.</div>
</div></body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
};

export const WillStudio = () => {
  const qc = useQueryClient();
  const willQ = useQuery({
    queryKey: ["legacy-will"],
    queryFn: async () => (await api.get<WillRow | null>("/legacy/will")).data,
  });
  const docQ = useQuery({
    queryKey: ["legacy-will-document"],
    queryFn: async () => (await api.get<WillDoc>("/legacy/will/document")).data,
  });

  const [view, setView] = useState<View | null>(null);
  const [body, setBody] = useState("");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  // Decide the initial view once data arrives: jump straight to the editor if a
  // document already exists, otherwise show the start chooser.
  if (view === null && !willQ.isLoading) {
    if (willQ.data?.body_html) {
      setBody(willQ.data.body_html);
      setTemplateId(willQ.data.template_id ?? null);
      setView("editor");
    } else {
      setView("start");
    }
    setEditorKey((k) => k + 1);
  }

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["legacy-will"] });
    qc.invalidateQueries({ queryKey: ["legacy-will-document"] });
  };
  const save = useMutation({
    mutationFn: async () =>
      api.put("/legacy/will", { body_html: body, template_id: templateId }),
    onSuccess: invalidate,
  });
  const seal = useMutation({
    mutationFn: async () => {
      await api.put("/legacy/will", { body_html: body, template_id: templateId });
      return api.post("/legacy/will/seal");
    },
    onSuccess: invalidate,
  });

  const loadContent = (html: string, tid: string | null) => {
    setBody(html);
    setTemplateId(tid);
    setEditorKey((k) => k + 1);
    setView("editor");
  };

  if (view === null || willQ.isLoading) {
    return <div className="h-64 bg-warm-fog rounded-2xl animate-pulse" />;
  }

  // ---- Start chooser ----
  if (view === "start") {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-warm-accent/10 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-warm-accent" />
            </div>
            <div>
              <h3 className="font-serif text-2xl text-warm-plum">¿Cómo quieres empezar?</h3>
              <p className="text-sm text-warm-olive mt-1 leading-relaxed">
                Elige una plantilla según tu caso, responde un formulario guiado que genera
                un borrador, o empieza en blanco. Luego lo editas con formato, imágenes y tu
                firma.
              </p>
            </div>
          </div>
        </div>

        {/* Guided form + blank */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setView("form")}
            className="text-left card hover:border-warm-silver transition flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-warm-accent/10 flex items-center justify-center shrink-0">
              <ListChecks size={18} className="text-warm-accent" />
            </div>
            <div>
              <h4 className="font-bold text-warm-plum">Formulario guiado</h4>
              <p className="text-sm text-warm-olive mt-0.5">
                Responde y autogeneramos el borrador. Añade tantos herederos o bienes como
                necesites.
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => loadContent(BLANK_TEMPLATE_HTML, null)}
            className="text-left card hover:border-warm-silver transition flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-warm-light flex items-center justify-center shrink-0">
              <FilePlus size={18} className="text-warm-plum" />
            </div>
            <div>
              <h4 className="font-bold text-warm-plum">En blanco</h4>
              <p className="text-sm text-warm-olive mt-0.5">
                Empieza con un lienzo vacío y escríbelo a tu manera.
              </p>
            </div>
          </button>
        </div>

        {/* Templates */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-warm-silver mb-3">
            Plantillas por escenario
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {WILL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => loadContent(t.html, t.id)}
                className="text-left card hover:border-warm-silver transition"
              >
                <h4 className="font-serif text-xl text-warm-plum">{t.name}</h4>
                <p className="text-sm text-warm-olive mt-1">{t.scenario}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Guided form ----
  if (view === "form") {
    return (
      <WillForm
        onCancel={() => setView("start")}
        onGenerate={(html) => loadContent(html, "form")}
      />
    );
  }

  // ---- Editor ----
  const doc = docQ.data;
  const sealValid = doc?.seal.valid ?? false;
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => setView("start")}
        className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum transition"
      >
        <ArrowLeft size={16} /> Cambiar plantilla / reiniciar
      </button>

      <WillEditor key={editorKey} initialContent={body} onChange={setBody} />

      {/* Seal + actions */}
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
                  ? `Versión ${doc.seal.document_version} · ${fmtShort(doc.seal.sealed_at)}`
                  : doc?.seal.document_hash
                  ? "El contenido cambió tras el último sello. Guarda y vuelve a sellar."
                  : "Guarda y sella para fijar una huella de integridad."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="btn-secondary inline-flex items-center gap-2"
            >
              {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => printDocument(body, doc)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Download size={16} /> Imprimir
            </button>
            <button
              type="button"
              onClick={() => seal.mutate()}
              disabled={seal.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {seal.isPending ? <Loader2 size={16} className="animate-spin" /> : <Stamp size={16} />}
              {sealValid ? "Re-sellar" : "Sellar"}
            </button>
          </div>
        </div>
        {doc?.content_hash && (
          <div className="border border-warm-sand rounded-2xl px-4 py-3 bg-warm-fog/40">
            <p className="text-[10px] font-bold uppercase tracking-wider text-warm-silver mb-1">
              Huella SHA-256 (último guardado)
            </p>
            <p className="text-xs font-mono text-warm-plum break-all">{doc.content_hash}</p>
          </div>
        )}
        <p className="text-xs text-warm-silver flex items-center gap-1.5">
          <Lock size={12} /> El sello acredita integridad, no validez legal — para eso, lleva
          el documento ante notario.
        </p>
      </div>
    </div>
  );
};

const fmtShort = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("es") : "";

// ---------- Dynamic guided form ----------

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
      {label}
    </label>
    {children}
  </div>
);

const WillForm = ({
  onCancel,
  onGenerate,
}: {
  onCancel: () => void;
  onGenerate: (html: string) => void;
}) => {
  const [d, setD] = useState<WillFormData>(emptyWillForm());
  const set = (patch: Partial<WillFormData>) => setD((prev) => ({ ...prev, ...patch }));

  const importQ = useMutation({
    mutationFn: async () => {
      const [heirs, assets] = await Promise.all([
        api.get<{ entries: { full_name?: string; relationship?: string; inheritance_share?: string; notes?: string }[] }>(
          "/legacy/estate/heirs"
        ),
        api.get<{ entries: { name?: string; asset_type?: string; approximate_value?: string; location?: string }[] }>(
          "/legacy/estate/assets"
        ),
      ]);
      return { heirs: heirs.data.entries, assets: assets.data.entries };
    },
    onSuccess: ({ heirs, assets }) => {
      set({
        heirs: heirs.length
          ? heirs.map((h) => ({
              name: h.full_name ?? "",
              relationship: h.relationship ?? "",
              share: h.inheritance_share ?? "",
              notes: h.notes ?? "",
            }))
          : d.heirs,
        assets: assets.map((a) => ({
          name: a.name ?? "",
          kind: a.asset_type ?? "",
          value: a.approximate_value ?? "",
          location: a.location ?? "",
        })),
      });
    },
  });

  // Generic helpers to mutate dynamic lists.
  const addHeir = () =>
    set({ heirs: [...d.heirs, { name: "", relationship: "", share: "", notes: "" }] });
  const addAsset = () =>
    set({ assets: [...d.assets, { name: "", kind: "", value: "", location: "" }] });
  const addGuardian = () =>
    set({ guardians: [...d.guardians, { minor: "", guardian: "", contact: "" }] });

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum transition"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="card space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-serif text-2xl text-warm-plum">Formulario guiado</h3>
          <button
            type="button"
            onClick={() => importQ.mutate()}
            disabled={importQ.isPending}
            className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-accent/10 text-warm-accent hover:bg-warm-accent/20 transition"
          >
            {importQ.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Importar de Mi legado
          </button>
        </div>

        {/* Testator */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nombre legal completo">
            <input className="input" value={d.testator_full_name} onChange={(e) => set({ testator_full_name: e.target.value })} />
          </Field>
          <Field label="Documento de identidad">
            <input className="input" value={d.testator_id_number} onChange={(e) => set({ testator_id_number: e.target.value })} />
          </Field>
          <Field label="Ciudad">
            <input className="input" value={d.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <Field label="Fecha">
            <input type="date" className="input" value={d.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
        </div>
        <Field label="Declaraciones generales">
          <textarea className="input min-h-[80px] resize-y" placeholder="Ej. revoco cualquier testamento anterior..." value={d.declarations} onChange={(e) => set({ declarations: e.target.value })} />
        </Field>
      </div>

      {/* Heirs (dynamic) */}
      <DynamicList
        title="Herederos"
        addLabel="Añadir heredero"
        onAdd={addHeir}
        rows={d.heirs}
        onRemove={(i) => set({ heirs: d.heirs.filter((_, idx) => idx !== i) })}
        render={(h, i) => (
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Nombre" value={h.name} onChange={(e) => set({ heirs: d.heirs.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
            <input className="input" placeholder="Relación" value={h.relationship} onChange={(e) => set({ heirs: d.heirs.map((x, idx) => (idx === i ? { ...x, relationship: e.target.value } : x)) })} />
            <input className="input" placeholder='Parte (ej. "50%" o "la casa")' value={h.share} onChange={(e) => set({ heirs: d.heirs.map((x, idx) => (idx === i ? { ...x, share: e.target.value } : x)) })} />
            <input className="input" placeholder="Notas" value={h.notes} onChange={(e) => set({ heirs: d.heirs.map((x, idx) => (idx === i ? { ...x, notes: e.target.value } : x)) })} />
          </div>
        )}
      />

      {/* Guardians (dynamic) */}
      <DynamicList
        title="Tutela de menores"
        addLabel="Añadir menor"
        onAdd={addGuardian}
        rows={d.guardians}
        onRemove={(i) => set({ guardians: d.guardians.filter((_, idx) => idx !== i) })}
        emptyHint="Solo si tienes hijos o personas menores a tu cargo."
        render={(g, i) => (
          <div className="grid sm:grid-cols-3 gap-3">
            <input className="input" placeholder="Menor" value={g.minor} onChange={(e) => set({ guardians: d.guardians.map((x, idx) => (idx === i ? { ...x, minor: e.target.value } : x)) })} />
            <input className="input" placeholder="Tutor designado" value={g.guardian} onChange={(e) => set({ guardians: d.guardians.map((x, idx) => (idx === i ? { ...x, guardian: e.target.value } : x)) })} />
            <input className="input" placeholder="Contacto del tutor" value={g.contact} onChange={(e) => set({ guardians: d.guardians.map((x, idx) => (idx === i ? { ...x, contact: e.target.value } : x)) })} />
          </div>
        )}
      />

      {/* Assets (dynamic) */}
      <DynamicList
        title="Bienes y cuentas"
        addLabel="Añadir bien"
        onAdd={addAsset}
        rows={d.assets}
        onRemove={(i) => set({ assets: d.assets.filter((_, idx) => idx !== i) })}
        render={(a, i) => (
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="input" placeholder="Nombre del bien" value={a.name} onChange={(e) => set({ assets: d.assets.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
            <input className="input" placeholder="Tipo" value={a.kind} onChange={(e) => set({ assets: d.assets.map((x, idx) => (idx === i ? { ...x, kind: e.target.value } : x)) })} />
            <input className="input" placeholder="Valor aprox." value={a.value} onChange={(e) => set({ assets: d.assets.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)) })} />
            <input className="input" placeholder="Ubicación" value={a.location} onChange={(e) => set({ assets: d.assets.map((x, idx) => (idx === i ? { ...x, location: e.target.value } : x)) })} />
          </div>
        )}
      />

      {/* Executor + wishes */}
      <div className="card space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Albacea (nombre)">
            <input className="input" value={d.executor_name} onChange={(e) => set({ executor_name: e.target.value })} />
          </Field>
          <Field label="Albacea (contacto)">
            <input className="input" value={d.executor_contact} onChange={(e) => set({ executor_contact: e.target.value })} />
          </Field>
        </div>
        <Field label="Últimos deseos">
          <textarea className="input min-h-[80px] resize-y" value={d.wishes} onChange={(e) => set({ wishes: e.target.value })} />
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onGenerate(generateWillHtml(d))}
          className="btn-primary inline-flex items-center gap-2"
        >
          <FileText size={16} /> Generar borrador
        </button>
      </div>
    </div>
  );
};

function DynamicList<T>({
  title,
  addLabel,
  onAdd,
  rows,
  onRemove,
  render,
  emptyHint,
}: {
  title: string;
  addLabel: string;
  onAdd: () => void;
  rows: T[];
  onRemove: (i: number) => void;
  render: (row: T, i: number) => React.ReactNode;
  emptyHint?: string;
}) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-warm-plum">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-accent/10 text-warm-accent hover:bg-warm-accent/20 transition"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-warm-silver italic">
          {emptyHint ?? "Aún no añadiste ninguno."}
        </p>
      )}
      <AnimatePresence initial={false}>
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-warm-sand rounded-2xl p-3 relative"
          >
            <div className="pr-8">{render(row, i)}</div>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-3 right-3 text-warm-silver hover:text-warm-accent p-1"
              aria-label="Quitar"
            >
              <Trash2 size={15} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
