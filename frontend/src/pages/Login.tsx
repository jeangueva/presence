import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Heart, Shield } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

type LoginResponse =
  | {
      user: { id: string; email: string; full_name?: string | null; subscription_tier?: string | null };
      access_token: string;
      refresh_token: string;
    }
  | { requires_2fa: true; two_fa_token: string };

export const Login = () => {
  useDocumentTitle("Iniciar sesión");
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", form);
      if ("requires_2fa" in data) {
        setTwoFaToken(data.two_fa_token);
      } else {
        setSession(data.user, data.access_token, data.refresh_token);
        navigate("/app");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  const submit2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaToken || !code || twoFaLoading) return;
    setTwoFaError(null);
    setTwoFaLoading(true);
    try {
      const { data } = await api.post("/auth/2fa/login", {
        two_fa_token: twoFaToken,
        code,
      });
      setSession(data.user, data.access_token, data.refresh_token);
      navigate("/app");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setTwoFaError(msg ?? "Código incorrecto");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const restart = () => {
    setTwoFaToken(null);
    setCode("");
    setTwoFaError(null);
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
          <p className="text-sm text-warm-olive">Tu memoria, viva para siempre.</p>
        </div>

        <div className="card shadow-sm">
          <AnimatePresence mode="wait" initial={false}>
            {!twoFaToken ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-serif text-3xl text-warm-plum mb-2">Iniciar sesión</h1>
                <p className="text-sm text-warm-olive mb-6">
                  Bienvenido de vuelta. Continúa donde lo dejaste.
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
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-warm-olive">
                        Contraseña
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-warm-accent hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        className="input pr-12"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
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
                    {loading ? "Ingresando..." : "Entrar"}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </form>
                <p className="text-sm text-warm-olive mt-6 text-center">
                  ¿Primera vez?{" "}
                  <Link to="/register" className="text-warm-accent font-bold hover:underline">
                    Crea una cuenta
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-warm-accent" />
                  <h1 className="font-serif text-3xl text-warm-plum">Verificación 2FA</h1>
                </div>
                <p className="text-sm text-warm-olive mb-6">
                  Ingresa el código de 6 dígitos de tu app autenticadora.
                </p>
                <form onSubmit={submit2fa} className="space-y-4">
                  <input
                    autoFocus
                    className="input text-center text-2xl font-mono tracking-[0.4em]"
                    placeholder="000000"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                  />
                  {twoFaError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2"
                    >
                      {twoFaError}
                    </motion.p>
                  )}
                  <button
                    type="submit"
                    disabled={twoFaLoading || code.length !== 6}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    {twoFaLoading ? "Verificando..." : "Verificar y entrar"}
                    {!twoFaLoading && <ArrowRight size={18} />}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={restart}
                  className="mt-5 text-sm text-warm-olive hover:text-warm-plum inline-flex items-center gap-1 transition"
                >
                  <ArrowLeft size={14} /> Usar otro email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
