# Presence

Plataforma de legado digital. Monorepo con `backend/` (Node + Express + TypeScript) y `frontend/` (React + Vite + Tailwind).

Esta primera iteración entrega el **Pilar 1 — Memory Vault**: autenticación JWT, CRUD de vaults, upload de archivos a Supabase Storage, y chat con Claude usando la biografía + archivos como contexto. El schema SQL ya incluye los cuatro pilares para no re-migrar cuando se implementen Memorial, Legacy Planner y Digital Will.

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind + Zustand + TanStack Query + React Router
- **Backend:** Express 4 + TypeScript + Zod + Helmet + bcryptjs + jsonwebtoken + multer
- **DB / Storage:** Supabase (PostgreSQL + Storage)
- **LLM:** Claude API (`@anthropic-ai/sdk`, modelo por defecto `claude-sonnet-4-6`)

## Requisitos

- Node 20+
- Cuenta de Supabase (https://supabase.com) — free tier alcanza
- API key de Anthropic (https://console.anthropic.com)

## Setup

### 1. Supabase

1. Crea un proyecto nuevo en Supabase.
2. En el SQL Editor, ejecuta en orden:
   - [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql)
   - [`supabase/migrations/0002_vault_file_storage_path.sql`](supabase/migrations/0002_vault_file_storage_path.sql)
3. En **Storage**, crea un bucket llamado `vault-files`. Déjalo en modo **Public** para que los archivos sean accesibles por URL (ajusta esto si necesitas control de acceso más fino).
4. En **Project Settings → API**, copia `Project URL` y `service_role secret`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edita .env con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, JWT_SECRET
npm install
npm run dev
```

El backend queda en `http://localhost:3000`. Verifica con `curl http://localhost:3000/health`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:5173`.

### 4. Flujo mínimo para probar

1. Regístrate en `/register`.
2. Crea un Memory Vault con nombre y biografía (la biografía es lo que alimenta el system prompt de Claude — cuanto más rica, mejor el chat).
3. Sube algunos archivos en el detalle del vault.
4. Abre el chat y conversa.

## Docker (opcional, para dev local)

```bash
# asegúrate de tener backend/.env y frontend/.env llenos
docker compose up --build
```

## Seguridad y GDPR

- Passwords: bcrypt (12 rondas).
- JWT: access 1h, refresh 7d, refresh rotation en `/auth/refresh`.
- Rate limit global: 100 req/min por IP.
- Borrado en cascada desde `users` — satisface "derecho al olvido" si se borra al usuario.
- `audit_logs` está definido en el schema; el middleware de escritura de logs todavía no — es un TODO razonable para la siguiente iteración.

## Roadmap

- **Siguiente slice:** 2FA TOTP real, RAG con embeddings (Claude + pgvector), Pilar 2 (Interactive Memorial).
- **Después:** MercadoPago (subscription + notary), Kapso (WhatsApp), Pilar 3 (Legacy Planner), Pilar 4 (Digital Will + PDF + blockchain).

## Estructura

```
presence/
├── backend/
│   ├── src/
│   │   ├── config/       (env, supabase, anthropic)
│   │   ├── controllers/  (auth, vault)
│   │   ├── middleware/   (auth, rateLimit, errorHandler)
│   │   ├── routes/       (auth, vaults)
│   │   ├── schemas/      (zod: auth, vault)
│   │   ├── services/     (authService, vaultService, chatService, storageService)
│   │   └── utils/        (jwt, errors, asyncHandler)
│   └── server.ts
├── frontend/
│   └── src/
│       ├── components/   (Layout, ProtectedRoute, UploadZone, VaultChat)
│       ├── lib/          (api client)
│       ├── pages/        (Login, Register, Dashboard, VaultCreate, VaultDetail)
│       └── store/        (authStore)
├── supabase/migrations/  (0001_initial_schema.sql)
└── docker-compose.yml
```
