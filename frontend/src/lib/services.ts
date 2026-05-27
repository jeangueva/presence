import type { LucideIcon } from "lucide-react";
import { Heart, PawPrint, Scroll, ScrollText, MessageSquareHeart, Users } from "lucide-react";

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
    slug: "cuidado-de-dependientes",
    eyebrow: "Cuidado de dependientes",
    title: "Quienes dependen de ti, en buenas manos.",
    tagline:
      "Hijos pequeños, padres mayores, hermanos con condiciones especiales. Define quién y cómo se hará cargo si tú faltas.",
    description:
      "Registra a las personas que dependen de ti y deja instrucciones claras de cuidado: quién tiene la custodia, cómo contactar a la persona responsable, qué rutinas mantener, qué evitar.",
    icon: Users,
    features: [
      {
        title: "Lista de dependientes",
        body: "Cada persona con su nombre, relación contigo, fecha de nacimiento.",
      },
      {
        title: "Persona responsable",
        body: "El cuidador asignado y cómo contactarlo — teléfono, email, dirección.",
      },
      {
        title: "Notas de cuidado",
        body: "Médicos de cabecera, medicamentos, rutinas, alergias, escuelas, hábitos.",
      },
      {
        title: "Actualizable en cualquier momento",
        body: "La vida cambia. Edita el plan cuando los dependientes crezcan o cambien circunstancias.",
      },
    ],
    faqs: [
      {
        q: "¿Esto reemplaza la designación legal de tutor?",
        a: "No, es complementario. El tutor legal se designa ante notario. Aquí dejas las instrucciones del día a día que ningún documento legal cubre.",
      },
    ],
    cta: "Crear mi plan de dependientes",
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
    slug: "cuidado-de-mascotas",
    eyebrow: "Cuidado de mascotas",
    title: "Tus mascotas, parte de tu plan.",
    tagline:
      "Quién las cuida, qué comen, su veterinario, sus rutinas. Para que no terminen abandonadas o en un refugio.",
    description:
      "Registra cada mascota con sus rutinas de alimentación, información veterinaria, persona designada para cuidarla y cualquier dato relevante sobre su salud y comportamiento.",
    icon: PawPrint,
    features: [
      {
        title: "Ficha por mascota",
        body: "Nombre, especie, raza, edad. Para cada peludo, plumífero o acuático.",
      },
      {
        title: "Cuidador designado",
        body: "Quién se hará cargo si tú no estás. Idealmente alguien que ya la conozca.",
      },
      {
        title: "Veterinario y salud",
        body: "Datos del vet, medicamentos, vacunas pendientes, condiciones a vigilar.",
      },
      {
        title: "Rutinas y preferencias",
        body: "Qué come y cuántas veces, paseos, juguetes favoritos, miedos.",
      },
    ],
    faqs: [
      {
        q: "¿Por qué no solo decirle a un amigo de palabra?",
        a: "En el momento del shock, los detalles se olvidan. Tener una ficha escrita reduce ese riesgo y le ayuda al cuidador a darle continuidad sin estrés.",
      },
    ],
    cta: "Registrar a mis mascotas",
  },
  {
    slug: "mensaje-postumo",
    eyebrow: "Mensaje póstumo",
    title: "Lo que querías decirles, dicho.",
    tagline:
      "Mensajes que se envían a personas específicas cuando tú ya no estés. Escritos hoy, entregados el día que cuente.",
    description:
      "Redacta mensajes para tus hijos, pareja, padres, amigos. Cada uno con su destinatario, asunto y contenido. Quedan guardados hasta que tu cuenta sea marcada como cerrada — entonces se envían automáticamente por email.",
    icon: MessageSquareHeart,
    features: [
      {
        title: "Mensajes a medida",
        body: "Uno por persona, con asunto y contenido completos. Tantos como quieras.",
      },
      {
        title: "Entrega automática",
        body: "Cuando un familiar reporta tu fallecimiento y se verifica, los mensajes salen por email.",
      },
      {
        title: "Editables hasta el último día",
        body: "Cambia el contenido cuando quieras. Solo se enviará la versión más reciente.",
      },
      {
        title: "Próximamente: audio y video",
        body: "Por ahora texto. Audio y video llegan en próximas iteraciones.",
      },
    ],
    faqs: [
      {
        q: "¿Cómo saben que ya no estoy?",
        a: "Hoy se envían cuando una persona de confianza (que tú designaste) confirma tu fallecimiento con documentación. En el futuro automatizaremos con triggers adicionales.",
      },
    ],
    cta: "Escribir mi primer mensaje",
  },
];

// re-export commonly used icon for landing card grid
export { Heart };
