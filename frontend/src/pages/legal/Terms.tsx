import { LegalLayout, LegalSection } from "./LegalLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export const Terms = () => {
  useDocumentTitle("Términos de servicio");
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Términos de servicio"
      lastUpdated="26 de mayo de 2026"
    >
      <p>
        Al crear una cuenta y usar Presence aceptas estos términos. Léelos: son cortos y
        están escritos para que se entiendan.
      </p>

      <LegalSection title="Qué es Presence">
        <p>
          Una plataforma para preservar memorias de personas que ya no están (Memory Vault),
          publicar memoriales (Memorial Interactivo) y dejar instrucciones para tu familia
          el día que tú no estés (Plan de legado).
        </p>
      </LegalSection>

      <LegalSection title="Quién puede usarlo">
        <p>
          Mayores de 16 años (o la edad mínima requerida en tu país, lo que sea mayor). Te
          comprometes a darnos información veraz al registrarte.
        </p>
      </LegalSection>

      <LegalSection title="Tu contenido es tuyo">
        <p>
          Mantienes todos los derechos sobre el contenido que subes. Nos otorgas solo la
          licencia limitada necesaria para mostrarlo a las personas que tú autorices y para
          procesarlo con los servicios de IA que usamos (chat con Claude, transcripción con
          Whisper, biografía generada). No usamos tu contenido para entrenar modelos
          públicos ni para mostrarlo a otros usuarios.
        </p>
      </LegalSection>

      <LegalSection title="Uso aceptable">
        <p>No puedes usar Presence para:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Suplantar la identidad de otras personas.</li>
          <li>Subir contenido ilegal, violento, sexual sin consentimiento, o que infrinja derechos de terceros.</li>
          <li>Acosar o difamar a personas, vivas o fallecidas, en libros de visitas de memoriales.</li>
          <li>Intentar acceder a vaults o memoriales privados que no son tuyos.</li>
          <li>Hacer ingeniería inversa, scraping masivo o ataques contra nuestros sistemas.</li>
        </ul>
        <p>Podemos suspender cuentas que violen estas reglas.</p>
      </LegalSection>

      <LegalSection title="Planes y pagos">
        <p>
          Presence ofrece un plan Free y planes pagos mensuales (Personal, Family). Los
          pagos los procesa MercadoPago. Puedes cancelar tu suscripción cuando quieras
          desde Ajustes → Plan; conservas el acceso hasta el final del periodo pagado. No
          hay reembolsos por periodos parciales salvo obligación legal.
        </p>
      </LegalSection>

      <LegalSection title="Inteligencia artificial: lo que prometemos y lo que no">
        <p>
          La IA de Memory Vault genera respuestas basadas en la biografía y archivos que
          le proporcionas. Es una <strong>reflexión</strong>, no una resurrección. Puede
          equivocarse, inventar, o malinterpretar. No tomes decisiones legales, médicas o
          financieras basándote en sus respuestas.
        </p>
        <p>
          Las biografías generadas y las historias de fotos son producidas por modelos de
          IA y revisadas por ti antes de aparecer públicamente. La responsabilidad final
          del contenido publicado es tuya.
        </p>
      </LegalSection>

      <LegalSection title="Mensajes póstumos (beta)">
        <p>
          La función de mensajes póstumos está en <strong>beta</strong>. La entrega
          requiere verificación manual del fallecimiento por nuestro equipo. No prometemos
          entrega automática en este momento. Si necesitas garantía 100%, también deja
          tus mensajes con tu albacea o notario.
        </p>
      </LegalSection>

      <LegalSection title="Limitación de responsabilidad">
        <p>
          Presence se ofrece "tal cual". Hacemos nuestro mejor esfuerzo para preservar tus
          datos pero no podemos garantizar disponibilidad ininterrumpida, exactitud
          absoluta de la IA, ni recuperación tras fallos catastróficos. Mantén copias de
          los archivos que más te importan.
        </p>
      </LegalSection>

      <LegalSection title="Cierre de cuenta">
        <p>
          Puedes cerrar tu cuenta en cualquier momento desde Ajustes. Podemos cerrar la
          tuya si violas estos términos. Al cerrarse, se borran tus datos según lo
          descrito en la política de privacidad.
        </p>
      </LegalSection>

      <LegalSection title="Cambios y contacto">
        <p>
          Podemos actualizar estos términos; te avisaremos por email. Para consultas
          escríbenos a <strong>legal@presence.app</strong>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};
