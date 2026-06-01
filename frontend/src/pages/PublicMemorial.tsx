import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Send, Calendar, Sparkles } from "lucide-react";
import axios from "axios";
import { useMeta } from "../hooks/useMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import { buildPersonSchema, SITE_ORIGIN } from "../lib/seo";

type Memorial = {
  id: string;
  deceased_name: string;
  deceased_bio?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  profile_photo_url?: string | null;
  cover_photo_url?: string | null;
  public_slug: string;
};

type Photo = {
  id: string;
  photo_url: string;
  caption?: string | null;
};

type GuestbookEntry = {
  id: string;
  visitor_name: string;
  message: string;
  created_at: string;
};

// Public endpoints — bypass the authenticated `api` client so we don't send tokens
// and don't trigger refresh logic on visitor traffic.
const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const publicApi = axios.create({ baseURL });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const yearOf = (date?: string | null) => {
  if (!date) return null;
  const m = /^(\d{4})/.exec(date);
  return m ? m[1] : null;
};

export const PublicMemorial = () => {
  const { slug } = useParams<{ slug: string }>();
  // Document title updated once memorial loads (below, after the query).
  const qc = useQueryClient();
  const [form, setForm] = useState({ visitor_name: "", visitor_email: "", message: "" });
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.add("public-memorial-body");
      return () => document.body.classList.remove("public-memorial-body");
    }
  }, []);

  const memorialQ = useQuery({
    queryKey: ["public-memorial", slug],
    queryFn: async () =>
      (await publicApi.get<Memorial>(`/m/${slug}`)).data,
    enabled: !!slug,
    retry: false,
  });

  useMeta({
    title: memorialQ.data
      ? `En memoria de ${memorialQ.data.deceased_name}`
      : null,
    description: memorialQ.data
      ? (memorialQ.data.deceased_bio ?? "").slice(0, 200) ||
        `Memorial digital en honor a ${memorialQ.data.deceased_name}.`
      : undefined,
    canonical: memorialQ.data ? `/m/${memorialQ.data.public_slug}` : undefined,
    ogTitle: memorialQ.data
      ? `En memoria de ${memorialQ.data.deceased_name}`
      : undefined,
    ogImage: memorialQ.data?.cover_photo_url || memorialQ.data?.profile_photo_url || undefined,
  });
  useStructuredData(
    memorialQ.data
      ? [
          buildPersonSchema({
            name: memorialQ.data.deceased_name,
            birthDate: memorialQ.data.birth_date,
            deathDate: memorialQ.data.death_date,
            description: memorialQ.data.deceased_bio,
            image: memorialQ.data.profile_photo_url ?? memorialQ.data.cover_photo_url,
            url: `${SITE_ORIGIN}/m/${memorialQ.data.public_slug}`,
          }),
        ]
      : []
  );

  const photosQ = useQuery({
    queryKey: ["public-memorial-photos", slug],
    queryFn: async () =>
      (await publicApi.get<{ photos: Photo[] }>(`/m/${slug}/photos`)).data.photos,
    enabled: !!slug && !!memorialQ.data,
  });

  const guestbookQ = useQuery({
    queryKey: ["public-memorial-guestbook", slug],
    queryFn: async () =>
      (await publicApi.get<{ entries: GuestbookEntry[] }>(`/m/${slug}/guestbook`)).data
        .entries,
    enabled: !!slug && !!memorialQ.data,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {
        visitor_name: form.visitor_name,
        message: form.message,
      };
      if (form.visitor_email.trim()) payload.visitor_email = form.visitor_email.trim();
      await publicApi.post(`/m/${slug}/guestbook`, payload);
    },
    onMutate: () => {
      setSubmitState("submitting");
      setSubmitError(null);
    },
    onSuccess: () => {
      setSubmitState("success");
      setForm({ visitor_name: "", visitor_email: "", message: "" });
      qc.invalidateQueries({ queryKey: ["public-memorial-guestbook", slug] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data
        ?.error;
      setSubmitError(msg ?? "No se pudo enviar el mensaje. Intenta de nuevo.");
      setSubmitState("error");
    },
  });

  if (memorialQ.isLoading) {
    return (
      <div className="min-h-screen bg-warm-fog flex items-center justify-center">
        <div className="text-warm-olive italic">Cargando memorial...</div>
      </div>
    );
  }

  if (memorialQ.error || !memorialQ.data) {
    return (
      <div className="min-h-screen bg-warm-fog flex items-center justify-center px-6 text-center">
        <div>
          <Heart size={32} className="text-warm-silver mx-auto mb-3" />
          <h1 className="font-serif text-3xl text-warm-plum mb-2">Memorial no disponible</h1>
          <p className="text-warm-olive max-w-sm">
            Es posible que el link sea incorrecto o que la familia haya hecho este memorial
            privado.
          </p>
        </div>
      </div>
    );
  }

  const memorial = memorialQ.data;
  const lifespan = [yearOf(memorial.birth_date), yearOf(memorial.death_date)]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="min-h-screen bg-warm-fog text-warm-plum">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-warm-light via-warm-fog to-white py-20 sm:py-28">
        {/* decorative orbs */}
        <motion.div
          aria-hidden
          className="absolute -top-32 -right-20 w-96 h-96 rounded-full bg-warm-accent/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-warm-plum/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-3xl mx-auto px-6 text-center"
        >
          {memorial.profile_photo_url ? (
            <img
              src={memorial.profile_photo_url}
              alt={memorial.deceased_name}
              className="w-32 h-32 rounded-full object-cover mx-auto mb-6 shadow-lg border-4 border-white"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-warm-accent/10 mx-auto mb-6 flex items-center justify-center">
              <Heart size={36} className="text-warm-accent" fill="currentColor" />
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
            En memoria de
          </p>
          <h1 className="font-serif text-5xl sm:text-7xl text-warm-plum leading-tight mb-3">
            {memorial.deceased_name}
          </h1>
          {lifespan && (
            <p className="font-serif text-xl text-warm-olive">{lifespan}</p>
          )}
        </motion.div>
      </section>

      {/* BIO */}
      {memorial.deceased_bio && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="py-16 px-6"
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3 text-center">
              Su historia
            </p>
            <p className="text-lg text-warm-plum/90 leading-relaxed whitespace-pre-wrap">
              {memorial.deceased_bio}
            </p>
          </div>
        </motion.section>
      )}

      {/* GALLERY */}
      {photosQ.data && photosQ.data.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="py-16 px-6 bg-white"
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3 text-center">
              Galería
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-warm-plum text-center mb-12">
              Momentos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photosQ.data.map((p, i) => (
                <motion.a
                  key={p.id}
                  href={p.photo_url}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                  className="aspect-square rounded-2xl overflow-hidden bg-warm-fog hover:shadow-lg transition-shadow"
                >
                  <img
                    src={p.photo_url}
                    alt={p.caption ?? "Foto"}
                    className="w-full h-full object-cover"
                  />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* GUESTBOOK */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
              Libro de visitas
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-warm-plum">
              Deja un mensaje
            </h2>
            <p className="text-warm-olive mt-3 leading-relaxed">
              Comparte un recuerdo, una anécdota o unas palabras de cariño. La familia
              revisará tu mensaje antes de que aparezca aquí.
            </p>
          </div>

          {/* Submit form */}
          <div className="card mb-10">
            {submitState === "success" ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="w-12 h-12 rounded-full bg-warm-accent/15 mx-auto mb-3 flex items-center justify-center">
                  <Sparkles size={20} className="text-warm-accent" />
                </div>
                <p className="font-serif text-2xl text-warm-plum mb-2">¡Gracias!</p>
                <p className="text-warm-olive">
                  Tu mensaje fue enviado. Aparecerá aquí cuando la familia lo apruebe.
                </p>
                <button
                  onClick={() => setSubmitState("idle")}
                  className="text-xs font-bold text-warm-accent hover:underline mt-4"
                >
                  Enviar otro mensaje
                </button>
              </motion.div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!form.visitor_name.trim() || !form.message.trim()) return;
                  submit.mutate();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                      Tu nombre *
                    </label>
                    <input
                      className="input"
                      placeholder="María González"
                      value={form.visitor_name}
                      onChange={(e) =>
                        setForm({ ...form, visitor_name: e.target.value })
                      }
                      required
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="opcional@email.com"
                      value={form.visitor_email}
                      onChange={(e) =>
                        setForm({ ...form, visitor_email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    className="input min-h-[120px] resize-y"
                    placeholder="Comparte un recuerdo, una anécdota, palabras de cariño..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    maxLength={2000}
                  />
                  <p className="text-xs text-warm-silver mt-1.5">
                    {form.message.length} / 2000
                  </p>
                </div>
                {submitError && (
                  <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    submit.isPending ||
                    !form.visitor_name.trim() ||
                    !form.message.trim()
                  }
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {submit.isPending ? "Enviando..." : "Enviar mensaje"}
                  {!submit.isPending && <Send size={16} />}
                </button>
              </form>
            )}
          </div>

          {/* Approved entries */}
          <AnimatePresence>
            {guestbookQ.data && guestbookQ.data.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {guestbookQ.data.map((e, i) => (
                  <motion.article
                    key={e.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className="card"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-warm-accent/10 text-warm-accent font-bold flex items-center justify-center">
                        {e.visitor_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-warm-plum">{e.visitor_name}</p>
                        <p className="text-xs text-warm-silver flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(e.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-warm-plum/90 whitespace-pre-wrap leading-relaxed">
                      {e.message}
                    </p>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-warm-dark text-warm-silver py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif text-2xl text-white mb-2">Presence</p>
          <p className="text-xs">
            Memorial creado con cuidado en{" "}
            <a href="/" className="text-white hover:underline">
              presence.app
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
