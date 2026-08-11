import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../lib/api";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/**
 * Where a trusted contact answers the hardest question the product asks.
 *
 * Unlike the check-in page this never auto-submits: confirming a death starts
 * an irreversible delivery, so it always costs a deliberate click, even when
 * the email link already carried `?no=1`.
 */
export const ConfirmPassing = () => {
  useDocumentTitle("Confirmación");
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");

  const respond = async (confirmed: boolean) => {
    if (state === "sending") return;
    setState("sending");
    try {
      await api.post(`/deadman/confirm/${token}`, { confirmed });
      setAnswer(confirmed);
      setState("done");
    } catch (err) {
      const e = err as AxiosError<{ error?: string }>;
      setState("error");
      setMessage(e.response?.data?.error ?? "No pudimos registrar tu respuesta.");
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16 animate-page-fade">
      <div className="max-w-lg w-full">
        <Link to="/" className="font-serif text-3xl tracking-tight text-warm-plum">
          Presence<sup className="text-sm">®</sup>
        </Link>

        {state === "done" ? (
          <div className="mt-12">
            <CheckCircle2 size={36} className="text-warm-plum" />
            <h1 className="font-serif text-4xl text-warm-plum mt-6 leading-tight">
              {answer ? "Gracias. Registrado." : "Gracias por avisarnos."}
            </h1>
            <p className="text-warm-olive mt-4 leading-relaxed">
              {answer
                ? "Tu confirmación quedó guardada. Si otras personas de confianza también confirman, entregaremos los mensajes que dejó escritos. Lamentamos tu pérdida."
                : "No haremos nada por ahora. Seguiremos intentando contactar directamente."}
            </p>
          </div>
        ) : (
          <div className="mt-12">
            <p className="eyebrow mb-3">Contacto de confianza</p>
            <h1 className="font-serif text-4xl text-warm-plum leading-tight">
              Una pregunta difícil.
            </h1>
            <p className="text-warm-olive mt-5 leading-relaxed">
              Alguien te designó en Presence para una sola cosa: confirmar si ha
              fallecido. Lleva tiempo sin responder a nuestros check-ins — puede
              no significar nada, y por eso preguntamos antes de actuar.
            </p>
            <p className="text-warm-olive mt-4 leading-relaxed">
              Si confirmas, y hay suficientes confirmaciones de otras personas
              designadas, entregaremos por correo los mensajes que dejó escritos
              para sus seres queridos. No se comparte contigo ningún otro dato.
            </p>

            {state === "error" && (
              <p className="text-sm text-danger bg-danger-fill border border-danger-hairline rounded-card px-4 py-3 mt-6">
                {message}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <button
                type="button"
                onClick={() => respond(true)}
                disabled={state === "sending"}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                {state === "sending" && <Loader2 size={16} className="animate-spin" />}
                Sí, ha fallecido
              </button>
              <button
                type="button"
                onClick={() => respond(false)}
                disabled={state === "sending"}
                className="btn-secondary"
              >
                {params.get("no") ? "Confirmar que está bien" : "No, o no me consta"}
              </button>
            </div>

            <p className="text-xs text-warm-silver mt-6 leading-relaxed">
              Si no estás segura/o, elige la segunda opción. Podemos volver a
              preguntarte; una entrega no se puede deshacer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
