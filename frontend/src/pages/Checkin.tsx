import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * "Sí, estoy bien" — resolved straight from the emailed token, with no session.
 * The whole point is that it works in one tap from a phone's mail app, so it
 * fires on mount rather than asking for another click the user already gave.
 */
export const Checkin = () => {
  useDocumentTitle("Check-in");
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .post(`/deadman/checkin/${token}`)
      .then(() => {
        if (!cancelled) setState("done");
      })
      .catch((err: AxiosError<{ error?: string }>) => {
        if (cancelled) return;
        setState("error");
        setMessage(
          err.response?.data?.error ??
            "No pudimos validar este enlace. Entra a tu cuenta para hacer el check-in."
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 animate-page-fade">
      <div className="max-w-md w-full text-center">
        <Link to="/" className="font-serif text-3xl tracking-tight text-warm-plum">
          Presence<sup className="text-sm">®</sup>
        </Link>

        {state === "loading" && (
          <div className="mt-12 flex flex-col items-center gap-4 text-warm-olive">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm">Confirmando…</p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-12">
            <CheckCircle2 size={40} className="mx-auto text-warm-plum" />
            <h1 className="font-serif text-4xl text-warm-plum mt-6 leading-tight">
              Gracias. Seguimos como estamos.
            </h1>
            <p className="text-warm-olive mt-4 leading-relaxed">
              Tu check-in quedó registrado y el reloj vuelve a empezar. Nadie ha
              recibido nada.
            </p>
            <Link to="/app/settings" className="btn-primary inline-block mt-8">
              Ir a mi cuenta
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="mt-12">
            <h1 className="font-serif text-4xl text-warm-plum leading-tight">
              Este enlace ya no sirve
            </h1>
            <p className="text-warm-olive mt-4 leading-relaxed">{message}</p>
            <Link to="/login" className="btn-primary inline-block mt-8">
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
