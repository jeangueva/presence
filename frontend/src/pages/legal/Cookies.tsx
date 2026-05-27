import { LegalLayout, LegalSection } from "./LegalLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export const Cookies = () => {
  useDocumentTitle("Política de cookies");
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Política de cookies"
      lastUpdated="26 de mayo de 2026"
    >
      <p>
        Usamos almacenamiento local del navegador para mantener tu sesión y recordar
        algunas preferencias. Aquí explicamos qué usamos exactamente.
      </p>

      <LegalSection title="Cookies y almacenamiento esencial">
        <p>Necesarias para que la plataforma funcione. No requieren consentimiento.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>presence-auth</strong> (localStorage): guarda tu sesión (access token y
            refresh token) para que no tengas que loguearte en cada visita.
          </li>
          <li>
            <strong>presence:dashboard-explainer-hidden</strong> (localStorage): recuerda
            si ocultaste la guía "¿cuál usar para qué?" en el dashboard.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies analíticas o de marketing">
        <p>
          Hoy no usamos analítica de terceros. Si en el futuro añadimos herramientas como
          Plausible o PostHog, te pediremos consentimiento explícito mediante el banner de
          cookies y podrás rechazarlas sin perder funcionalidad.
        </p>
      </LegalSection>

      <LegalSection title="Cookies de terceros">
        <p>
          Al pagar te redirigimos a <strong>MercadoPago</strong>, que opera bajo su propia
          política de cookies. No tenemos visibilidad ni control sobre lo que ellos
          almacenan en tu navegador.
        </p>
      </LegalSection>

      <LegalSection title="Cómo borrarlas">
        <p>
          Borra la pestaña "Datos del sitio" en la configuración de tu navegador para el
          dominio de Presence. Cerrarás sesión y perderás los ajustes de UI guardados, pero
          tu cuenta y datos permanecerán intactos.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};
