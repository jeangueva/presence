import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, MailCheck } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export const ForgotPassword = () => {
  useDocumentTitle("Recuperar contraseña");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/password-reset/request", { email });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data
        ?.error;
      setError(msg ?? "No se pudo procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-warm-accent/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-warm-plum/5 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <Heart size={20} className="text-warm-accent" fill="currentColor" />
            <span className="font-serif text-3xl text-warm-plum">Presence</span>
          </Link>
        </div>

        <div className="card shadow-sm">
          {sent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-warm-accent/10 mx-auto mb-4 flex items-center justify-center">
                <MailCheck size={26} className="text-warm-accent" />
              </div>
              <h1 className="font-serif text-3xl text-warm-plum mb-3">Revisa tu email</h1>
              <p className="text-warm-olive leading-relaxed mb-6">
                Si existe una cuenta con <strong>{email}</strong>, te enviamos un link para
                restablecer la contraseña. Tienes una hora para usarlo.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-warm-accent hover:underline"
              >
                <ArrowLeft size={14} /> Volver al login
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-warm-olive hover:text-warm-plum mb-4 transition"
              >
                <ArrowLeft size={14} /> Volver
              </Link>
              <h1 className="font-serif text-3xl text-warm-plum mb-2">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-sm text-warm-olive mb-6">
                Escribe tu email y te enviaremos un link para crear una nueva.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                    Email
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {loading ? "Enviando..." : "Enviar link"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
