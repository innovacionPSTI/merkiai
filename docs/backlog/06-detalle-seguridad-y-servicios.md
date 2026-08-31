## Detalle · E14 — Seguridad transversal y hardening (HU-202…206)

> Refuerza la seguridad más allá de lo ya hecho (CSP básica + rate-limit HU-062 ✅; firmas/idempotencia/anti-subpago en webhooks ✅; PCI SAQ A HU-184…187; RLS). Cubre CORS, XSS, abuso, validación, secretos y dependencias. Todo **🔲 (roadmap)**.

### HU-202 — Política CORS + hardening de endpoints internos/API · E14
> Como plataforma, quiero una política CORS explícita y endpoints internos blindados, para no exponer APIs a orígenes no autorizados.

**Estimación:** M (5 puntos) · **Estado:** 🔶 Parcial — **hecho:** `hasInternalSecret` con comparación timing-safe + rechazo de `Origin` (deny navegador) en los `/api/internal` del console; host validado con charset estricto. Pendiente: allowlist CORS de APIs públicas.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CORS explícito | APIs públicas con allowlist de orígenes (incl. dominios propios de tenants, HU-174); por defecto **deny** cross-origin |
| AC-2 | Internos deny | `/api/internal/*` (console) rechazan cross-origin y navegador; solo server-to-server |
| AC-3 | Comparación segura | Secretos internos comparados con **timing-safe** (no `===`); host validado con charset estricto *(hecho para resolve-tenant)* |
| AC-4 | Métodos/headers | Sólo métodos/headers necesarios; sin comodines `*` con credenciales |

### HU-203 — CSP endurecida (nonce) + sanitización XSS de contenido · E14
> Como plataforma, quiero eliminar `unsafe-inline`/`unsafe-eval` y sanitizar el HTML de contenido, para cerrar la superficie XSS.

**Estimación:** L (8 puntos) · **Estado:** 🔶 Parcial — **hecho:** sanitización XSS del contenido de tenant en `markdownToHtml` (escape de HTML + `href` seguro contra `javascript:`/`data:`) + pruebas (`markdown.test.ts`). Pendiente: CSP con nonce (quitar `unsafe-inline`/`unsafe-eval`) y sanitizar cualquier otro HTML no-markdown.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CSP con nonce/hash | Reemplazar `'unsafe-inline'`/`'unsafe-eval'` por nonce/hash en las 3 apps (web/admin/console) |
| AC-2 | Sanitización | Contenido HTML de tenant (blog, páginas, legales, descripciones) renderizado con `dangerouslySetInnerHTML` pasa por **sanitizer** (DOMPurify/rehype-sanitize) |
| AC-3 | Headers en todas | Security headers (CSP, HSTS, X-Frame-Options, etc.) en web/admin/console y en dominios propios |
| AC-4 | Escapes | Interpolaciones en JSON-LD/estilos verificadas contra inyección |

### HU-204 — Rate limiting distribuido + anti-abuso · E14
> Como plataforma, quiero límites de tasa reales y protección anti-bot, para resistir fuerza bruta y abuso.

**Estimación:** L (8 puntos) · **Estado:** 🔲 Pendiente (roadmap) — reemplaza el rate-limit in-memory por-instancia actual

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Distribuido | Rate limit con store compartido (Upstash/Redis) para login, checkout, newsletter, webhooks y APIs |
| AC-2 | Anti-bot | Captcha/Turnstile en formularios públicos (registro, newsletter, contacto) |
| AC-3 | Brute-force | Backoff/bloqueo por credenciales fallidas (complementa Stack Auth) |
| AC-4 | Por tenant | Cuotas por tenant/plan (se conecta con entitlements HU-173) |

### HU-205 — Validación de entradas + CSRF · E14
> Como plataforma, quiero validar toda entrada en los bordes y proteger las mutaciones con sesión, para evitar inyección y CSRF.

**Estimación:** M (5 puntos) · **Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | zod en bordes | Todos los route handlers validan body/params con **zod**; rechazo 400 uniforme |
| AC-2 | Sin inyección | Filtros de Supabase/PostgREST nunca interpolan entrada sin validar *(fix aplicado en resolve-tenant)* |
| AC-3 | CSRF | Mutaciones autenticadas por cookie verifican origen/token; cookies `SameSite`/`HttpOnly`/`Secure` confirmadas |
| AC-4 | Uploads | Subida de medios valida mime, tamaño y extensión; nombres saneados |

### HU-206 — Gestión de secretos + escaneo de dependencias (SCA) · E14
> Como responsable, quiero rotación de secretos y escaneo continuo de dependencias, para reducir el riesgo de fuga y CVEs.

**Estimación:** M (5 puntos) · **Estado:** 🔲 Pendiente (roadmap) — extiende HU-184 (rotación de llaves de pago) a los demás secretos

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Rotación | Procedimiento de rotación para `INTERNAL_API_SECRET`, `SUPABASE_JWT_SECRET` y llaves de pasarela (HU-184) |
| AC-2 | SCA en CI | Escaneo de dependencias (Dependabot/Snyk) y alertas de CVE en el pipeline |
| AC-3 | Secret scanning | Detección de secretos en commits (pre-commit / GitHub) |
| AC-4 | Mínimo privilegio | Revisión de que ninguna llave sensible esté en `NEXT_PUBLIC_` ni en el cliente |

---

## Detalle · Preparación para extracción a servicios — endurecer el monolito modular (HU-195…199)

> **Decisión (ago-2026):** *de momento* la app sigue siendo un **monolito modular** (no se extraen microservicios todavía). Pero se adoptan **desde ahora** las prácticas que dejan la costura lista, para que una migración futura a servicios sea mecánica y no un refactor grande. Estas HU no cambian el despliegue actual; endurecen límites, datos, contexto y observabilidad. Todo **🔲 (roadmap)**.

### HU-195 — Endurecer límites de bounded contexts + contratos · E2

> Como arquitecto, quiero que cada dominio tenga una API pública explícita y contratos validados en sus bordes, para poder extraerlo a un servicio sin reescribir a sus consumidores.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (payments, shipping, email, billing, tenancy, inventory), contratos zod, lint de límites
**Estado:** 🔲 Pendiente (roadmap) — **fase actual: prioritario**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | API pública por dominio | Cada dominio expone solo su `index.ts`; prohibido importar internals de otro dominio (regla de lint/CI) |
| AC-2 | Contratos en los bordes | DTOs de entrada/salida validados con **zod** en las fronteras de cada dominio (base del futuro contrato de red) |
| AC-3 | Transporte-agnóstico | La lógica de dominio sigue sin depender de Next (ya se cumple); se mantiene como invariante verificado |
| AC-4 | Providers detrás de interfaz | El patrón interfaz+factory se aplica a **todos** los dominios de integración (pagos/email ya; añadir billing y shipping) |

---

### HU-196 — Capa de eventos de dominio + outbox (async) · E2

> Como plataforma, quiero publicar eventos de dominio de forma confiable (patrón outbox), para desacoplar reacciones (emails, reconcile, IA, webhooks salientes) y tener la línea de corte natural hacia servicios.

**Estimación:** L (8 puntos)
**Módulo:** bus de eventos interno + tabla `outbox`, despacho con reintentos; base para HU-136 (telemetría) y HU-165 (webhooks salientes)
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**; hoy no hay capa async

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Publicación confiable | Los cambios de estado (p. ej. `order.paid`, `shipment.created`) escriben un evento en `outbox` **en la misma transacción** que el cambio |
| AC-2 | Despacho | Un despachador entrega los eventos a los consumidores con reintentos/backoff e idempotencia (reusa `processed_webhook_events`) |
| AC-3 | Consumidores desacoplados | Email, reconcile e IA reaccionan a eventos en vez de llamadas in-process directas |
| AC-4 | Costura de servicio | El transporte de eventos es reemplazable por una cola externa (SQS/PubSub/Kafka) sin cambiar los productores/consumidores |
| AC-5 | Multi-tenant | Cada evento porta `tenant_id`; los consumidores fijan el contexto (HU-198) |

---

### HU-197 — Propiedad de datos por dominio (un dominio solo escribe sus tablas) · E2

> Como arquitecto, quiero que cada dominio sea dueño de sus tablas y que lo ajeno se consuma vía API/eventos, para evitar el "monolito distribuido" y permitir BD-por-dominio en el futuro.

**Estimación:** M (5 puntos)
**Módulo:** convención de propiedad de tablas + verificación, refactor de escrituras cross-dominio
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Propiedad declarada | Cada tabla pertenece a un dominio; documentado y verificable |
| AC-2 | Sin escrituras cruzadas | Un dominio **solo escribe sus tablas**; los datos ajenos se leen por su API o se reciben por evento (HU-196) |
| AC-3 | Lecturas explícitas | Las lecturas cross-dominio pasan por la API pública del dueño (HU-195), no por acceso directo a sus tablas |
| AC-4 | Preparado para split | La convención permite mover un dominio a su propio schema/BD sin tocar a sus consumidores |

---

### HU-198 — Propagación del contexto de tenant a través de la red · E17

> Como plataforma multi-tenant, quiero propagar el `tenant_id` de forma confiable y firmada entre procesos/servicios, para no perder el aislamiento al cruzar una frontera de red.

**Estimación:** M (5 puntos)
**Módulo:** `@merkiai/tenancy` (propagación + re-fijado de GUC), headers/tokens firmados
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**; depende de HU-156/171

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Contexto portable | El `tenant_id` viaja en un token/header **firmado** en toda llamada entre procesos y en cada evento (HU-196) |
| AC-2 | Re-fijado de RLS | El servicio/consumidor receptor **vuelve a fijar** `app.current_tenant` (GUC) en su propia conexión antes de tocar datos |
| AC-3 | Fail-closed | Sin contexto de tenant válido, la operación se rechaza (nunca se ejecuta sin tenant) |
| AC-4 | Trazabilidad | El `tenant_id` se incluye en trazas/logs (HU-199) para correlación |

---

### HU-199 — Observabilidad distribuida (trazas correlacionadas) · E14

> Como responsable, quiero trazas correlacionadas y logs estructurados con contexto (request, tenant, dominio), para operar de forma fiable cuando la lógica se reparta en procesos/servicios.

**Estimación:** M (5 puntos)
**Módulo:** tracing (OpenTelemetry), correlation id, logs estructurados; extiende HU-170 (APM)
**Estado:** 🔲 Pendiente (roadmap) — **enabler de extracción**; extiende HU-170

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Correlation id | Cada request/evento propaga un id de correlación a través de las fronteras |
| AC-2 | Trazas | Instrumentación (OpenTelemetry) que sigue una operación entre módulos/servicios y colas |
| AC-3 | Logs estructurados | Logs con `request_id`, `tenant_id` y dominio; sin PII innecesaria (HU-152) |
| AC-4 | Base para split | La observabilidad ya funciona antes de extraer un servicio, no después del incidente |

---

