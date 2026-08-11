import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, X } from "lucide-react";

export type QuotaInfo = {
  reason: string;
  current_plan: string;
  required_plan: string;
  limit: number;
  used: number;
  message: string;
};

type Props = {
  open: boolean;
  quota: QuotaInfo | null;
  onClose: () => void;
};

const reasonLabel: Record<string, string> = {
  vaults: "Memory Vaults",
  files_per_vault: "Archivos en este vault",
  storage_mb: "Almacenamiento",
  memorials: "Memoriales públicos",
  biography_generations_per_month: "Biografías con IA este mes",
  chat_messages_per_month: "Mensajes de chat este mes",
};

export const UpgradeModal = ({ open, quota, onClose }: Props) => {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {open && quota && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-warm-plum/40 backdrop-blur-sm flex items-center justify-center px-4 py-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="card w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-warm-silver hover:text-warm-plum p-1.5 rounded-lg hover:bg-warm-fog"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-warm-accent/10 flex items-center justify-center mb-4">
              <Sparkles size={22} className="text-warm-accent" />
            </div>
            <p className="eyebrow mb-2">
              {reasonLabel[quota.reason] ?? "Has alcanzado un límite"}
            </p>
            <h3 className="font-serif text-2xl text-warm-plum mb-2">
              Sube a {quota.required_plan.charAt(0).toUpperCase() + quota.required_plan.slice(1)} para continuar.
            </h3>
            <p className="text-warm-olive leading-relaxed mb-5">{quota.message}</p>
            <div className="text-xs text-warm-silver mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-warm-fog rounded-full">
              <span className="font-bold text-warm-plum">{quota.used}</span> usados de
              <span className="font-bold text-warm-plum">
                {quota.limit === -1 ? "∞" : quota.limit}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/pricing");
                }}
                className="btn-primary inline-flex items-center gap-2"
              >
                Ver planes
                <ArrowRight size={16} />
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Más tarde
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
