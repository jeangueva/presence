import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Heart } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export const ResetPassword = () => {
  useDocumentTitle("Nueva contraseña");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data
        ?.error;
      setError(msg ?? "El link es inválido o expiró.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-warm-accent/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
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
          {!token ? (
            <div className="text-center py-4">
              <h1 className="font-serif text-2xl text-warm-plum mb-2">Link inválido</h1>
              <p className="text-warm-olive mb-5">
                Falta el token. Pide un nuevo link desde la pantalla de recuperación.
              </p>
              <Link to="/forgot-password" className="btn-primary inline-flex">
                Pedir nuevo link
              </Link>
            </div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-warm-accent/10 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-warm-accent" />
              </div>
              <h1 className="font-serif text-3xl text-warm-plum mb-3">Listo</h1>
              <p className="text-warm-olive">
                Tu contraseña fue actualizada. Te llevamos al login...
              </p>
            </motion.div>
          ) : (
            <>
              <h1 className="font-serif text-3xl text-warm-plum mb-2">
                Nueva contraseña
              </h1>
              <p className="text-sm text-warm-olive mb-6">
                Elige una contraseña que no hayas usado antes en otro sitio.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-silver hover:text-warm-plum transition p-1"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive mb-2">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      className="input pr-12"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repite la contraseña"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-silver hover:text-warm-plum transition p-1"
                      aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                  disabled={loading}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2"
                >
                  {loading ? "Actualizando..." : "Actualizar contraseña"}
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
