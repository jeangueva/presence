# Deploy guide — Cloudflare Pages (frontend) + Render (backend)

Esta guía asume que **ya tienes**:
- El repo en GitHub (públio o privado).
- Cuenta de Supabase con migraciones 0001–0013 aplicadas.
- Cuenta de Resend con dominio verificado (opcional pero recomendado).
- Cuenta de MercadoPago developer + API key (modo Test o Producción).

Tiempo total estimado: **~25 minutos**.

---

## 1. Deploy del backend en Render

Render es gratis (free tier) y maneja Node + sharp + bcrypt sin problemas. Se duerme tras 15 min de inactividad — el primer request post-sleep tarda ~30s.

### Pasos

1. Crea cuenta en https://render.com (puedes usar GitHub login).
2. Dashboard → **New +** → **Blueprint**.
3. Conecta tu repo de GitHub. Render detecta `render.yaml` en la raíz automáticamente.
4. Click **Apply**. Render crea el service `presence-backend`.
5. Ve al service → **Environment** y rellena los secrets marcados con "Set in dashboard":
   - `JWT_SECRET` → genera con `openssl rand -base64 48`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `GROQ_API_KEY`
   - `RESEND_API_KEY`, `EMAIL_FROM` (ej. `Presence <noreply@tudominio.com>`)
   - `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`
   - `ADMIN_TOKEN` → genera otro `openssl rand -base64 32`
   - `SENTRY_DSN` (opcional)
   - `FRONTEND_URL` → **lo llenas en el paso 2.5** después de tener la URL de Pages
   - `BACKEND_PUBLIC_URL` → **lo llenas ahora**: copia la URL que Render asigna al service (algo como `https://presence-backend.onrender.com`)
6. Click **Save changes**. El service redeploya.
7. Verifica: visita `https://TU-BACKEND.onrender.com/health` → debe devolver `{"status":"ok","service":"presence-backend"}`.

---

## 2. Deploy del frontend en Cloudflare Pages

Cloudflare Pages es gratis sin límite de bandwidth, 500 builds/mes. SPA con `_redirects` listo en `frontend/public/_redirects`.

### Pasos

1. Crea cuenta en https://dash.cloudflare.com (gratis).
2. Sidebar → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Selecciona tu repo, autoriza acceso.
4. Configuración del build:
   - **Framework preset**: Vite
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory** (avanzado): `frontend`
5. Sección **Environment variables**:
   - `VITE_API_URL` = la URL del backend en Render (paso 1, ej. `https://presence-backend.onrender.com`)
   - `VITE_SENTRY_DSN` (opcional)
   - `VITE_PLAUSIBLE_DOMAIN` (opcional, ej. `presence.app`)
6. Click **Save and Deploy**. Tarda ~2 min.
7. Cuando termine, Cloudflare te da una URL tipo `https://presence-abc.pages.dev`.

### 2.5 Cierra el círculo

Copia la URL de Cloudflare Pages y pégala en Render → service backend → Environment → `FRONTEND_URL`. Render redeploya. Esto habilita CORS para que el frontend pueda hablarle al backend.

---

## 3. Configura el webhook de MercadoPago

Presence cobra de **dos formas distintas**, y cada una usa una API distinta de
MercadoPago. Si solo activas una, la otra falla en silencio:

| Producto | Precio | Producto MercadoPago | Dónde paga el usuario | Eventos del webhook |
|---|---|---|---|---|
| **Legado** | pago único | **Checkout API** (Bricks) | en `presence.app/checkout/legado` | `payment` |
| **Vault IA** | mensual | **Suscripciones** | redirect a MercadoPago | `preapproval`, `subscription_authorized_payment` |

Legado usa **Checkout Bricks**: el formulario vive en nuestra página, estilizado
con los tokens de `tokens.css`, pero los campos de tarjeta son iframes de
MercadoPago. El número de tarjeta nunca pasa por nuestro JS ni por el servidor —
solo recibimos el token de un solo uso.

Vault IA sigue con redirect porque **preapproval no tiene equivalente en
Bricks**: MercadoPago no ofrece un brick de suscripciones.

> **Alcance PCI:** renderizar campos de tarjeta en tu dominio te mueve de SAQ-A
> a **SAQ-A-EP** (más cuestionario, escaneos ASV trimestrales). Confírmalo con
> tu adquirente — el scoping depende del caso.

El panel de MercadoPago te obliga a declarar **un solo producto por
aplicación**, así que necesitas **dos aplicaciones**:

| Aplicación | Producto a declarar | Variables en Render |
|---|---|---|
| `Presence — Legado` | Checkout API | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET` |
| `Presence — Vault IA` | Suscripciones | `MERCADOPAGO_SUBSCRIPTION_ACCESS_TOKEN`, `MERCADOPAGO_SUBSCRIPTION_WEBHOOK_SECRET` |

Ambas apuntan al **mismo endpoint** `/billing/webhook`. El backend elige el
secreto de firma según el tipo de evento, así que no hay ambigüedad.

Si dejas vacías las `SUBSCRIPTION_*`, el backend reutiliza las credenciales de
Checkout API para las suscripciones — sirve si una sola aplicación te cubre
ambos casos, pero no es lo habitual.

**Puedes lanzar solo con la app de Legado.** Sin la app de suscripciones, la
tarjeta de Vault IA aparece como "Próximamente" y deshabilitada, en vez de
mandar a alguien a un checkout que no puede completarse. Legado, que es el
producto que de verdad quieres vender, funciona igual.

La `MERCADOPAGO_PUBLIC_KEY` la encuentras en la misma pantalla de credenciales
que el access token. Es pública por diseño: viaja al navegador para que el Brick
pueda tokenizar. El **access token nunca** sale del servidor.

### Webhooks

1. Ve a https://www.mercadopago.com/developers/panel → **Notificaciones webhooks**.
2. Crea un endpoint apuntando a: `https://TU-BACKEND.onrender.com/billing/webhook`
3. Eventos: marca **Pagos**, **Suscripciones** *y* **Pagos autorizados de suscripción**.
   - Sin `payment`, quien compre Legado paga y nunca recibe el acceso.
   - Sin `subscription_authorized_payment`, la fecha de renovación no avanza y
     el suscriptor de Vault pierde el acceso al mes exacto mientras le sigues
     cobrando.
4. Copia el **Secret de firma** → pégalo en Render como `MERCADOPAGO_WEBHOOK_SECRET` → save → redeploya.

### Comprueba que quedó bien

```bash
cd backend && npm run check:env
```

Lista qué credenciales están puestas y cuáles faltan, con los valores
enmascarados (nunca los imprime completos). También te dice si estás en modo
**PRUEBA** o **PRODUCCIÓN**, que es el error más caro de no notar.

### Precios: dónde se definen y por qué hay dos números

`plans.ts` lleva una cifra en USD (`price_usd`) que se usa solo para el copy y
los datos estructurados de SEO. **Lo que se cobra de verdad** son las variables
de entorno, en la moneda local de tu cuenta de MercadoPago:

```
MERCADOPAGO_CURRENCY=COP
MERCADOPAGO_PRICE_LEGADO=396000   # pago único
MERCADOPAGO_PRICE_VAULT=48000     # mensual
```

La página de precios consulta `GET /billing/pricing` y muestra **el monto real
en moneda local**, no el USD — así nunca anuncias un precio distinto del que
cobras. Si billing no está configurado, cae al USD como referencia.

El backend **no arranca** si un plan de pago se queda sin precio: mejor un
deploy fallido que un usuario llegando al checkout de un plan sin importe.

---

## 3.5 Cron del check-in de vida (Cloudflare Workers — gratis)

El dead-man's switch necesita un barrido diario. Va en un **Cron Trigger de
Cloudflare**, no en Render: los cron jobs de Render no están en el free tier, y
un Worker que solo hace un `fetch` sí es gratis.

```bash
cd workers/deadman-cron
npm install
wrangler secret put BACKEND_URL   # https://TU-BACKEND.onrender.com
wrangler secret put ADMIN_TOKEN   # el mismo valor que en Render
npm run deploy
```

Corre todos los días a las **12:00 UTC** (≈ 7am Bogotá). Antes de disparar el
barrido hace polling a `/health` hasta 60 s, porque el free tier de Render se
duerme y el arranque en frío se comería el timeout.

**Probarlo sin esperar al día siguiente:**

```bash
curl -X POST https://presence-deadman-sweep.TU-SUBDOMINIO.workers.dev \
  -H "X-Admin-Token: TU_ADMIN_TOKEN"

npm run tail   # ver los logs en vivo
```

Si prefieres tenerlo en Render, el bloque está comentado al final de
`render.yaml` — pero requiere plan de pago.

---

## 4. Verifica el dominio de Resend (recomendado)

Sin esto, los emails (verificación, password reset, notificaciones, mensajes póstumos) solo llegan a tu email registrado en Resend.

1. https://resend.com/domains → **Add domain** → tu dominio (ej. `presence.app`).
2. Añade los registros DNS que Resend te indica en tu proveedor (Cloudflare DNS funciona perfecto si compras el dominio ahí).
3. Cuando se verifique (5-30 min), actualiza `EMAIL_FROM` en Render a algo como `Presence <noreply@tudominio.com>`.

---

## 5. Test end-to-end

1. Visita tu URL de Cloudflare Pages.
2. Registro nuevo → revisa email (verificación).
3. Crea un Memory Vault, sube un audio (verifica que Whisper lo transcribe).
4. Crea un memorial, hazlo público → comparte la URL `/m/:slug` → comprueba que carga.
5. Precios → **Comprar Legado** → checkout con tarjeta de prueba (Visa `4509 9535 6623 3704`, vence `11/30`, CVV `123`, nombre `APRO`) → confirma. Comprueba en Supabase que `users.legado_purchased_at` quedó con fecha: eso es lo que concede el acceso permanente.
6. Settings → **Añadir Vault IA** → mismo checkout, pero flujo de suscripción. Verifica que `subscription_tier` pasa a `vault`.
7. Settings → Check-in de vida: añade un contacto de confianza, escribe un mensaje póstumo y activa el check-in. Luego dispara el cron a mano (Render → **Trigger run**) para ver el email.

---

## 6. Custom domain (opcional)

### Frontend (Cloudflare Pages)
- Pages → tu proyecto → **Custom domains** → **Set up a custom domain** → `app.tudominio.com`. Auto-genera SSL.

### Backend (Render)
- Service → **Settings** → **Custom Domain** → `api.tudominio.com`. Configura el CNAME que Render indica en tu DNS.

Luego actualiza:
- En Pages: `VITE_API_URL=https://api.tudominio.com`
- En Render: `FRONTEND_URL=https://app.tudominio.com`, `BACKEND_PUBLIC_URL=https://api.tudominio.com`
- En MercadoPago webhook: `https://api.tudominio.com/billing/webhook`

---

## 7. OG tags para memoriales públicos (opcional, post-launch)

Para que cuando alguien comparta `/m/:slug` en WhatsApp/Facebook se vea el preview con foto y nombre, los crawlers JS-less necesitan llegar al endpoint `/og/m/:slug` del backend.

Crea un **Cloudflare Worker** que detecta user-agents bot y reescribe la URL:

```js
// pages-functions/_middleware.js (en Cloudflare Pages Functions)
export const onRequest = async ({ request, next, env }) => {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const isBot = /facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot/i.test(ua);
  if (isBot && url.pathname.startsWith("/m/")) {
    const slug = url.pathname.slice(3);
    return fetch(`${env.BACKEND_URL}/og/m/${slug}`);
  }
  return next();
};
```

Set `BACKEND_URL` env var en Pages. Los humanos siguen yendo al SPA, los bots reciben HTML con OG meta.

---

## Limitaciones a saber

- **Render free se duerme** tras 15 min sin requests → primer request demora ~30s. Acceptable para feedback, no para producción seria. Upgrade a $7/mo plan starter lo deja siempre vivo.
- **Cloudflare Pages free** tiene 500 builds/mes. Sobra mucho.
- **Supabase free** tiene 500MB DB + 1GB storage. Para early-stage va sobrado.

Cuando estés listo para producción seria: upgrade Render → starter ($7/mo) + Supabase → Pro ($25/mo). Eso te lleva hasta varios miles de usuarios.
