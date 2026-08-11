import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowLeft,
  Archive,
  Calendar,
  ChevronDown,
  Copy,
  Download,
  FileImage,
  FileText,
  FileVideo,
  Globe,
  Headphones,
  Loader2,
  MessageCircle,
  Pencil,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ProfilePhotoUploader } from "../components/ProfilePhotoUploader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { UpgradeModal, type QuotaInfo } from "../components/UpgradeModal";
import { extractQuota } from "../lib/quota";
import { api } from "../lib/api";
import { UploadZone } from "../components/UploadZone";
import { VaultChat } from "../components/VaultChat";
import { MemorialPanel } from "../components/MemorialPanel";
import { useAuthStore } from "../store/authStore";
import { Shimmer } from "../components/Shimmer";

type Surface = "conversar" | "recuerdos" | "memorial";

type Vault = {
  id: string;
  user_id: string;
  deceased_name: string;
  deceased_bio?: string | null;
  deceased_birth_date?: string | null;
  deceased_death_date?: string | null;
  profile_photo_url?: string | null;
};

type VaultFile = {
  id: string;
  file_type: string;
  file_name: string | null;
  file_url: string;
  uploaded_at: string;
  transcript?: string | null;
};

const fileIcon = (type: string) => {
  switch (type) {
    case "photo":
      return FileImage;
    case "audio":
      return Headphones;
    case "video":
      return FileVideo;
    default:
      return FileText;
  }
};

export const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [bioOpen, setBioOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  // Surface tabs: the person stays the same, the way you engage changes. Deep
  // links (e.g. redirects from the old /app/memorials/:id) can preselect one.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSurface = (searchParams.get("surface") as Surface | null) ?? "conversar";
  const [surface, setSurface] = useState<Surface>(
    ["conversar", "recuerdos", "memorial"].includes(initialSurface)
      ? initialSurface
      : "conversar"
  );
  const selectSurface = (s: Surface) => {
    setSurface(s);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (s === "conversar") next.delete("surface");
        else next.set("surface", s);
        return next;
      },
      { replace: true }
    );
  };
  const toggleExpanded = (fileId: string) =>
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      next.has(fileId) ? next.delete(fileId) : next.add(fileId);
      return next;
    });
  const copyTranscript = async (fileId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFile(fileId);
      setTimeout(() => setCopiedFile((c) => (c === fileId ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  const vaultQ = useQuery({
    queryKey: ["vault", id],
    queryFn: async () => (await api.get<Vault>(`/vaults/${id}`)).data,
    enabled: !!id,
  });

  const filesQ = useQuery({
    queryKey: ["vault-files", id],
    queryFn: async () =>
      (await api.get<{ files: VaultFile[] }>(`/vaults/${id}/files`)).data.files,
    enabled: !!id,
    // Poll while any audio/video lacks transcript — Whisper runs async in backend.
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return false;
      const pending = data.some(
        (f) => (f.file_type === "audio" || f.file_type === "video") && !f.transcript
      );
      return pending ? 5000 : false;
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/vaults/${id}/files/${fileId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault-files", id] }),
  });

  const isOwner = !!currentUser && currentUser.id === vaultQ.data?.user_id;

  // Cursor-aware glow on the hero card. Springs smooth the cursor lag.
  const glowRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const glowX = useSpring(mouseX, { stiffness: 80, damping: 18, mass: 0.6 });
  const glowY = useSpring(mouseY, { stiffness: 80, damping: 18, mass: 0.6 });
  const onHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = glowRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set(e.clientX - r.left);
    mouseY.set(e.clientY - r.top);
  };
  const onHeroLeave = () => {
    mouseX.set(-400);
    mouseY.set(-400);
  };

  const biographyQ = useQuery({
    queryKey: ["vault-biography", id],
    queryFn: async () =>
      (await api.get<{ biography: string | null; generated_at: string | null }>(
        `/vaults/${id}/biography`
      )).data,
    enabled: !!id,
  });

  const generateBio = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/vaults/${id}/biography/generate`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault-biography", id] });
      setBioOpen(true);
    },
    onError: (err) => {
      const q = extractQuota(err);
      if (q) setQuota(q);
    },
  });

  const updateBio = useMutation({
    mutationFn: async (text: string) => {
      await api.patch(`/vaults/${id}/biography`, { text });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault-biography", id] });
      setIsEditingBio(false);
    },
  });

  const updateVaultInfo = useMutation({
    mutationFn: async (patch: Partial<Vault>) => {
      await api.put(`/vaults/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault", id] });
      setIsEditingInfo(false);
    },
  });

  useDocumentTitle(vaultQ.data?.deceased_name);

  const doExport = async () => {
    try {
      const resp = await api.get(`/vaults/${id}/export`, { responseType: "blob" });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `presence-${vaultQ.data?.deceased_name ?? "vault"}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("export failed", err);
    }
  };

  if (vaultQ.isLoading)
    return (
      <div className="card">
        <Shimmer className="h-9 w-1/3 mb-3" />
        <Shimmer className="h-4 w-1/4 mb-6" />
        <Shimmer className="h-4 w-full mb-2" />
        <Shimmer className="h-4 w-5/6" />
      </div>
    );

  if (vaultQ.error || !vaultQ.data)
    return (
      <div className="card border-red-100 bg-red-50">
        <p className="text-red-700">No se pudo cargar este vault.</p>
      </div>
    );

  const vault = vaultQ.data;
  const lifespan = [vault.deceased_birth_date, vault.deceased_death_date]
    .filter(Boolean)
    .join(" – ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm text-warm-olive hover:text-warm-plum transition"
        >
          <ArrowLeft size={16} /> Volver al dashboard
        </Link>
        {isOwner && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsEditingInfo(true)}
              className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-fog hover:bg-warm-sand text-warm-olive hover:text-warm-plum transition"
              title="Editar nombre, fechas y biografía"
            >
              <Pencil size={14} />
              Editar info
            </button>
            <button
              type="button"
              onClick={() => generateBio.mutate()}
              disabled={generateBio.isPending}
              className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-accent/10 text-warm-accent hover:bg-warm-accent/20 transition disabled:opacity-50"
              title="Generar biografía con IA basada en archivos y transcripciones"
            >
              <Sparkles size={14} />
              {generateBio.isPending
                ? "Generando..."
                : biographyQ.data?.biography
                ? "Regenerar biografía"
                : "Generar biografía"}
            </button>
            <button
              type="button"
              onClick={doExport}
              className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-fog hover:bg-warm-sand text-warm-olive hover:text-warm-plum transition"
              title="Descargar ZIP con todos los datos del vault"
            >
              <Download size={14} />
              Exportar
            </button>
          </div>
        )}
      </div>

      {/* HERO CARD */}
      <motion.div
        ref={glowRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="card relative overflow-hidden"
      >
        {/* cursor-aware glow */}
        <motion.div
          aria-hidden
          className="absolute w-72 h-72 rounded-full pointer-events-none -z-0"
          style={{
            x: glowX,
            y: glowY,
            translateX: "-50%",
            translateY: "-50%",
            background:
              "radial-gradient(circle, rgba(0, 0, 0, 0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        {/* decorative orb (static fallback) */}
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-warm-accent/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
          {isOwner ? (
            <ProfilePhotoUploader
              uploadUrl={`/vaults/${id}/profile-photo`}
              currentUrl={vault.profile_photo_url}
              fallback={vault.deceased_name}
              size={88}
              onUploaded={() => qc.invalidateQueries({ queryKey: ["vault", id] })}
            />
          ) : vault.profile_photo_url ? (
            <img
              src={vault.profile_photo_url}
              alt={vault.deceased_name}
              className="w-[88px] h-[88px] rounded-full object-cover shrink-0"
            />
          ) : null}
          <div className="flex-1 min-w-0">
            <p className="eyebrow mb-2">
              Memory Vault
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-warm-plum">
              {vault.deceased_name}
            </h1>
            {lifespan && (
              <p className="text-sm text-warm-olive flex items-center gap-1.5 mt-2">
                <Calendar size={14} />
                {lifespan}
              </p>
            )}
            {vault.deceased_bio && (
              <p className="text-warm-plum/90 mt-5 whitespace-pre-wrap leading-relaxed max-w-3xl">
                {vault.deceased_bio}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* SURFACE TABS — same person, different way to engage */}
      <div className="flex gap-1 border-b border-warm-sand overflow-x-auto pb-px">
        {([
          { key: "conversar" as const, label: "Conversar", icon: <MessageCircle size={14} /> },
          { key: "recuerdos" as const, label: "Recuerdos", icon: <Archive size={14} /> },
          { key: "memorial" as const, label: "Memorial público", icon: <Globe size={14} /> },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectSurface(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              surface === t.key
                ? "border-warm-accent text-warm-plum"
                : "border-transparent text-warm-olive hover:text-warm-plum"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {surface === "conversar" && (
          <motion.div
            key="surface-conversar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <VaultChat vaultId={id!} />
          </motion.div>
        )}

        {surface === "memorial" && (
          <motion.div
            key="surface-memorial"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <MemorialPanel vaultId={id!} />
          </motion.div>
        )}

        {surface === "recuerdos" && (
          <motion.div
            key="surface-recuerdos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
      {/* AI BIOGRAPHY (collapsible + editable) */}
      {biographyQ.data?.biography && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setBioOpen((o) => !o)}
              className="flex items-center gap-2 text-left flex-1"
            >
              <Sparkles size={18} className="text-warm-accent" />
              <div>
                <h3 className="font-serif text-2xl text-warm-plum">
                  Biografía generada por IA
                </h3>
                {biographyQ.data.generated_at && (
                  <p className="text-xs text-warm-silver mt-0.5">
                    Actualizada {new Date(biographyQ.data.generated_at).toLocaleDateString("es", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              {isOwner && bioOpen && !isEditingBio && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedBio(biographyQ.data?.biography ?? "");
                    setIsEditingBio(true);
                  }}
                  className="text-warm-silver hover:text-warm-accent transition p-1.5 rounded-lg hover:bg-warm-fog"
                  title="Editar manualmente"
                  aria-label="Editar biografía"
                >
                  <Pencil size={16} />
                </button>
              )}
              <motion.button
                type="button"
                onClick={() => setBioOpen((o) => !o)}
                animate={{ rotate: bioOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-warm-silver p-1.5 rounded-lg hover:bg-warm-fog"
                aria-label={bioOpen ? "Colapsar" : "Expandir"}
              >
                <ChevronDown size={20} />
              </motion.button>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {bioOpen && (
              <motion.div
                key="bio"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                {isEditingBio ? (
                  <div className="mt-5">
                    <textarea
                      autoFocus
                      className="input min-h-[280px] font-serif text-lg whitespace-pre-wrap resize-y leading-relaxed"
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                    />
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingBio(false)}
                        className="btn-secondary"
                        disabled={updateBio.isPending}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBio.mutate(editedBio)}
                        disabled={updateBio.isPending || !editedBio.trim()}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        {updateBio.isPending ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-warm-plum/90 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                    {biographyQ.data.biography}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FILES */}
      <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-2xl text-warm-plum">Memorias</h3>
            {filesQ.data && filesQ.data.length > 0 && (
              <span className="text-xs font-bold text-warm-silver">
                {filesQ.data.length} archivo{filesQ.data.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <UploadZone
            vaultId={id!}
            onUploaded={() => qc.invalidateQueries({ queryKey: ["vault-files", id] })}
            onQuotaExceeded={(q) => setQuota(q)}
          />
          <div className="mt-5 space-y-2">
            {(filesQ.data ?? []).map((f) => {
              const Icon = fileIcon(f.file_type);
              const isMedia = f.file_type === "audio" || f.file_type === "video";
              const transcribing = isMedia && !f.transcript;
              const hasTranscript = isMedia && !!f.transcript;
              const isOpen = expandedFiles.has(f.id);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-warm-sand rounded-2xl overflow-hidden hover:border-warm-silver transition"
                >
                  <div className="flex items-center gap-3 text-sm px-3 py-2.5 hover:bg-warm-fog/50 transition">
                    <div className="w-8 h-8 rounded-xl bg-warm-light flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-warm-plum" />
                    </div>
                    <span className="flex-1 truncate text-warm-plum flex items-center gap-2 min-w-0">
                      <span className="truncate">{f.file_name ?? "archivo"}</span>
                      {transcribing && (
                        <span
                          title="Whisper transcribiendo este audio..."
                          className="text-[10px] font-bold uppercase tracking-wider text-warm-accent bg-warm-accent/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"
                        >
                          <Loader2 size={10} className="animate-spin" />
                          Transcribiendo
                        </span>
                      )}
                      {hasTranscript && (
                        <span
                          title="Transcrito — la IA puede usarlo en el chat"
                          className="text-[10px] font-bold uppercase tracking-wider text-warm-olive bg-warm-fog px-2 py-0.5 rounded-full shrink-0"
                        >
                          Transcrito
                        </span>
                      )}
                    </span>
                    {hasTranscript && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(f.id)}
                        className="text-warm-silver hover:text-warm-accent transition p-1 rounded-lg"
                        aria-label={isOpen ? "Ocultar transcripción" : "Ver transcripción"}
                        aria-expanded={isOpen}
                      >
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="inline-block"
                        >
                          <ChevronDown size={16} />
                        </motion.span>
                      </button>
                    )}
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-warm-olive hover:text-warm-accent transition"
                    >
                      Abrir
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${f.file_name ?? "archivo"}"?`)) {
                          deleteFile.mutate(f.id);
                        }
                      }}
                      disabled={deleteFile.isPending}
                      className="text-warm-silver hover:text-warm-accent disabled:opacity-50 transition p-1 rounded-lg"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && hasTranscript && f.transcript && (
                      <motion.div
                        key="transcript"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden border-t border-warm-sand bg-warm-fog/40"
                      >
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-warm-silver">
                              Transcripción
                            </p>
                            <button
                              type="button"
                              onClick={() => copyTranscript(f.id, f.transcript!)}
                              className="text-[10px] font-bold uppercase tracking-wider text-warm-olive hover:text-warm-accent inline-flex items-center gap-1 transition"
                            >
                              <Copy size={10} />
                              {copiedFile === f.id ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                          <p className="text-sm text-warm-plum/90 italic leading-relaxed whitespace-pre-wrap">
                            {f.transcript}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            {filesQ.data && filesQ.data.length === 0 && (
              <p className="text-sm text-warm-silver italic text-center py-4">
                Sin archivos aún. Sube fotos, audios o documentos para enriquecer la conversación.
              </p>
            )}
          </div>
        </motion.div>

          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal open={!!quota} quota={quota} onClose={() => setQuota(null)} />

      {/* EDIT INFO MODAL */}
      <AnimatePresence>
        {isEditingInfo && (
          <motion.div
            key="edit-info-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-warm-plum/30 backdrop-blur-sm flex items-center justify-center px-4 py-8"
            onClick={() => !updateVaultInfo.isPending && setIsEditingInfo(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <EditInfoPanel
                vault={vault}
                onCancel={() => setIsEditingInfo(false)}
                onSave={(patch) => updateVaultInfo.mutate(patch)}
                saving={updateVaultInfo.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ----- Edit info subpanel -----
const EditInfoPanel = ({
  vault,
  onCancel,
  onSave,
  saving,
}: {
  vault: Vault;
  onCancel: () => void;
  onSave: (patch: Partial<Vault>) => void;
  saving: boolean;
}) => {
  const [form, setForm] = useState({
    deceased_name: vault.deceased_name ?? "",
    deceased_bio: vault.deceased_bio ?? "",
    deceased_birth_date: vault.deceased_birth_date ?? "",
    deceased_death_date: vault.deceased_death_date ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      deceased_name: form.deceased_name,
      deceased_bio: form.deceased_bio || undefined,
      deceased_birth_date: form.deceased_birth_date || undefined,
      deceased_death_date: form.deceased_death_date || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-warm-plum">Editar información</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-warm-silver hover:text-warm-plum transition p-1.5 rounded-lg hover:bg-warm-fog"
          aria-label="Cerrar"
          disabled={saving}
        >
          <X size={18} />
        </button>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
          Nombre completo
        </label>
        <input
          className="input"
          value={form.deceased_name}
          onChange={(e) => setForm({ ...form, deceased_name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Nacimiento
          </label>
          <input
            type="date"
            className="input"
            value={form.deceased_birth_date}
            onChange={(e) => setForm({ ...form, deceased_birth_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Fallecimiento
          </label>
          <input
            type="date"
            className="input"
            value={form.deceased_death_date}
            onChange={(e) => setForm({ ...form, deceased_death_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
          Biografía base
        </label>
        <textarea
          className="input min-h-[160px] resize-y"
          value={form.deceased_bio}
          onChange={(e) => setForm({ ...form, deceased_bio: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={saving}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
};
