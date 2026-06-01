import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Archive, Calendar, Plus, Trash2, Users } from "lucide-react";
import { api } from "../lib/api";
import { Shimmer } from "../components/Shimmer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useTour, type TourStep } from "../hooks/useTour";
import { Tour } from "../components/Tour";

type Vault = {
  id: string;
  deceased_name: string;
  deceased_bio?: string | null;
  deceased_birth_date?: string | null;
  deceased_death_date?: string | null;
  created_at: string;
  _shared?: boolean;
  _access_role?: string;
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
    <g transform="rotate(-8 80 90)">
      <rect x="40" y="40" width="80" height="100" rx="6" fill="#ffffff" stroke="#e5e5e0" />
      <rect x="46" y="46" width="68" height="72" rx="3" fill="#e0e0d9" />
    </g>
    <g transform="rotate(6 150 90)">
      <rect x="110" y="35" width="90" height="110" rx="6" fill="#ffffff" stroke="#e5e5e0" />
      <rect x="116" y="41" width="78" height="78" rx="3" fill="#f6f6f3" />
      <circle cx="155" cy="80" r="14" fill="#7e238b" opacity="0.15" />
      <path
        d="M155 87 C 150 84, 146 80, 146 76 C 146 73, 148 71, 151 71 C 153 71, 155 73, 155 75 C 155 73, 157 71, 159 71 C 162 71, 164 73, 164 76 C 164 80, 160 84, 155 87 Z"
        fill="#7e238b"
      />
    </g>
  </svg>
);

const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    title: "Bienvenido a Presence",
    body:
      "Te muestro en 4 pasos cómo aprovechar la plataforma. Si prefieres explorar por tu cuenta, puedes saltarlo en cualquier momento.",
    ctaLabel: "Empezar",
  },
  {
    selector: '[data-tour="new-vault"]',
    title: "Crea tu primer Memory Vault",
    body:
      "Un vault es una IA conversacional construida desde la biografía, fotos y audios de alguien que ya no está. La idea: poder seguir hablando con su voz.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="main-nav"]',
    title: "Dos espacios",
    body:
      "Memory Vaults: para recordar a quienes ya no están — conversa con su IA y, dentro de cada vault, publica su memorial. Mi legado: para prepararte tú — lo que tu familia necesitará el día que no estés.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="settings-icon"]',
    title: "Tu cuenta y plan",
    body:
      "Aquí gestionas tu perfil, contraseña, 2FA, suscripción y descargas de tus datos.",
    placement: "bottom",
  },
  {
    title: "Listo",
    body:
      "Cuando quieras, presiona 'Nuevo Vault' arriba y empieza por una biografía corta. Después subes fotos y audios — la IA los transcribe automáticamente. Si necesitas ayuda, hay un Centro de Ayuda en el footer.",
    ctaLabel: "Crear mi primer vault",
  },
];

export const Dashboard = () => {
  useDocumentTitle("Dashboard");
  const qc = useQueryClient();
  const tour = useTour("dashboard-v1", DASHBOARD_TOUR_STEPS);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vaults"],
    queryFn: async () => (await api.get<{ vaults: Vault[] }>("/vaults")).data.vaults,
  });

  const deleteVault = useMutation({
    mutationFn: async (vaultId: string) => {
      await api.delete(`/vaults/${vaultId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vaults"] }),
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
            Tus memorias
          </p>
          <h1 className="font-serif text-4xl text-warm-plum">Mis Memory Vaults</h1>
        </div>
        <Link
          to="/app/vaults/new"
          data-tour="new-vault"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Vault
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
          <p className="text-red-700 text-sm">No se pudieron cargar los vaults.</p>
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
            Aún no has creado ninguna memoria.
          </h2>
          <p className="text-warm-olive mb-6 max-w-md mx-auto">
            Empieza honrando a alguien especial. Solo necesitas un nombre y una breve
            biografía para comenzar.
          </p>
          <Link
            to="/app/vaults/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} /> Crear el primero
          </Link>
          <div className="mt-10 pt-8 border-t border-warm-sand text-left max-w-md mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-warm-silver mb-3">
              Cómo aprovecharlo
            </p>
            <ol className="space-y-2 text-sm text-warm-olive list-decimal list-inside">
              <li>Crea un Memory Vault con biografía detallada.</li>
              <li>Sube fotos, audios y documentos (los audios se transcriben solos).</li>
              <li>Conversa con la IA — usa los recuerdos como contexto vivo.</li>
              <li>Genera una biografía narrativa y compártela.</li>
              <li>Convierte el vault en un memorial público con libro de visitas.</li>
            </ol>
          </div>
          <button
            type="button"
            onClick={tour.restart}
            className="mt-6 text-xs font-semibold text-warm-silver hover:text-warm-plum transition"
          >
            Volver a ver el tour
          </button>
        </motion.div>
      )}

      {data && data.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {data.map((v) => {
            const lifespan = [v.deceased_birth_date, v.deceased_death_date]
              .filter(Boolean)
              .join(" – ");
            return (
              <motion.div
                key={v.id}
                variants={item}
                transition={{ duration: 0.3 }}
                className="polaroid rounded-3xl p-6 relative group border border-warm-sand/70"
              >
                <Link to={`/app/vaults/${v.id}`} className="block">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-warm-light flex items-center justify-center shrink-0">
                      <Archive size={18} className="text-warm-plum" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-serif text-2xl text-warm-plum truncate">
                        {v.deceased_name}
                      </h3>
                      {lifespan && (
                        <p className="text-xs text-warm-silver flex items-center gap-1.5 mt-1">
                          <Calendar size={12} />
                          {lifespan}
                        </p>
                      )}
                    </div>
                    {v._shared && (
                      <span
                        title="Compartido contigo"
                        className="text-[10px] font-bold uppercase tracking-wider text-warm-accent bg-warm-accent/10 px-2 py-1 rounded-full inline-flex items-center gap-1 shrink-0"
                      >
                        <Users size={10} />
                        Compartido
                      </span>
                    )}
                  </div>
                  {v.deceased_bio && (
                    <p className="text-sm text-warm-olive line-clamp-2 leading-relaxed">
                      {v.deceased_bio}
                    </p>
                  )}
                </Link>
                {!v._shared && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (
                        confirm(
                          `¿Eliminar el vault de ${v.deceased_name}? Se borrarán archivos y conversaciones.`
                        )
                      ) {
                        deleteVault.mutate(v.id);
                      }
                    }}
                    disabled={deleteVault.isPending}
                    className="absolute top-4 right-4 text-warm-silver hover:text-warm-accent disabled:opacity-50 opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-warm-fog"
                    aria-label="Eliminar vault"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Tour tour={tour} />
    </motion.div>
  );
};
