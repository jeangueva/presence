import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  HelpCircle,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useMeta } from "../hooks/useMeta";
import { useStructuredData } from "../hooks/useStructuredData";
import { buildFaqSchema } from "../lib/seo";

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Qué pasa con mi vault si no pago?",
    a: "Tu cuenta se mantiene activa en plan Free con sus límites. Los datos no se borran. Si superabas los límites del Free, ya no podrás añadir más hasta volver a un plan pago, pero todo lo creado sigue accesible.",
  },
  {
    q: "¿La IA puede equivocarse o inventar cosas?",
    a: "Sí. La IA responde basándose en la biografía y archivos que le proporcionas, pero puede malinterpretar o llenar vacíos. Cuanta más información veraz le des, mejor. Nunca tomes decisiones médicas, legales o financieras basándote en sus respuestas.",
  },
  {
    q: "¿Cómo borro un vault para siempre?",
    a: "En el vault → click papelera. O si quieres borrar tu cuenta entera, ve a Ajustes → Zona peligrosa → Eliminar cuenta. Se borra todo en cascada y no se puede recuperar.",
  },
  {
    q: "¿Puedo exportar mis datos?",
    a: "Sí, en cada vault hay un botón 'Exportar' que descarga un ZIP con todos los metadatos, transcripciones y la biografía generada. Los archivos multimedia están como URLs (descargables individualmente desde Supabase Storage).",
  },
  {
    q: "¿Cómo funcionan los mensajes póstumos?",
    a: "Por ahora la entrega es manual: tu albacea contacta a soporte con documentación de defunción y nosotros disparamos los emails. La entrega automática está en roadmap. Si necesitas garantía absoluta, deja también copia con tu notario.",
  },
  {
    q: "¿Mis datos se usan para entrenar IA?",
    a: "No. Lo que subes a tus vaults nunca se usa para entrenar modelos públicos. Solo enviamos a Claude/Whisper el contexto necesario para responder cada pregunta o transcribir cada audio, dentro de un vault que tú controlas.",
  },
];

export const Help = () => {
  useMeta({
    title: "Centro de ayuda",
    description:
      "Respuestas a preguntas frecuentes sobre Memory Vaults, memoriales, mensajes póstumos, pagos y privacidad en Presence.",
    canonical: "/help",
  });
  useStructuredData(
    buildFaqSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))
  );
  return (
    <div className="min-h-screen bg-white text-warm-plum animate-page-fade">
      <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-warm-sand">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-serif text-warm-plum inline-flex items-center gap-2">
            <Heart size={20} className="text-warm-accent" fill="currentColor" />
            Presence
          </Link>
          <div className="flex items-center gap-3 text-sm font-semibold text-warm-olive">
            <Link to="/pricing" className="hover:text-warm-plum">Precios</Link>
            <Link to="/app" className="btn-primary">Ir al app</Link>
          </div>
        </div>
      </nav>

      <section className="relative px-6 pt-16 pb-12 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-warm-accent/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-warm-accent/10 mb-5">
            <HelpCircle size={28} className="text-warm-accent" />
          </div>
          <p className="eyebrow mb-3">
            Centro de ayuda
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-warm-plum leading-tight mb-4">
            ¿En qué te ayudamos?
          </h1>
          <p className="text-warm-olive text-lg">
            Respuestas a las preguntas más frecuentes. Si no encuentras la tuya,
            escríbenos.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="card group cursor-pointer"
            >
              <summary className="font-bold text-warm-plum list-none flex items-center justify-between gap-3">
                <span>{f.q}</span>
                <span className="text-warm-silver text-xl leading-none group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="text-warm-olive leading-relaxed mt-3 text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3 text-center">
            ¿No encuentras tu respuesta?
          </p>
          <h2 className="font-serif text-4xl text-warm-plum text-center mb-8">
            Escríbenos.
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:soporte@presence.app"
              className="card group hover:border-warm-silver hover:shadow-md transition flex items-start gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-warm-light flex items-center justify-center shrink-0">
                <Mail size={20} className="text-warm-plum" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-warm-plum">Soporte general</p>
                <p className="text-sm text-warm-olive mt-1">
                  Dudas, bugs, sugerencias.
                </p>
                <p className="text-sm font-mono text-warm-accent mt-2 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  soporte@presence.app
                  <ArrowRight size={12} />
                </p>
              </div>
            </a>
            <a
              href="mailto:privacy@presence.app"
              className="card group hover:border-warm-silver hover:shadow-md transition flex items-start gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-warm-light flex items-center justify-center shrink-0">
                <MessageCircle size={20} className="text-warm-plum" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-warm-plum">Privacidad y datos</p>
                <p className="text-sm text-warm-olive mt-1">
                  Solicitudes RGPD, eliminación de datos.
                </p>
                <p className="text-sm font-mono text-warm-accent mt-2 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  privacy@presence.app
                  <ArrowRight size={12} />
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-warm-dark text-warm-silver py-10 px-6 rounded-t-[40px] mt-12">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <Link to="/" className="text-white font-serif text-2xl">Presence</Link>
          <p className="mt-2">© {new Date().getFullYear()} · Presence.</p>
        </div>
      </footer>
    </div>
  );
};
