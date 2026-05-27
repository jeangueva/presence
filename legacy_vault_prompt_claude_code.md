# 🕊️ LEGACY VAULT - Prompt Completo para Claude Code

## 📋 BRIEF EJECUTIVO

**Nombre:** LEGACY VAULT (o "Eternity" / "Presence")

**Tagline:** "Mantén viva la memoria. Crea legado digital. Conecta generaciones."

**Visión Unificada:**
Una plataforma integral donde familias pueden:
1. **Crear perfiles digitales inmortales** de seres queridos (con IA conversacional)
2. **Diseñar memoriales interactivos** (no lápidas estáticas, sino espacios vivos)
3. **Grabar legados digitales** (testamentos, mensajes futuros, instrucciones)
4. **Planificar herencia digital** (documentos legales, instrucciones post-mortem)

**Diferenciador:** Todo integrado en UNA plataforma. No es solo chat de duelo, es gestión completa de legado digital + herencia legal.

**Mercado:** LATAM (Perú, Colombia, México, Brasil) → Global. Culturas con duelo prolongado, familias multigeneracionales.

**Modelo de Negocio:**
- **Tier 1 (Free):** Crear 1 memorial básico, sin IA, sin documentos legales
- **Tier 2 (USD 9.99/mes):** 1 memorial + IA conversacional + 1 documento legal template
- **Tier 3 (USD 29.99/mes):** Memorials ilimitados + IA mejorada + documentos legales ilimitados + integración Kapso (notificaciones)
- **Tier 4 (USD 99/mes Enterprise):** Para funeradas/servicios funerarios (white-label memorial, gestión de múltiples clientes)

**Ingresos Secundarios:**
- Integración con funeradas (comisión 2-3%)
- Marketplace de "plantillas de legacy" (testamentos, cartas, videos curados)
- Notarios digitales (partnership MercadoPago → verificación legal)

---

## 🏗️ ARQUITECTURA TÉCNICA

### Stack Confirmado:

```
FRONTEND:
  - React 18+
  - Tailwind CSS (styling)
  - React Router v6 (navegación)
  - Zustand (state management)
  - React Query (data fetching)
  - Framer Motion (animaciones)
  - Hosting: Railway Container OR Render (Docker)

BACKEND:
  - Node.js + Express 4.x
  - TypeScript
  - JWT (autenticación)
  - Hosting: Railway OR Render

BASE DE DATOS:
  - Supabase (PostgreSQL) con Real-time subscriptions
  - Schema versionado con Liquibase/Flyway
  - Encryption at rest para datos sensibles

APIs EXTERNAS:
  - Claude API (fine-tuning mini-models)
  - MercadoPago SDK (pagos)
  - Kapso (WhatsApp Business API)
  - Google Cloud Storage (archivos: fotos, audios, videos)

SEGURIDAD:
  - SSL/TLS obligatorio
  - GDPR compliant (derecho al olvido)
  - 2FA con TOTP
  - Auditoría de acceso (quién accedió a legado de quién)
```

---

## 🎯 LOS 4 PILARES FUNCIONALES

### PILAR 1: MEMORY VAULT AI
**"Tu ser querido sigue conversando"**

**Funcionalidad:**
- Upload: Fotos, textos (carta, biografia), audios, videos
- IA: Claude fine-tune crea mini-modelo que imita estilo + personalidad
- Chat: Conversaciones con "versión IA" del fallecido
- Privacidad: Solo familia puede acceder (whitelist de emails)

**Workflow:**
```
1. Usuario crea "Memory Vault" para John (fallecido)
2. Sube: 10+ fotos, 5 cartas PDF, 3 audios de John
3. Sistema procesa + Claude fine-tune crea modelo
4. Chat disponible en 2-4 horas
5. Familia invita a otros via email → acceso compartido
6. Pueden conversar: "¿Qué me recomienda John sobre carrera?"
```

**Datos Supabase necesarios:**
```sql
-- Tablas clave
memory_vaults (id, user_id, deceased_name, deceased_bio, model_id, created_at, updated_at)
memory_vault_files (id, vault_id, file_type, file_url, uploaded_at)
memory_vault_access (id, vault_id, email, role, granted_at)
chat_history (id, vault_id, user_id, message, response, model_version, created_at)
```

**Claude Code debe:**
- Crear componente UploadZone (fotos + audio + PDF drag-drop)
- Crear Chat widget con streaming responses
- Integrar con Claude API para fine-tuning
- Manejar privacy/access control

---

### PILAR 2: INTERACTIVE MEMORIAL
**"Un espacio donde familia se reúne"**

**Funcionalidad:**
- Perfil visual del fallecido (foto portada, bio, timeline)
- Muro de recuerdos (familia/amigos dejan mensajes, fotos)
- Guestbook digital (visitantes dejan recuerdos)
- Timeline interactivo (vida del fallecido: eventos, fotos, historias)
- Gallery de fotos (compartida, con permisos)
- IA Stories: Click en foto → IA genera "historia de ese momento"

**Workflow:**
```
1. Usuario crea "Interactive Memorial"
2. Llena: Nombre, fechas, bio, foto perfil
3. Sube álbum de fotos (timeline automático por metadata)
4. Invita familia → pueden agregar fotos/historias
5. Publicidad opcional: Link público para amigos/comunidad
6. IA genera narrativas sobre fotos (con context)
7. Cada visita: contador, mensajes de duelo validados
```

**Datos Supabase necesarios:**
```sql
memorials (id, user_id, deceased_name, description, public, created_at)
memorial_timeline_events (id, memorial_id, event_name, date, photo_url)
memorial_guestbook (id, memorial_id, visitor_name, message, approved, created_at)
memorial_photos (id, memorial_id, photo_url, caption, date_taken, ai_story_generated)
memorial_visitors (id, memorial_id, visitor_email, visit_count, last_visited)
```

**Claude Code debe:**
- Timeline interactivo (Framer Motion)
- Gallery infinita con lightbox
- Guestbook con moderación (admin approval)
- IA story generator (call Claude API + image context)
- Privacidad: Publicar/privado toggle
- Integración Kapso: Notificar familia de nuevos mensajes via WhatsApp

---

### PILAR 3: DIGITAL LEGACY PLANNER
**"Tus instrucciones para después"**

**Funcionalidad:**
- Grabar mensajes de voz (para abrirse en fechas específicas)
- Instrucciones condicionales ("Si me muero y alguien pregunta por X, responde Y")
- Auto-respuestas IA (Setup: cuando muera, IA responde emails/mensajes automáticamente)
- Cartas programadas (enviar automático después de muerte)
- Instrucciones post-mortem (cuentas a cerrar, dinero a transferir, etc.)

**Workflow:**
```
1. Usuario abre "Digital Legacy"
2. Graba mensaje: "Para mi hijo en su 18 aniversario" → se abre automático
3. Crea instrucciones: 
   - "Si alguien pregunta cómo empecé mi negocio, responde [template]"
   - "Después de 1 año, enviar carta a mi esposa"
4. Carga documentos: testamento digital, contactos de emergencia
5. Designa executor (persona que maneja legacy post-mortem)
6. IA entrenada responde según reglas (not free-form, sino template-based)
```

**Datos Supabase necesarios:**
```sql
legacy_plans (id, user_id, executor_email, death_status, created_at)
legacy_messages (id, plan_id, message_type, trigger_type, scheduled_date, audio_url, text, created_at)
legacy_rules (id, plan_id, trigger_condition, response_template, created_at)
legacy_documents (id, plan_id, doc_type, file_url, created_at)
```

**Claude Code debe:**
- Voice recording + upload (Google Cloud Storage)
- Conditional trigger builder (UI para reglas)
- Document upload + preview
- Scheduler (para mensajes futuros)
- Integración: After muerte → enviar notificaciones via Kapso

---

### PILAR 4: HERRAMIENTAS DE TESTAMENTO DIGITAL
**"Tu voluntad, legal + digital"**

**Funcionalidad:**
- Templates de testamento digital (herederos, dinero, instrucciones)
- Document generator (genera PDF legal basado en respuestas)
- Notario virtual (verificación vía MercadoPago Notario)
- Checklist: Cuentas a cerrar (banco, redes, suscripciones)
- Inventario de activos (dinero, cripto, propiedad, cuentas)
- E-signature (validación legal)

**Workflow:**
```
1. Usuario abre "Testamento Digital"
2. Responde cuestionario: herederos, bienes, instrucciones
3. Sistema genera documento PDF (template legal + respuestas)
4. Opción 1: Download + notario tradicional
5. Opción 2: E-signature via MercadoPago (costo adicional USD 29.99)
6. Sistema almacena versión sellada + notarizada
7. Executor recibe copia segura
8. Registro en blockchain (Polygon) para prueba de existencia
```

**Datos Supabase necesarios:**
```sql
digital_wills (id, user_id, status, generated_pdf_url, notarized, notary_date, created_at)
will_heirs (id, will_id, heir_name, heir_email, relationship, inheritance_amount)
will_assets (id, will_id, asset_type, description, value, location)
will_instructions (id, will_id, instruction_type, content, priority)
will_checklist (id, will_id, account_type, account_name, username, status_closed)
```

**Claude Code debe:**
- Form builder (cuestionario dinámico)
- PDF generator (pdfkit o similar)
- Asset inventory UI (tabla editable)
- Blockchain registration (Polygon contract call)
- MercadoPago notary integration (redirect → firma)

---

## 🗄️ ESQUEMA SUPABASE COMPLETO

```sql
-- USUARIOS BASE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free', -- free, monthly, yearly
  subscription_expires_at TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  gdpr_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MEMORY VAULTS (Pilar 1)
CREATE TABLE memory_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deceased_name VARCHAR(255) NOT NULL,
  deceased_bio TEXT,
  deceased_birth_date DATE,
  deceased_death_date DATE,
  profile_photo_url TEXT,
  model_id VARCHAR(255), -- Claude fine-tune model ID
  model_trained BOOLEAN DEFAULT FALSE,
  training_progress INT DEFAULT 0, -- 0-100%
  public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memory_vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES memory_vaults(id) ON DELETE CASCADE,
  file_type VARCHAR(50), -- 'photo', 'audio', 'video', 'document'
  file_url TEXT NOT NULL,
  file_size INT,
  duration_seconds INT, -- para audio/video
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memory_vault_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES memory_vaults(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES memory_vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20), -- 'user', 'assistant'
  content TEXT NOT NULL,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MEMORIALS (Pilar 2)
CREATE TABLE memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deceased_name VARCHAR(255) NOT NULL,
  deceased_bio TEXT,
  birth_date DATE,
  death_date DATE,
  profile_photo_url TEXT,
  cover_photo_url TEXT,
  public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memorial_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  event_name VARCHAR(255),
  event_date DATE,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memorial_guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  message TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memorial_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  date_taken DATE,
  uploaded_by UUID REFERENCES users(id),
  ai_story TEXT, -- generated by Claude
  ai_story_generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memorial_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id UUID NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  visitor_email VARCHAR(255),
  visit_count INT DEFAULT 1,
  last_visited TIMESTAMP DEFAULT NOW()
);

-- LEGACY PLANNER (Pilar 3)
CREATE TABLE legacy_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  executor_email VARCHAR(255),
  executor_phone VARCHAR(20),
  death_reported BOOLEAN DEFAULT FALSE,
  death_reported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE legacy_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES legacy_plans(id) ON DELETE CASCADE,
  message_type VARCHAR(50), -- 'voice_message', 'scheduled_letter', 'instruction'
  trigger_type VARCHAR(50), -- 'immediate', 'scheduled', 'conditional'
  trigger_value VARCHAR(255), -- fecha o condición
  recipient_email VARCHAR(255),
  audio_url TEXT,
  text_content TEXT,
  opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE legacy_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES legacy_plans(id) ON DELETE CASCADE,
  trigger_condition VARCHAR(255), -- "alguien pregunta por X"
  response_template TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE legacy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES legacy_plans(id) ON DELETE CASCADE,
  doc_type VARCHAR(50), -- 'will', 'instruction', 'contact_list'
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- DIGITAL WILLS (Pilar 4)
CREATE TABLE digital_wills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'completed', 'notarized'
  generated_pdf_url TEXT,
  notarized BOOLEAN DEFAULT FALSE,
  notary_date TIMESTAMP,
  notary_id VARCHAR(255),
  blockchain_hash VARCHAR(255), -- Polygon registrado
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE will_heirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  will_id UUID NOT NULL REFERENCES digital_wills(id) ON DELETE CASCADE,
  heir_name VARCHAR(255),
  heir_email VARCHAR(255),
  relationship VARCHAR(100),
  inheritance_percentage DECIMAL(5,2),
  inheritance_amount DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE will_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  will_id UUID NOT NULL REFERENCES digital_wills(id) ON DELETE CASCADE,
  asset_type VARCHAR(50), -- 'bank_account', 'crypto', 'property', 'digital_asset'
  description VARCHAR(255),
  estimated_value DECIMAL(12,2),
  location VARCHAR(255),
  account_info TEXT, -- encrypted
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE will_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  will_id UUID NOT NULL REFERENCES digital_wills(id) ON DELETE CASCADE,
  instruction_type VARCHAR(50), -- 'funeral', 'digital_accounts', 'funeral_wishes'
  content TEXT,
  priority INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE will_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  will_id UUID NOT NULL REFERENCES digital_wills(id) ON DELETE CASCADE,
  account_type VARCHAR(100), -- 'bank', 'email', 'social_media', 'subscription'
  account_name VARCHAR(255),
  username VARCHAR(255),
  action_needed VARCHAR(255), -- 'close', 'transfer', 'notify'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed'
  created_at TIMESTAMP DEFAULT NOW()
);

-- PAGOS (integración MercadoPago)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2),
  currency VARCHAR(10) DEFAULT 'USD',
  payment_type VARCHAR(50), -- 'subscription', 'notary', 'premium_feature'
  payment_method VARCHAR(50), -- 'mercadopago', 'stripe'
  external_id VARCHAR(255), -- MercadoPago preference_id
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- AUDITORÍA
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  resource_type VARCHAR(100), -- 'memory_vault', 'memorial', etc
  resource_id UUID,
  action VARCHAR(50), -- 'view', 'edit', 'delete'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 SEGURIDAD Y GDPR

### Requisitos Implementados:
```
1. Encryption at rest: Supabase maneja (PG encryption)
2. HTTPS/TLS: Obligatorio
3. 2FA: TOTP (Google Authenticator)
4. JWT: Expiry 1 hora, refresh 7 días
5. Rate limiting: 100 requests/minuto por IP
6. Audit logs: Todos accesos registrados
7. GDPR right-to-be-forgotten: Delete cascade en user
8. Consent management: Checkbox en signup
9. Data residency: EU/US Supabase region
10. Backup: Supabase automático diario
```

---

## 🚀 RUTAS API (Backend Node/Express)

```
=== AUTENTICACIÓN ===
POST   /auth/register
POST   /auth/login
POST   /auth/refresh-token
POST   /auth/logout
POST   /auth/2fa/setup
POST   /auth/2fa/verify

=== MEMORY VAULTS (Pilar 1) ===
POST   /vaults
GET    /vaults/:id
PUT    /vaults/:id
DELETE /vaults/:id
POST   /vaults/:id/files (upload)
POST   /vaults/:id/access (share)
GET    /vaults/:id/model-status
POST   /vaults/:id/train-model
POST   /vaults/:id/chat (streaming)

=== MEMORIALS (Pilar 2) ===
POST   /memorials
GET    /memorials/:id
PUT    /memorials/:id
DELETE /memorials/:id
POST   /memorials/:id/timeline-events
POST   /memorials/:id/guestbook (submit)
POST   /memorials/:id/photos
GET    /memorials/:id/ai-story/:photo_id
POST   /memorials/:id/public-link
GET    /public/memorial/:public_id (sin auth)

=== LEGACY PLANNER (Pilar 3) ===
POST   /legacy
GET    /legacy/:id
PUT    /legacy/:id
POST   /legacy/:id/messages (upload audio)
POST   /legacy/:id/rules
POST   /legacy/:id/mark-death (executor)
GET    /legacy/:id/messages/pending (after death)

=== DIGITAL WILLS (Pilar 4) ===
POST   /wills
GET    /wills/:id
PUT    /wills/:id
POST   /wills/:id/generate-pdf
POST   /wills/:id/notarize (MercadoPago)
POST   /wills/:id/heirs
POST   /wills/:id/assets
POST   /wills/:id/checklist
GET    /wills/:id/pdf (download)

=== PAGOS ===
POST   /payments/create-preference (MercadoPago)
POST   /payments/webhook (MercadoPago IPN)
GET    /payments/status/:id

=== AUDITORÍA ===
GET    /audit-logs (admin only)
```

---

## 📱 FLUJOS DE USUARIO CLAVE

### Flow 1: Crear Memory Vault
```
1. Dashboard → "New Memory Vault"
2. Llena datos básicos (nombre fallecido, fechas)
3. Upload files (drag-drop): fotos, audios, textos
4. Invita familia (emails)
5. Espera 2-4 horas (model training)
6. Recibe email: "Memory Vault ready"
7. Abre chat → conversa con IA
```

### Flow 2: Crear Interactive Memorial
```
1. Dashboard → "New Memorial"
2. Llena datos (nombre, bio, fotos)
3. Album automático (timeline por fecha de foto)
4. Toggle public/private
5. Si público: genera link compartible
6. Familia puede agregar fotos/mensajes
7. IA genera historias de fotos on-demand
```

### Flow 3: Crear Digital Legacy
```
1. Dashboard → "Digital Legacy"
2. Designa executor (email)
3. Graba mensajes de voz (+ transcripción automática)
4. Crea reglas: "Si alguien pregunta X → responde Y"
5. Carga documentos
6. Scheduler: "Enviar carta después de 1 año"
7. Si executor marca muerte → automatiza respuestas
```

### Flow 4: Crear Testamento Digital
```
1. Dashboard → "Digital Will"
2. Cuestionario guiado (herederos, bienes)
3. Sistema genera PDF
4. Opción: Download o e-signature (MercadoPago)
5. Almacena versión notarizada
6. Registra en blockchain (Polygon)
7. Executor recibe copia segura
```

---

## 📊 MODELO DE DATOS (Estado UI)

Usa Zustand para:
```javascript
// store/authStore.ts
- user (current user object)
- isAuthenticated
- isLoading
- error

// store/vaultStore.ts
- currentVault
- vaults (lista)
- chatHistory
- isTraining

// store/memorialStore.ts
- currentMemorial
- memorials (lista)
- guestbookEntries
- timelineEvents

// store/legacyStore.ts
- currentPlan
- messages
- rules
- executor

// store/willStore.ts
- currentWill
- heirs
- assets
- instructions
- checklist
```

---

## 🎨 COMPONENTES REACT PRINCIPALES

```
Layout/
  - Header.tsx (nav, usuario)
  - Sidebar.tsx (menú lateral)
  - Footer.tsx

Auth/
  - LoginForm.tsx
  - RegisterForm.tsx
  - 2FASetup.tsx

VaultComponents/
  - UploadZone.tsx (drag-drop files)
  - VaultChat.tsx (chat conversacional)
  - ModelTrainingProgress.tsx
  - AccessControl.tsx (share)

MemorialComponents/
  - MemorialProfile.tsx (portada)
  - TimelineView.tsx (eventos)
  - PhotoGallery.tsx (lightbox)
  - GuestbookForm.tsx
  - PublicMemorialPage.tsx

LegacyComponents/
  - MessageRecorder.tsx (audio)
  - RuleBuilder.tsx (trigger conditions)
  - DocumentUpload.tsx
  - ExecutorSetup.tsx

WillComponents/
  - WillQuestionnaire.tsx
  - AssetInventory.tsx
  - HeirManagement.tsx
  - PDFPreview.tsx
  - NotaryIntegration.tsx

Common/
  - Modal.tsx
  - Button.tsx
  - Card.tsx
  - InputField.tsx
  - FileUpload.tsx
  - Spinner.tsx
  - Toast.tsx (notifications)
```

---

## 🔌 INTEGRACIONES ESPECÍFICAS

### Claude API (Fine-tuning)
```javascript
// Backend: train-model.js
const Anthropic = require("@anthropic-ai/sdk");

async function trainMemoryModel(vaultId, files) {
  const client = new Anthropic();
  
  // 1. Procesar archivos (PDFs → text, audio → transcription)
  const processedContext = await processVaultFiles(files);
  
  // 2. Crear sistema prompt personalizado
  const systemPrompt = `You are an AI representation of ${deceased_name}.
  Key traits: ${extracted_traits}
  Speaking style: ${speech_patterns}
  
  Respond warmly but authentically. If asked about something personal,
  refer to memories/stories from the uploaded materials.`;
  
  // 3. Guardar modelo en Supabase
  // (Nota: Claude no tiene fine-tuning persistente, así que usamos:
  //  - System prompt personalizado
  //  - Few-shot examples del context
  //  - RAG: embeddings de archivos)
  
  // 4. Usar Claude Embeddings para RAG
  const embeddings = await generateEmbeddings(processedContext);
  await supabase
    .from("memory_vault_embeddings")
    .insert({ vault_id: vaultId, embeddings });
    
  return { status: "trained", model_id: vaultId };
}

// Chat endpoint
app.post("/vaults/:id/chat", async (req, res) => {
  const { vaultId } = req.params;
  const { message } = req.body;
  
  // 1. Obtener context del vault (RAG)
  const relevantContext = await semanticSearch(vaultId, message);
  
  // 2. Llamar Claude con system prompt + context
  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `${systemPrompt}\n\nRelevant memories:\n${relevantContext}`,
    messages: [{ role: "user", content: message }]
  });
  
  // 3. Stream response
  res.json({ response: response.content[0].text });
});
```

### MercadoPago Integration
```javascript
// Backend: payments.js
const mercadopago = require("mercadopago");

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_TOKEN
});

app.post("/payments/create-preference", async (req, res) => {
  const { tierId, userId } = req.body;
  
  const pricing = {
    monthly: { price: 9.99, title: "Legacy Monthly" },
    yearly: { price: 99.99, title: "Legacy Yearly" },
    notary: { price: 29.99, title: "Notary Service" }
  };
  
  const preference = {
    items: [{
      title: pricing[tierId].title,
      quantity: 1,
      unit_price: pricing[tierId].price
    }],
    back_urls: {
      success: `${process.env.FRONTEND_URL}/payment/success`,
      failure: `${process.env.FRONTEND_URL}/payment/failure`,
      pending: `${process.env.FRONTEND_URL}/payment/pending`
    },
    notification_url: `${process.env.BACKEND_URL}/payments/webhook`,
    metadata: { user_id: userId, tier: tierId }
  };
  
  try {
    const response = await mercadopago.preferences.create(preference);
    res.json({ preference_id: response.body.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
app.post("/payments/webhook", async (req, res) => {
  const { type, data } = req.body;
  
  if (type === "payment") {
    const paymentId = data.id;
    const payment = await mercadopago.payment.findById(paymentId);
    
    if (payment.body.status === "approved") {
      const { user_id, tier } = payment.body.metadata;
      
      // Actualizar subscription
      await supabase
        .from("users")
        .update({
          subscription_tier: tier,
          subscription_expires_at: addMonths(new Date(), 1)
        })
        .eq("id", user_id);
      
      // Enviar email
      await sendEmail(user_id, "subscription_activated");
    }
  }
  
  res.json({ status: "ok" });
});
```

### Kapso WhatsApp Integration
```javascript
// Backend: whatsapp.js
const axios = require("axios");

const KAPSO_API_KEY = process.env.KAPSO_API_KEY;
const KAPSO_PHONE_ID = process.env.KAPSO_PHONE_ID;

async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const response = await axios.post(
      `https://api.kapso.com/messages`,
      {
        recipient: phoneNumber,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${KAPSO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Kapso error:", error);
  }
}

// Evento: nuevo mensaje en memorial → notificar admin
app.post("/memorials/:id/guestbook", async (req, res) => {
  // ... crear message ...
  
  // Notificar al propietario via WhatsApp
  const memorial = await supabase
    .from("memorials")
    .select("user_id")
    .eq("id", req.params.id)
    .single();
  
  const user = await supabase
    .from("users")
    .select("phone_number")
    .eq("id", memorial.user_id)
    .single();
  
  if (user.phone_number) {
    await sendWhatsAppMessage(
      user.phone_number,
      `Nuevo mensaje en memorial de ${memorial.deceased_name}: "${req.body.message.substring(0, 50)}..."`
    );
  }
  
  res.json({ success: true });
});
```

### Google Cloud Storage (Files)
```javascript
// Backend: file-upload.js
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE
});

const bucket = storage.bucket(process.env.GCS_BUCKET);
const upload = multer({ storage: multer.memoryStorage() });

app.post("/vaults/:id/files", upload.single("file"), async (req, res) => {
  const file = req.file;
  const vaultId = req.params.id;
  
  const fileName = `${vaultId}/${Date.now()}-${file.originalname}`;
  const gcsFile = bucket.file(fileName);
  
  try {
    await gcsFile.save(file.buffer, {
      metadata: {
        contentType: file.mimetype
      }
    });
    
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`;
    
    // Guardar en Supabase
    await supabase
      .from("memory_vault_files")
      .insert({
        vault_id: vaultId,
        file_type: getFileType(file.mimetype),
        file_url: publicUrl,
        file_size: file.size
      });
    
    res.json({ url: publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📝 INSTRUCCIONES ESPECÍFICAS PARA CLAUDE CODE

### Paso 1: Scaffolding Inicial
```bash
# Frontend
npx create-vite legacy-vault --template react-ts
cd legacy-vault
npm install react-router-dom zustand react-query axios framer-motion lucide-react tailwindcss

# Backend
mkdir legacy-vault-backend
cd legacy-vault-backend
npm init -y
npm install express typescript ts-node dotenv cors helmet express-jwt jsonwebtoken bcryptjs @supabase/supabase-js axios multer @google-cloud/storage @anthropic-ai/sdk mercadopago
```

### Paso 2: Crear Estructura
```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── store/
│   ├── hooks/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── .env.example
└── vite.config.ts

backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── services/
│   ├── db/
│   └── server.ts
├── .env.example
├── tsconfig.json
└── package.json
```

### Paso 3: Implementación Fase 1 (MVP - 2 semanas)
```
SEMANA 1:
- Auth (login/registro/2FA)
- Memory Vault básico (upload + chat simple)
- Supabase setup + esquema

SEMANA 2:
- Interactive Memorial (galería + guestbook)
- MercadoPago integración
- Deploy frontend (Railway) + backend (Railway)
```

### Paso 4: Implementación Fase 2 (4 semanas)
```
SEMANA 3:
- Digital Legacy Planner (voice + rules)
- Kapso WhatsApp integration

SEMANA 4:
- Digital Wills (form builder + PDF)
- Notary integration
- Blockchain registration
```

### Paso 5: Testing & Optimization
- E2E tests (Playwright)
- Load testing (k6)
- Security audit
- GDPR compliance check

---

## 🎯 PROMPT PARA CLAUDE CODE

**Ahora sí, el prompt para copiar-pegar en Claude Code:**

---

## 💬 PROMPT FINAL PARA CLAUDE CODE

```
Crea un MVP full-stack para "LEGACY VAULT" - plataforma de legado digital.

CONTEXTO:
- Nombre: Legacy Vault (o "Eternity")
- Resuelve: Duelo + herencia digital (memory vault + memorial + legacy planner + testamento digital)
- Mercado: LATAM → Global (Perú, Colombia, México, Brasil)
- Modelo: Freemium (free) + Tier 2 ($9.99/mes) + Tier 3 ($29.99/mes) + Tier 4 ($99/mes)

STACK EXACTO:
Frontend:  React 18 + TypeScript + Tailwind + Zustand + React Query
Backend:   Node.js + Express + TypeScript
DB:        Supabase (PostgreSQL con Real-time)
APIs:      Claude API (chat) + MercadoPago (pagos) + Kapso (WhatsApp) + Google Cloud Storage
Hosting:   Railway/Render (backend) + NO Vercel (frontend: tu propio servidor)

LOS 4 PILARES FUNCIONALES:

1. MEMORY VAULT AI
   - Upload: fotos, audios, textos → IA fine-tune
   - Chat: conversar con "versión IA" del fallecido
   - Access control: compartir con familia via email
   - Status: modelo entrenando → notificar cuando ready

2. INTERACTIVE MEMORIAL
   - Perfil fallecido (foto, bio, timeline)
   - Guestbook: mensajes de familia/amigos
   - Gallery: fotos con IA story generation
   - Public/private toggle
   - Kapso integration: notificar nuevos mensajes via WhatsApp

3. DIGITAL LEGACY PLANNER
   - Voice messages: grabar para abrir después
   - Scheduled messages: enviar automático en fechas
   - Conditional rules: "Si alguien pregunta X → responde template Y"
   - Document upload: instrucciones
   - Executor setup: persona que maneja todo post-mortem

4. DIGITAL WILL
   - Questionnaire: herederos, bienes, instrucciones
   - PDF generator: documento legal
   - Asset inventory: banco, crypto, property, suscripciones
   - Notary: opción e-signature via MercadoPago
   - Blockchain: registrar en Polygon (prueba de existencia)

FEATURES CORE MVP (Fase 1):
✅ Auth con JWT + 2FA (TOTP)
✅ Memory Vault: upload + chat Claude API
✅ Interactive Memorial: perfil + guestbook + gallery
✅ MercadoPago pagos
✅ Supabase schema completo
✅ Responsive (mobile/desktop)

FEATURES Fase 2:
✅ Digital Legacy Planner
✅ Digital Will + PDF generator
✅ Kapso WhatsApp notifications
✅ Blockchain registration (Polygon)
✅ Notary integration

REQUISITOS NO-NEGOCIABLES:
- GDPR compliant (derecho al olvido, audit logs)
- Encriptación de datos sensibles
- Rate limiting (DDoS protection)
- SSL/TLS obligatorio
- Audit log: quién accedió a qué memorial/vault
- Email verification
- Documentación de APIs
- Docker compose para local dev
- .env.example con todas variables

ESTRUCTURA SUPABASE (SQL provided):
[VER ESQUEMA ARRIBA]

RUTAS API PRINCIPALES:
[VER API ROUTES ARRIBA]

COMPONENTES REACT:
[VER COMPONENTES ARRIBA]

INTEGRACIONES:
1. Claude API → Memory Vault chat + AI story generation
2. MercadoPago → Pagos (subscription + notary)
3. Kapso → WhatsApp notifications
4. Google Cloud Storage → File upload (fotos, audios)
5. Supabase → DB + Auth + Real-time

INSTRUCCIONES ESPECÍFICAS:
1. Usa Supabase CLI para crear tablas (migrations)
2. JWT tokens: 1 hora expiry + 7 días refresh
3. Streaming responses en /chat endpoint
4. Real-time: Supabase subscriptions en React Query
5. Error handling: Toast notifications consistent
6. Loading states: Skeleton + spinners
7. Validaciones: Zod schema validation frontend + backend
8. Rate limiting: 100 req/min por IP
9. Logging: Winston logger backend + Sentry error tracking
10. Testing: Vitest + Playwright E2E

DEPLOYMENT:
Frontend: Railway container (Next.js o React estático)
Backend: Railway Node.js container
DB: Supabase hosted (free tier ok para MVP)
Files: Google Cloud Storage OR Supabase Storage
Domain: tu dominio → Railway proxy

FASES RECOMENDADAS:
FASE 1 (2 semanas): Auth + Memory Vault + Memorial + MercadoPago
FASE 2 (4 semanas): Legacy Planner + Wills + Notary + Blockchain
FASE 3 (2 semanas): Testing + optimización + security audit

ENTREGABLES:
- Código frontend (GitHub repo)
- Código backend (mismo repo)
- Supabase migrations (SQL)
- Docker compose (local dev)
- README con setup instructions
- Postman collection (API testing)
- CHANGELOG
- SECURITY.md (GDPR compliance checklist)

Comenzar con scaffolding básico, auth funcional, y luego Memory Vault pilar 1.
```

---

## 🎬 PASO A PASO: CÓMO USAR ESTE PROMPT EN CLAUDE CODE

1. **Abre Claude Code** (extensión VS Code o en claude.ai con Claude Code enabled)

2. **Copia el prompt completo arriba** (desde "Crea un MVP full-stack...")

3. **Pega en Claude Code** con instrucción:
   ```
   "Usa TODO el contexto arriba (stack, esquema SQL, componentes, integraciones).
   Comienza con scaffolding, auth, y Memory Vault.
   Genera código listo para funcionar, con .env.example.
   No explicar, solo código."
   ```

4. **Claude Code generará:**
   - Todos los archivos del proyecto
   - Migraciones SQL Supabase
   - Componentes React funcionales
   - Endpoints backend
   - .env.example
   - docker-compose.yml

5. **Tú ejecutas:**
   ```bash
   npm install (backend)
   npm install (frontend)
   docker-compose up (local DB)
   npm run dev (ambos)
   ```

6. **Accedes a:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Supabase: dashboard
   - MercadoPago: sandbox

---

## 📋 CHECKLIST ANTES DE LANZAR

- [ ] Todos los .env configurados
- [ ] Supabase migrations ejecutadas
- [ ] MercadoPago sandbox keys
- [ ] Google Cloud Storage bucket creado
- [ ] Kapso API key (si aplica)
- [ ] Dominios (registrar en Namecheap/Cloudflare)
- [ ] SSL certificate (Let's Encrypt)
- [ ] Email service configurado (SendGrid/Resend)
- [ ] 2FA codes backup setup
- [ ] GDPR privacy policy escrita
- [ ] Terms of Service escrito
- [ ] Sentry error tracking
- [ ] Analytics (Plausible/Mixpanel)
- [ ] Monitoring (UptimeRobot)
- [ ] Backup strategy (Supabase automático)

---

**¿Ready? Copiar prompt, pegarlo en Claude Code, y que genere tu startup. 🚀**
