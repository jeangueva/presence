/**
 * Digital-will templates + a form-to-document generator.
 *
 * Templates are starting points (HTML the rich editor loads). The form
 * generator turns dynamic structured input into a base testament the user can
 * then refine in the editor. None of this is legal advice — it's editable
 * boilerplate the user owns and adapts.
 */

export type WillTemplate = {
  id: string;
  name: string;
  scenario: string;
  html: string;
};

const PLACEHOLDER = "[completa este dato]";

// Common closing block reused across templates.
const closing = `
<h2>Albacea</h2>
<p>Designo como albacea de esta voluntad a <strong>${PLACEHOLDER}</strong>, a quien
autorizo a coordinar el cumplimiento de lo aquí expresado.</p>
<h2>Firma</h2>
<p>Otorgo la presente declaración de forma libre y consciente.</p>
<p>Lugar y fecha: ${PLACEHOLDER}</p>
<p>Firma del testador:</p>
<p>&nbsp;</p>`;

export const WILL_TEMPLATES: WillTemplate[] = [
  {
    id: "simple",
    name: "Testamento simple",
    scenario: "Una sola persona o pareja, reparto directo a herederos.",
    html: `
<h1>Declaración de última voluntad</h1>
<p>Yo, <strong>${PLACEHOLDER}</strong>, con documento de identidad <strong>${PLACEHOLDER}</strong>,
en pleno uso de mis facultades, declaro esta mi última voluntad y revoco cualquier
disposición anterior.</p>
<h2>Herederos</h2>
<p>Designo como herederos a:</p>
<ul><li>${PLACEHOLDER} — relación y parte que le corresponde.</li></ul>
<h2>Bienes</h2>
<p>Mis bienes y cuentas principales son:</p>
<ul><li>${PLACEHOLDER}</li></ul>
<h2>Disposiciones particulares</h2>
<p>${PLACEHOLDER}</p>
${closing}`,
  },
  {
    id: "minors",
    name: "Con hijos menores (tutela)",
    scenario: "Tienes hijos menores; defines tutor y cuidado.",
    html: `
<h1>Declaración de última voluntad</h1>
<p>Yo, <strong>${PLACEHOLDER}</strong>, con documento de identidad <strong>${PLACEHOLDER}</strong>,
declaro esta mi última voluntad y revoco cualquier disposición anterior.</p>
<h2>Tutela de mis hijos menores</h2>
<p>Es mi voluntad que, en caso de mi fallecimiento, la tutela y cuidado de mis hijos
menores recaiga en <strong>${PLACEHOLDER}</strong>, por considerarla la persona idónea
para velar por su bienestar, educación y crianza.</p>
<ul><li>Hijo/a: ${PLACEHOLDER} — instrucciones de cuidado.</li></ul>
<h2>Herederos</h2>
<ul><li>${PLACEHOLDER}</li></ul>
<h2>Provisión económica para los menores</h2>
<p>${PLACEHOLDER}</p>
${closing}`,
  },
  {
    id: "couple",
    name: "Pareja sin hijos",
    scenario: "Reparto principal a tu pareja y disposiciones complementarias.",
    html: `
<h1>Declaración de última voluntad</h1>
<p>Yo, <strong>${PLACEHOLDER}</strong>, con documento de identidad <strong>${PLACEHOLDER}</strong>,
declaro esta mi última voluntad y revoco cualquier disposición anterior.</p>
<h2>Heredero principal</h2>
<p>Designo como heredero/a principal a mi pareja <strong>${PLACEHOLDER}</strong>, a quien
corresponde la parte de mis bienes que aquí detallo.</p>
<h2>Otras disposiciones</h2>
<ul><li>${PLACEHOLDER}</li></ul>
<h2>Bienes</h2>
<ul><li>${PLACEHOLDER}</li></ul>
${closing}`,
  },
  {
    id: "shares",
    name: "Reparto por porcentajes",
    scenario: "Varias personas con porcentajes definidos del patrimonio.",
    html: `
<h1>Declaración de última voluntad</h1>
<p>Yo, <strong>${PLACEHOLDER}</strong>, con documento de identidad <strong>${PLACEHOLDER}</strong>,
declaro esta mi última voluntad y revoco cualquier disposición anterior.</p>
<h2>Reparto del patrimonio</h2>
<p>Es mi voluntad repartir mi patrimonio en los siguientes porcentajes:</p>
<ul>
  <li>${PLACEHOLDER} — __%</li>
  <li>${PLACEHOLDER} — __%</li>
</ul>
<h2>Bienes específicos</h2>
<p>Asigno bienes concretos de la siguiente forma:</p>
<ul><li>${PLACEHOLDER}</li></ul>
${closing}`,
  },
];

export const BLANK_TEMPLATE_HTML = `<h1>Mi última voluntad</h1><p></p>`;

// ---------- Form-to-document generator ----------

export type WillFormHeir = {
  name: string;
  relationship: string;
  share: string;
  notes: string;
};
export type WillFormAsset = {
  name: string;
  kind: string;
  value: string;
  location: string;
};
export type WillFormGuardian = {
  minor: string;
  guardian: string;
  contact: string;
};
export type WillFormData = {
  testator_full_name: string;
  testator_id_number: string;
  city: string;
  date: string;
  declarations: string;
  heirs: WillFormHeir[];
  assets: WillFormAsset[];
  guardians: WillFormGuardian[];
  executor_name: string;
  executor_contact: string;
  wishes: string;
};

export const emptyWillForm = (): WillFormData => ({
  testator_full_name: "",
  testator_id_number: "",
  city: "",
  date: "",
  declarations: "",
  heirs: [{ name: "", relationship: "", share: "", notes: "" }],
  assets: [],
  guardians: [],
  executor_name: "",
  executor_contact: "",
  wishes: "",
});

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const li = (items: string[]) =>
  items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>` : "";

/**
 * Build a base testament from dynamic form data. Only renders the sections the
 * user actually filled, so the document stays clean.
 */
export const generateWillHtml = (d: WillFormData): string => {
  const parts: string[] = ["<h1>Declaración de última voluntad</h1>"];

  parts.push(
    `<p>Yo, <strong>${esc(d.testator_full_name) || PLACEHOLDER}</strong>` +
      (d.testator_id_number ? `, con documento de identidad <strong>${esc(d.testator_id_number)}</strong>` : "") +
      `, en pleno uso de mis facultades, declaro esta mi última voluntad y revoco cualquier disposición anterior.</p>`
  );

  if (d.declarations.trim()) {
    parts.push(`<h2>Declaraciones</h2><p>${esc(d.declarations).replace(/\n/g, "<br/>")}</p>`);
  }

  const heirs = d.heirs.filter((h) => h.name.trim());
  if (heirs.length) {
    parts.push("<h2>Herederos</h2>");
    parts.push(
      li(
        heirs.map(
          (h) =>
            `<strong>${esc(h.name)}</strong>` +
            (h.relationship ? ` (${esc(h.relationship)})` : "") +
            (h.share ? ` — ${esc(h.share)}` : "") +
            (h.notes ? `. ${esc(h.notes)}` : "")
        )
      )
    );
  }

  const guardians = d.guardians.filter((g) => g.minor.trim() || g.guardian.trim());
  if (guardians.length) {
    parts.push("<h2>Tutela de menores</h2>");
    parts.push(
      li(
        guardians.map(
          (g) =>
            `${esc(g.minor) || "Menor"}: tutela a cargo de <strong>${esc(g.guardian) || PLACEHOLDER}</strong>` +
            (g.contact ? ` (${esc(g.contact)})` : "")
        )
      )
    );
  }

  const assets = d.assets.filter((a) => a.name.trim());
  if (assets.length) {
    parts.push("<h2>Bienes y cuentas</h2>");
    parts.push(
      li(
        assets.map(
          (a) =>
            `<strong>${esc(a.name)}</strong>` +
            (a.kind ? ` · ${esc(a.kind)}` : "") +
            (a.value ? ` · ${esc(a.value)}` : "") +
            (a.location ? ` · ${esc(a.location)}` : "")
        )
      )
    );
  }

  if (d.wishes.trim()) {
    parts.push(`<h2>Últimos deseos</h2><p>${esc(d.wishes).replace(/\n/g, "<br/>")}</p>`);
  }

  if (d.executor_name.trim()) {
    parts.push(
      `<h2>Albacea</h2><p>Designo como albacea a <strong>${esc(d.executor_name)}</strong>` +
        (d.executor_contact ? ` (${esc(d.executor_contact)})` : "") +
        `, a quien autorizo a coordinar el cumplimiento de esta voluntad.</p>`
    );
  }

  parts.push("<h2>Firma</h2>");
  parts.push("<p>Otorgo la presente declaración de forma libre y consciente.</p>");
  parts.push(
    `<p>Lugar y fecha: ${esc([d.city, d.date].filter(Boolean).join(", ")) || PLACEHOLDER}</p>`
  );
  parts.push("<p>Firma del testador:</p><p>&nbsp;</p>");

  return parts.join("\n");
};
