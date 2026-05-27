import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Archive,
  Heart,
  Send,
  ScrollText,
  ShieldCheck,
  Lock,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { SERVICES as SERVICES_LIST } from "../lib/services";

const pillars = [
  {
    icon: Archive,
    title: "Memory Vault",
    desc: "Conversa con una IA construida desde la biografía, fotos, audios y recuerdos de quien ya no está.",
    status: "available" as const,
  },
  {
    icon: Heart,
    title: "Memorial Interactivo",
    desc: "Un espacio público y dignificado para honrar su vida — línea de tiempo, libro de visitas y galería curada.",
    status: "soon" as const,
  },
  {
    icon: Send,
    title: "Legacy Planner",
    desc: "Mensajes, audios y videos programados para fechas futuras — cumpleaños, graduaciones, momentos clave.",
    status: "soon" as const,
  },
  {
    icon: ScrollText,
    title: "Testamento Digital",
    desc: "Documento legal generado, notariado y firmado en blockchain — cuentas, herederos, instrucciones finales.",
    status: "soon" as const,
  },
];

const steps = [
  {
    n: "01",
    title: "Crea un Memory Vault",
    desc: "Añade nombre, biografía y fechas. Cuanto más rica la biografía, más cercana se sentirá la conversación.",
  },
  {
    n: "02",
    title: "Sube los recuerdos",
    desc: "Fotos, audios, cartas, transcripciones — Presence los entiende como contexto vivo de la persona.",
  },
  {
    n: "03",
    title: "Conversa cuando quieras",
    desc: "Pregunta sobre su infancia, su forma de hablar, esa anécdota que siempre contaba. Responde con sus historias.",
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
    desc: "Cumplimiento completo del Reglamento Europeo de Protección de Datos. Tu información, tus reglas.",
  },
  {
    icon: Trash2,
    title: "Tu derecho al olvido",
    desc: "Borra tu cuenta o cualquier vault cuando quieras. Cascada total — nada queda atrás.",
  },
];

// ---------------- motion variants ----------------
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

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
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ---------------- decorative SVGs ----------------
const WavyUnderline = () => (
  <svg
    viewBox="0 0 220 14"
    className="absolute -bottom-3 left-0 w-full h-3"
    preserveAspectRatio="none"
    aria-hidden
  >
    <motion.path
      d="M2 8 Q 30 2, 60 8 T 120 8 T 180 8 T 218 8"
      fill="none"
      stroke="#7e238b"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
    />
  </svg>
);

const FloatingOrbs = () => {
  const orbs = [
    { size: 220, top: "-4%", left: "-6%", color: "#7e238b", opacity: 0.06, delay: 0 },
    { size: 180, top: "30%", left: "85%", color: "#211922", opacity: 0.05, delay: 0.4 },
    { size: 140, top: "70%", left: "5%", color: "#7e238b", opacity: 0.04, delay: 0.8 },
    { size: 90, top: "12%", left: "55%", color: "#62625b", opacity: 0.07, delay: 0.2 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            backgroundColor: o.color,
            opacity: o.opacity,
          }}
          animate={{
            y: [0, -22, 0],
            x: [0, 12, 0],
          }}
          transition={{
            duration: 9 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: o.delay,
          }}
        />
      ))}
    </div>
  );
};

type PolaroidProps = {
  rotate: number;
  x: number;
  y: number;
  gradient: string;
  caption: string;
  date: string;
  delay: number;
  z: number;
  children?: ReactNode;
};

const Polaroid = ({
  rotate,
  x,
  y,
  gradient,
  caption,
  date,
  delay,
  z,
  children,
}: PolaroidProps) => (
  <motion.div
    className="absolute top-1/2 left-1/2 w-[78%] sm:w-[68%] max-w-sm bg-white p-3 pb-12 shadow-[0_8px_32px_-12px_rgba(33,25,34,0.25)]"
    style={{
      borderRadius: 8,
      zIndex: z,
      translateX: "-50%",
      translateY: "-50%",
    }}
    initial={{ opacity: 0, scale: 0.8, rotate: 0, x: 0, y: 0 }}
    animate={{ opacity: 1, scale: 1, rotate, x, y }}
    transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ rotate: rotate * 0.6, scale: 1.03, transition: { duration: 0.3 } }}
  >
    <div
      className="aspect-[4/5] rounded-sm overflow-hidden flex flex-col justify-end p-5"
      style={{ background: gradient }}
    >
      {children}
    </div>
    <div className="absolute bottom-3 left-0 right-0 text-center px-3">
      <p className="font-serif text-warm-plum text-base sm:text-lg leading-tight">
        {caption}
      </p>
      <p className="text-[10px] font-mono text-warm-silver mt-1 tracking-wider">
        {date}
      </p>
    </div>
  </motion.div>
);

const PolaroidStack = () => (
  <div className="relative aspect-[4/5] w-full max-w-md mx-auto">
    {/* Decorative sparkle */}
    <motion.div
      className="absolute -top-4 -right-2 z-30 text-warm-accent"
      initial={{ opacity: 0, scale: 0, rotate: -45 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 1.4, duration: 0.6, ease: "backOut" }}
    >
      <Sparkles size={28} className="drop-shadow-sm" />
    </motion.div>
    <motion.div
      className="absolute bottom-8 -left-4 z-30 text-warm-plum/70"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.6, duration: 0.6, ease: "backOut" }}
    >
      <Sparkles size={18} />
    </motion.div>

    <Polaroid
      rotate={-9}
      x={-58}
      y={4}
      gradient="linear-gradient(135deg, #e0e0d9 0%, #c8c8c1 100%)"
      caption="Verano en Cartagena"
      date="JUL · 1968"
      delay={0.5}
      z={1}
    >
      <div className="flex items-end gap-1 opacity-60">
        <div className="w-2 h-12 bg-warm-plum/30 rounded-sm" />
        <div className="w-2 h-8 bg-warm-plum/20 rounded-sm" />
        <div className="w-2 h-16 bg-warm-plum/40 rounded-sm" />
      </div>
    </Polaroid>

    <Polaroid
      rotate={7}
      x={62}
      y={-8}
      gradient="linear-gradient(135deg, #f6f6f3 0%, #e5e5e0 60%, #91918c 100%)"
      caption="Cumpleaños 70"
      date="MAR · 2012"
      delay={0.7}
      z={2}
    >
      <div className="self-start w-10 h-10 rounded-full bg-warm-accent/30 mb-2" />
      <div className="w-full h-1 bg-warm-plum/15 rounded-full" />
      <div className="w-2/3 h-1 bg-warm-plum/15 rounded-full mt-2" />
    </Polaroid>

    <Polaroid
      rotate={-2}
      x={0}
      y={0}
      gradient="linear-gradient(135deg, #fce4e6 0%, #f6f6f3 50%, #e0e0d9 100%)"
      caption="Cuéntame otra vez la historia."
      date="HOY"
      delay={0.95}
      z={3}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
          <Heart size={20} className="text-warm-accent" fill="currentColor" />
        </div>
        <div className="flex-1">
          <div className="w-3/4 h-1.5 bg-warm-plum/15 rounded-full" />
          <div className="w-1/2 h-1.5 bg-warm-plum/15 rounded-full mt-2" />
        </div>
      </div>
    </Polaroid>
  </div>
);

const StepConnector = () => (
  <svg
    viewBox="0 0 1200 60"
    className="hidden md:block absolute top-12 left-0 right-0 w-full h-12 pointer-events-none"
    preserveAspectRatio="none"
    aria-hidden
  >
    <motion.path
      d="M 100 30 Q 300 0, 500 30 T 900 30 T 1100 30"
      fill="none"
      stroke="#7e238b"
      strokeWidth="2"
      strokeDasharray="4 8"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
    />
  </svg>
);

// ---------------- main ----------------
export const Landing = () => {
  const navigate = useNavigate();
  const isAuthed = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    if (isAuthed) navigate("/app", { replace: true });
  }, [isAuthed, navigate]);

  return (
    <div className="min-h-full bg-white text-warm-plum">
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-warm-sand">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-serif text-warm-plum">
            Presence
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/pricing"
              className="hidden sm:inline-block text-sm font-semibold text-warm-olive hover:text-warm-plum px-3 py-2 transition"
            >
              Precios
            </Link>
            <Link
              to="/login"
              className="hidden sm:inline-block text-sm font-semibold text-warm-olive hover:text-warm-plum px-3 py-2 transition"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="inline-block bg-warm-accent hover:bg-warm-accent-hover text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform duration-200"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        <FloatingOrbs />
        <motion.div
          className="relative max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <div className="lg:col-span-7">
            <motion.p
              variants={item}
              className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-5 flex items-center gap-2"
            >
              <span className="inline-block w-8 h-px bg-warm-silver" />
              Plataforma de legado digital
            </motion.p>
            <motion.h1
              variants={item}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-warm-plum mb-6"
            >
              La memoria de quienes amas,{" "}
              <span className="relative inline-block text-warm-accent">
                viva para siempre
                <WavyUnderline />
              </span>
              .
            </motion.h1>
            <motion.p
              variants={item}
              className="text-lg text-warm-olive max-w-xl mb-8 leading-relaxed"
            >
              Presence convierte biografías, fotos y voces en una IA con la que puedes
              conversar — para honrar, recordar y mantener viva la presencia de quienes
              te importan.
            </motion.p>
            <motion.div variants={item} className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 bg-warm-accent hover:bg-warm-accent-hover text-white font-bold px-6 py-3 rounded-2xl transition shadow-sm hover:shadow-lg"
              >
                Crear una memoria
                <motion.span
                  className="inline-block"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight size={18} />
                </motion.span>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center bg-warm-sand hover:bg-warm-light text-warm-plum font-semibold px-6 py-3 rounded-2xl transition"
              >
                Cómo funciona
              </a>
            </motion.div>
            <motion.p variants={item} className="text-xs text-warm-silver mt-6">
              Sin tarjeta de crédito. Empieza a construir tu primer Memory Vault hoy.
            </motion.p>
          </div>

          <motion.div variants={item} className="lg:col-span-5 relative">
            <PolaroidStack />
          </motion.div>
        </motion.div>
      </section>

      {/* DIVIDER */}
      <hr className="border-warm-sand" />

      {/* PILLARS */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
              Cuatro pilares
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-warm-plum mb-4 max-w-2xl tracking-tight">
              Un legado completo, construido con cuidado.
            </h2>
            <p className="text-warm-olive max-w-2xl mb-12 text-lg">
              Hoy lanzamos Memory Vault. Los siguientes tres pilares llegan en las próximas
              iteraciones — todos pensados para acompañarte en distintos momentos.
            </p>
          </FadeIn>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  variants={item}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-warm-sand rounded-3xl p-6 hover:border-warm-silver hover:shadow-lg transition-shadow flex flex-col"
                >
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-warm-light flex items-center justify-center mb-5"
                    whileHover={{ rotate: -8, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon size={22} className="text-warm-plum" />
                  </motion.div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-bold text-warm-plum text-lg">{p.title}</h3>
                    {p.status === "soon" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-warm-olive bg-warm-fog border border-warm-sand px-2 py-0.5 rounded-full">
                        Próximamente
                      </span>
                    )}
                    {p.status === "available" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-warm-accent px-2 py-0.5 rounded-full">
                        Disponible
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-warm-olive leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="px-6 py-20 sm:py-28 bg-warm-fog relative">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
              Cómo funciona
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-warm-plum mb-12 max-w-xl tracking-tight">
              Tres pasos para empezar.
            </h2>
          </FadeIn>

          <div className="relative">
            <StepConnector />
            <motion.div
              className="grid md:grid-cols-3 gap-8 relative"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              {steps.map((s) => (
                <motion.div key={s.n} variants={item} className="relative">
                  <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-warm-sand text-warm-accent font-mono text-sm font-bold mb-5 shadow-sm"
                    whileHover={{ scale: 1.08, rotate: 4 }}
                    transition={{ duration: 0.3 }}
                  >
                    {s.n}
                  </motion.div>
                  <h3 className="font-serif text-2xl text-warm-plum mb-3">{s.title}</h3>
                  <p className="text-warm-olive leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* SERVICIOS (Pilar 3 + 4) */}
      <section className="px-6 py-20 sm:py-28 bg-warm-fog">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
              Servicios de planificación
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-warm-plum mb-4 max-w-2xl tracking-tight">
              Cinco módulos para que quienes amas no tengan que adivinar nada.
            </h2>
            <p className="text-warm-olive max-w-2xl mb-12 text-lg">
              Planifica hoy lo que tu familia necesitará el día que no estés. Cada
              módulo se llena en minutos y se actualiza cuando quieras.
            </p>
          </FadeIn>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            {SERVICES_LIST.map((s) => {
              const SIcon = s.icon;
              return (
                <motion.div key={s.slug} variants={item}>
                  <Link
                    to={`/servicios/${s.slug}`}
                    className="block bg-white border border-warm-sand rounded-3xl p-6 hover:border-warm-silver hover:shadow-lg transition-shadow group h-full"
                  >
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-warm-light flex items-center justify-center mb-5"
                      whileHover={{ rotate: -8, scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SIcon size={22} className="text-warm-plum" />
                    </motion.div>
                    <h3 className="font-serif text-2xl text-warm-plum mb-2">{s.eyebrow}</h3>
                    <p className="text-sm text-warm-olive leading-relaxed mb-4">
                      {s.tagline}
                    </p>
                    <span className="text-xs font-bold text-warm-accent inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Conocer más
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* TRUST */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <FadeIn className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
                Confianza y privacidad
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl text-warm-plum tracking-tight">
                Tus recuerdos son solo tuyos.
              </h2>
              <p className="text-warm-olive mt-5 leading-relaxed">
                Los archivos privados de quienes amas nunca se usan para entrenar
                modelos públicos. Construimos Presence con el respeto que esos
                recuerdos merecen.
              </p>
            </FadeIn>
            <motion.div
              className="lg:col-span-7 space-y-4"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
            >
              {trust.map((t) => {
                const Icon = t.icon;
                return (
                  <motion.div
                    key={t.title}
                    variants={item}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-4 bg-white border border-warm-sand rounded-3xl p-6 hover:border-warm-silver hover:shadow-md transition-shadow"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-warm-light flex items-center justify-center">
                      <Icon size={20} className="text-warm-plum" />
                    </div>
                    <div>
                      <h3 className="font-bold text-warm-plum mb-1">{t.title}</h3>
                      <p className="text-sm text-warm-olive leading-relaxed">{t.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 pb-24">
        <FadeIn>
          <div className="relative max-w-5xl mx-auto bg-warm-plum text-white rounded-[40px] p-12 sm:p-16 text-center overflow-hidden">
            {/* decorative orbs inside CTA */}
            <motion.div
              aria-hidden
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-warm-accent/20 blur-3xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-warm-accent/10 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <div className="relative">
              <h2 className="font-serif text-4xl sm:text-5xl mb-5 tracking-tight">
                Empieza hoy.
              </h2>
              <p className="text-warm-light text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Cada día sin documentar es un detalle que se diluye. Construye el primer
                Memory Vault en menos de cinco minutos.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-warm-accent hover:bg-warm-accent-hover text-white font-bold px-7 py-3.5 rounded-2xl transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
                >
                  Crear cuenta gratis
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-2xl transition"
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="bg-warm-dark text-warm-silver rounded-t-[40px]">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <p className="font-serif text-3xl text-white mb-3">Presence</p>
              <p className="text-sm leading-relaxed max-w-sm">
                Plataforma de legado digital. La memoria de quienes amas, viva para
                siempre.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Producto
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/register" className="hover:text-white transition">
                    Crear cuenta
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <a href="#como-funciona" className="hover:text-white transition">
                    Cómo funciona
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                Legal
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="hover:text-white transition">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white transition">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} Presence. Todos los derechos reservados.</p>
            <p className="text-warm-silver">Hecho con cuidado.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
