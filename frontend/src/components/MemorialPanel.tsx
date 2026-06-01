import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Globe,
  Heart,
  Image as ImageIcon,
  Link as LinkIcon,
  Lock,
  MessageSquare,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { UpgradeModal, type QuotaInfo } from "./UpgradeModal";
import { extractQuota } from "../lib/quota";
import { Shimmer } from "./Shimmer";

type Memorial = {
  id: string;
  vault_id: string;
  deceased_name: string;
  deceased_bio?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  profile_photo_url?: string | null;
  public: boolean;
  public_slug?: string | null;
};

type Photo = {
  id: string;
  photo_url: string;
  caption?: string | null;
  ai_story?: string | null;
  ai_story_generated_at?: string | null;
  created_at: string;
};

type GuestbookEntry = {
  id: string;
  visitor_name: string;
  visitor_email?: string | null;
  message: string;
  approved: boolean;
  created_at: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Public-memorial management as a surface *inside* a vault. A memorial is the
 * public face of a vault (1:1, FK vault_id), so it lives here rather than as a
 * top-level sibling. If no memorial exists yet for this vault, we lazily create
 * one on demand instead of forcing a separate "pick a vault" flow.
 */
export const MemorialPanel = ({ vaultId }: { vaultId: string }) => {
  const qc = useQueryClient();
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  // The memorial list already carries vault_id, so we resolve the vault's
  // memorial client-side — no dedicated endpoint needed.
  const memorialsQ = useQuery({
    queryKey: ["memorials"],
    queryFn: async () =>
      (await api.get<{ memorials: Memorial[] }>("/memorials")).data.memorials,
  });

  const memorial = memorialsQ.data?.find((m) => m.vault_id === vaultId) ?? null;

  const createMemorial = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Memorial>("/memorials", { vault_id: vaultId });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorials"] }),
    onError: (err) => {
      const q = extractQuota(err);
      if (q) setQuota(q);
    },
  });

  if (memorialsQ.isLoading) {
    return (
      <div className="card">
        <Shimmer className="h-7 w-1/3 mb-3" />
        <Shimmer className="h-4 w-2/3" />
      </div>
    );
  }

  if (!memorial) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center py-12"
        >
          <div className="w-14 h-14 rounded-2xl bg-warm-accent/10 flex items-center justify-center mx-auto mb-4">
            <Heart size={24} className="text-warm-accent" fill="currentColor" />
          </div>
          <h3 className="font-serif text-2xl text-warm-plum mb-2">
            Crea la página pública
          </h3>
          <p className="text-warm-olive mb-6 max-w-md mx-auto">
            Un memorial es la cara pública de este vault. Hereda el nombre, la biografía
            y las fechas, y añade galería y libro de visitas para que familia y amigos
            honren la memoria.
          </p>
          <button
            type="button"
            onClick={() => createMemorial.mutate()}
            disabled={createMemorial.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Heart size={16} />
            {createMemorial.isPending ? "Creando..." : "Crear memorial"}
          </button>
        </motion.div>
        <UpgradeModal open={!!quota} quota={quota} onClose={() => setQuota(null)} />
      </>
    );
  }

  return <MemorialManager memorial={memorial} />;
};

// ----- Management UI for an existing memorial -----
const MemorialManager = ({ memorial }: { memorial: Memorial }) => {
  const id = memorial.id;
  const qc = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"info" | "photos" | "guestbook">("info");
  const [copySuccess, setCopySuccess] = useState(false);

  const photosQ = useQuery({
    queryKey: ["memorial-photos", id],
    queryFn: async () =>
      (await api.get<{ photos: Photo[] }>(`/memorials/${id}/photos`)).data.photos,
    enabled: tab === "photos",
  });

  const guestbookQ = useQuery({
    queryKey: ["memorial-guestbook", id],
    queryFn: async () =>
      (await api.get<{ entries: GuestbookEntry[] }>(`/memorials/${id}/guestbook`))
        .data.entries,
    enabled: tab === "guestbook",
  });

  const togglePublic = useMutation({
    mutationFn: async (isPublic: boolean) => {
      await api.post(`/memorials/${id}/public`, { public: isPublic });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorials"] }),
  });

  const updateInfo = useMutation({
    mutationFn: async (patch: Partial<Memorial>) => {
      await api.put(`/memorials/${id}`, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorials"] }),
  });

  const removeMemorial = useMutation({
    mutationFn: async () => {
      await api.delete(`/memorials/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorials"] }),
  });

  const uploadPhoto = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("photo", file);
      await api.post(`/memorials/${id}/photos`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorial-photos", id] }),
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      await api.delete(`/memorials/${id}/photos/${photoId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorial-photos", id] }),
  });

  const generatePhotoStory = useMutation({
    mutationFn: async (photoId: string) => {
      await api.post(`/memorials/${id}/photos/${photoId}/story`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorial-photos", id] }),
  });

  const approveEntry = useMutation({
    mutationFn: async (entryId: string) => {
      await api.patch(`/memorials/${id}/guestbook/${entryId}/approve`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorial-guestbook", id] }),
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      await api.delete(`/memorials/${id}/guestbook/${entryId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memorial-guestbook", id] }),
  });

  const publicUrl = memorial.public_slug
    ? `${window.location.origin}/m/${memorial.public_slug}`
    : null;
  const pendingCount = guestbookQ.data?.filter((e) => !e.approved).length ?? 0;

  const onCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Public toggle */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold text-warm-plum flex items-center gap-2">
              {memorial.public ? (
                <>
                  <Globe size={16} className="text-warm-accent" />
                  Memorial público
                </>
              ) : (
                <>
                  <Lock size={16} className="text-warm-olive" />
                  Memorial privado
                </>
              )}
            </p>
            <p className="text-sm text-warm-olive mt-1">
              {memorial.public
                ? "Cualquiera con el link puede verlo y dejar mensajes."
                : "Solo tú puedes verlo. Hazlo público para compartir el link."}
            </p>
          </div>
          <button
            onClick={() => togglePublic.mutate(!memorial.public)}
            disabled={togglePublic.isPending}
            className={memorial.public ? "btn-secondary" : "btn-primary"}
          >
            {memorial.public ? "Hacer privado" : "Hacer público"}
          </button>
        </div>

        {memorial.public && publicUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 p-3 border border-warm-sand rounded-2xl"
          >
            <LinkIcon size={16} className="text-warm-silver shrink-0" />
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-mono text-warm-plum truncate flex-1 hover:text-warm-accent transition"
            >
              {publicUrl}
            </a>
            <button
              type="button"
              onClick={onCopyLink}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-warm-light hover:bg-warm-sand text-warm-plum transition shrink-0"
            >
              {copySuccess ? "Copiado!" : "Copiar"}
            </button>
          </motion.div>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-1 border-b border-warm-sand">
        {([
          { key: "info" as const, label: "Información", icon: null },
          { key: "photos" as const, label: "Fotos", icon: <ImageIcon size={14} /> },
          {
            key: "guestbook" as const,
            label: `Libro de visitas${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
            icon: <MessageSquare size={14} />,
          },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition ${
              tab === t.key
                ? "border-warm-accent text-warm-plum"
                : "border-transparent text-warm-olive hover:text-warm-plum"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* PANELS */}
      <AnimatePresence mode="wait">
        {tab === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <InfoPanel
              memorial={memorial}
              onSave={(patch) => updateInfo.mutate(patch)}
              saving={updateInfo.isPending}
              onDelete={() => {
                if (
                  confirm(
                    "¿Eliminar la página pública? Borra fotos y mensajes del memorial. El vault privado se conserva."
                  )
                ) {
                  removeMemorial.mutate();
                }
              }}
            />
          </motion.div>
        )}

        {tab === "photos" && (
          <motion.div
            key="photos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card"
          >
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  uploadPhoto.mutate(f, {
                    onSettled: () => {
                      if (photoInputRef.current) photoInputRef.current.value = "";
                    },
                  });
                }
              }}
            />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl text-warm-plum">Galería</h3>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadPhoto.isPending}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={16} />
                {uploadPhoto.isPending ? "Subiendo..." : "Subir foto"}
              </button>
            </div>

            {photosQ.isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-warm-fog rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {photosQ.data && photosQ.data.length === 0 && (
              <p className="text-sm text-warm-silver italic text-center py-8">
                Sin fotos aún. Sube imágenes para que aparezcan en la galería pública.
              </p>
            )}

            {photosQ.data && photosQ.data.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photosQ.data.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden bg-warm-fog group flex flex-col"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={p.photo_url}
                        alt={p.caption ?? "Foto"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => generatePhotoStory.mutate(p.id)}
                          disabled={generatePhotoStory.isPending}
                          title={p.ai_story ? "Regenerar historia" : "Generar historia con IA"}
                          className="w-8 h-8 rounded-full bg-white/90 text-warm-accent hover:bg-white flex items-center justify-center"
                        >
                          <Sparkles size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar esta foto?")) {
                              deletePhoto.mutate(p.id);
                            }
                          }}
                          disabled={deletePhoto.isPending}
                          className="w-8 h-8 rounded-full bg-white/90 text-warm-plum hover:bg-white hover:text-warm-accent flex items-center justify-center"
                          aria-label="Eliminar foto"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {p.ai_story && (
                      <div className="px-3 py-2 bg-white border-t border-warm-sand">
                        <p className="text-xs text-warm-plum italic leading-relaxed line-clamp-3">
                          {p.ai_story}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "guestbook" && (
          <motion.div
            key="guestbook"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl text-warm-plum">Libro de visitas</h3>
              {guestbookQ.data && (
                <span className="text-xs font-bold text-warm-silver">
                  {guestbookQ.data.length} mensaje
                  {guestbookQ.data.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <p className="text-sm text-warm-olive mb-5">
              Los mensajes aparecen aquí cuando un visitante los envía. Aprueba los que
              quieras que aparezcan en la página pública.
            </p>

            {guestbookQ.isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-warm-fog rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {guestbookQ.data && guestbookQ.data.length === 0 && (
              <p className="text-sm text-warm-silver italic text-center py-8">
                Aún no hay mensajes.
              </p>
            )}

            {guestbookQ.data && guestbookQ.data.length > 0 && (
              <div className="space-y-3">
                {guestbookQ.data.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border ${
                      e.approved
                        ? "border-warm-sand bg-white"
                        : "border-warm-accent/30 bg-warm-accent/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-bold text-warm-plum">{e.visitor_name}</p>
                        <p className="text-xs text-warm-silver">
                          {formatDate(e.created_at)}
                          {e.visitor_email && ` · ${e.visitor_email}`}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${
                          e.approved
                            ? "bg-warm-fog text-warm-olive"
                            : "bg-warm-accent/15 text-warm-accent"
                        }`}
                      >
                        {e.approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-sm text-warm-plum/90 whitespace-pre-wrap leading-relaxed mb-3">
                      {e.message}
                    </p>
                    <div className="flex gap-2">
                      {!e.approved && (
                        <button
                          onClick={() => approveEntry.mutate(e.id)}
                          disabled={approveEntry.isPending}
                          className="text-xs font-bold inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-warm-accent text-white hover:bg-warm-accent-hover transition disabled:opacity-50"
                        >
                          <Check size={12} /> Aprobar
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("¿Eliminar este mensaje?")) {
                            deleteEntry.mutate(e.id);
                          }
                        }}
                        disabled={deleteEntry.isPending}
                        className="text-xs font-bold inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-warm-fog hover:bg-warm-sand text-warm-olive hover:text-warm-plum transition disabled:opacity-50"
                      >
                        <X size={12} /> Eliminar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ----- Info subpanel -----
const InfoPanel = ({
  memorial,
  onSave,
  saving,
  onDelete,
}: {
  memorial: Memorial;
  onSave: (patch: Partial<Memorial>) => void;
  saving: boolean;
  onDelete: () => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    deceased_name: memorial.deceased_name ?? "",
    deceased_bio: memorial.deceased_bio ?? "",
    birth_date: memorial.birth_date ?? "",
    death_date: memorial.death_date ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      deceased_name: form.deceased_name,
      deceased_bio: form.deceased_bio || null,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="flex items-start gap-4">
        <ProfilePhotoUploader
          uploadUrl={`/memorials/${memorial.id}/profile-photo`}
          currentUrl={memorial.profile_photo_url}
          fallback={memorial.deceased_name}
          size={72}
          onUploaded={() => qc.invalidateQueries({ queryKey: ["memorials"] })}
        />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Foto pública del memorial
          </p>
          <p className="text-sm text-warm-silver">
            Puede diferir de la foto del vault privado. Esta es la que ven los visitantes.
          </p>
        </div>
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
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
            Fallecimiento
          </label>
          <input
            type="date"
            className="input"
            value={form.death_date}
            onChange={(e) => setForm({ ...form, death_date: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
          Biografía
        </label>
        <textarea
          className="input min-h-[160px] resize-y"
          value={form.deceased_bio}
          onChange={(e) => setForm({ ...form, deceased_bio: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
        <button
          type="button"
          onClick={onDelete}
          className="text-sm text-warm-olive hover:text-red-700 inline-flex items-center gap-1.5 transition"
        >
          <Trash2 size={14} />
          Eliminar página pública
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
};
