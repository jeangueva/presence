import { LegalLayout, LegalSection } from "./LegalLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export const Privacy = () => {
  useDocumentTitle("Política de privacidad");
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Política de privacidad"
      lastUpdated="26 de mayo de 2026"
    >
      <p>
        En Presence tratamos los datos que nos confías con el cuidado que merecen: son
        recuerdos de personas que amas. Este documento explica qué recolectamos, para qué,
        durante cuánto tiempo, con quién lo compartimos y qué derechos tienes sobre tus
        datos según el RGPD/GDPR.
      </p>

      <LegalSection title="Responsable del tratamiento">
        <p>
          Presence (en adelante, "nosotros") es responsable del tratamiento de los datos
          personales que recopilas y compartes en la plataforma. Para consultas sobre
          privacidad escríbenos a <strong>privacy@presence.app</strong>.
        </p>
      </LegalSection>

      <LegalSection title="Qué datos recopilamos">
        <p>Datos que tú nos das directamente:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Datos de cuenta: email, contraseña (hash), nombre completo.</li>
          <li>Datos del contenido: biografías, archivos (fotos, audios, documentos), conversaciones con la IA, mensajes en libros de visitas.</li>
          <li>Datos de plan de legado: dependientes, mascotas, herederos, mensajes póstumos, voluntades.</li>
          <li>Datos de pago: nunca almacenamos números de tarjeta. Eso lo gestiona nuestro procesador de pagos (MercadoPago).</li>
        </ul>
        <p>Datos técnicos que recopilamos automáticamente:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Dirección IP, agente de usuario y registros básicos de acceso (para seguridad y auditoría).</li>
          <li>Identificadores de sesión y tokens guardados en tu navegador.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Para qué los usamos (bases legales)">
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Ejecución del contrato:</strong> ofrecer las funciones del producto (vaults, memoriales, plan de legado, chat con IA, transcripciones).</li>
          <li><strong>Consentimiento:</strong> envío de emails de notificación, almacenamiento de cookies no esenciales (cuando las haya).</li>
          <li><strong>Interés legítimo:</strong> auditoría de seguridad, prevención de fraude, mejoras del producto en forma agregada.</li>
          <li><strong>Cumplimiento legal:</strong> facturación, retención de registros tributarios.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Con quién los compartimos">
        <p>Solo con sub-encargados estrictamente necesarios para operar el servicio:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Supabase</strong> (base de datos + almacenamiento de archivos).</li>
          <li><strong>Anthropic</strong> (Claude — procesamiento de chat de Memory Vault y generación de biografías).</li>
          <li><strong>Groq</strong> u <strong>OpenAI</strong> (transcripción de audio con Whisper).</li>
          <li><strong>Resend</strong> (envío de emails transaccionales).</li>
          <li><strong>MercadoPago</strong> (procesamiento de pagos).</li>
        </ul>
        <p>
          No vendemos tus datos. No los usamos para entrenar modelos de IA públicos. Solo
          enviamos a Claude el contexto necesario para responder cada pregunta del chat —
          y solo dentro de un vault al que tú tienes acceso.
        </p>
      </LegalSection>

      <LegalSection title="Cuánto los conservamos">
        <p>
          Mientras tu cuenta esté activa. Si la eliminas (Ajustes → Eliminar cuenta), se
          borran en cascada todos tus vaults, memoriales, archivos y planes de legado. Los
          registros de auditoría se conservan hasta 12 meses por motivos de seguridad.
        </p>
      </LegalSection>

      <LegalSection title="Tus derechos (RGPD)">
        <p>Tienes derecho a:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Acceder</strong> a tus datos (exportable como ZIP desde cada vault).</li>
          <li><strong>Rectificar</strong> datos incorrectos (editas tus vaults y perfil cuando quieras).</li>
          <li><strong>Suprimir</strong> tu cuenta y todo el contenido asociado.</li>
          <li><strong>Portabilidad</strong>: descarga tus vaults como ZIP con JSON estructurado.</li>
          <li><strong>Limitar u oponerte</strong> al tratamiento. Escríbenos a privacy@presence.app.</li>
          <li><strong>Reclamar</strong> ante la autoridad de protección de datos de tu país.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Seguridad">
        <p>
          Las contraseñas se almacenan con bcrypt (12 rondas). Los tokens JWT se firman
          con un secreto privado. La autenticación de dos factores (TOTP) está disponible
          en Ajustes. Los archivos se sirven desde Supabase Storage; comunicaciones via
          HTTPS. Aún así, ningún sistema es 100% inviolable — usa contraseñas fuertes.
        </p>
      </LegalSection>

      <LegalSection title="Cambios en esta política">
        <p>
          Te notificaremos por email cualquier cambio sustancial. La versión vigente
          siempre es la publicada en esta página.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};
