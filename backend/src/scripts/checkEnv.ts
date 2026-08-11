import "dotenv/config";

/**
 * Report which credentials are configured, without ever printing them.
 *
 * Values are shown as a masked fingerprint (first 6 chars + length) — enough to
 * tell "I pasted the test key instead of the production one" apart from "I
 * pasted nothing", and never enough to reconstruct the secret if this output
 * ends up in a terminal recording or a support thread.
 */

const mask = (v: string) =>
  v.length <= 8 ? "*".repeat(v.length) : `${v.slice(0, 6)}…(${v.length} chars)`;

type Check = {
  key: string;
  required: boolean;
  note?: string;
  /** Extra validation once a value is present. */
  validate?: (v: string) => string | null;
};

const startsWithMpKey = (v: string) =>
  /^(APP_USR-|TEST-)/.test(v)
    ? null
    : 'no parece una credencial de MercadoPago (debería empezar por "APP_USR-" o "TEST-")';

const GROUPS: { title: string; checks: Check[] }[] = [
  {
    title: "MercadoPago — App Bricks (Legado, pago único)",
    checks: [
      { key: "MERCADOPAGO_PUBLIC_KEY", required: true, validate: startsWithMpKey },
      { key: "MERCADOPAGO_ACCESS_TOKEN", required: true, validate: startsWithMpKey },
      { key: "MERCADOPAGO_WEBHOOK_SECRET", required: false, note: "sin esto no se verifica la firma del webhook" },
    ],
  },
  {
    title: "MercadoPago — App Suscripciones (Vault IA, mensual)",
    checks: [
      {
        key: "MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN",
        required: false,
        note: "vacío = Vault IA se muestra como 'Próximamente'",
        validate: startsWithMpKey,
      },
      { key: "MERCADOPAGO_SUBSCRIPTION_WEBHOOK_SECRET", required: false },
    ],
  },
  {
    title: "Precios y webhooks",
    checks: [
      { key: "MERCADOPAGO_CURRENCY", required: true },
      {
        key: "MERCADOPAGO_PRICE_LEGADO",
        required: true,
        validate: (v) => (Number(v) > 0 ? null : "debe ser un número mayor que cero"),
      },
      {
        key: "MERCADOPAGO_PRICE_VAULT",
        required: true,
        validate: (v) => (Number(v) > 0 ? null : "debe ser un número mayor que cero"),
      },
      {
        key: "BACKEND_PUBLIC_URL",
        required: true,
        note: "en local: ngrok http 3000",
        validate: (v) =>
          v.startsWith("https://")
            ? null
            : "MercadoPago solo entrega webhooks a URLs https",
      },
    ],
  },
  {
    title: "Otros",
    checks: [
      { key: "ADMIN_TOKEN", required: true, note: "operaciones de admin" },
      { key: "FRONTEND_URL", required: true, note: "enlaces de los emails de check-in" },
      { key: "RESEND_API_KEY", required: false, note: "vacío = los emails van a la consola" },
    ],
  },
];

let problems = 0;

for (const group of GROUPS) {
  console.log(`\n${group.title}`);
  console.log("─".repeat(group.title.length));
  for (const check of group.checks) {
    const value = (process.env[check.key] ?? "").trim();
    if (!value) {
      const icon = check.required ? "✗" : "·";
      if (check.required) problems += 1;
      console.log(
        `  ${icon} ${check.key.padEnd(42)} vacío${check.note ? ` — ${check.note}` : ""}`
      );
      continue;
    }
    const error = check.validate?.(value) ?? null;
    if (error) {
      problems += 1;
      console.log(`  ✗ ${check.key.padEnd(42)} ${mask(value)} — ${error}`);
    } else {
      console.log(`  ✓ ${check.key.padEnd(42)} ${mask(value)}`);
    }
  }
}

// An empty token is neither mode — saying "PRODUCCIÓN" for a blank value would
// be exactly backwards from the truth.
const token = (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").trim();
console.log(
  `\nModo MercadoPago: ${
    !token
      ? "sin configurar"
      : token.startsWith("TEST-")
        ? "PRUEBA (no se cobra dinero real)"
        : "PRODUCCIÓN (cobra de verdad)"
  }`
);

if (problems > 0) {
  console.log(`\n${problems} cosa(s) por resolver antes de poder cobrar.\n`);
  process.exit(1);
}
console.log("\nTodo listo para cobrar.\n");
