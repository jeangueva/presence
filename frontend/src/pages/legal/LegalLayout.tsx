import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { ReactNode } from "react";

export const LegalLayout = ({
  eyebrow,
  title,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-white text-warm-plum">
    <nav className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-warm-sand">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-serif text-warm-plum inline-flex items-center gap-2">
          <Heart size={20} className="text-warm-accent" fill="currentColor" />
          Presence
        </Link>
        <div className="flex items-center gap-3 text-sm font-semibold text-warm-olive">
          <Link to="/privacy" className="hover:text-warm-plum">Privacidad</Link>
          <Link to="/terms" className="hover:text-warm-plum">Términos</Link>
          <Link to="/cookies" className="hover:text-warm-plum">Cookies</Link>
        </div>
      </div>
    </nav>
    <article className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-silver mb-3">
        {eyebrow}
      </p>
      <h1 className="font-serif text-5xl text-warm-plum mb-3">{title}</h1>
      <p className="text-sm text-warm-silver mb-12">Última actualización: {lastUpdated}</p>
      <div className="prose-presence space-y-6 text-warm-plum leading-relaxed">
        {children}
      </div>
    </article>
    <footer className="bg-warm-dark text-warm-silver rounded-t-[40px] mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 text-center text-sm">
        <Link to="/" className="text-white font-serif text-2xl">Presence</Link>
        <p className="mt-2">© {new Date().getFullYear()} · Presence.</p>
      </div>
    </footer>
  </div>
);

export const LegalSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="font-serif text-2xl text-warm-plum">{title}</h2>
    <div className="space-y-3 text-warm-plum/90">{children}</div>
  </section>
);
