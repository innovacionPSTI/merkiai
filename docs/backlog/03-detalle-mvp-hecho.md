## Detalle · E2 — Arquitectura Limpia y Generalización CMS  *(histórico: "Épica 9")*

> **Contexto:** análisis v11 (julio 2026) identificó deuda técnica acumulada en 5 categorías. Estas HUs la liquidan en orden de riesgo y esfuerzo.

---

### HU-044 — Eliminar rutas API legacy sin autenticación

> Como equipo de seguridad, quiero que todas las rutas del panel admin requieran autenticación para que no exista ningún endpoint de escritura expuesto sin verificar el rol del usuario.

**Estimación:** XS (1 punto)  
**Módulo:** `apps/admin/src/app/api/admin/banners/route.ts`  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | GET /api/admin/banners (sin sesión) | 401 o ruta inexistente |
| AC-2 | La UI de `/home` sigue funcionando | Usa `/api/admin/home/banners` (ya autenticada) |
| AC-3 | No hay ningún `fetch('/api/admin/banners')` en el cliente | Grep confirma cero referencias |
| AC-4 | `tsc --noEmit` pasa sin errores | Sin errores de tipo tras la eliminación |

**Criterios de rechazo:**
- El archivo sigue existiendo con acceso público de escritura.
- La eliminación rompe alguna feature visible en el admin.

---

### HU-045 — Eliminar directorios y código zombie en admin

> Como desarrollador, quiero que el código del admin no tenga directorios ni componentes que ya no se usen, para reducir la superficie de mantenimiento y evitar confusión al explorar el codebase.

**Estimación:** XS (1 punto)  
**Módulo:** `apps/admin/src/app/banners/`, `apps/admin/src/app/secciones/`, `BannersClient.tsx`, `SeccionesClient.tsx`  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/banners` y `/secciones` ya no existen como directorios | Carpetas eliminadas del árbol |
| AC-2 | `BannersClient.tsx` y `SeccionesClient.tsx` eliminados | ~800 líneas de código muerto removidas |
| AC-3 | El sidebar del admin no tiene links a `/banners` ni `/secciones` | Confirmado en `AdminSidebar.tsx` |
| AC-4 | `tsc --noEmit` y `pnpm build` pasan | Sin referencias rotas |

---

### HU-046 — Consolidar `SearchableSelect` en `packages/ui`

> Como desarrollador, quiero tener un solo `SearchableSelect` en el paquete compartido para no tener que mantener dos copias idénticas que inevitablemente van a divergir.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/ui/src/components/SearchableSelect.tsx`; eliminar copia de `apps/web` y `apps/admin`  
**Estado:** ✅ Completado (v12) — nota: `apps/web` mantiene copia local por limitación de Turbopack con `'use client'` en barrels; `apps/admin` usa `@merkiai/ui`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Existe `packages/ui/src/components/SearchableSelect.tsx` | Exportado desde el barrel de `@merkiai/ui` |
| AC-2 | `apps/web` importa desde `@merkiai/ui` | Sin copia local |
| AC-3 | `apps/admin` importa desde `@merkiai/ui` | Sin copia local |
| AC-4 | El componente sigue funcionando en checkout, Mi Cuenta y ShippingConfigForm | Tests + inspección visual |

---

### HU-047 — Consolidar `colombia-locations` en `packages/ui`

> Como desarrollador, quiero que la lista de departamentos y ciudades de Colombia esté en un único lugar para no tener que sincronizar cambios en dos archivos idénticos.

**Estimación:** XS (1 punto)  
**Módulo:** `packages/ui/src/colombia-locations.ts`; exportar desde `@merkiai/ui`; eliminar copias locales  
**Estado:** ✅ Completado (v12) — movido a `packages/ui` (no a `packages/database`) para evitar que client components importen del barrel server-only

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Existe un único `colombia-locations.ts` en `packages/database` | Exportado vía `@merkiai/database` |
| AC-2 | `apps/web` y `apps/admin` importan desde `@merkiai/database` | Cero copias locales |
| AC-3 | `SearchableSelect` de departamento/ciudad sigue funcionando | Sin cambios de comportamiento |

---

### HU-048 — Consolidar `sendShippingNotification` duplicada en `packages/`

> Como desarrollador, quiero que la lógica de envío de emails transaccionales viva en un único paquete compartido para no duplicar credenciales y lógica entre las dos apps.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/src/lib/email.ts`  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `sendShippingNotification` existe solo en `packages/` | No duplicada en `apps/web/lib/email.ts` ni `apps/admin/lib/email.ts` |
| AC-2 | Los webhooks de pago y el endpoint de status la importan desde `@merkiai/database` o `@merkiai/utils` | Sin rutas relativas entre apps |
| AC-3 | Emails de shipping/status siguen funcionando | Sin regresión en flujo de pedidos |

---

### HU-049 — Migrar `/privacy` y `/terms` al CMS de páginas

> Como editor de contenido, quiero actualizar el texto de privacidad y términos desde el panel de administración sin tocar código ni `store_config`.

**Estimación:** S (2 puntos)  
**Módulo:** `apps/web/src/app/(public)/privacy/`, `apps/web/src/app/(public)/terms/`; migración SQL seed  
**Estado:** ✅ Completado (v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/privacy` lee su contenido desde la tabla `pages` (slug = `privacidad`) | No consume `store_config.privacy_content` |
| AC-2 | `/terms` ídem con slug = `terminos` | No consume `store_config.terms_content` |
| AC-3 | Migración SQL inserta los slugs con contenido inicial | El sitio funciona sin edición manual |
| AC-4 | Admin puede editar ambas páginas en `/contenido/paginas` | Mismo flujo que cualquier otra página CMS |
| AC-5 | `store_config.privacy_content` y `terms_content` marcados como deprecated | Comentario en `types.ts` y `store_config` |

---

### HU-050 — Crear `getWebHomeData()` consolidado en `packages/database`

> Como desarrollador, quiero una sola función que devuelva todos los datos del home en paralelo para reducir el boilerplate en `page.tsx` y facilitar testear el home en aislamiento.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/src/queries/home.ts`  
**Estado:** ✅ Completado (v12) — función nombrada `getWebHomeData` para evitar colisión con `getHomeData` del admin editor

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `getHomeData()` existe y devuelve `{ banners, products, posts, bestSellers, sectionSettings, categories }` | Promise.all interno, tipado completo |
| AC-2 | `apps/web/src/app/(public)/page.tsx` llama solo `getHomeData()` | Sin 6 llamadas individuales inline |
| AC-3 | Cada sub-query tiene `.catch(() => [])` para fail-open | Igual que el comportamiento actual |
| AC-4 | `tsc --noEmit` pasa | Sin errores de tipo |

---

### HU-051 — Home adopta `page_sections` + `section_items`

> Como equipo de producto, queremos que el home funcione con el mismo modelo de datos que el resto del CMS para eliminar el modelo paralelo de banners + section_settings y tener una única forma de editar cualquier página.

**Estimación:** XL (13 puntos)  
**Módulo:** migración 19, `apps/admin`, `apps/web/src/app/(public)/page.tsx`, `SectionRenderer`  
**Estado:** ✅ Completado (v13) — implementado como épica HU-053 a HU-057

**Implementación:**
- `banners`, `section_settings` y `testimonials` migradas a `page_sections` + `section_items` (migración 19)
- `section_items` extendido con `image_url_mobile`, `link_url`, `cta_text`, `metadata JSONB`
- Home web reescrito para usar `homeSections` de `getWebHomeData()`
- Admin: `/home` y `/testimonios` eliminados; `/contenido` maneja todo el CMS

---

### HU-052 — Unificar rutas API de secciones y páginas del CMS

> Como desarrollador, quiero que exista una única ruta API para cada recurso CMS (secciones, páginas, banners) para eliminar la ambigüedad sobre cuál ruta usar y cuál tiene los guards correctos.

**Estimación:** M (3 puntos)  
**Módulo:** `apps/admin/src/app/api/admin/cms/[resource]/`  
**Estado:** ✅ Completado (v13)

**Implementación:**
- `GET|POST|PATCH|DELETE /api/admin/cms/[resource]` — endpoint genérico con mapa de 4 recursos: `pages` (pk=`key`), `sections` (pk=`id`, pkNumeric), `items` (pk=`id`, pkNumeric), `section-settings` (pk=`key`, filter=`page_key`)
- 4 endpoints legacy eliminados: `/content/pages`, `/content/sections`, `/content/items`, `/home/sections`
- Callers migrados en `ContenidoClient.tsx` y `HomeClient.tsx`
- 35 tests de integración en `cms.integration.test.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/api/admin/content/pages,sections,items` y `/api/admin/home/sections` eliminadas | ✅ Solo existe `/api/admin/cms/[resource]` |
| AC-2 | Todas las rutas usan `getAdminUser()` | ✅ Guard en todos los handlers |
| AC-3 | `tsc --noEmit` confirma cero consumidores de rutas eliminadas | ✅ `.next` limpiado; tsc pendiente de verificar |
| AC-4 | Tests de integración cubren auth, CRUD y errores DB por recurso | ✅ 35 tests en `cms.integration.test.ts` |

---

---

## Detalle · E2 — CMS Unificado e Integridad de Base de Datos  *(histórico: "Épica 10")*

> **Contexto:** v13 (julio 2026) — elimina los tres modelos CMS paralelos (banners, section_settings, testimonials), unifica todo en `pages → page_sections → section_items`, compacta 20 migraciones en un esquema canónico y refuerza integridad referencial.

---

### HU-053 — Migración 19: unificar CMS en un solo modelo

> Como arquitecto del sistema, quiero que banners, section_settings y testimonials desaparezcan como tablas independientes y existan únicamente como section_items dentro del modelo page_sections, para eliminar la ambigüedad de qué tabla es la fuente de verdad para cada tipo de contenido.

**Estimación:** L (8 puntos)  
**Módulo:** `packages/database/supabase/migrations/19_unified_cms.sql`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Migración crea sección `hero` en `page_sections` para el home | Todos los banners hero migrados como `section_items` de tipo `slide` |
| AC-2 | Migración crea sección `services` en `page_sections` para el home | Banners de servicios migrados como `section_items` de tipo `service` |
| AC-3 | Migración crea sección `testimonials` en `page_sections` para asesorías | Testimonios migrados como `section_items` de tipo `testimonial` |
| AC-4 | `section_settings` migrada fila a fila como `page_sections` | `key → section_type`, `metadata → settings` |
| AC-5 | Tablas `banners`, `section_settings`, `testimonials` eliminadas con `DROP TABLE IF EXISTS ... CASCADE` | Ningún error de FK al eliminar |
| AC-6 | `section_items` extendido con `image_url_mobile`, `link_url`, `cta_text`, `metadata JSONB DEFAULT '{}'` | Sin NOT NULL en primera pasada (añadido en migración 20) |
| AC-7 | Migración es idempotente: re-ejecutar no genera duplicados | `ON CONFLICT DO NOTHING` en todos los INSERT |

**Criterios de rechazo:**
- La migración falla si ya se ejecutó una vez.
- Datos de content existentes (banners, testimonios) se pierden en lugar de migrarse.

---

### HU-054 — Actualizar `packages/database` para el modelo unificado

> Como desarrollador, quiero que los tipos TypeScript, las queries y los exports del paquete de base de datos reflejen el nuevo modelo sin referencias a tablas eliminadas, para que el compilador sirva como guardián de coherencia.

**Estimación:** M (5 puntos)  
**Módulo:** `packages/database/src/types.ts`, `queries/home.ts`, `queries/content.ts`, `index.ts`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `types.ts` no tiene interfaces de `banners`, `section_settings` ni `testimonials` | Solo `page_sections` y `section_items` |
| AC-2 | `section_items` Row incluye `image_url_mobile`, `link_url`, `cta_text`, `metadata`, `updated_at` | Tipado exacto al schema |
| AC-3 | `queries/home.ts` exporta `getWebHomeData()` devolviendo `{ homeSections, featuredProducts, bestSellers, blogPosts, categories }` | `homeSections` tiene `.items[]` anidados |
| AC-4 | Archivos zombie `banners.ts`, `testimonials.ts`, `sections.ts` eliminados | `grep` no encuentra referencias a tablas eliminadas |
| AC-5 | `queries/content.ts` — `updateSectionItem` acepta `metadata` como `Json` | Sin error de tipos `Json vs Record<string,unknown>` |
| AC-6 | `tsc --noEmit --skipLibCheck` pasa en `packages/database` | Sin errores de compilación |
| AC-7 | Tests `home.test.ts` actualizados y pasan | Cubre forma `homeSections`, fail-open por query |

---

### HU-055 — Actualizar `apps/web` para leer del CMS unificado

> Como usuario del sitio, quiero que la home, el carrusel hero, los servicios y los testimonios sigan funcionando exactamente igual visualmente, pero ahora leyendo sus datos de `section_items` en lugar de tablas legacy.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/web/src/app/(public)/page.tsx`, `HeroCarousel`, `ServicesSection`, `TestimonialsSection`, `TestimonialsCarousel`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `page.tsx` llama `getWebHomeData()` y desestructura `homeSections` | Una sola llamada; no 6 queries individuales |
| AC-2 | `HeroCarousel` recibe slides de `section_items` (tipo `slide`) | `image_url`, `image_url_mobile`, `title`, `description`, `cta_text`, `link_url`, `metadata.bg_color` |
| AC-3 | `ServicesSection` recibe items de `section_items` (tipo `service`) | `title`, `description`, `image_url`, `cta_text`, `link_url`, `metadata.bg_color` |
| AC-4 | `TestimonialsSection` recibe items de `section_items` (tipo `testimonial`) | `title` (autor), `description` (contenido), `image_url` (avatar), `metadata.rating`, `metadata.role` |
| AC-5 | Home sin sección hero | Componente no se renderiza (no crashea) |
| AC-6 | `tsc --noEmit` pasa en `apps/web` | Sin errores de tipo |

---

### HU-056 — Extender `ContenidoClient` con editor por tipo de sección

> Como gestor de contenido, quiero poder editar los campos específicos de cada tipo de sección (slides de hero, servicios, testimonios, tarjetas, FAQ) desde el panel `/contenido`, para no necesitar ir a pantallas separadas según el tipo de contenido.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/admin/src/app/contenido/ContenidoClient.tsx`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Sección tipo `hero` o `services` | Editor muestra: title, description, cta_text, link_url, image_url, image_url_mobile (solo hero), bg_color en metadata |
| AC-2 | Sección tipo `testimonials` | Editor muestra: title (autor), description (contenido), role en metadata, rating (1-5), image_url (avatar) |
| AC-3 | Sección tipo `cards` | Editor muestra: icon, title, description |
| AC-4 | Sección tipo `faq` | Editor muestra: question, answer |
| AC-5 | Botón "Agregar" usa vocabulario correcto | `slide / servicio / testimonio / tarjeta / pregunta / ítem` según section_type |
| AC-6 | Cambios guardados via PATCH `/api/admin/cms/items` | `metadata` se persiste como JSONB |

---

### HU-057 — Limpiar admin: eliminar /home, /testimonios y código zombie

> Como desarrollador, quiero que el admin no tenga páginas, rutas API ni archivos que ya no sean necesarios tras la unificación del CMS, para que el codebase refleje solo la arquitectura actual.

**Estimación:** S (3 puntos)  
**Módulo:** `apps/admin/src/app/home/`, `apps/admin/src/app/testimonios/`, `apps/admin/src/app/api/admin/home/`, `AdminSidebar.tsx`, `roles.ts`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/home` y `/testimonios` eliminados como directorios | Cualquier acceso → 404 |
| AC-2 | `/api/admin/home/` eliminado | Sin endpoints zombie |
| AC-3 | `AdminSidebar` no tiene links a `/home` ni `/testimonios` | Solo `/contenido`, `/blog`, `/newsletter` en el grupo Contenido |
| AC-4 | `roles.ts` — `AdminSection` no incluye `'home'` ni `'testimonios'` | `tsc` lo detectaría si quedaran referencias |
| AC-5 | `export/route.ts` — versión bumpeada a `v2` | Sin referencias a `section_settings` ni `banners` |
| AC-6 | `import/route.ts` — bloques de `section_settings`/`banners` reemplazados por comentario | Snapshots v1 se ignoran silenciosamente |
| AC-7 | `tsc --noEmit --skipLibCheck` pasa en `apps/admin` | Sin errores de tipo |

---

### HU-058 — Migración 20: integridad referencial e índices

> Como DBA, quiero que el esquema tenga NOT NULL en columnas críticas, índices compuestos para los patrones de consulta más frecuentes, CHECK constraints para enumeraciones, y triggers `updated_at` en todas las tablas mutables, para garantizar coherencia de datos y rendimiento sin intervención manual.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/supabase/migrations/20_integrity_and_indexes.sql`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `section_items.metadata` tiene NOT NULL con DEFAULT `'{}'` | Ninguna fila puede tener `metadata IS NULL` |
| AC-2 | Índices compuestos en `page_sections` | `(page_key, enabled, order_index) WHERE enabled=true` + `(page_key, section_type)` |
| AC-3 | Índices compuestos en `section_items` | `(section_id, enabled, order_index) WHERE enabled=true` + `(section_id, item_type)` |
| AC-4 | Índice GIN en `media_assets.used_in` | Soporta `@>` para búsqueda de referencias JSONB |
| AC-5 | CHECK constraint en `page_sections.section_type` | Lista cerrada de 13 tipos; valores desconocidos normalizados a `'text'` antes de aplicar |
| AC-6 | Triggers `updated_at` en `section_items` y `nav_items` | `NOW()` automático en cualquier UPDATE |
| AC-7 | COMMENT ON TABLE/COLUMN para tablas principales | Documentación visible en Supabase Studio |

**Criterios de rechazo:**
- El CHECK constraint falla con valores existentes no normalizados (debe hacer UPDATE previo).
- Los índices duplican los existentes de migración 13 en lugar de complementarlos.

---

### HU-059 — Esquema canónico para despliegue desde cero

> Como DevOps, quiero poder levantar la base de datos completa ejecutando un único archivo SQL sin tener que correr 20 migraciones en orden, para simplificar el proceso de despliegue, CI y entornos de desarrollo locales.

**Estimación:** M (3 puntos)  
**Módulo:** `packages/database/supabase/migrations/01_schema.sql`, `seeds/01_config.sql`, `seeds/02_content.sql`  
**Estado:** ✅ Completado (v13)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `01_schema.sql` ejecutado en Supabase vacío | Todas las tablas, índices, triggers, RLS, constraints y comentarios creados |
| AC-2 | No tiene código de migración incremental (`ALTER TABLE ADD COLUMN IF NOT EXISTS`) | Solo `CREATE TABLE`, `CREATE INDEX`, `CREATE TRIGGER` |
| AC-3 | `seeds/01_config.sql` ejecutado después | Tema activo, variant_types, categorías, nav items base insertados |
| AC-4 | `seeds/02_content.sql` ejecutado después | Páginas, page_sections e items del CMS para el sitio Merkiai |
| AC-5 | Seeds son idempotentes | Re-ejecutar no genera duplicados (`ON CONFLICT DO NOTHING`) |
| AC-6 | Las 20 migraciones históricas se conservan en la carpeta | Registro de la evolución del schema para referencia |
| AC-7 | `tsc --noEmit` pasa tras aplicar el esquema | `types.ts` es coherente con `01_schema.sql` |

---

## Detalle · E14 — Despliegue, Seguridad e Identidad del Panel  *(histórico: "Épica 11")*

> **Contexto:** v14 (julio 2026) — seis historias. **Validación ago-2026:** favicon (HU-063) y colores del panel (HU-064) completos con pruebas ✅; CI/CD (HU-061) implementado ✅; tracking (HU-060), audit de seguridad (HU-062), responsive admin (HU-079), JSON-LD (HU-080) y fuentes de tema (HU-081) están implementados **y ahora con pruebas** (✅, v20).

---

### HU-060 — Tracking en Mi Cuenta

> Como cliente, quiero ver el estado de mi pedido en tiempo real con número de guía y transportadora directamente en Mi Cuenta, sin necesitar abrir el email de confirmación cada vez.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/web/src/app/(account)/account/orders/`  
**Estado:** ✅ Implementado con pruebas (v20) — vista `account/orders/[id]` cableada; `orders.test.ts` cubre `getOrdersByCustomerEmail` (email en minúsculas, orden desc, `tracking_number`/`carrier_name`) y `getOrderById`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido con `tracking_number` y `carrier_name` | Timeline visual: Pendiente → Procesando → Enviado (activo) con número de guía |
| AC-2 | Click en número de guía | Enlace a la web de seguimiento de la transportadora |
| AC-3 | Pedido cancelado | Timeline muestra Cancelado con fecha |
| AC-4 | Pedido sin tracking aún | Timeline muestra Pendiente/Procesando sin guía |
| AC-5 | Mobile | Timeline compacto; funcional en 375px |

---

### HU-061 — Despliegue en Vercel + CI/CD

> Como equipo técnico, queremos automatizar el despliegue en Vercel con GitHub Actions para que cada push a `main` desplegado automáticamente y cada PR tenga un preview environment.

**Estimación:** M (5 puntos)  
**Módulo:** `.github/workflows/`, `vercel.json`, `DEPLOYMENT.md`  
**Estado:** ✅ Implementado (v15) — `.github/workflows/ci.yml` presente (infra; es el runner de tests, no requiere test propio)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Push a `main` | Deploy automático de `apps/web` y `apps/admin` en Vercel |
| AC-2 | Apertura de PR | Preview URL generado para ambas apps |
| AC-3 | Secrets en Vercel Dashboard | `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc. configurados como environment variables |
| AC-4 | `turbo build` pasa en CI | Sin errores de compilación ni TypeScript |
| AC-5 | `DEPLOYMENT.md` actualizado | Guía paso a paso para configurar entorno nuevo desde `01_schema.sql` |

---

### HU-062 — Audit de seguridad y hardening

> Como responsable de seguridad, quiero un audit completo de las rutas API, RLS policies y manejo de secrets para identificar y corregir cualquier vector de ataque antes del despliegue en producción.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/admin/src/app/api/`, `apps/web/src/app/api/`, políticas RLS  
**Estado:** ✅ Completado — guards de auth y firma de webhooks con pruebas; rate limiting (429 por IP) cubierto en `checkout.integration.test.ts` y CSP/headers en `security-headers.test.ts` (v19)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Todas las rutas `/api/admin/*` tienen `getAdminUser()` | Grep confirma guard en cada handler |
| AC-2 | Ningún secret en respuestas API | `wompi_private_key`, `resend_api_key`, etc. nunca en JSON de respuesta |
| AC-3 | RLS habilitado en todas las tablas | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en `01_schema.sql` |
| AC-4 | Webhooks verifican firma HMAC | Wompi: SHA256; MercadoPago: header `x-signature` |
| AC-5 | Rate limiting en `/api/checkout` | Máx N requests por IP por minuto (Vercel Edge Config o middleware) |
| AC-6 | CSP headers configurados en `next.config.ts` | `Content-Security-Policy` con directivas mínimas |

---

### HU-063 — Favicon configurable desde el panel admin

> Como administrador de la tienda, quiero poder subir y cambiar el favicon del sitio web directamente desde el panel de administración, para personalizar la identidad visual del sitio sin intervención técnica.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/supabase/migrations/21_favicon_url.sql`, `apps/admin/src/app/configuracion/general/`, `apps/web/src/app/layout.tsx`  
**Estado:** ✅ Completado (v14)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `store_config` tiene columna `favicon_url` (TEXT NULL) | Migración `21_favicon_url.sql` aplica sin errores; campo disponible vía `getStoreConfig()` |
| AC-2 | Sección "Favicon" en `/configuracion/general` | Preview circular 32×32 del favicon actual; botón "Cambiar favicon" con drag-and-drop |
| AC-3 | Subir imagen PNG/ICO/SVG | Imagen subida a `store-assets/favicon.*`; `favicon_url` actualizado en `store_config`; preview actualizado inmediatamente |
| AC-4 | `apps/web` — `generateMetadata` en `layout.tsx` | `icons.icon` toma el valor de `favicon_url` cuando está definido; fallback a `/favicon.ico` estático |
| AC-5 | Sin favicon configurado | Comportamiento idéntico al anterior: favicon estático por defecto |
| AC-6 | `tsc --noEmit` en `apps/admin` y `apps/web` | Sin errores TypeScript |

---

### HU-064 — Identidad visual propia del panel de administración

> Como administrador, quiero que el panel de administración tenga colores corporativos propios (accent y sidebar) que pueda personalizar desde `/sistema/apariencia`, completamente independientes de los temas del sitio web.

**Estimación:** M (5 puntos)  
**Módulo:** `packages/database/supabase/migrations/22_admin_config.sql`, `packages/database/src/queries/admin-config.ts`, `apps/admin/src/app/sistema/apariencia/`, `apps/admin/src/app/layout.tsx`, `apps/admin/tailwind.config.ts`  
**Estado:** ✅ Completado (v14)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Tabla `admin_config` creada con migración 22 | Singleton `id=1 CHECK (id=1)`, columnas `accent_color` y `sidebar_color` (TEXT, no null), trigger `updated_at` |
| AC-2 | Seed por defecto | `accent_color = '#4F46E5'` (indigo-600) y `sidebar_color = '#0F172A'` (slate-900) insertados en `seeds/01_config.sql` |
| AC-3 | `getAdminConfig()` y `updateAdminConfig()` en `@merkiai/database` | Funciones tipadas que usan el cliente servidor de Supabase |
| AC-4 | `apps/admin/layout.tsx` inyecta CSS vars en cada request | `hexToRgb(accent_color)` → `--brand-primary`, `hexToRgb(sidebar_color)` → `--brand-sidebar` en `<html style>` |
| AC-5 | `apps/admin/tailwind.config.ts` usa `rgb(var(--brand-primary))` y `rgb(var(--brand-sidebar))` | Tokens `brand.primary` y `brand.sidebar` funcionales con alpha modifiers de Tailwind |
| AC-6 | Página `/sistema/apariencia` visible para super_admin y admin | Muestra color pickers nativos + presets para accent (7 colores) y sidebar (6 colores); preview en tiempo real |
| AC-7 | Guardar cambios | `PATCH /api/admin/sistema` actualiza `admin_config`; recarga server-side aplica los nuevos colores sin redeploy |
| AC-8 | Los temas del sitio web no se ven afectados | `apps/web` sigue usando sus propias CSS vars de `themes`; los dos sistemas son completamente independientes |
| AC-9 | `tsc --noEmit` en `apps/admin` | Sin errores TypeScript; `admin_config` correctamente tipado en `packages/database/src/types.ts` |
| AC-10 | Export/Import v3 incluye `admin_config` | Snapshot descargado desde `/api/admin/export` contiene `admin_config`; importar restaura los colores del panel |

---

### HU-079 — Responsive audit y menú hamburguesa en admin

> Como operador del negocio, quiero que el panel de administración sea usable desde una tablet o pantalla pequeña, con un menú lateral que se pueda abrir y cerrar, para gestionar pedidos o productos cuando no tengo acceso a un desktop.

**Estimación:** M (5 puntos)  
**Módulo:** `apps/admin/src/components/layout/AdminSidebar.tsx`, `apps/admin/src/app/layout.tsx`  
**Estado:** ✅ Implementado con pruebas (v20) — `AdminSidebar.test.tsx` valida nav por rol, drawer hamburguesa (responsive) y expansión de grupos

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pantalla < 768px | Sidebar oculto por defecto; botón hamburguesa visible en topbar |
| AC-2 | Tap en hamburguesa | Sidebar aparece como drawer lateral con overlay oscuro |
| AC-3 | Tap en overlay o en un link de navegación | Sidebar se cierra |
| AC-4 | Tablas de pedidos y productos en mobile | Scroll horizontal con columnas prioritarias visibles sin truncar |
| AC-5 | Formularios (ProductForm, OrderDetail) | Campos apilados en una columna en pantallas < 768px |
| AC-6 | Desktop (≥ 1024px) | Comportamiento actual sin cambios; sidebar siempre visible |

---

### HU-080 — SEO avanzado: structured data JSON-LD

> Como responsable de SEO, quiero que las páginas de producto y artículos de blog incluyan datos estructurados JSON-LD para que Google pueda mostrar rich snippets (precio, disponibilidad, calificación, fecha de publicación) en los resultados de búsqueda.

**Estimación:** M (3 puntos)  
**Módulo:** `apps/web/src/app/shop/[slug]/page.tsx`, `apps/web/src/app/blog/[slug]/page.tsx`  
**Estado:** ✅ Implementado con pruebas (v20) — builders extraídos a `lib/json-ld.ts`; `json-ld.test.ts` valida `@context/@type`, offers/brand y el schema Article

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Página de producto | `<script type="application/ld+json">` con schema `Product`: name, description, image, offers (price, currency, availability), brand |
| AC-2 | Artículo de blog | Schema `Article`: headline, datePublished, dateModified, author, image |
| AC-3 | Producto sin stock | `offers.availability: "https://schema.org/OutOfStock"` |
| AC-4 | Validación con Google Rich Results Test | Sin errores críticos; eligible para rich snippets |
| AC-5 | No afecta el LCP | JSON-LD en `<head>` sin bloquear render |

---

### HU-081 — Fuentes adicionales de tema

> Como administrador, quiero elegir entre más opciones de tipografía en el editor de temas del sitio web, para personalizar la identidad visual más allá de las fuentes por defecto.

**Estimación:** S (2 puntos)  
**Módulo:** `apps/admin/src/app/configuracion/temas/`, `apps/web/src/app/layout.tsx`  
**Estado:** ✅ Implementado con pruebas (v20) — mapas de fuentes extraídos a `lib/theme-css.ts`; `theme-css.test.ts` valida el mapeo de cada fuente display/body, el fallback y los colores

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor de temas muestra selector de fuente display | Al menos 6 opciones: Cormorant, Playfair Display, Lora, Libre Baskerville, DM Serif Display, Merriweather |
| AC-2 | Editor de temas muestra selector de fuente body | Al menos 4 opciones: DM Sans, Inter, Open Sans, Lato |
| AC-3 | Admin activa tema con nueva fuente | `web/layout.tsx` carga la fuente desde Google Fonts y la aplica via CSS var `--font-display` o `--font-body` |
| AC-4 | La fuente se aplica sin redeploy | La inyección del tema activo en `layout.tsx` ya es dinámica; solo agregar la nueva entrada al mapa de fuentes |
| AC-5 | Fuente no válida en BD | Fallback a Cormorant/DM Sans; sin error visible |

---

## Detalle · E8 — Emails Transaccionales  *(histórico: "Épica 12")*

> **Contexto:** sistema de emails transaccionales completo usando Resend. Las credenciales se configuran desde el panel admin (`store_config`); el nombre de la tienda y la URL base se inyectan dinámicamente en cada plantilla via `buildEmailConfig()`.

---

### HU-065 — Configurar proveedor de email Resend desde el admin

> Como administrador, quiero ingresar mis credenciales de Resend y el email remitente desde el panel de configuración, para que los emails transaccionales salgan con el dominio de Merkiai sin tocar código.

**Estimación:** S (2 puntos)  
**Módulo:** `apps/admin/src/app/configuracion/email/`, `packages/database/src/queries/store-config.ts`  
**Estado:** ✅ Completado (v2)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre `/configuracion/email` | Formulario con campos `resend_api_key`, `resend_from_email`, `resend_from_name` |
| AC-2 | Admin guarda credenciales válidas | Campos actualizados en `store_config`; toast de éxito |
| AC-3 | Admin guarda con api_key vacía | Error de validación en el campo; no se actualiza BD |
| AC-4 | API `PATCH /api/admin/store-config` | Acepta y persiste los campos de Resend; requiere rol admin o superior |
| AC-5 | `buildEmailConfig()` en `packages/database` | Lee `resend_api_key`, `resend_from_email`, `resend_from_name`, `store_name`, `site_url` y los devuelve en un solo objeto |

---

### HU-066 — Email de confirmación de pedido

> Como comprador, quiero recibir un email de confirmación inmediatamente después de que mi pago sea aprobado, con el resumen de mi pedido y número de orden, para tener un comprobante de mi compra.

**Estimación:** M (3 puntos)  
**Módulo:** `packages/database/src/email.ts`, `apps/web/src/app/api/webhooks/`  
**Estado:** ✅ Completado (v2)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Webhook de Wompi recibe evento `TRANSACTION.UPDATED` con estado `APPROVED` | Se llama `sendOrderConfirmation()` con los datos del pedido |
| AC-2 | Webhook de MercadoPago recibe notificación de pago aprobado | Ídem para MercadoPago |
| AC-3 | Email recibido por el cliente | Asunto: "Pedido confirmado — VPS-XXXX"; contiene número de orden, listado de productos con variantes, subtotal, envío y total |
| AC-4 | `store_name` en el email | Nombre configurable; por defecto "Merkiai" |
| AC-5 | Resend API key no configurada | Error logueado en servidor; pedido se crea igual; no falla el flujo de compra |
| AC-6 | Dirección de envío incluida | Ciudad, departamento, dirección completa del comprador |

**Criterios de rechazo:**
- El flujo de checkout se interrumpe si el envío del email falla.

---

### HU-067 — Email de notificación de envío con tracking

> Como cliente, quiero recibir un email automático cuando mi pedido sea marcado como "Enviado" que incluya el número de guía y la transportadora, para poder hacer seguimiento sin contactar a la tienda.

**Estimación:** S (2 puntos)  
**Módulo:** `packages/database/src/email.ts`, `apps/admin/src/app/api/admin/orders/[id]/route.ts`  
**Estado:** ✅ Completado (v10)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin cambia estado de pedido a "shipped" en `/pedidos/[id]` | Se dispara `sendShippingNotification()` automáticamente |
| AC-2 | Email recibido por el cliente | Asunto: "Tu pedido está en camino — VPS-XXXX"; incluye `tracking_number`, `carrier_name` y enlace de seguimiento |
| AC-3 | Pedido sin `tracking_number` | Email enviado igualmente sin sección de guía; no error |
| AC-4 | Cambio de estado a otro valor (ej. "processing") | No se dispara el email de envío |
| AC-5 | Cambio de estado de vuelta a "shipped" | Email se envía de nuevo (el admin puede reenviar manualmente) |

---

### HU-068 — Email de bienvenida al registrarse

> Como nuevo cliente, quiero recibir un email de bienvenida al crear mi cuenta, para sentir que Merkiai me reconoce como parte de su comunidad.

**Estimación:** S (1 punto)  
**Módulo:** `packages/database/src/email.ts`, `apps/web/src/app/api/auth/welcome/route.ts`  
**Estado:** ✅ Completado (v3)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Stack Auth llama a `/api/auth/welcome` tras nuevo registro | Se crea fila en `customers` y se envía `sendWelcomeEmail()` |
| AC-2 | Email recibido | Asunto: "Bienvenido a [store_name]"; cuerpo con saludo personalizado y enlace a la tienda |
| AC-3 | Email ya registrado (re-registro) | No se envía segundo email de bienvenida; upsert en `customers` sin duplicar |
| AC-4 | Ruta `/api/auth/welcome` no autenticada con Stack Auth token | 401 devuelto; email no enviado |

---

### HU-069 — Email de confirmación de suscripción al newsletter

> Como suscriptor, quiero recibir un email de confirmación cuando me suscribo al boletín de Merkiai, para saber que mi suscripción fue exitosa.

**Estimación:** S (1 punto)  
**Módulo:** `packages/database/src/email.ts`, `apps/web/src/app/api/newsletter/route.ts`  
**Estado:** ✅ Completado (v3)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario envía formulario de newsletter con email válido | Fila creada/actualizada en `newsletter_subscribers`; `sendNewsletterConfirmation()` ejecutada |
| AC-2 | Email recibido | Asunto: "¡Ya eres parte de [store_name]!"; cuerpo con mensaje de agradecimiento |
| AC-3 | Email ya suscrito (re-suscripción) | `status` se actualiza a `active`; email de confirmación enviado de nuevo |
| AC-4 | Email inválido en el formulario | Validación client-side; no llega al API |

---

## Detalle · E15 — SEO y Rendimiento  *(histórico: "Épica 13")*

> **Contexto:** estrategia SEO técnica completa: metadatos dinámicos, ISR, generación estática, sitemap, Open Graph, optimización de imágenes y analytics. Todo gestionado desde Next.js 16 con `generateMetadata` y `generateStaticParams`.

---

### HU-070 — Metadatos globales con template de título

> Como responsable de marketing, quiero que todas las páginas del sitio tengan un título consistente con el nombre de la tienda, para reforzar la marca en resultados de búsqueda y pestañas del navegador.

**Estimación:** S (1 punto)  
**Módulo:** `apps/web/src/app/layout.tsx`, `packages/database/src/queries/store-config.ts`  
**Estado:** ✅ Completado (v1)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `layout.tsx` exporta `generateMetadata` | `title.template: '%s — [store_name]'`; fallback `title.default` cuando la página no define título |
| AC-2 | `store_name` se lee desde `store_config` | Cambiar el nombre en admin actualiza el template sin redeploy (ISR) |
| AC-3 | Página de producto | Título: "Café Etiopía Yirgacheffe — Merkiai" |
| AC-4 | Página de inicio | Título default de `store_config.store_description` o nombre de la tienda |

---

### HU-071 — Metadatos dinámicos por producto y artículo de blog

> Como responsable de SEO, quiero que cada página de producto y cada artículo del blog tenga un título, descripción y palabras clave únicos generados desde la base de datos, para maximizar la indexación individual de cada URL.

**Estimación:** M (3 puntos)  
**Módulo:** `apps/web/src/app/shop/[slug]/page.tsx`, `apps/web/src/app/blog/[slug]/page.tsx`  
**Estado:** ✅ Completado (v1 + v12)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Página de producto con `seo_title` definido en BD | `<title>` usa `seo_title`; fallback al nombre del producto |
| AC-2 | Página de producto con `seo_description` | `<meta name="description">` usa el campo; fallback a `description` |
| AC-3 | Artículo de blog | `generateMetadata` extrae título y excerpt del artículo |
| AC-4 | Slug no encontrado | `notFound()` retornado; no se genera metadata |
| AC-5 | Páginas del CMS (`[slug]`) | `generateMetadata` lee `pages.seo_title` y `pages.seo_description` |

---

### HU-072 — ISR en tienda y blog

> Como visitante, quiero que las páginas de catálogo y blog carguen rápido aunque el inventario se actualice frecuentemente, sin sacrificar datos frescos.

**Estimación:** S (1 punto)  
**Módulo:** `apps/web/src/app/shop/page.tsx`, `apps/web/src/app/blog/page.tsx`  
**Estado:** ✅ Completado (v1)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `/shop` tiene `revalidate = 60` | Página cacheada 60s; se regenera en background tras la primera visita post-expiración |
| AC-2 | `/blog` tiene `revalidate = 60` | Ídem |
| AC-3 | Admin publica nuevo producto | El cambio es visible en la tienda tras máximo 60s sin redeploy |
| AC-4 | Admin publica artículo | Visible en `/blog` tras máximo 60s |

---

### HU-073 — Generación estática de rutas de producto y blog

> Como equipo técnico, queremos que las páginas de producto y artículo individuales sean pre-renderizadas en build time para máxima performance y SEO.

**Estimación:** S (1 punto)  
**Módulo:** `apps/web/src/app/shop/[slug]/page.tsx`, `apps/web/src/app/blog/[slug]/page.tsx`  
**Estado:** ✅ Completado (v1)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `generateStaticParams` en `/shop/[slug]` | Todos los slugs de productos activos pre-renderizados en build |
| AC-2 | `generateStaticParams` en `/blog/[slug]` | Todos los artículos publicados pre-renderizados en build |
| AC-3 | Producto creado después del build | Se sirve en runtime con ISR (`dynamicParams = true` por defecto) |
| AC-4 | Producto inactivo | No incluido en `generateStaticParams`; 404 si se accede directamente |

---

### HU-074 — Sitemap.xml dinámico

> Como responsable de SEO, quiero que el sitio genere automáticamente un sitemap.xml con todas las URLs indexables para que los motores de búsqueda descubran todas las páginas eficientemente.

**Estimación:** S (2 puntos)  
**Módulo:** `apps/web/src/app/sitemap.ts`  
**Estado:** ✅ Completado (v3)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | GET `/sitemap.xml` | Responde con XML válido; `Content-Type: application/xml` |
| AC-2 | Incluye URLs estáticas | `/`, `/shop`, `/blog`, `/maquila`, `/asesorias`, `/nosotros` |
| AC-3 | Incluye productos activos | `/shop/[slug]` por cada producto con `is_active = true` |
| AC-4 | Incluye artículos publicados | `/blog/[slug]` por cada artículo con `published = true` |
| AC-5 | `lastmod` de productos | Toma `updated_at` del producto |
| AC-6 | Nuevo producto añadido desde admin | Aparece en el sitemap sin redeploy (ISR o `no-store`) |

---

### HU-075 — robots.txt

> Como responsable de SEO, quiero un archivo robots.txt que permita la indexación del sitio público y bloquee el panel de administración, para proteger rutas privadas y no desperdiciar crawl budget.

**Estimación:** XS (1 punto)  
**Módulo:** `apps/web/public/robots.txt` o `apps/web/src/app/robots.ts`  
**Estado:** ✅ Completado (v3)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | GET `/robots.txt` | Responde con texto válido |
| AC-2 | `User-agent: *` con `Allow: /` | Todo el sitio público indexable |
| AC-3 | `Disallow` para rutas de API | `/api/` bloqueado para crawlers |
| AC-4 | Referencia a sitemap | `Sitemap: https://[dominio]/sitemap.xml` |

---

### HU-076 — Open Graph y Twitter Card por página

> Como responsable de marketing, quiero que al compartir cualquier página del sitio en redes sociales se muestre una imagen previa, título y descripción atractivos, para aumentar el CTR de los enlaces compartidos.

**Estimación:** S (2 puntos)  
**Módulo:** `apps/web/src/app/layout.tsx`, páginas individuales  
**Estado:** ✅ Completado (v3)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Layout global exporta `openGraph` | `og:site_name`, `og:type: website`, imagen por defecto del sitio |
| AC-2 | Página de producto | `og:title`, `og:description`, `og:image` con la imagen del producto |
| AC-3 | Artículo de blog | `og:title` del artículo; `og:image` con imagen de portada |
| AC-4 | `twitter:card: summary_large_image` | Presente en todas las páginas con imagen |
| AC-5 | Compartir en WhatsApp/Slack | Preview correcto con imagen, título y descripción |

---

### HU-077 — Optimización de imágenes con next/image

> Como visitante, quiero que las imágenes del sitio carguen rápido y en el formato más eficiente para mi dispositivo, sin sacrificar calidad visual.

**Estimación:** M (3 puntos)  
**Módulo:** `apps/web/src/components/`, `apps/web/next.config.ts`  
**Estado:** ✅ Completado (v4)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Imágenes de producto | Componente `<Image>` con `sizes` responsive; formato WebP servido por Next.js |
| AC-2 | Imágenes de Supabase Storage | Dominio de Supabase en `next.config.ts → images.remotePatterns` |
| AC-3 | Hero carrusel | `priority={true}` en el primer slide; lazy load en los demás |
| AC-4 | LCP (Largest Contentful Paint) | Hero principal sin CLS; imagen visible antes del scroll |
| AC-5 | Imágenes con `alt` descriptivo | Todo `<Image>` tiene `alt` no vacío; accesibilidad garantizada |

---

### HU-078 — Analytics con Vercel Analytics

> Como propietario del negocio, quiero ver cuántas visitas tiene el sitio, qué páginas son las más visitadas y de dónde vienen los usuarios, para tomar decisiones de marketing basadas en datos reales.

**Estimación:** XS (1 punto)  
**Módulo:** `apps/web/src/app/layout.tsx`, `apps/web/package.json`  
**Estado:** ✅ Completado (v4)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `@vercel/analytics` instalado y `<Analytics />` en layout | Eventos de pageview enviados automáticamente en producción |
| AC-2 | Dashboard de Vercel | Visitas, páginas únicas, fuentes de tráfico, Web Vitals visibles |
| AC-3 | Desarrollo local | Analytics deshabilitado o en modo sandbox; no contamina datos de producción |
| AC-4 | Sin cookies de seguimiento | Vercel Analytics es cookieless; sin banner de GDPR necesario |

---

## Detalle · Proveedores intercambiables *(DISUELTA en v2 → E6/E7/E8; histórico: "Épica 15")*

> ⚠️ **Estados obsoletos:** los "🔲 Pendiente" de las HU de esta sección histórica **no reflejan el estado real** (se escribieron antes de implementarse). El estado vigente está en la **tabla de la Épica 15** más arriba y en el **Resumen de Cobertura** (todas ✅ salvo PRV-07 🟡). Esta sección se conserva solo como registro del diseño.

> **Contexto:** refactorización para que envíos, pasarelas de pago y email usen interfaces abstractas con una implementación activa a la vez. Permite agregar nuevos proveedores (Coordinadora, Tu Compra, SendGrid) sin tocar el flujo existente. Las tres áreas comparten el mismo patrón: interfaz → implementaciones concretas → selector en admin → único proveedor activo visible al cliente.

---

### HU-082 — Interfaz ShippingProvider y refactor de Skydropx

> Como desarrollador, quiero que el módulo de envíos esté abstraído detrás de una interfaz `ShippingProvider`, para que agregar un nuevo proveedor (ej. Coordinadora) solo requiera implementar esa interfaz sin tocar el flujo de checkout.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database/src/providers/shipping/`, `apps/web/src/app/api/shipping/`
**Estado:** 🔲 Pendiente
**Prerequisito de:** HU-083, HU-084

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `ShippingProvider` definida | Métodos: `calculateRate(cart, address): Promise<ShippingRate[]>` y `createShipment(order): Promise<Shipment>` |
| AC-2 | `SkydropxProvider` implementa la interfaz | Lógica actual de cotización y creación de guía encapsulada en la clase concreta |
| AC-3 | `FixedPriceProvider` implementa la interfaz | `calculateRate()` devuelve la tarifa fija configurada; `createShipment()` es no-op |
| AC-4 | Factory `getShippingProvider(config)` | Lee `shipping_config.provider` y devuelve la instancia correcta |
| AC-5 | `tsc --noEmit` sin errores | Tipos estrictos en toda la cadena |
| AC-6 | Tests unitarios de `SkydropxProvider` y `FixedPriceProvider` | Cubren `calculateRate` con mocks de la API externa |

**Criterios de rechazo:**
- La lógica de Skydropx queda dispersa fuera de la clase concreta.

---

### HU-083 — Selector excluyente de proveedor de envíos en admin

> Como administrador, quiero elegir entre "Precio fijo" y las integraciones disponibles (ej. Skydropx) como método de cálculo de envío de forma excluyente, para que nunca estén activos dos métodos al mismo tiempo.

**Estimación:** S (2 puntos)
**Módulo:** `packages/database/supabase/migrations/`, `apps/admin/src/app/configuracion/envios/`
**Estado:** 🔲 Pendiente
**Bloqueada por:** HU-082

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `shipping_config` tiene campo `provider TEXT` | Valores válidos: `'fixed'`, `'skydropx'`; default `'fixed'`; CHECK constraint |
| AC-2 | Admin abre `/configuracion/envios` | Radio buttons: "Precio fijo" y "Skydropx"; solo uno seleccionado a la vez |
| AC-3 | Admin selecciona "Precio fijo" | Muestra solo el campo de tarifa fija; credenciales Skydropx ocultas |
| AC-4 | Admin selecciona "Skydropx" | Muestra campos de credenciales Skydropx; tarifa fija oculta |
| AC-5 | Guardar configuración | `provider` actualizado en BD; campo anterior no afecta el cálculo |
| AC-6 | Migración idempotente | Rows existentes reciben `provider = 'skydropx'` si tienen credenciales, `'fixed'` si no |

---

### HU-084 — Checkout calcula envío con el proveedor activo

> Como comprador, quiero que el costo de envío se calcule con el método que haya configurado el administrador, sin que el sistema mezcle tarifas fijas con tarifas de API.

**Estimación:** S (2 puntos)
**Módulo:** `apps/web/src/app/api/shipping/quote/route.ts`
**Estado:** 🔲 Pendiente
**Bloqueada por:** HU-082, HU-083

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `provider = 'fixed'` configurado | Checkout muestra una única tarifa con el precio fijo; sin llamada a API externa |
| AC-2 | `provider = 'skydropx'` configurado | Checkout llama a Skydropx y muestra las opciones reales de tarifa |
| AC-3 | API externa de Skydropx falla | Error manejado; mensaje al usuario; no expone detalles técnicos |
| AC-4 | Envío gratis configurado y subtotal suficiente | Aplica independientemente del proveedor activo |
| AC-5 | `provider` no está definido en BD | Fallback a `'fixed'` con tarifa cero; no rompe el checkout |

---

### HU-085 — Interfaz PaymentGateway y refactor de Wompi y MercadoPago

> Como desarrollador, quiero que cada pasarela de pago implemente una interfaz `PaymentGateway` común, para poder agregar nuevas pasarelas (ej. Tu Compra) sin modificar el flujo de checkout ni los webhooks existentes.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database/src/providers/payment/`, `apps/web/src/app/api/checkout/`
**Estado:** 🔲 Pendiente
**Prerequisito de:** HU-086, HU-087, HU-088

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `PaymentGateway` definida | Métodos: `createPayment(order, config): Promise<PaymentResult>` y `verifyWebhook(req): Promise<WebhookEvent>` |
| AC-2 | `WompiGateway` implementa la interfaz | Lógica actual de hosted checkout y verificación de webhook encapsulada |
| AC-3 | `MercadoPagoGateway` implementa la interfaz | Lógica actual de preference y webhook encapsulada |
| AC-4 | Factory `getPaymentGateway(name, config)` | Recibe el nombre de la pasarela y devuelve la instancia correcta |
| AC-5 | Rutas `/api/checkout` y `/api/webhooks/*` usan la factory | Sin lógica condicional `if wompi / else mercadopago` en los handlers |
| AC-6 | `tsc --noEmit` sin errores | Tipos estrictos; `PaymentResult` y `WebhookEvent` tipados |

---

### HU-086 — Toggle por pasarela de pago en admin

> Como administrador, quiero habilitar o deshabilitar cada pasarela de pago (Wompi, MercadoPago, Tu Compra) de forma independiente, para controlar cuál se ofrece al comprador sin tener que eliminar credenciales.

**Estimación:** S (2 puntos)
**Módulo:** `packages/database/supabase/migrations/`, `apps/admin/src/app/configuracion/pagos/`
**Estado:** 🔲 Pendiente
**Bloqueada por:** HU-085

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `payment_config` tiene campos `wompi_enabled`, `mercadopago_enabled`, `tucompra_enabled` (BOOLEAN DEFAULT false) | Migración aplica sin errores |
| AC-2 | Admin abre `/configuracion/pagos` | Cada pasarela tiene un toggle independiente + sección de credenciales colapsable |
| AC-3 | Admin activa Wompi | `wompi_enabled = true`; sección de credenciales Wompi visible y requerida |
| AC-4 | Admin desactiva MercadoPago | `mercadopago_enabled = false`; pasarela no aparece en checkout aunque tenga credenciales |
| AC-5 | Ninguna pasarela activa | Admin ve advertencia: "El checkout no tendrá método de pago disponible" |
| AC-6 | Al menos una pasarela debe tener credenciales si está activa | Validación antes de guardar; mensaje de error claro |

---

### HU-087 — Checkout muestra solo las pasarelas activas

> Como comprador, quiero ver en el checkout únicamente las pasarelas de pago que el administrador haya habilitado, para no confundirme con opciones no disponibles.

**Estimación:** S (2 puntos)
**Módulo:** `apps/web/src/app/(public)/checkout/`
**Estado:** 🔲 Pendiente
**Bloqueada por:** HU-085, HU-086

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Solo Wompi activa | Checkout muestra únicamente "Pagar con Wompi"; sin selector de pasarela |
| AC-2 | Wompi y MercadoPago activas | Checkout muestra radio buttons para elegir entre las dos |
| AC-3 | Las tres pasarelas activas | Checkout muestra las tres opciones |
| AC-4 | Cero pasarelas activas | Checkout muestra mensaje: "No hay método de pago disponible; contacta a la tienda" |
| AC-5 | API `/api/checkout` valida que la pasarela recibida esté activa | 400 si el cliente envía una pasarela deshabilitada |

---

### HU-088 — Integración Tu Compra como tercera pasarela de pago

> Como administrador, quiero poder configurar Tu Compra e integrarlo como opción de pago, para ofrecer una alternativa local a los compradores colombianos.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database/src/providers/payment/TuCompraGateway.ts`, `apps/web/src/app/api/webhooks/tucompra/`
**Estado:** ⛔ **REEMPLAZADA por HU-188.** Describía el modelo antiguo (`tucompra_merchant_id`/`secret_key`, redirección a "página de pago de Tu Compra", firma **HMAC**) que **no corresponde** a la API REST integrador. Ver HU-188 (a–e).
**Bloqueada por:** HU-085, HU-086

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `payment_config` tiene campos `tucompra_merchant_id`, `tucompra_secret_key`, `tucompra_sandbox` | Migración aplica; campos opcionales |
| AC-2 | Admin configura credenciales y activa Tu Compra | Toggle + formulario de credenciales en `/configuracion/pagos` |
| AC-3 | Comprador selecciona Tu Compra en checkout | `POST /api/checkout` con `gateway: 'tucompra'` → redirige a página de pago de Tu Compra |
| AC-4 | Tu Compra notifica pago aprobado por webhook | `POST /api/webhooks/tucompra` → orden marcada como pagada; email de confirmación enviado |
| AC-5 | Tu Compra notifica pago rechazado | Orden permanece `pending`; comprador puede reintentar |
| AC-6 | Modo sandbox activado | Las llamadas van al entorno de pruebas de Tu Compra |
| AC-7 | Verificación de firma HMAC del webhook | Requests sin firma válida devuelven 401 |

**Criterios de rechazo:**
- El webhook acepta eventos sin verificar la firma.

---

### HU-089 — Interfaz EmailProvider y refactor de Resend

> Como desarrollador, quiero que el módulo de email esté abstraído detrás de una interfaz `EmailProvider`, para que cambiar de Resend a SendGrid o Mailgun no requiera modificar los callers del negocio.

**Estimación:** S (2 puntos)
**Módulo:** `packages/database/src/providers/email/`, `packages/database/src/lib/email.ts`
**Estado:** 🔲 Pendiente
**Prerequisito de:** HU-090

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `EmailProvider` definida | Método único: `send({ from, to, subject, html }): Promise<void>` |
| AC-2 | `ResendProvider` implementa la interfaz | Lógica actual de `fetch` a la API de Resend encapsulada en la clase |
| AC-3 | Factory `getEmailProvider(config)` | Lee `store_config.email_provider` y devuelve la instancia correcta; default `'resend'` |
| AC-4 | Todas las funciones en `lib/email.ts` usan la factory | `sendOrderConfirmation`, `sendShippingNotification`, etc. no referencian Resend directamente |
| AC-5 | `tsc --noEmit` sin errores | Tipos estrictos en toda la cadena |
| AC-6 | Test unitario de `ResendProvider` | Mock del `fetch` verifica que construye el payload correcto para la API de Resend |

---

### HU-090 — Selector de proveedor de email activo en admin

> Como administrador, quiero seleccionar el proveedor de email activo desde `/configuracion/email`, para poder cambiar de Resend a otro servicio sin tocar código.

**Estimación:** S (2 puntos)
**Módulo:** `apps/admin/src/app/configuracion/email/`, `packages/database/supabase/migrations/`
**Estado:** 🔲 Pendiente
**Bloqueada por:** HU-089

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `store_config` tiene campo `email_provider TEXT DEFAULT 'resend'` | Migración aplica; CHECK constraint con valores válidos conocidos |
| AC-2 | Admin abre `/configuracion/email` | Selector de proveedor (actualmente solo "Resend"); sección de credenciales del proveedor seleccionado |
| AC-3 | Proveedor `resend` seleccionado | Muestra campos `resend_api_key`, `resend_from_email`, `resend_from_name` |
| AC-4 | Nuevo proveedor agregado en el futuro | Solo requiere: nueva `XxxProvider` class + nueva opción en el selector + campos de credenciales |
| AC-5 | Guardar sin credenciales del proveedor activo | Validación: campos requeridos del proveedor seleccionado no pueden estar vacíos |
| AC-6 | `getEmailProvider()` lee el campo en cada envío | Cambio de proveedor en admin efectivo en el próximo email sin redeploy |

---

## Detalle · E6 — Pagos: pasarela única, Bold, validación manual y fallback  *(histórico: "Épica 16")*

> **Contexto:** v16 (agosto 2026) — la configuración de pagos se reorganiza con la misma lógica de "Proveedor activo" de envíos (una sola pasarela activa a la vez), se refuerza la seguridad del checkout para que la pasarela se derive del servidor, se integra **Bold** como cuarta pasarela, y el panel muestra las URLs de webhook de cada pasarela para facilitar su configuración en las cuentas.

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| HU-091 | Pasarela de pago única (`active_provider`): solo una activa a la vez; espejo de `shipping_config.provider` | Alta | ✅ |
| HU-092 | Seguridad del checkout: la pasarela se deriva del servidor (`active_provider`), no del cliente; opción "ninguna" → pedido manual pendiente de validación | Alta | ✅ |
| HU-093 | Integración de **Bold** como pasarela de pago (API link de pagos + webhook HMAC-SHA256) | Alta | ✅ |
| HU-094 | Mostrar en el panel las URLs de webhook de cada pasarela (base por env) para configurarlas en las cuentas | Media | ✅ |
| HU-095 | Reconciliación de pagos Bold por fallback (consulta de estado por referencia) cuando el webhook no llega | Media | ✅ |
| HU-096 | Validación manual del pago por el administrador (confirmar/rechazar) para pedidos sin pasarela en línea | Alta | ✅ |

---

### HU-091 — Pasarela de pago única (`active_provider`)

> Como administrador, quiero que solo una pasarela de pago pueda estar activa a la vez (igual que el proveedor de envíos), para tener un flujo de cobro claro y sin ambigüedad sobre cuál cobra.

**Estimación:** M (5 puntos)
**Módulo:** `payment_config.active_provider`, `providers/payment/index.ts`, `PaymentConfigForm.tsx`, `/api/admin/payment-config`
**Estado:** ✅ Completado (v16)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Migración añade `active_provider TEXT DEFAULT 'none'` con CHECK (`none`,`wompi`,`mercadopago`,`tucompra`,`bold`) y elimina los booleanos `*_active` | Back-fill desde los booleanos previos; esquema canónico actualizado |
| AC-2 | Admin selecciona una pasarela en el selector "Proveedor activo" | Solo esa queda activa; las demás inactivas automáticamente |
| AC-3 | Activar una pasarela sin credenciales completas | `PATCH` responde 400 con lista `missing` (igual que envíos) |
| AC-4 | `getActiveProvider(config)` es *fail-closed* | Si la pasarela activa no tiene credenciales → devuelve `'none'` |
| AC-5 | `getPaymentGateway` valida contra `active_provider` | Solo instancia la pasarela marcada activa |

---

### HU-092 — Seguridad del checkout y modo manual

> Como responsable de seguridad, quiero que el checkout nunca confíe en el método de pago que envía el cliente y que, si no hay pasarela activa, el pedido quede pendiente de validación manual, para impedir que se creen pedidos saltándose el medio de pago.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web/src/app/api/checkout/route.ts`, `CheckoutClient.tsx`, `/api/checkout/gateways`
**Estado:** ✅ Completado (v16)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente envía `payment_method` distinto a la pasarela activa | El servidor ignora el valor del cliente y usa `getActiveProvider()` |
| AC-2 | `active_provider = 'none'` | El pedido se crea con `payment_method: 'manual'` y `payment_status: 'pending'`; sin `payment_url` |
| AC-3 | Checkout en modo manual | La UI muestra "Pago coordinado con la tienda"; redirige a confirmación con `?manual=1` |
| AC-4 | El pago manual solo se confirma por acción del administrador | Ningún POST público puede marcar el pedido como pagado |
| AC-5 | `/api/checkout/gateways` sin pasarela activa | Devuelve `{ gateways: [], manual: true }` (nunca inventa una pasarela) |

---

### HU-093 — Integración de Bold como pasarela de pago

> Como comprador, quiero poder pagar con **Bold** (tarjeta, PSE, Nequi, Botón Bancolombia) cuando la tienda lo tenga activo, para usar la pasarela colombiana de mi preferencia.

**Estimación:** L (8 puntos)
**Módulo:** `providers/payment/BoldGateway.ts`, `/api/webhooks/bold`, `payment_config.bold_*`, `PaymentConfigForm.tsx`
**Referencia API:** https://developers.bold.co/pagos-en-linea/api-integration · https://developers.bold.co/webhook
**Estado:** ✅ Completado (v16) — `BoldGateway` + webhook con HMAC-SHA256 + idempotencia; tests `bold-gateway.test.ts` (10) y `webhook-bold.integration.test.ts` (5)

**Notas de la API (link de pagos):**
- Auth: header `Authorization: x-api-key <api_key>`; base `https://integrations.api.bold.co`.
- Crear link: `POST /online/link/v1` con `amount_type: 'CLOSE'`, `amount.total_amount` (COP, no centavos), `description`, `callback_url`, `payer_email`, `metadata.reference` (= nuestro `order_number`). Respuesta: `payload.url` (a donde se redirige al cliente).
- Webhook: `POST` con firma **HMAC-SHA256 hex de base64(body)** usando la *llave secreta*, comparada contra el header `x-bold-signature`. En **sandbox la llave secreta es un string vacío**. Debe responder `200` en < 2 s. Eventos: `SALE_APPROVED`, `SALE_REJECTED`, `VOID_APPROVED`, `VOID_REJECTED`. Reintentos hasta 5 veces → requiere idempotencia. Correlación del pedido por `data.metadata.reference`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `payment_config` tiene `bold_api_key`, `bold_secret_key`, `bold_sandbox`; `active_provider` acepta `'bold'` | Migración + `types.ts` + CHECK actualizados |
| AC-2 | `BoldGateway.createPaymentUrl()` | `POST /online/link/v1` con `amount_type:'CLOSE'`, total en COP, `callback_url` a confirmación con `?order=`, `metadata.reference = order_number`; devuelve `payload.url` |
| AC-3 | Webhook con firma válida y `type = SALE_APPROVED` | Verifica HMAC-SHA256(base64(body)); actualiza `payment_status = 'paid'` del pedido de `metadata.reference`; dispara guía + email |
| AC-4 | Webhook con firma inválida | Responde 401 y no toca ningún estado |
| AC-5 | Webhook duplicado (reintento) para un pedido ya pagado | Responde 200 sin volver a procesar (idempotencia) |
| AC-6 | `bold_sandbox = true` | La verificación de firma usa llave secreta vacía (según docs de pruebas de Bold) |
| AC-7 | Bold como pasarela activa en checkout | El cliente es redirigido a `payload.url`; el `payment_method` del pedido queda `'bold'` |
| AC-8 | `getActiveProvider` con Bold activo pero sin `bold_api_key`/`bold_secret_key` | Devuelve `'none'` (fail-closed) |

---

### HU-094 — URLs de webhook por pasarela en el panel

> Como administrador, quiero ver en la configuración de pagos la URL de webhook de cada pasarela (y copiarla), para pegarla fácilmente en la cuenta de la pasarela sin adivinar el formato.

**Estimación:** S (3 puntos)
**Módulo:** `PaymentConfigForm.tsx`, `apps/admin/.../pagos/page.tsx`, env `NEXT_PUBLIC_SITE_URL`
**Estado:** ✅ Completado (v16) — componente `WebhookUrl` por pasarela (Wompi, MercadoPago, Tu Compra, Bold) con URL copiable basada en `NEXT_PUBLIC_SITE_URL`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cada sección de pasarela muestra su URL de webhook | `${NEXT_PUBLIC_SITE_URL}/api/webhooks/<provider>` (donde viven los handlers), copiable con un clic |
| AC-2 | La base de la URL está generalizada por variable de entorno | No hay dominios hardcodeados; cambiar el env cambia todas las URLs mostradas |
| AC-3 | Si el env no está configurado | Se muestra un placeholder claro (ej. `https://tu-dominio.com/api/webhooks/bold`) e indicación de configurarlo |
| AC-4 | Bold requiere registrar el webhook en su Panel de Comercios | La UI muestra la URL + nota de dónde registrarla; para MercadoPago/Wompi/Tu Compra igual |
| AC-5 | Seguridad | Solo se muestra la URL pública del endpoint; nunca se exponen secrets ni llaves en el HTML |

---

### HU-095 — Reconciliación de pagos Bold por fallback (consulta de estado)

> Como operador de la tienda, quiero poder reconciliar el estado real de un pago de Bold cuando el webhook no llega (Bold advierte hasta 10 min de demora en link de pagos), consultando el servicio de fallback de Bold por la referencia del pedido, para que ningún pago aprobado se quede sin reflejar sin depender exclusivamente del webhook.

**Estimación:** M (5 puntos)
**Módulo:** `providers/payment/BoldGateway.ts` (`queryStatusByReference`), `apps/web/src/lib/bold-reconcile.ts`, `/api/checkout/bold/reconcile`, `/api/admin/orders/[id]/reconcile-bold`, `apps/web/checkout/confirmation`, detalle de pedido en admin
**Referencia API:** `GET https://integrations.api.bold.co/payments/webhook/notifications/{payment_id}?is_external_reference=true`
**Estado:** ✅ Completado (v16) — `queryStatusByReference` + `reconcileBoldOrder`; endpoint público rate-limited invocado en confirmación; endpoint admin + botón "Verificar pago con Bold"; tests en `bold-gateway.test.ts` (13) y `bold-reconcile.test.ts` (5)

**Notas de la API (servicio de fallback):**
- Endpoint: `GET /payments/webhook/notifications/<ref>` con header `Authorization: x-api-key <api_key>`.
- Con `is_external_reference=true` se busca por la **referencia externa** (nuestro `order_number`, enviado como `metadata.reference`), sin necesidad de guardar el ID de Bold.
- Respuesta: `{ notifications: [ … ] }` (máx. 10), cada una con la misma estructura del webhook (`type`, `subject`, `data.metadata.reference`, `data.payment_id`).
- **Uso solo como respaldo**, no como fuente principal (Bold puede bloquear la integración por exceso de peticiones).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `BoldGateway.queryStatusByReference(order_number)` | Llama al fallback con `is_external_reference=true` y `Authorization: x-api-key`; devuelve el estado mapeado (prioriza `SALE_APPROVED`) o `null` si no hay notificaciones |
| AC-2 | Reconciliar un pedido Bold en estado `pending` que Bold reporta aprobado | Actualiza `payment_status='approved'`, `status='processing'`; dispara email + guía de envío (idempotente, misma lógica que el webhook) |
| AC-3 | Reconciliar un pedido ya `approved` | No reprocesa; responde con el estado actual (idempotencia) |
| AC-4 | Reconciliar un pedido cuyo `payment_method` no es `bold` | No hace nada; responde sin cambios (no aplica) |
| AC-5 | Seguridad — el estado proviene solo de la API autenticada de Bold | El endpoint nunca acepta el estado desde el cliente; solo actúa sobre pedidos `bold` en estado `pending` |
| AC-6 | Endpoint público de confirmación | `POST /api/checkout/bold/reconcile` está **rate-limited** por IP; la página de confirmación lo invoca **una vez** si el pedido es `bold` + `pending` |
| AC-7 | Acción manual del administrador | Botón "Verificar pago con Bold" en el detalle del pedido → `POST /api/admin/orders/[id]/reconcile-bold` (guard admin) reconcilia y refresca el estado |
| AC-8 | Bold no configurado o sin `api_key` | Responde de forma segura sin error 500 hacia el usuario; el pedido permanece `pending` |

---

### HU-096 — Validación manual del pago por el administrador

> Como operador de la tienda, quiero confirmar o rechazar manualmente el pago de un pedido que no pasó por una pasarela en línea (opción "Ninguna" → pago `manual`), para que el pedido avance a preparación solo cuando yo verifique que el pago se recibió.

**Estimación:** M (5 puntos)
**Módulo:** `/api/admin/orders/[id]/payment-status`, `apps/admin/.../pedidos/[id]/PaymentStatusValidator.tsx`, `packages/database/src/lib/email.ts` (`sendPaymentConfirmed`)
**Estado:** ✅ Completado (v16) — ruta con guard admin, botones Confirmar/Rechazar en el detalle, email `sendPaymentConfirmed`; tests `payment-status.integration.test.ts` (5) + `sendPaymentConfirmed` en `email.test.ts`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido `manual`/`pending` en el detalle | Se muestran botones "Confirmar pago" y "Rechazar pago" |
| AC-2 | El operador confirma el pago | `PATCH /api/admin/orders/[id]/payment-status` con `{payment_status:'approved'}` → `payment_status='approved'`, `status='processing'` |
| AC-3 | Al confirmar | Se envía al cliente un email "pago confirmado" (fire-and-forget, no bloquea) |
| AC-4 | El operador rechaza el pago | `payment_status='rejected'`; el estado de fulfillment no avanza |
| AC-5 | Seguridad | Ruta protegida con `getAdminUser()` (super_admin/admin/vendedor); solo acepta `approved`/`rejected`; nunca desde el sitio público |
| AC-6 | Idempotencia | Confirmar un pedido ya `approved` no rompe ni reenvía efectos innecesarios |
| AC-7 | Pedido con pasarela en línea (wompi/bold/…) | El control manual sigue disponible como respaldo del operador, pero el flujo normal lo confirma vía webhook |

---

## Detalle · E9 — Control de inventario y stock  *(histórico: "Épica 17")*

> **Contexto (bug reportado, ago-2026):** el campo `product_variants.stock` existe pero **nunca se descuenta** — no hay lógica de inventario en checkout, webhooks ni validación manual. Además el frontend permite agregar al carrito más unidades de las que hay en stock (el selector de cantidad no tiene tope). Se añade también un control por producto para permitir/impedir vender sin stock (backorder).

> **Decisión de diseño:** el stock se descuenta **al aprobarse el pago** (no al crear la orden), para no bloquear inventario por pagos abandonados; el checkout valida stock por adelantado para no prometer lo que no hay. El descuento es **atómico** (RPC SQL) e **idempotente** (solo en la transición `pending → approved`). El servidor es la autoridad; el frontend solo mejora la UX.

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| HU-097 | Campo `allow_backorder` en productos (permitir vender sin stock) | Alta | ✅ |
| HU-098 | Descuento y reposición de stock según el estado del pago (atómico e idempotente) + validación en checkout | Alta | ✅ |
| HU-099 | Límites de stock en el frontend — página de producto y store del carrito | Media | ✅ |
| HU-100 | Guardas de stock en **todos** los puntos de "Agregar al carrito" (quick-add en /shop y home) + botón "+" del carrito | Media | ✅ |

---

### HU-097 — Permitir vender sin stock (`allow_backorder`) por producto

> Como administrador, quiero un checkbox por producto que permita o impida vender más unidades de las que hay en stock, para manejar productos bajo pedido o de fabricación continua sin bloquear la venta.

**Estimación:** S (3 puntos)
**Módulo:** migración `products.allow_backorder`, `types.ts`, `apps/admin/.../productos/ProductForm.tsx`
**Estado:** ✅ Completado (v16)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Migración añade `products.allow_backorder BOOLEAN NOT NULL DEFAULT false` | Aplica idempotente; disponible en `types.ts` y en las queries de producto |
| AC-2 | `ProductForm` muestra un checkbox "Permitir vender sin stock (bajo pedido)" | Se guarda y se recarga con su valor actual |
| AC-3 | `allow_backorder = false` (por defecto) | Ni el front ni el servidor permiten vender por encima del stock |
| AC-4 | `allow_backorder = true` | Se permite comprar aunque el stock sea 0 o insuficiente; no se bloquea |

---

### HU-098 — Descuento y reposición de stock según el estado del pago

> Como negocio, quiero que el stock se descuente cuando un pedido se paga y se reponga si se cancela o rechaza, de forma segura ante concurrencia, para que el inventario refleje siempre la realidad.

**Estimación:** L (8 puntos)
**Módulo:** RPC SQL `decrement_variant_stock`/`restore_variant_stock`, `apps/web/src/app/api/checkout/route.ts`, webhooks (wompi/mercadopago/tucompra/bold), `bold-reconcile.ts`, `apps/admin/.../orders/[id]/payment-status` y `.../status`
**Estado:** ✅ Completado (v16) — helper compartido `applyStockForOrder`/`restoreStockForOrder`; validación 409 en checkout; tests `stock.test.ts` (6) + caso 409 en `checkout.integration`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Checkout con stock insuficiente en una variante y `allow_backorder = false` | La orden **no** se crea; responde 409 con el detalle de la(s) variante(s) sin stock |
| AC-2 | Checkout con `allow_backorder = true` | Se permite crear la orden aunque no haya stock |
| AC-3 | Un pago pasa a `approved` (webhook Wompi/MP/Tu Compra/Bold, validación manual o reconcile) | Se descuenta el stock de cada variante de forma **atómica** vía RPC (`stock = stock - qty WHERE allow_backorder OR stock >= qty`) |
| AC-4 | El mismo webhook llega dos veces (reintento) | El stock se descuenta **una sola vez** (idempotente: solo en la transición `pending → approved`) |
| AC-5 | Carrera: dos pedidos compiten por la última unidad | El RPC atómico impide dejar stock negativo cuando `allow_backorder = false`; el segundo no descuenta de más |
| AC-6 | Una orden ya `approved` se cancela o su pago se rechaza | Se **repone** el stock descontado (una sola vez) |
| AC-7 | Descuento con `allow_backorder = true` | Se permite y el stock puede quedar en negativo (indicador de faltante para el operador) |

---

### HU-099 — Límites de stock en el frontend

> Como comprador, no quiero poder agregar al carrito más unidades de las disponibles (salvo productos bajo pedido), para no crear pedidos que la tienda no puede cumplir.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web/src/components/shop/ProductDetail.tsx`, `store/cart.ts`, carrito
**Estado:** ✅ Completado (v16) — tope de cantidad en PDP (deshabilita "+" al llegar al stock), "Agotado", `clampQty` en el store del carrito

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selector de cantidad en la página de producto | El máximo es el stock disponible de la variante seleccionada (salvo `allow_backorder`) |
| AC-2 | Variante con stock 0 y sin backorder | Botón "Agregar" deshabilitado; se muestra "Agotado" |
| AC-3 | Intento de subir cantidad en el carrito por encima del stock | Se topa al stock disponible y se avisa ("Máximo N disponibles"), salvo backorder |
| AC-4 | Producto con `allow_backorder = true` | No hay tope de cantidad; puede comprarse sin stock |
| AC-5 | El límite del front es solo UX | La autoridad es el servidor (HU-098); el checkout igual valida y puede rechazar |
| AC-6 | Cambiar de variante con la cantidad por encima del stock de la nueva | La cantidad se re-ajusta al stock de la variante seleccionada (no queda por encima) |

> **Nota:** HU-099 cubrió la PDP (`ProductDetail`) y el `clampQty` del store. Los otros puntos de "Agregar al carrito" (quick-add en /shop y home) y el botón "+" del carrito se completan en **HU-100**.

---

### HU-100 — Guardas de stock en todos los puntos de "Agregar al carrito"

> Como comprador, no quiero poder agregar al carrito un producto agotado desde la tienda o el home, ni subir la cantidad en el carrito por encima del stock, para que el carrito siempre refleje lo que la tienda puede cumplir.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web/src/components/shop/ShopClient.tsx` (ProductCard), `apps/web/src/components/home/FeaturedProducts.tsx`, `apps/web/src/app/cart/page.tsx`
**Estado:** ✅ Completado (v16) — quick-add en /shop y home con guarda "Agotado" + propagación de `stock`/`allowBackorder`; botón "+" del carrito deshabilitado al máximo con aviso; tests de clamp en `cart.test.ts` (4)

**Contexto:** el descuento (HU-098) y los topes de la PDP + store (HU-099) ya existen, pero el quick-add de `/shop` y del home agregaba sin validar stock y **sin propagar `stock`/`allowBackorder`** al ítem, por lo que el `clampQty` del carrito no podía topar.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Botón "Agregar" en `/shop` con variante única y stock 0 (sin backorder) | Botón deshabilitado / muestra "Agotado"; no agrega |
| AC-2 | Quick-add en `/shop` y en el home | El ítem del carrito incluye `stock` y `allowBackorder` de la variante/producto |
| AC-3 | Botón "+" en el carrito al alcanzar el stock (sin backorder) | Deshabilitado; se muestra "Máximo N disponibles" |
| AC-4 | Producto con `allow_backorder = true` | Sin restricción en quick-add ni en el carrito |
| AC-5 | Consistencia con HU-098 | El front solo mejora la UX; el checkout sigue validando (409) como autoridad |

---

