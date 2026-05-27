import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export const NotFound = () => {
  useDocumentTitle("404 — No encontrado");

  return (
    <div className="min-h-screen bg-warm-fog flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-warm-accent/8 blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-center max-w-md"
      >
        <div className="inline-flex items-center gap-2 mb-6">
          <Heart size={22} className="text-warm-accent" fill="currentColor" />
          <span className="font-serif text-3xl text-warm-plum">Presence</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
          Error 404
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl text-warm-plum mb-4">
          No encontramos esa página.
        </h1>
        <p className="text-warm-olive leading-relaxed mb-8">
          El link puede estar mal o la página fue movida. Volvamos a un lugar conocido.
        </p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
      </motion.div>
    </div>
  );
};
