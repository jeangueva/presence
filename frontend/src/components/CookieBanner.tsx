import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const KEY = "presence:cookie-consent";

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (!stored) setVisible(true);
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    try {
      window.localStorage.setItem(KEY, choice);
    } catch {
      // ignore
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 bg-white border border-warm-sand rounded-3xl shadow-xl p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warm-accent/10 flex items-center justify-center shrink-0">
              <Cookie size={18} className="text-warm-accent" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-warm-plum mb-1">Sobre cookies y almacenamiento</p>
              <p className="text-sm text-warm-olive leading-relaxed mb-4">
                Usamos almacenamiento local esencial para mantener tu sesión y guardar
                preferencias de UI. No usamos analítica de terceros ni cookies de
                publicidad.{" "}
                <Link to="/cookies" className="text-warm-accent font-semibold hover:underline">
                  Leer detalles
                </Link>
                .
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => decide("accepted")}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Entendido
                </button>
                <button
                  type="button"
                  onClick={() => decide("rejected")}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Solo esenciales
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => decide("rejected")}
              className="text-warm-silver hover:text-warm-plum p-1"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
