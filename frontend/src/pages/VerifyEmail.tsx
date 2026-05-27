import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Heart, XCircle } from "lucide-react";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export const VerifyEmail = () => {
  useDocumentTitle("Verificar email");
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Falta el token de verificación.");
      return;
    }
    (async () => {
      try {
        await api.post("/auth/verify-email", { token });
        setState("success");
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setErrorMsg(msg ?? "No se pudo verificar el email.");
        setState("error");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-warm-accent/10 blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Heart size={20} className="text-warm-accent" fill="currentColor" />
            <span className="font-serif text-3xl text-warm-plum">Presence</span>
          </Link>
        </div>
        <div className="card text-center">
          {state === "loading" && (
            <>
              <p className="text-warm-olive">Verificando tu email...</p>
            </>
          )}
          {state === "success" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-warm-accent/10 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-warm-accent" />
              </div>
              <h1 className="font-serif text-3xl text-warm-plum mb-2">Email verificado</h1>
              <p className="text-warm-olive mb-6">Tu cuenta ya está completamente activa.</p>
              <Link to="/app" className="btn-primary inline-flex items-center gap-2">
                Ir al app
                <ArrowRight size={16} />
              </Link>
            </>
          )}
          {state === "error" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <XCircle size={28} className="text-red-700" />
              </div>
              <h1 className="font-serif text-3xl text-warm-plum mb-2">No se pudo verificar</h1>
              <p className="text-warm-olive mb-6">{errorMsg}</p>
              <Link to="/app/settings" className="btn-primary inline-flex items-center gap-2">
                Pedir un nuevo link
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
