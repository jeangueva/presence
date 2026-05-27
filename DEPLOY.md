# Deploy guide — Cloudflare Pages (frontend) + Render (backend)

Esta guía asume que **ya tienes**:
- El repo en GitHub (públio o privado).
- Cuenta de Supabase con migraciones 0001–0008 aplicadas.
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
   - `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
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

1. Ve a https://www.mercadopago.com/developers/panel → **Notificaciones webhooks**.
2. Crea un endpoint apuntando a: `https://TU-BACKEND.onrender.com/billing/webhook`
3. Eventos: marca **Suscripciones (preapproval)**.
4. Copia el **Secret de firma** → pégalo en Render como `MERCADOPAGO_WEBHOOK_SECRET` → save → redeploya.

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
5. Settings → Plan → click "Cambiar de plan" → checkout en MercadoPago con tarjeta de prueba (Visa `4509 9535 6623 3704`, vence `11/30`, CVV `123`, nombre `APRO`) → confirma → vuelves al settings con banner "¡Pago confirmado!" tras unos segundos (cuando llegue el webhook).

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
