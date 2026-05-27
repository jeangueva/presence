import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Heart } from "lucide-react";
import { SERVICES } from "../../lib/services";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuthStore } from "../../store/authStore";

export const ServiceLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const service = SERVICES.find((s) => s.slug === slug);
  const isAuthed = useAuthStore((s) => !!s.accessToken);
  // Hook MUST run unconditionally — pass undefined when no service.
  useDocumentTitle(service?.title);

  if (!service) return <Navigate to="/" replace />;

  const Icon = service.icon;
  const ctaHref = isAuthed ? "/app/legacy" : "/register";

  return (
    <div className="min-h-screen bg-white text-warm-plum">
      <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-warm-sand">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-serif text-warm-plum inline-flex items-center gap-2">
            <Heart size={20} className="text-warm-accent" fill="currentColor" />
            Presence
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/pricing" className="text-sm font-semibold text-warm-olive hover:text-warm-plum">
              Precios
            </Link>
            {!isAuthed ? (
              <Link to="/register" className="btn-primary">Crear cuenta</Link>
            ) : (
              <Link to="/app" className="btn-secondary">Ir al app</Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-6 pt-16 pb-20 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-warm-accent/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-warm-accent/10 mb-5"
          >
            <Icon size={28} className="text-warm-accent" />
          </motion.div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
            {service.eyebrow}
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-warm-plum leading-tight mb-5">
            {service.title}
          </h1>
          <p className="text-warm-olive text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            {service.tagline}
          </p>
          <Link to={ctaHref} className="btn-primary inline-flex items-center gap-2">
            {service.cta}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <hr className="border-warm-sand" />

      {/* DESCRIPTION */}
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="font-serif text-xl text-warm-plum leading-relaxed">
            {service.description}
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-16 bg-warm-fog/60">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3 text-center">
            Lo que incluye
          </p>
          <h2 className="font-serif text-4xl text-warm-plum text-center mb-12">
            Todo lo que necesitas, nada más.
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {service.features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="card flex gap-3"
              >
                <Check size={20} className="text-warm-accent shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-warm-plum mb-1">{f.title}</h3>
                  <p className="text-sm text-warm-olive leading-relaxed">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {service.faqs.length > 0 && (
        <section className="px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3 text-center">
              Preguntas frecuentes
            </p>
            <h2 className="font-serif text-4xl text-warm-plum text-center mb-12">
              Lo que la gente pregunta.
            </h2>
            <div className="space-y-5">
              {service.faqs.map((f) => (
                <div key={f.q} className="card">
                  <h3 className="font-bold text-warm-plum mb-2">{f.q}</h3>
                  <p className="text-warm-olive text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto card bg-warm-plum text-white text-center p-12 rounded-[40px]">
          <h2 className="font-serif text-4xl mb-4">{service.cta}.</h2>
          <p className="text-warm-light mb-7">
            Empieza gratis. Tu plan crece contigo. Sin permanencia.
          </p>
          <Link
            to={ctaHref}
            className="inline-flex items-center gap-2 bg-warm-accent hover:bg-warm-accent-hover text-white font-bold px-7 py-3.5 rounded-2xl transition shadow-lg"
          >
            {isAuthed ? "Ir a mi plan" : "Crear cuenta gratis"}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="bg-warm-dark text-warm-silver py-10 px-6 rounded-t-[40px]">
        <div className="max-w-6xl mx-auto text-center text-sm">
          <Link to="/" className="text-white font-serif text-2xl">Presence</Link>
          <p className="mt-2">© {new Date().getFullYear()} · Presence.</p>
        </div>
      </footer>
    </div>
  );
};
