import type { LucideIcon } from "lucide-react";
import { Heart, Scroll, ScrollText, MessageSquareHeart } from "lucide-react";

export type ServiceContent = {
  slug: string;
  eyebrow: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  features: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  cta: string;
};

export const SERVICES: ServiceContent[] = [
  {
    slug: "planificacion-patrimonial",
    eyebrow: "Planificación patrimonial",
    title: "Tu patrimonio, organizado y listo para tu familia.",
    tagline:
      "Centraliza tus bienes, cuentas y herederos en un solo lugar. Para que el día que no estés, nadie tenga que adivinar.",
    description:
      "Documenta tus propiedades, cuentas, inversiones, herederos y la persona de confianza que ejecutará tu voluntad. Toda la información se guarda cifrada y solo se libera cuando tú decidas — en vida o tras tu fallecimiento.",
    icon: ScrollText,
    features: [
      {
        title: "Bienes y cuentas",
        body: "Lista de propiedades, cuentas bancarias, inversiones, criptos y activos digitales con ubicación y valor aproximado.",
      },
      {
        title: "Herederos definidos",
        body: "Quién recibe qué, con porcentajes o asignaciones específicas. Email y relación de cada heredero.",
      },
      {
        title: "Albacea de confianza",
        body: "Designa quién coordinará la entrega — abogado, familiar, amigo cercano.",
      },
      {
        title: "Información notarial",
        body: "Datos del notario, ubicación del testamento físico, contactos legales.",
      },
    ],
    faqs: [
      {
        q: "¿Esto reemplaza un testamento legal?",
        a: "No. Es una herramienta complementaria que centraliza la información para que tus seres queridos sepan dónde está todo. El testamento legal requiere notario.",
      },
      {
        q: "¿Quién puede ver esta información?",
        a: "Solo tú, mientras vivas. La información se libera a los herederos o albacea cuando tu cuenta es marcada como cerrada por defunción.",
      },
    ],
    cta: "Empezar a planificar",
  },
  {
    slug: "ultimos-deseos",
    eyebrow: "Últimos deseos",
    title: "Cómo quieres ser recordada/o.",
    tagline:
      "Entierro o cremación, qué música suena, qué se lee, qué se evita. Tu despedida tal como la imaginas.",
    description:
      "Documenta tus preferencias para tu funeral o ceremonia: tipo de disposición del cuerpo, ritos religiosos o seculares, música, lecturas, obituario sugerido y cualquier solicitud especial.",
    icon: Scroll,
    features: [
      {
        title: "Disposición del cuerpo",
        body: "Entierro, cremación, donación al cuerpo médico u otra opción.",
      },
      {
        title: "Ceremonia",
        body: "Estilo religioso o secular, lugar preferido, oficio que quieres.",
      },
      {
        title: "Música y lecturas",
        body: "Canciones que suenan, poemas, textos sagrados o seculares.",
      },
      {
        title: "Obituario sugerido",
        body: "Cómo te gustaría que la gente te recuerde por escrito.",
      },
    ],
    faqs: [
      {
        q: "¿Mi familia está obligada a cumplirlo?",
        a: "Es una guía clara para tu familia, pero la decisión final recae en quienes te sobreviven. Dejarlo escrito reduce conflictos y dudas.",
      },
    ],
    cta: "Escribir mis últimos deseos",
  },
  {
    slug: "mensaje-postumo",
    eyebrow: "Mensaje póstumo",
    title: "Lo que querías decirles, dicho.",
    tagline:
      "Mensajes que se envían a personas específicas cuando tú ya no estés. Escritos hoy, entregados el día que cuente.",
    description:
      "Redacta mensajes para tus hijos, pareja, padres, amigos. Cada uno con su destinatario, asunto y contenido. Quedan guardados cifrados hasta que se verifique tu fallecimiento — entonces se entregan por email.",
    icon: MessageSquareHeart,
    features: [
      {
        title: "Mensajes a medida",
        body: "Uno por persona, con asunto y contenido completos. Tantos como quieras.",
      },
      {
        title: "Entrega por check-in automático",
        body: "Presence te escribe cada cierto tiempo para confirmar que estás bien. Si dejas de responder durante el plazo que tú elijas, avisamos a tus contactos de confianza y, con su confirmación, entregamos los mensajes.",
      },
      {
        title: "Editables hasta el último día",
        body: "Cambia el contenido cuando quieras. Solo se entregará la versión más reciente.",
      },
      {
        title: "Próximamente: audio y video",
        body: "Por ahora solo texto. Audio y video llegan en próximas iteraciones.",
      },
    ],
    faqs: [
      {
        q: "¿Cómo saben que ya no estoy?",
        a: "Con un check-in periódico. Presence te envía un correo cada cierto tiempo — tú eliges la frecuencia — y basta un clic para confirmar que estás bien. Si dejas de responder, esperamos el periodo de gracia que configuraste y recién entonces escribimos a tus contactos de confianza; solo cuando ellos confirman se entregan los mensajes. Todo el proceso es automático y no depende de terceros. Aun así, si necesitas garantía absoluta, deja también copia con tu albacea o notario.",
      },
    ],
    cta: "Escribir mi primer mensaje",
  },
];

// re-export commonly used icon for landing card grid
export { Heart };
