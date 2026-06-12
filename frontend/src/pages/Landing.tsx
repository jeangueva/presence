import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { SERVICES as SERVICES_LIST } from "../lib/services";
import { useMeta } from "../hooks/useMeta";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";

const pillars = [
  {
    n: "01",
    title: "Memory Vault",
    desc: "Conversa con una IA construida desde la biografía, fotos, audios y recuerdos de quien ya no está.",
  },
  {
    n: "02",
    title: "Memorial Interactivo",
    desc: "Un espacio público y dignificado — línea de tiempo, libro de visitas y galería curada.",
  },
  {
    n: "03",
    title: "Legacy Planner",
    desc: "Mensajes, audios y videos programados para fechas futuras — cumpleaños, graduaciones, momentos clave.",
  },
  {
    n: "04",
    title: "Testamento Digital",
    desc: "Documento legal generado y sellado con integridad criptográfica — cuentas, herederos, instrucciones finales.",
  },
];

const steps = [
  {
    n: "01",
    title: "Crea un Memory Vault",
    desc: "Añade nombre, biografía y fechas. Cuanto más rica la biografía, más cercana la conversación.",
  },
  {
    n: "02",
    title: "Sube los recuerdos",
    desc: "Fotos, audios, cartas — Presence los entiende como contexto vivo de la persona.",
  },
  {
    n: "03",
    title: "Conversa cuando quieras",
    desc: "Pregunta por su infancia, su forma de hablar, esa anécdota de siempre. Responde con sus historias.",
  },
];

const trust = [
  {
    icon: Lock,
    title: "Cifrado de extremo a extremo",
    desc: "Tus archivos viajan y se almacenan cifrados. Solo tú y quienes autorizas tienen acceso.",
  },
  {
    icon: ShieldCheck,
    title: "GDPR por diseño",
    desc: "Cumplimiento completo del Reglamento Europeo de Protección de Datos.",
  },
  {
    icon: Trash2,
    title: "Tu derecho al olvido",
    desc: "Borra tu cuenta o cualquier vault cuando quieras. Cascada total — nada queda atrás.",
  },
];

// ---------------- scroll reveal ----------------
const FadeIn = ({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// ---------------- cinematic video background ----------------
// Manual loop with fade-in/out so the cut is invisible:
// rAF monitors currentTime; opacity ramps 0→1 over the first 0.5s and
// 1→0 over the last 0.5s; on `ended` we wait 100ms, rewind and replay.
const HeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    let restartTimer: ReturnType<typeof setTimeout>;

    const FADE = 0.5;
    const tick = () => {
      if (video.duration) {
        const t = video.currentTime;
        const remaining = video.duration - t;
        let opacity = 1;
        if (t < FADE) opacity = t / FADE;
        else if (remaining < FADE) opacity = Math.max(remaining / FADE, 0);
        video.style.opacity = String(opacity);
      }
      raf = requestAnimationFrame(tick);
    };

    const onEnded = () => {
      video.style.opacity = "0";
      restartTimer = setTimeout(() => {
        video.currentTime = 0;
        void video.play();
      }, 100);
    };

    video.addEventListener("ended", onEnded);
    void video.play().catch(() => {
      /* autoplay blocked — gradient backdrop remains */
    });
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(restartTimer);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <div
      className="absolute z-0 pointer-events-none"
      style={{ top: "300px", inset: "auto 0 0 0" }}
      aria-hidden
    >
      <video
        ref={videoRef}
        src={VIDEO_URL}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="w-full h-full object-cover"
        style={{ opacity: 0, transition: "opacity 0.2s linear" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
    </div>
  );
};

// ---------------- beta waitlist (fake door) ----------------
const BetaWaitlist = () => {
  const reduce = useReducedMotion();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");
    try {
      // Capture campaign attribution so we can tell which social post converted.
      const utm = window.location.search ? window.location.search.slice(1) : undefined;
      const { data } = await api.post("/beta/signup", {
        full_name: fullName,
        email,
        source: "landing",
        utm,
      });
      setStatus("done");
      setMessage(data?.message ?? "¡Estás en la lista!");
    } catch (err) {
      const axiosErr = err as AxiosError<{ details?: Record<string, string[]> }>;
      const fieldErr =
        axiosErr.response?.data?.details?.email?.[0] ??
        axiosErr.response?.data?.details?.full_name?.[0];
      setStatus("error");
      setMessage(
        fieldErr ?? "No pudimos guardarte ahora. Revisa tus datos e intenta de nuevo."
      );
    }
  };

  return (
    <section id="beta" className="px-6 py-24 sm:py-32">
      <FadeIn>
        <div className="max-w-3xl mx-auto bg-black text-white rounded-[40px] p-10 sm:p-14">
          <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-6">
            Acceso anticipado · cupos limitados
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl mb-4 leading-[1.05]">
            Sé de los primeros en probar{" "}
            <em className="text-white/60">Presence.</em>
          </h2>
          <p className="text-white/60 text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
            Estamos abriendo la beta privada a un grupo pequeño de early
            adopters. Déjanos tu nombre y correo y te escribiremos en cuanto
            tengamos tu lugar listo.
          </p>

          {status === "done" ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-white/10 rounded-2xl p-5"
            >
              <CheckCircle2 className="shrink-0 text-white mt-0.5" size={24} />
              <div>
                <p className="font-medium text-white">
                  ¡Listo, {fullName.split(" ")[0]}!
                </p>
                <p className="text-white/60 text-sm mt-1">{message}</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="beta-name" className="sr-only">
                    Nombre completo
                  </label>
                  <input
                    id="beta-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full bg-white text-black placeholder:text-[#A3A3A3] rounded-full px-6 py-3.5 outline-none focus:ring-2 focus:ring-white/40 transition"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="beta-email" className="sr-only">
                    Correo de Google
                  </label>
                  <Mail
                    size={18}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A3A3A3] pointer-events-none"
                  />
                  <input
                    id="beta-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@gmail.com"
                    className="w-full bg-white text-black placeholder:text-[#A3A3A3] rounded-full pl-12 pr-6 py-3.5 outline-none focus:ring-2 focus:ring-white/40 transition"
                  />
                </div>
              </div>

              {status === "error" && (
                <p className="text-sm text-white bg-white/10 rounded-xl px-4 py-2.5">
                  {message}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-black font-medium px-8 py-3.5 rounded-full transition-transform duration-200 hover:scale-[1.03] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      Quiero mi acceso
                      <ArrowRight
                        size={18}
                        className="transition group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
                <p className="text-xs text-white/40 max-w-xs">
                  Sin spam. Solo te escribimos para tu invitación a la beta.
                </p>
              </div>
            </form>
          )}
        </div>
      </FadeIn>
    </section>
  );
};

// ---------------- main ----------------
export const Landing = () => {
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.accessToken);

  useMeta({
    title: null, // landing usa el título base "Presence — Tu memoria, viva para siempre"
    description:
      "Plataforma de legado digital. Convierte biografías, fotos y voces en una IA con la que puedes conversar — para honrar, recordar y mantener viva la presencia de quienes te importan.",
    canonical: "/",
  });

  useEffect(() => {
    if (isAuthed) navigate("/app", { replace: true });
  }, [isAuthed, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-black">
      {/* CINEMATIC OPENING: video + nav + hero share one viewport */}
      <div className="relative min-h-screen w-full overflow-hidden">
        <HeroVideo />

        {/* NAV */}
        <nav className="relative z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-6">
            <Link to="/" className="font-serif text-3xl tracking-tight text-black">
              Presence<sup className="text-sm">®</sup>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm text-black transition-colors">
                Inicio
              </Link>
              <a
                href="#pilares"
                className="text-sm text-[#6F6F6F] hover:text-black transition-colors"
              >
                Producto
              </a>
              <Link
                to="/pricing"
                className="text-sm text-[#6F6F6F] hover:text-black transition-colors"
              >
                Precios
              </Link>
              <Link
                to="/help"
                className="text-sm text-[#6F6F6F] hover:text-black transition-colors"
              >
                Ayuda
              </Link>
              <Link
                to="/login"
                className="text-sm text-[#6F6F6F] hover:text-black transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
            <a
              href="#beta"
              className="rounded-full px-6 py-2.5 text-sm bg-black text-white transition-transform duration-200 hover:scale-[1.03]"
            >
              Únete a la beta
            </a>
          </div>
        </nav>

        {/* HERO */}
        <section
          className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-40"
          style={{ paddingTop: "calc(8rem - 75px)" }}
        >
          <h1
            className="animate-fade-rise font-serif font-normal text-5xl sm:text-7xl md:text-8xl max-w-7xl text-black"
            style={{ lineHeight: 0.95, letterSpacing: "-2.46px" }}
          >
            Más allá del <em className="text-[#6F6F6F]">silencio,</em>
            <br />
            la memoria sigue <em className="text-[#6F6F6F]">viva.</em>
          </h1>
          <p className="animate-fade-rise-delay text-base sm:text-lg max-w-2xl mt-8 leading-relaxed text-[#6F6F6F]">
            Presence convierte biografías, fotos y voces en una IA con la que
            puedes conversar — para honrar, recordar y mantener viva la
            presencia de quienes te importan.
          </p>
          <a
            href="#beta"
            className="animate-fade-rise-delay-2 rounded-full px-14 py-5 text-base mt-12 bg-black text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            Únete a la beta
          </a>
          <p className="animate-fade-rise-delay-2 text-xs text-[#A3A3A3] mt-6">
            Acceso anticipado gratuito · cupos limitados para early adopters.
          </p>
        </section>
      </div>

      {/* PILLARS */}
      <section id="pilares" className="px-6 py-24 sm:py-32 border-t border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.18em] text-[#A3A3A3] mb-4">
              Cuatro pilares
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl text-black max-w-3xl leading-[1.02]">
              Un legado completo,{" "}
              <em className="text-[#6F6F6F]">construido con cuidado.</em>
            </h2>
            <p className="text-[#6F6F6F] max-w-2xl mt-6 mb-16 text-lg leading-relaxed">
              Dos para recordar a quienes ya no están, dos para preparar lo que
              tu familia necesitará. Todos disponibles hoy.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12">
            {pillars.map((p, i) => (
              <FadeIn key={p.title} delay={i * 0.08}>
                <div className="border-t border-black pt-6 h-full">
                  <p className="font-mono text-xs text-[#A3A3A3] mb-4">{p.n}</p>
                  <h3 className="font-serif text-2xl text-black mb-3">
                    {p.title}
                  </h3>
                  <p className="text-sm text-[#6F6F6F] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="como-funciona"
        className="px-6 py-24 sm:py-32 bg-[#FAFAFA] border-t border-[#E8E8E8]"
      >
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.18em] text-[#A3A3A3] mb-4">
              Cómo funciona
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl text-black mb-16 leading-[1.02]">
              Tres pasos <em className="text-[#6F6F6F]">para empezar.</em>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-x-10 gap-y-12">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.1}>
                <p className="font-serif text-6xl text-[#E8E8E8] mb-4 select-none">
                  {s.n}
                </p>
                <h3 className="font-serif text-2xl text-black mb-3">{s.title}</h3>
                <p className="text-[#6F6F6F] leading-relaxed">{s.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES — módulos de "Mi legado" */}
      <section className="px-6 py-24 sm:py-32 border-t border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <p className="text-xs uppercase tracking-[0.18em] text-[#A3A3A3] mb-4">
              Servicios de planificación
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl text-black max-w-3xl leading-[1.02]">
              Que quienes amas{" "}
              <em className="text-[#6F6F6F]">no tengan que adivinar.</em>
            </h2>
            <p className="text-[#6F6F6F] max-w-2xl mt-6 mb-16 text-lg leading-relaxed">
              Planifica hoy lo que tu familia necesitará. Cada módulo se llena
              en minutos y se actualiza cuando quieras.
            </p>
          </FadeIn>

          <div className="divide-y divide-[#E8E8E8] border-y border-[#E8E8E8]">
            {SERVICES_LIST.map((s, i) => (
              <FadeIn key={s.slug} delay={i * 0.05}>
                <Link
                  to={`/servicios/${s.slug}`}
                  className="group flex items-center justify-between gap-6 py-8 px-2 hover:bg-[#FAFAFA] transition-colors"
                >
                  <div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-black group-hover:text-[#6F6F6F] transition-colors">
                      {s.eyebrow}
                    </h3>
                    <p className="text-sm text-[#6F6F6F] leading-relaxed mt-2 max-w-2xl">
                      {s.tagline}
                    </p>
                  </div>
                  <ArrowRight
                    size={24}
                    className="shrink-0 text-[#A3A3A3] group-hover:text-black group-hover:translate-x-1 transition-all"
                  />
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="px-6 py-24 sm:py-32 bg-[#FAFAFA] border-t border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-start">
          <FadeIn className="lg:col-span-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[#A3A3A3] mb-4">
              Confianza y privacidad
            </p>
            <h2 className="font-serif text-4xl sm:text-6xl text-black leading-[1.02]">
              Tus recuerdos son{" "}
              <em className="text-[#6F6F6F]">solo tuyos.</em>
            </h2>
            <p className="text-[#6F6F6F] mt-6 leading-relaxed">
              Los archivos privados de quienes amas nunca se usan para entrenar
              modelos públicos. Construimos Presence con el respeto que esos
              recuerdos merecen.
            </p>
          </FadeIn>
          <div className="lg:col-span-7 space-y-10 lg:pt-12">
            {trust.map((t, i) => {
              const Icon = t.icon;
              return (
                <FadeIn key={t.title} delay={i * 0.08}>
                  <div className="flex gap-5 border-t border-black pt-6">
                    <Icon size={20} className="shrink-0 text-black mt-1" />
                    <div>
                      <h3 className="font-serif text-xl text-black mb-1">
                        {t.title}
                      </h3>
                      <p className="text-sm text-[#6F6F6F] leading-relaxed">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* BETA WAITLIST (fake door) */}
      <BetaWaitlist />

      {/* FINAL CTA */}
      <section className="px-6 pb-32 text-center">
        <FadeIn>
          <h2
            className="font-serif text-5xl sm:text-7xl text-black leading-[0.98]"
            style={{ letterSpacing: "-1.5px" }}
          >
            Asegura <em className="text-[#6F6F6F]">tu lugar.</em>
          </h2>
          <p className="text-[#6F6F6F] text-lg max-w-xl mx-auto mt-6 leading-relaxed">
            La beta privada abre con cupos limitados. Serás de los primeros en
            construir tu Memory Vault.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <a
              href="#beta"
              className="rounded-full px-10 py-4 bg-black text-white transition-transform duration-200 hover:scale-[1.03]"
            >
              Quiero mi acceso anticipado
            </a>
            <Link
              to="/login"
              className="rounded-full px-10 py-4 border border-[#E8E8E8] text-black hover:border-black transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-[#A3A3A3]">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <p className="font-serif text-3xl text-white mb-3">
                Presence<sup className="text-sm">®</sup>
              </p>
              <p className="text-sm leading-relaxed max-w-sm">
                Plataforma de legado digital. La memoria de quienes amas, viva
                para siempre.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white mb-5">
                Producto
              </p>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Crear cuenta
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <a href="#como-funciona" className="hover:text-white transition-colors">
                    Cómo funciona
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white mb-5">
                Legal
              </p>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Presence. Todos los derechos reservados.</p>
            <p>Hecho con cuidado.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
