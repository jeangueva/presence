import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, MailCheck, X } from "lucide-react";
import { api } from "../lib/api";

const HIDE_KEY = "presence:unverified-banner-hidden";

type AccountMe = { email_verified?: boolean };

export const UnverifiedEmailBanner = () => {
  const [hidden, setHidden] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem(HIDE_KEY) === "1"
  );
  const [sent, setSent] = useState(false);

  const q = useQuery({
    queryKey: ["account"],
    queryFn: async () => (await api.get<AccountMe>("/account/me")).data,
    staleTime: 60_000,
  });
  const resend = useMutation({
    mutationFn: async () => api.post("/auth/resend-verification"),
    onSuccess: () => setSent(true),
  });

  const verified = q.data?.email_verified ?? true;
  const show = !hidden && q.data && !verified;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="max-w-5xl mx-auto px-6 pt-4"
        >
          <div className="card border-warm-accent/30 bg-warm-accent/5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warm-accent/15 flex items-center justify-center shrink-0">
              {sent ? (
                <MailCheck size={18} className="text-warm-accent" />
              ) : (
                <AlertCircle size={18} className="text-warm-accent" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-warm-plum">
                {sent ? "Email reenviado" : "Verifica tu email"}
              </p>
              <p className="text-sm text-warm-olive mt-0.5">
                {sent
                  ? "Revisa tu bandeja. Si no llega en unos minutos, mira en spam."
                  : "Para invitar familia y recibir avisos importantes, confirma tu email."}
              </p>
              {!sent && (
                <button
                  type="button"
                  onClick={() => resend.mutate()}
                  disabled={resend.isPending}
                  className="text-xs font-bold text-warm-accent hover:underline mt-2"
                >
                  {resend.isPending ? "Enviando..." : "Reenviar email"}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setHidden(true);
                try {
                  window.localStorage.setItem(HIDE_KEY, "1");
                } catch {
                  // ignore
                }
              }}
              className="text-warm-silver hover:text-warm-plum p-1"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
