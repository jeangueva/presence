import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Heart } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export const Register = () => {
  useDocumentTitle("Crear cuenta");
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    gdpr_consent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setSession(data.user, data.access_token, data.refresh_token);
      navigate("/app");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* decorative orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-warm-accent/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-warm-plum/5 blur-3xl"
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
          <p className="text-sm text-warm-olive">Tu memoria, viva para siempre.</p>
        </div>

        <div className="card shadow-sm">
          <h1 className="font-serif text-3xl text-warm-plum mb-2">Crear cuenta</h1>
          <p className="text-sm text-warm-olive mb-6">
            Honra la memoria de quienes te importan.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                Nombre completo
              </label>
              <input
                className="input"
                placeholder="María González"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                Email
              </label>
              <input
                className="input"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-silver hover:text-warm-plum transition p-1"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-3 text-sm text-warm-olive cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={form.gdpr_consent}
                onChange={(e) => setForm({ ...form, gdpr_consent: e.target.checked })}
                required
                className="mt-1 w-4 h-4 accent-warm-accent"
              />
              <span>
                Acepto el tratamiento de datos conforme a GDPR y la{" "}
                <span className="text-warm-plum font-semibold">política de privacidad</span>.
              </span>
            </label>
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
              disabled={loading}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              {loading ? "Creando..." : "Crear cuenta"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="text-sm text-warm-olive mt-6 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-warm-accent font-bold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
