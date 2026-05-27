import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Plus, Heart, Globe, Lock, Calendar } from "lucide-react";
import { api } from "../lib/api";
import { Shimmer } from "../components/Shimmer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type Memorial = {
  id: string;
  deceased_name: string;
  deceased_bio?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  profile_photo_url?: string | null;
  public: boolean;
  public_slug?: string | null;
  created_at: string;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const EmptyIllustration = () => (
  <svg viewBox="0 0 240 180" className="w-48 h-36 mx-auto mb-2" aria-hidden>
    <g transform="rotate(-6 120 90)">
      <rect x="60" y="30" width="120" height="120" rx="60" fill="#f6f6f3" stroke="#e5e5e0" />
      <path
        d="M120 110 C 105 95, 90 80, 90 65 C 90 56, 96 50, 105 50 C 113 50, 120 57, 120 65 C 120 57, 127 50, 135 50 C 144 50, 150 56, 150 65 C 150 80, 135 95, 120 110 Z"
        fill="#7e238b"
        opacity="0.4"
      />
    </g>
    <circle cx="200" cy="40" r="6" fill="#7e238b" opacity="0.3" />
    <circle cx="40" cy="140" r="4" fill="#7e238b" opacity="0.2" />
  </svg>
);

export const MemorialList = () => {
  useDocumentTitle("Memoriales");
  const { data, isLoading, error } = useQuery({
    queryKey: ["memorials"],
    queryFn: async () =>
      (await api.get<{ memorials: Memorial[] }>("/memorials")).data.memorials,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-warm-silver mb-2">
            Pilar 2 — Memorial Interactivo
          </p>
          <h1 className="font-serif text-4xl text-warm-plum">Mis Memoriales</h1>
        </div>
        <Link
          to="/app/memorials/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Memorial
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="card">
              <Shimmer className="h-7 w-2/3 mb-3" />
              <Shimmer className="h-4 w-1/3 mb-4" />
              <Shimmer className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="card border-red-100 bg-red-50">
          <p className="text-red-700 text-sm">No se pudieron cargar los memoriales.</p>
        </div>
      )}

      {data && data.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="card text-center py-12"
        >
          <EmptyIllustration />
          <h2 className="font-serif text-2xl text-warm-plum mb-2">
            Aún no has creado ningún memorial.
          </h2>
          <p className="text-warm-olive mb-6 max-w-md mx-auto">
            Crea un memorial a partir de un Memory Vault que ya tengas. Hereda biografía,
            fechas y se enriquece con galería pública y libro de visitas.
          </p>
          <Link
            to="/app/memorials/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} /> Crear el primero
          </Link>
        </motion.div>
      )}

      {data && data.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {data.map((m) => {
            const lifespan = [m.birth_date, m.death_date].filter(Boolean).join(" – ");
            return (
              <motion.div
                key={m.id}
                variants={item}
                transition={{ duration: 0.3 }}
                className="polaroid rounded-3xl p-6 relative border border-warm-sand/70"
              >
                <Link to={`/app/memorials/${m.id}`} className="block">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-warm-accent/10 flex items-center justify-center shrink-0">
                      <Heart size={20} className="text-warm-accent" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-2xl text-warm-plum truncate">
                        {m.deceased_name}
                      </h3>
                      {lifespan && (
                        <p className="text-xs text-warm-silver flex items-center gap-1.5 mt-1">
                          <Calendar size={12} />
                          {lifespan}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                        m.public
                          ? "bg-warm-accent/10 text-warm-accent"
                          : "bg-warm-fog text-warm-olive"
                      }`}
                    >
                      {m.public ? <Globe size={10} /> : <Lock size={10} />}
                      {m.public ? "Público" : "Privado"}
                    </span>
                  </div>
                  {m.deceased_bio && (
                    <p className="text-sm text-warm-olive line-clamp-2 leading-relaxed">
                      {m.deceased_bio}
                    </p>
                  )}
                  {m.public && m.public_slug && (
                    <p className="text-xs font-mono text-warm-silver mt-3 truncate">
                      /m/{m.public_slug}
                    </p>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};
