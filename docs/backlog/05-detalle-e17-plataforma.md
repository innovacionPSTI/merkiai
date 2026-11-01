## Detalle · E17 — Plataforma multi-tienda (multi-tenant) + SaaS  *(roadmap)*

> **Épica nueva.** Correr **varias tiendas (tenants) desde un mismo despliegue** con datos, contenido, plantillas y configuración aislados por tenant, y operarlas como **plataforma SaaS** (planes, entitlements, facturación por suscripción y suspensión por impago). Es la capacidad más estratégica para el modelo white-label. Todo **🔲 (roadmap)**.

### Arquitectura de referencia (decisiones tomadas · ago-2026)

> Estas decisiones son la **fuente de verdad** para diseñar E17; las HU de abajo las materializan.

**1. Modelo de tenancy — *pooled* single-DB + `tenant_id` + RLS.** Una sola BD Supabase; toda tabla tenant-scoped lleva `tenant_id`. **No** schema-por-tenant ni BD-por-tenant (costo operativo/migración). Se diseña para poder **aislar después** a un tenant grande sin reescribir.

**2. Identidad — Stack Auth (Hexclave) Teams = tenants.** *(Validado contra doc oficial, ago-2026.)* 1 Team = 1 negocio-cliente; un usuario puede pertenecer a **varios** Teams (el tenant es *contexto*, no identidad). Confirmado en la doc: creación/gestión de Teams server-side (`createTeam`, `addUser`, `removeUser`, `delete`) → **provisioning desde el control plane**; **metadata de Team** (`serverMetadata` JSON) para espejar `tenant_id`/plan/estado; sincronización Team→fila `tenants` vía **webhooks** (la integración no sincroniza datos por sí sola). **RBAC confirmado y encaja mejor de lo previsto:** *Team Permissions* = roles **por tenant** (admin de tienda, editor…) → HU-158; *Project Permissions* = permisos **globales cross-team** → **rol de operador del control plane** (HU-172) y respaldo de entitlements de plan (HU-173). Checks autoritativos server-side (`user.hasPermission`). No se migra a FusionAuth.

**3. Aislamiento de datos — RLS como frontera dura (prima la seguridad, cero fugas entre organizaciones).** *(Revisado tras validar la doc oficial Hexclave↔Supabase, ago-2026.)*
> - **Estrategia primaria: JWT con claim `tenant_id` (patrón oficial soportado).** La integración documentada emite un **JWT de Supabase** firmado (server action con `SUPABASE_JWT_SECRET`) y lo pasa por el callback `accessToken` del cliente Supabase; las políticas RLS leen `auth.jwt()`/`auth.uid()`. Como el JWT lo firmamos nosotros, **añadimos el claim `tenant_id`** (= Team activo, verificado que el usuario pertenece a ese Team) y las policies filtran por `auth.jwt() ->> 'tenant_id'`.
> - **Se usa el rol `authenticated`/`anon` (sujeto a RLS), no `service-role`.** Esta es la garantía dura: como **el service-role omite RLS**, el plano de tienda **nunca** lo usa; aunque una query olvide el filtro, la RLS impide la fuga. **`service-role` solo en el control plane** (cross-tenant, auditado).
> - **Storefront público (anon, tenant resuelto por host):** se emite un token de vida corta con `tenant_id` del host (sin usuario) para lecturas públicas bajo RLS.
> - **Fallback (rutas server-only host-resueltas: webhooks, cron, ISR):** donde emitir un JWT sea incómodo, se admite **GUC por request** (`SET LOCAL app.current_tenant` en la transacción, sobre el pooler) + rol Postgres dedicado, con policies que acepten **ambos** orígenes (`auth.jwt()` o `current_setting`).
> - El filtro `.eq('tenant_id', …)` en la app queda como conveniencia; **la barrera real es la RLS**.
> - **Los singletons dejan de serlo:** `store_config`, `payment_config`, `shipping_config`, `admin_config` y `themes` pasan de `CHECK id=1` a **una fila por `tenant_id`**.
> - **Riesgo a confirmar en el PoC:** el ejemplo usa el **secreto JWT compartido (HS256)**; Supabase está migrando a **llaves asimétricas** — validar qué firma acepta el proyecto actual. El token porta el tenant activo → **cambiar de tenant = re-emitir** el JWT.

**4. Estructura del monorepo — se añade el plano de plataforma.**
> - **Nuevo `apps/console`** — consola del operador Merkiai: alta/baja de tenants, planes, suscripciones, facturación, suspensión, dominios y métricas globales. Corre sobre **su propio proyecto Supabase (BD de plataforma)** con `service-role` (ver punto 7).
> - **`packages/@merkiai/tenancy`** — resolución de tenant, contexto por request (JWT-claim/GUC), **entitlements** (`can(tenant, feature)`, `withinLimit`) y **connection factory** (enruta a la BD del tenant según `tenants.db_ref`).
> - **`packages/@merkiai/billing`** — abstracción `BillingProvider` (misma forma que pagos/envíos/email).
> - `apps/web` (storefront) y `apps/admin` siguen como **plano de tienda**, ahora tenant-scoped.

**5. Facturación por suscripción — cobra al tenant, distinto de las pasarelas de sus compradores.** Abstracción `BillingProvider` intercambiable: **PayZen**, **Mercado Pago Suscripciones** (mejor conversión CO) y **Stripe** (internacional). El ciclo de vida de la suscripción (`active/trialing/past_due/suspended`) gobierna la **suspensión por impago** vía webhooks del proveedor → gate de tenant en middleware.

**6. Aislamiento de datos por niveles, según el plan (routing de BD).** El default es **pooled + RLS** (una sola Supabase para todos). Pero **desde el inicio** se incluye una **costura de enrutamiento** para no quedar amarrados: columna `tenants.db_ref` + un **connection factory en `@merkiai/tenancy`** que devuelve el cliente Supabase/Postgres correcto por tenant. Esto habilita **tres niveles de aislamiento como *entitlement* de plan** (gestionado por Merkiai desde el control plane, HU-173):
> - **Compartido** *(planes base)* — tablas compartidas + `tenant_id` + RLS.
> - **Schema dedicado** *(plan intermedio)* — un `schema` por tenant en el mismo proyecto.
> - **BD/proyecto dedicado** *(plan enterprise / residencia de datos)* — proyecto Supabase propio o, a escala, **Neon** (Postgres, DB-por-tenant vía API, scale-to-zero) detrás del **mismo** factory.
> Como `tenant_id` está en todas las tablas, **promover** un tenant = exportar sus filas + cambiar `db_ref`, **sin reescribir la app**. La RLS se mantiene como defensa en profundidad incluso con BD dedicada. *(Confirmar límites/precios de aprovisionamiento de Supabase/Neon en su doc actual.)*

**7. Separación de bases de datos por plano — Merkiai tiene su BD propia (proyecto Supabase dedicado, desde el inicio).** Dos planos de datos con dueños distintos:
> - **BD de plataforma (control plane) — proyecto Supabase propio, desde el día 1.** Contiene el registro de `tenants`, `plans`, `subscriptions`, billing, dominios, la tabla de routing **`db_ref`** y la auditoría de plataforma. Solo la toca `apps/console` con **service-role**; **no** está sujeta a RLS de tenant. Es un **proyecto Supabase separado** (backups, PII de tenants y billing aislados) — **no** un schema dentro de la BD de tiendas.
> - **BD del plano de tienda.** Productos, pedidos, clientes, páginas, config, temas… *tenant-scoped* por RLS/`db_ref`. **`apps/web` y `apps/admin` la comparten** (misma data; se separan por identidad/permisos, no por datos), con rol `authenticated` + JWT `tenant_id`.
> - **Resolución del routing:** el plano de tienda resuelve `host → tenant_id → db_ref` contra el registro de Merkiai vía una **API interna mínima del control plane** o un **caché/réplica** del mapa en el middleware (cambia poco); **nunca** accede directo a la BD de plataforma.
> - **Blast radius:** un fallo del storefront no puede tocar billing/suscripciones/registro de tenants. La `db_ref` (mapa de dónde vive cada tenant) **debe** vivir aquí, no dentro de una BD de tenant (huevo-y-gallina).

**8. Secuencia.** Los cimientos de tenancy (`tenant_id` + RLS + rol dedicado + config por-tenant + **costura de routing `db_ref`** + **BD de plataforma separada**) van **temprano** (Ola 0), antes de acumular features: introducirlos tarde es el refactor más caro del backlog.

### HU-156 — Modelo multi-tienda (aislamiento de datos por tenant) · E17

> Como operador de plataforma, quiero que cada tienda tenga sus datos, contenido y configuración aislados, para servir múltiples negocios desde una instalación.

**Estimación:** XL (13+ puntos)
**Módulo:** `tenant_id` en el modelo de datos, RLS por tenant, minteo de JWT con claim `tenant_id` (+ GUC/rol dedicado como fallback), `packages/@merkiai/tenancy`, migraciones
**Estado:** 🔲 Pendiente (roadmap v18) — materializa la **Arquitectura de referencia** (arriba); depende de HU-171

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Entidades con tenant | Todas las tablas tenant-scoped (productos, pedidos, clientes, páginas, config, plantillas, `processed_webhook_events`, etc.) llevan `tenant_id` |
| AC-2 | RLS como frontera dura | Policies que filtran por el `tenant_id` del contexto; una tienda **nunca** ve datos de otra aunque una query olvide el filtro. Cero fugas entre organizaciones = requisito no negociable |
| AC-3 | Contexto por JWT-claim (primaria) | El tenant activo viaja como claim `tenant_id` en el JWT de Supabase (`accessToken` callback); policies usan `auth.jwt() ->> 'tenant_id'`. Verificado server-side que el usuario pertenece al Team |
| AC-4 | Rol sujeto a RLS | El plano de tienda usa el rol `authenticated`/`anon` (sujeto a RLS), **nunca** `service-role` (omite RLS); éste queda **solo para el control plane**. Fallback GUC (`SET LOCAL`) + rol dedicado para rutas server-only. Tests de aislamiento cross-tenant obligatorios |
| AC-5 | Config por tenant | `store_config`, `payment_config`, `shipping_config`, `admin_config` y `themes` pasan de `CHECK id=1` a **una fila por `tenant_id`** |
| AC-6 | Espejo de tenants | Cada Team de Hexclave se espeja a una fila `tenants` vía **webhook** (`serverMetadata` porta `tenant_id`/plan); provisioning desde el control plane |
| AC-7 | Costura de routing de BD | `db_ref` (en la **BD de plataforma**, HU-172) + **connection factory** en `@merkiai/tenancy` (default: BD compartida pooled+RLS). El plano de tienda resuelve `host→tenant_id→db_ref` vía API/caché del control plane. Deja preparado el salto a schema/BD dedicada **sin reescritura** (materializado en HU-200) |
| AC-8 | Migración | Ruta desde el modelo actual (single-tenant) a multi-tenant sin pérdida: crea el tenant por defecto y le asigna los datos existentes |

---

### HU-157 — Resolución de tienda por dominio/subdominio · E17

> Como plataforma, quiero resolver qué tienda servir según el dominio o subdominio, para que cada negocio tenga su propia URL.

**Estimación:** L (8 puntos)
**Módulo:** middleware de resolución de tenant, mapeo dominio→tienda, `apps/web`
**Estado:** 🔲 Pendiente (roadmap v18) — depende de HU-156

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Dominio/subdominio | El middleware resuelve la tienda activa y carga su config/plantilla |
| AC-2 | Dominios personalizados | Soporte para dominio propio por tienda además de subdominio |
| AC-3 | Aislamiento en runtime | Todas las queries de la petición quedan acotadas a la tienda resuelta |

---

### HU-158 — Panel multi-tienda (contexto y administración) · E17

> Como administrador con varias tiendas, quiero cambiar de contexto de tienda y administrar cada una por separado, para operarlas desde un mismo panel.

**Estimación:** L (8 puntos)
**Módulo:** admin (selector de tienda, scoping de vistas y permisos por tienda)
**Estado:** 🔲 Pendiente (roadmap v18) — depende de HU-156

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selector de tienda | El admin cambia de tienda activa; todas las vistas quedan acotadas a esa tienda |
| AC-2 | Permisos por tienda | Un usuario puede tener acceso a una o varias tiendas según su rol |
| AC-3 | Configuración | Cada tienda gestiona su catálogo, contenido, plantillas e integraciones de forma independiente |
| AC-4 | **Resolutor post-login** | Tras el login (cualquier método), un paso server resuelve los **Teams** del usuario: **0** → sin acceso; **1** → set del tenant activo + `/dashboard`; **>1** → **selector de workspace** (tarjetas por tienda) |
| AC-5 | **Tenant activo** | El tenant elegido se guarda en **cookie firmada** (`active_tenant`), reemplaza a `ADMIN_TENANT_ID`, y **acota** todas las vistas, entitlements (HU-173) y queries; verificación server-side de que el usuario pertenece a ese Team |
| AC-6 | **Switcher + guardia** | Selector de tienda en el topbar para cambiar de contexto; guardia de sesión en `/login` (si ya hay sesión, redirige — resuelve el no-redirect de OAuth) |

---

## Detalle · Emails y newsletter (v18) — HU-159…163 · E8

> Refuerza la **Épica 8**: eleva el email de "HTML embebido + solo Resend" a una capa de proveedores intercambiables, plantillas editables, entregabilidad y observabilidad; y separa el **transaccional** del **marketing/newsletter**, que se integra con plataformas especializadas (Beehiiv y similares). Todo **🔲 (roadmap)**.

### HU-159 — Abstracción `EmailProvider` multi-proveedor (transaccional) · E8

> Como plataforma, quiero una interfaz de proveedor de email intercambiable (mismo patrón que pagos/envíos), para enviar correos transaccionales por distintos servicios sin acoplar el código.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database/src/providers/email/*` (interfaz + factory), `store_config.email_provider` (ampliar CHECK), config admin
**Estado:** 🔲 Pendiente (roadmap v18) — **enabler de E8**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `EmailProvider.send(message, config)` | Implementaciones registradas en un factory; Resend actual migrado a este contrato |
| AC-2 | Proveedores | Resend + **Amazon SES**, **Postmark** y **SMTP genérico (Nodemailer)** como comodín para white-label |
| AC-3 | Configuración | Proveedor activo + credenciales + `from`/dominio desde el admin; llave sensible vía service_role |
| AC-4 | Resiliencia | Un fallo del proveedor se registra (HU-162) y no bloquea el flujo (p. ej. checkout) |
| AC-5 | Separación | El transaccional es independiente del marketing/newsletter (HU-163): distinto proveedor y reputación |

---

### HU-160 — Plantillas de email editables con variables · E8

> Como administrador, quiero editar el **asunto y el contenido de cada email** (confirmación de pago, cada cambio de estado del pedido, bienvenida, recuperación) con variables, para personalizarlos sin tocar código.

**Estimación:** L (8 puntos)
**Módulo:** layout MJML/React Email + plantillas en BD (`email_templates`), interpolación de variables, preview en admin, `lib/email` (reemplazar HTML fijo)
**Estado:** ✅ Hecho (v158) — **hecho:** tabla `email_templates` (`e17/51`, override por tienda de **asunto+cuerpo+enabled** por tipo, RLS is_admin) + catálogo de tipos con **defaults de sistema** (pago confirmado/rechazado, estados de pedido, bienvenida, recuperación) + renderer puro de variables (`{{...}}`) con **fallback** al default (`resolveTemplate`) + tests. Admin **Configuración → Plantillas de correo**: editar asunto/cuerpo con lista de variables y **activar/silenciar** por tipo (AC-2/AC-5). **Fase 2 (v158):** los correos **admin de estado de pedido y confirmación de pago** ya usan `sendTemplatedEmail` (plantilla activa, respeta el toggle, registra en email_log); **previsualización en iframe + correo de prueba** al admin desde el editor (AC-3); layout con logo/tema reutilizado (AC-1). **Pendiente menor:** cablear los envíos del **storefront** (confirmación de compra, back-in-stock, avisos VIP) al mismo helper + i18n (AC-6).
**Baseline actual (v20):** los correos transaccionales **ya se envían** con Resend vía el proveedor activo — confirmación de pago (al aprobarse), notificación de envío (con tracking) y en los cambios de estado del pedido —, pero con **plantillas HTML fijas en código** (`lib/email`). Esta HU las hace **editables por tipo/estado desde el admin**.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Layout compartido | Header con logo, colores del theme y footer legal; HTML responsive renderizado **en la app** (no plantillas del proveedor, para no amarrarse) |
| AC-2 | Contenido editable por tipo/estado | Asunto y bloques editables desde el admin para **cada mensaje**: confirmación de pago, pago rechazado, y por **estado del pedido** (procesando, enviado, entregado, cancelado, excepción), además de bienvenida y recuperación; con variables (`{{order_number}}`, `{{customer_name}}`, `{{tracking_url}}`, `{{status}}`, `{{total}}`) |
| AC-3 | Previsualización | Vista previa con datos de ejemplo antes de guardar; envío de correo de prueba |
| AC-4 | Envío agnóstico | Se renderiza el HTML de la plantilla activa y se envía por el proveedor activo (HU-159); si no hay plantilla personalizada, usa la de sistema por defecto (fallback) |
| AC-5 | Activar/desactivar por tipo | El admin puede habilitar/silenciar el envío de cada tipo de correo (p. ej. no notificar "procesando") |
| AC-6 | i18n-ready | Variante de plantilla por idioma (se apoya en HU-114) |

---

### HU-161 — Entregabilidad: dominio de envío, SPF/DKIM/DMARC, rebotes y suppression list · E8

> Como responsable, quiero configurar un dominio de envío autenticado y procesar rebotes/quejas, para que los correos lleguen a la bandeja y no a spam.

**Estimación:** L (8 puntos)
**Módulo:** config de dominio en admin, webhooks de eventos del proveedor, tabla `suppression_list`
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Dominio de envío | Configuración de dominio/subdominio y `from`; guía y estado de verificación de SPF/DKIM/DMARC en el admin |
| AC-2 | Webhook de eventos | Recibe `delivered`/`bounce`/`complaint` del proveedor con verificación de origen |
| AC-3 | Suppression list | Rebotes duros y quejas alimentan una lista de supresión; no se envía a direcciones suprimidas |
| AC-4 | Transversal | Aplica a cualquier proveedor activo (HU-159) |

---

### HU-162 — Registro de emails (`email_log`) + reintentos · E8

> Como operador, quiero un registro de los emails enviados y sus fallos, para trazabilidad y soporte.

**Estimación:** M (5 puntos)
**Módulo:** tabla `email_log`, wrapper de envío, reintentos con backoff
**Estado:** 🟡 Parcial (v156) — **hecho:** tabla `email_log` (`e17/50`, RLS is_admin read/insert) + `recordEmail` (best-effort, nunca lanza) / `listEmailLog` (paginado); instrumentados los correos **admin** de **estado de pedido** y **confirmación de pago** (sent/failed, reemplazando el `.catch` mudo — AC-1/AC-4); vista admin **`/emails`** (menú Sistema, gated por permiso de datos). **Pendiente:** instrumentar los envíos del storefront (confirmación de compra, back-in-stock, avisos VIP) + **reintentos con backoff + idempotencia por (tipo, entidad)** (AC-2).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cada envío | Registra destinatario, tipo, proveedor, estado (enviado/fallido/suprimido) y timestamp |
| AC-2 | Reintentos | Backoff ante fallos transitorios; idempotencia por (tipo, entidad) para no duplicar correos |
| AC-3 | Consulta | Filtrable en el admin; solo roles autorizados (compatible con HU-146/134) |
| AC-4 | Sin fallos silenciosos | Reemplaza el `.catch` mudo actual por registro explícito |

---

### HU-163 — Integración con plataformas de newsletter (Beehiiv y similares) · E8

> Como negocio, quiero conectar el newsletter con plataformas especializadas (Beehiiv, ConvertKit, Substack, Mailchimp, Brevo), para gestionar suscriptores y campañas fuera de la plataforma.

**Estimación:** L (8 puntos)
**Módulo:** `NewsletterProvider` intercambiable, sync de suscriptores, config admin; se apoya en `newsletter_subscribers`
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `NewsletterProvider` | `subscribe`/`unsubscribe`/`sync` con implementaciones (**Beehiiv** y similares) + el newsletter interno actual como opción |
| AC-2 | Alta en el sitio | El contacto se sincroniza con la plataforma activa, respetando su doble opt-in |
| AC-3 | Baja | El unsubscribe se propaga en ambos sentidos (consentimiento; se conecta con HU-151/152) |
| AC-4 | Configuración | Proveedor + API key + `publication`/`list id` desde el admin |
| AC-5 | Separación | Marketing separado del transaccional (HU-159): distinto proveedor, dominio y reputación |
| AC-6 | Fallback | Sin proveedor externo configurado, usa el newsletter interno existente |

---

## Detalle · v19 — Enablers de plataforma y vacíos (HU-164…171)

> HU derivadas del análisis de coherencia arquitectónica: *enablers* transversales y funcionalidades faltantes de una plataforma de comercio madura. Todo **🔲 (roadmap)**.

### HU-164 — Motor de cálculo de precios/checkout unificado (enabler) · E6

> Como plataforma, quiero un pipeline único y autoritativo (server-side) que calcule el total —líneas → descuentos → impuestos → envío—, para que cupones, promociones, gift cards e impuestos se apliquen en un solo lugar consistente y seguro.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (pricing), checkout, pasos de regla conectables
**Estado:** 🔲 Pendiente (roadmap) — **enabler de HU-147/148/149/167**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cálculo determinista | subtotal → descuentos → impuestos → envío → total, en el servidor |
| AC-2 | Conectores | Cupones (existente), promociones (HU-147), gift cards (HU-148), impuestos (HU-149) y puntos (HU-167) entran como pasos, no como parches |
| AC-3 | Seguridad | El cliente nunca decide el total; el checkout usa siempre el resultado del pipeline (HU-092) |
| AC-4 | Desglose | Devuelve el detalle para UI, email y factura |

---

### HU-165 — Webhooks salientes / API pública de integración · E2

> Como plataforma, quiero exponer una API y webhooks salientes de eventos (`order.created`, `payment.approved`, `shipment.created`), para que sistemas de terceros se integren.

**Estimación:** L (8 puntos)
**Módulo:** registro de webhooks, firma HMAC, API keys, cola con reintentos
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Registro de endpoints por evento | Desde el admin; con firma HMAC verificable (igual que las que recibimos de Bold/Wompi) |
| AC-2 | Entrega confiable | Reintentos con backoff y log de entregas (HU-162/146) |
| AC-3 | API de lectura | Con API keys por rol/tenant (RBAC, HU-134) |
| AC-4 | Versionado | Catálogo de eventos versionado |

---

### HU-166 — Facturación electrónica (Colombia / DIAN) · E6

> Como comercio en Colombia, quiero emitir factura electrónica válida ante la DIAN al confirmarse el pago, para cumplir la obligación fiscal.

**Estimación:** XL (13+ puntos)
**Módulo:** proveedor de facturación electrónica (swappable), mapeo orden→factura, numeración fiscal
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pago aprobado | Se genera el documento fiscal vía proveedor autorizado (integración configurable) |
| AC-2 | Datos fiscales | Numeración/resolución DIAN + datos del comercio y del cliente |
| AC-3 | Almacenamiento | Documento enlazado a la orden y disponible para el cliente |
| AC-4 | Consistencia | Impuestos alineados con HU-149 y el pipeline (HU-164) |
| AC-5 | Extensible | La abstracción permite otros regímenes fiscales por país (se conecta con HU-114) |

---

### HU-167 — Programa de fidelización / puntos · E12

> Como cliente recurrente, quiero acumular y redimir puntos por mis compras, para incentivar la recompra.

**Estimación:** L (8 puntos)
**Módulo:** `loyalty_points` por cliente, reglas de acumulación/redención, checkout
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Acumulación | Puntos por compra según reglas configurables |
| AC-2 | Redención | Como descuento en el checkout, vía el pipeline de pricing (HU-164) |
| AC-3 | Visibilidad | Saldo y movimientos en `/account`; auditable (HU-146) |
| AC-4 | Configuración | Reglas gestionables desde el admin |

---

### HU-168 — Bundles / kits de producto · E4

> Como negocio, quiero vender paquetes/kits (varios productos como una unidad con precio propio), para aumentar el ticket promedio.

**Estimación:** L (8 puntos)
**Módulo:** modelo de bundle, PDP, carrito, inventario compuesto
**Estado:** ✅ Hecho (v147) — **Fase 1** (modelo + admin + lógica pura) + **Fase 2** storefront/checkout: páginas `/bundles` (listado) y `/bundles/[slug]` (detalle con componentes, precio, ahorro y disponibilidad por componente más restrictivo). Add-to-cart como **línea única** (sentinel `-bundleId`; no se sincroniza a la BD). En el checkout el servidor **expande el bundle a sus componentes desde la BD** (server-authoritative): valida y descuenta stock por componente (reusa `getStockForVariants` + `applyStockForOrder`), con el precio del bundle distribuido entre líneas. Guarded: tiendas sin bundles no cambian. *(El canje/precio fino queda sujeto al endurecimiento de pricing HU-297.)*

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definición | Bundle = componentes + precio, desde el admin |
| AC-2 | Compra | PDP y carrito lo tratan como una línea; el inventario descuenta cada componente (RPC de stock, HU-098) |
| AC-3 | Precio | El precio del bundle entra al pipeline (HU-164) |
| AC-4 | Stock | Backorder/disponibilidad según el componente más restrictivo |

> **Evolución (E24 · HU-404).** El bundle es, conceptualmente, el caso **`al_vender`** de la **receta/BOM de un nivel**: vender la unidad descuenta sus componentes. Cuando se formalice el BOM con **política de consumo** (E24), este motor **se generaliza/reutiliza** (no se duplica): el BOM añade además el caso **`al_producir`** (orden de producción que crea stock de terminado) y los **modificadores** que consumen inventario. HU-168 queda como instancia ya implementada del mismo concepto.

---

### HU-169 — Onboarding / asistente de configuración inicial · E13

> Como nuevo comercio (white-label), quiero un asistente guiado de primer arranque (marca, pago, envío, dominio, legales), para dejar la tienda operativa sin fricción.

**Estimación:** M (5 puntos)
**Módulo:** wizard en admin, checklist de setup
**Estado:** 🔲 Pendiente (roadmap)

> ⚠️ **Ampliada por HU-236** (onboarding por plan): esta HU es el núcleo básico; la versión completa (apariencia/Tema, Presets de nicho, Template de páginas, modelo de inventario, catálogo, sucursales, todo **gated por entitlements**) se define en el cluster HU-233…239 y su fundamento en `docs/adr/ADR-002-presets-onboarding-entitlements.md`. **No implementar HU-169 aislada** — hacerlo dentro de HU-236.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Wizard de arranque | Identidad/tema, pasarela activa, proveedor de envío, dominio, legales |
| AC-2 | Estado | Checklist con lo pendiente; se puede retomar |
| AC-3 | Multi-tienda | En E17, aplica por tienda |

---

### HU-170 — Monitoreo de errores en runtime (APM / error tracking) · E14

> Como responsable, quiero capturar y agrupar errores de runtime (front y back) con contexto, para detectar y resolver incidencias.

**Estimación:** M (5 puntos)
**Módulo:** abstracción `ErrorReporter` intercambiable (packages) + adaptador por defecto (Sentry) + bordes de captura (route handlers, error boundaries, middleware) + source maps en el build
**Estado:** ✅ Hecho (v161) — abstracción `ErrorReporter` en `@merkiai/database` (`NoopReporter` / `ConsoleReporter` default / `HookReporter` → APM externo vía `globalThis.__merkiaiCaptureException`), `reportError()` best-effort con **scrubbing de PII/secretos** (AC-4), contexto de **tenant/scope/route** (AC-1/AC-5), resiliencia (AC-6) + tests. **Sentry conectado (v161):** `@sentry/nextjs` en apps/web + `instrumentation.ts` (`register` server-side inicializa Sentry **solo si hay `SENTRY_DSN`** y registra el hook global; `onRequestError` enruta errores de rutas/RSC) + `instrumentation-client.ts` (browser, guarded por `NEXT_PUBLIC_SENTRY_DSN`). Import **no-literal** → el build no se acopla al SDK; **sin DSN se mantiene el `ConsoleReporter`** (cero cambios para la tienda viva hasta definir el DSN). `reportError` ya cableado en checkout + cupón/crédito (alertas de abuso HU-300). **Pendiente opcional (AC-3):** subir source maps en el build (requiere `SENTRY_AUTH_TOKEN` + `withSentryConfig`) y adoptar `reportError`/error boundaries en más bordes. **Para activar:** `pnpm install` (toma `@sentry/nextjs`) + setear `SENTRY_DSN` (y `NEXT_PUBLIC_SENTRY_DSN` para el browser) en Vercel.

> **Enfoque (patrón del repo).** Igual que pagos/envíos/correo/identidad, NO acoplar la app a un proveedor: definir una **interfaz `ErrorReporter`** (`captureException(err, context)`, `captureMessage`, `setTenant/ setUser`, `flush`) en `packages/observability` (o `@merkiai/tenancy`-adjacent) con un **`NoopReporter`** por defecto (sin config → no-op, no rompe dev/CI) y un **`SentryReporter`** activado por env (`SENTRY_DSN`). El contexto de **tenant** se inyecta desde el request (host→tenant) para poder filtrar incidencias por tienda. Capa de infra (Vercel/Supabase logs) se mantiene; esto añade el **application error-tracking** que hoy falta. Alcance: web + admin + console.
>
> **Capas distintas (aclaración).** *Infra logging/metrics* (Vercel Observability, Supabase Logs; equivalente a CloudWatch en AWS) ya existe y no es parte de esta HU. HU-170 agrega el **tracking de errores de aplicación** (agrupación + stack + contexto de negocio + alertas), típicamente Sentry.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Captura | Errores de cliente (error boundary + unhandled) y servidor (route handlers, server actions, webhooks, middleware) con **stack + contexto** (tenant, ruta, release, request id) |
| AC-2 | Abstracción | Interfaz `ErrorReporter` intercambiable; `NoopReporter` por defecto (sin DSN = no-op); `SentryReporter` por env — sin acoplar la app al proveedor |
| AC-3 | Gestión | Agrupación por fingerprint, **entorno** (prod/preview/dev) y **release** (commit) asociados; alertas configurables; source maps subidos en el build para stacks legibles |
| AC-4 | Privacidad | **Sin PII innecesaria** (scrubbing de email/teléfono/dirección y de secretos/credenciales); respeta consentimiento (HU-152); nunca envía tokens ni llaves |
| AC-5 | Multi-tenant | El error queda etiquetado con `tenant_id` para filtrar por tienda; no se filtran datos de un tenant a otro |
| AC-6 | Resiliencia | El reporter nunca tumba la request (best-effort, try/catch interno); `flush` acotado por timeout en serverless |

---

### HU-170b — Monitoreo de errores en el ADMIN (y consola) · E14

> Como responsable, quiero que los errores de runtime del **panel de cada tenant** (y de la consola del operador) también se capturen en el APM, para detectar incidencias de gestión (cambios de estado de pedido, validación de pago, gift cards, imports) y no solo las del storefront.

**Estimación:** S (3 puntos)
**Estado:** 🔲 Pendiente (documentada v162). HU-170 dejó Sentry conectado **solo en `apps/web`**. El admin (`apps/admin`) y la consola (`apps/console`) hoy registran errores únicamente en los logs de infraestructura (Vercel/Supabase); **no** tienen `@sentry/nextjs`, ni `instrumentation.ts`, ni llamadas a `reportError`.

> **Enfoque (reutiliza HU-170, sin reinventar):** la abstracción `ErrorReporter` + `reportError` de `@merkiai/database` ya es multi-app. El trabajo es replicar en `apps/admin` el mismo cableado **guarded** que ya tiene web:
> 1. Agregar `@sentry/nextjs` a `apps/admin` (y opcionalmente `apps/console`).
> 2. Crear `apps/admin/src/lib/sentry.ts` (loader no-literal + `initSentryServer` que registra `globalThis.__merkiaiCaptureException` solo si hay DSN), `apps/admin/instrumentation.ts` (`register` + `onRequestError`) y `instrumentation-client.ts`.
> 3. Instrumentar los **bordes sensibles del admin** con `reportError({ scope, tenantId })`: cambio de estado de pedido, validación manual de pago, emisión de gift cards, ajuste de saldo, imports/exports masivos, aprobación de devoluciones.
> 4. Env nuevas en el proyecto **admin** de Vercel: su propio `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (puede ser el mismo proyecto Sentry que web o uno aparte).

> **Multi-tenant (importante):** Sentry es **por aplicación, no por tenant**. Un único proyecto Sentry recibe los errores de **todos** los tenants del admin juntos; la separación por tienda se hace con el **tag `tenant_id`** (ya lo adjunta `reportError`), filtrando/alertando dentro del mismo proyecto. **No** se crea un Sentry por tenant.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Captura (admin) | Errores de servidor del admin (route handlers de pedidos/pagos/gift cards/imports) y de cliente (error boundaries) con **stack + contexto** (tenant, ruta, actor) |
| AC-2 | Guarded | Sin `SENTRY_DSN` del admin, no se envía nada (se mantiene el log); mismo patrón no-literal que web (build no acoplado) |
| AC-3 | Multi-tenant | Cada evento etiquetado con `tenant_id` para filtrar por tienda dentro del mismo proyecto Sentry |
| AC-4 | Privacidad | Scrubbing de PII/secretos (reutiliza el del `ErrorReporter`); nunca envía tokens ni llaves |
| AC-5 | Consola (opcional) | Mismo cableado en `apps/console` para errores del control plane |

---

### HU-171 — Spike: auth multi-tenant + estrategia de aislamiento RLS · E17

> Como arquitecto, quiero validar con un PoC la decisión de auth + aislamiento y dejarla en un ADR, para no acoplar E17 a supuestos sin probar.

**Estimación:** M (spike)
**Módulo:** PoC (Stack Auth Teams + rol dedicado + GUC + RLS sobre el pooler) + ADR
**Estado:** 🔲 Pendiente (roadmap) — **precede a HU-156/157/158**

> **Decisión de referencia — validada contra doc oficial Hexclave (ago-2026):** **Teams = tenants** (no FusionAuth) ✅; **RBAC** cubre roles por tenant (*Team Permissions*) y rol de operador del control plane (*Project Permissions*) ✅; **estrategia RLS revisada → JWT con claim `tenant_id`** (patrón oficial Hexclave↔Supabase: `accessToken` callback + policies `auth.jwt() ->> 'tenant_id'`), usando el rol `authenticated`/`anon` sujeto a RLS (service-role solo en control plane). **GUC por request + rol dedicado** queda como **fallback** para rutas server-only. El PoC confirma la mecánica y los riesgos abiertos.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Auth = Teams (validado) | PoC: 1 Team = 1 tenant, provisioning server-side (`createTeam`/`addUser`), `serverMetadata` con `tenant_id`/plan, sync Team→`tenants` vía **webhook**. Confirmado: no requiere FusionAuth |
| AC-2 | RBAC (validado) | PoC: *Team Permission* (rol por tienda) y *Project Permission* (operador de plataforma) con `hasPermission` server-side; base de entitlements (HU-173) |
| AC-3 | RLS por JWT-claim (primaria) | PoC end-to-end: server action que firma un JWT con claim `tenant_id` (Team activo verificado) → cliente Supabase con `accessToken` → policy `auth.jwt() ->> 'tenant_id'` con rol `authenticated`. Se prueba que una query **no** ve datos de otro tenant y que **nunca** se usa service-role en el plano de tienda |
| AC-4 | RLS por GUC (fallback) | PoC: para webhooks/cron/ISR host-resueltos, `SET LOCAL app.current_tenant` en la transacción sobre el **pooler** + rol dedicado; policy que acepte `auth.jwt()` **o** `current_setting` |
| AC-5 | ADR + riesgos | Registra la decisión y los riesgos: **firma JWT compartida (HS256) vs migración de Supabase a llaves asimétricas** (confirmar qué acepta el proyecto), re-emisión de token al cambiar de tenant, e impacto de mover el data-layer de `service-role`→rol sujeto a RLS |

---

## Detalle · E17 — Control plane, planes y dominios (HU-172…175)

> Eleva E17 de "multi-tenant básico" a **plataforma SaaS**: introduce el **plano de plataforma (control plane)** por encima del plano de tienda. Todo **🔲 (roadmap)**. Depende del spike de auth (HU-171) y del modelo de datos multi-tenant (HU-156/157).

### HU-172 — Consola de plataforma: administración de todos los tenants · E17

> Como operador de la plataforma, quiero una consola por encima de las tiendas para crear, listar, suspender y monitorear todos los tenants, para administrar el negocio white-label.

**Estimación:** L (8 puntos)
**Módulo:** `apps/console` sobre **proyecto Supabase propio** (BD de plataforma), rol de plataforma, acceso cross-tenant, auditoría
**Estado:** 🔲 Pendiente (roadmap) — depende de HU-156

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-0 | BD de plataforma propia | El registro de `tenants`, `plans`, `subscriptions`, billing, dominios, `db_ref` y auditoría vive en un **proyecto Supabase dedicado** (separado de la BD del plano de tienda), accedido solo por el control plane con service-role |
| AC-1 | Vista global | Lista de todos los tenants: estado (activo/trial/suspendido), plan, dominios y uso básico |
| AC-2 | Ciclo de vida | Crear, suspender, reactivar y eliminar tenant |
| AC-3 | Soporte | Impersonar una tienda para soporte, **auditado** (HU-146) |
| AC-4 | Aislamiento | Rol de **plataforma** separado del admin de tienda (vía *Project Permission* de Hexclave, p. ej. `platform:operate`); un admin de tienda (con *Team Permissions*) nunca ve otros tenants |

---

### HU-173 — Planes y entitlements (habilitar funcionalidades por plan) · E17

> Como operador, quiero definir planes y qué funcionalidades habilita cada uno, y asignar un plan por tenant, para ofrecer niveles (p. ej. Free/Pro/Enterprise).

**Estimación:** L (8 puntos)
**Módulo:** `plans` + `entitlements`, guard `can(tenant, feature)` en UI y API (`@merkiai/tenancy`)
**Estado:** 🔶 Parcial — **hecho:** catálogo `plans` (features/limits JSONB) en la BD de plataforma + FK `tenants.plan` + seed free/pro/enterprise (`platform/03_plans.sql`); módulo de entitlements puro `@merkiai/tenancy/entitlements` (`hasFeature`/`withinLimit`/`limitOf`, 3 tests verdes); `resolve-tenant` devuelve los entitlements del plan y el plano de tienda los transporta en `ResolvedTenant`; **guard reusable** en `apps/web/src/lib/entitlements.ts` (`tenantHasFeature` para UI, `requireFeature`/`requireWithinLimit` → 403 para API), **sin cablear a ninguna feature aún** (cada módulo aplicará el suyo al construirse). **Pendiente:** cablear el gating a features reales cuando existan (POS/dropshipping/IA no están construidos) y límites (products/users) al iniciar onboarding; gestión de planes en la consola. Se acopla a billing (HU-192/193)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Catálogo de planes | Planes (`plans`) con matriz de funcionalidades (`features JSONB`) y límites (`limits JSONB`) configurables desde el control plane |
| AC-2 | Gating (3 capas) | Entitlement en **UI** (ocultar), **API** (middleware `requireEntitlement`, autoritativo server-side) y **datos** (RLS solo para aislamiento, no para features) según el plan del tenant |
| AC-3 | Límites | Límites cuantitativos por plan (nº de productos, usuarios, envíos…) vía `withinLimit` |
| AC-4 | Origen del plan | El plan puede asignarse manualmente desde el control plane **o** derivarse de la suscripción activa (HU-193); un cambio de estado de suscripción actualiza el plan efectivo |
| AC-5 | Cambio de plan | Actualiza entitlements de inmediato; degradación controlada (no rompe datos existentes) |
| AC-6 | Nivel de aislamiento de datos | El plan define `data_isolation` (`compartido` \| `schema` \| `dedicado`); el **connection factory** (HU-156/HU-200) enruta según `tenants.db_ref`. Planes enterprise/residencia → BD dedicada; cambiar de nivel es una operación auditada del control plane |
| AC-7 | **Cupos de usuarios por plan (aprobado)** | El plan define un **máximo de asientos de admin** (`limits.max_users` / `max_admins`). Se valida al invitar/asignar en **dos** frentes: (a) el endpoint interno del admin `POST /api/internal/owners` (invitación desde la consola) y (b) el `POST /api/admin/usuarios` (alta desde el propio admin) → cuenta los `profiles` con rol de panel del tenant y rechaza (403) si supera el cupo. El **super_admin dueño** (bootstrap del control plane) cuenta como el primer asiento. `super_admin` sigue siendo **exclusivo del control plane** (el admin no lo crea). Depende de HU-158 (scoping por `tenant_id`). |

---

### HU-174 — Dominios personalizados de la web pública (DNS → certificado → CDN → activo) · E17

> Como comercio, quiero conectar mi propio dominio a mi tienda con un proceso guiado y verificable, para operar bajo mi marca.

**Estimación:** XL (13+ puntos)
**Módulo:** gestión de dominios + máquina de estados; integración con CDN/host para certificado + propagación
**Estado:** 🔶 **v1 (backend completo)** — **núcleo puro** `domain-verification.ts` (`normalizeDomain`, `isValidDomain` [rechaza `*.merkiai.com`], `makeVerifyToken`, `expectedTxtName`/`Value`, `verifyTxt`) + **orquestación** `domain-service.ts` (`requestDomain` → `pending`+token+instrucciones TXT; `verifyDomain` → resuelve TXT y deja `verified`, DNS inyectable). **Persistencia** `platform/06_custom_domains.sql` (`domain_status`/`domain_verify_token`/`domain_requested` + check). **Endpoints** `POST/GET /api/internal/tenants/[id]/domain` y `POST …/domain/verify` (DNS real `node:dns/promises`). **Gating anti-hijack** en `PATCH /tenants/[id]`: `primaryDomain` solo se activa si el dominio está `verified` y coincide con el solicitado (→ `active`). 14 tests. **UI en el admin** ✅: `/configuracion/dominio` (sección en Configuración) — ingresar dominio → instrucciones del registro TXT (con copiar) → Verificar → Activar, con estados (`none/pending/verified/active`) en `StatusBadge`; puente `admin/lib/domains.ts` al control plane (GET/POST domain, POST verify, PATCH activar). **v2 ✅ (apuntado DNS + fix referencias por host):** núcleo `expectedDnsRecords` (A apex + CNAME www; destinos `DOMAIN_A_RECORD`/`DOMAIN_CNAME_TARGET`, Vercel por defecto) devuelto por el POST y el GET del endpoint; nuevo paso **"3 · Apunta tu dominio"** en la UI + TXT que ahora **persiste** vía GET. **Fix:** la vista previa usa SIEMPRE el **subdominio** (el `frame-src` del CSP del admin no permite el dominio propio); `metadataBase`/OG (layout) y `robots.ts` pasan a usar el **host de la petición** (antes `NEXT_PUBLIC_SITE_URL` fijo). Checkout/webhooks/`sitemap.ts` ya seguían el host (OK). Tests console +2. **Pendiente (ops, fuera de código):** alta del dominio en el hosting (Vercel auto-provisiona cert/CDN al detectar el DNS) y sync de **Trusted Domains** en Stack Auth (paso (f) de HU-214). Extiende HU-157.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Alta de dominio | Se muestran los registros DNS a crear (CNAME/A + token de verificación) |
| AC-2 | Máquina de estados | **pendiente → validación DNS → emisión de certificado (ACME/TLS) → propagación CDN → activo**, con estado visible, polling/webhook y reintentos |
| AC-3 | Cert y CDN delegados | La emisión del certificado y la propagación se **delegan al host/CDN** (no implementar ACME propio). Recomendado **Cloudflare for SaaS (custom hostnames)** o **Vercel Domains** |
| AC-4 | Resolución y unicidad | El dominio activo resuelve al tenant correcto (HU-157); un dominio pertenece a un solo tenant (anti-takeover) |
| AC-5 | Renovación | El certificado se renueva automáticamente |
| AC-6 | UI en el **admin del comercio** | El comerciante da de alta y ve el estado de su dominio desde su panel (`admin`), con el operador del control plane con visibilidad/override en la consola. `primary_domain` se persiste en `tenants` vía la API interna del control plane |
| AC-7 | **Redirección canónica** | Cuando el dominio propio queda **activo**, la web redirige (301) el subdominio `*.merkiai.com` → dominio propio y fuerza el host canónico (evita contenido duplicado / SEO); antes de activo, el subdominio sigue sirviendo. Configurable: forzar apex vs `www` |
| AC-8 | **Trusted Domains de Stack Auth** | Al pasar a **activo**, agregar el dominio propio (apex + `www`) a los **Trusted Domains** del proyecto **web** vía la API de Stack Auth (para que el login del comprador funcione en el dominio propio); al **remover/despublicar** el dominio, quitarlo. Idempotente. Distinto de los *redirect URIs de Google* (HU-214) |
| AC-9 | **Binding en la BD, no en Teams** | El vínculo dominio↔tenant vive en `tenants.primary_domain` (**UNIQUE**, anti-takeover; ya existe), ligado al Team vía `tenants.stack_team_id`. Stack Auth **no** liga dominios a Teams (Trusted Domains es lista global del proyecto); el aislamiento lo garantizan **cookies host-scoped + RLS**, no el scope del trust |
| AC-10 | **Cambio/reemplazo mediado por control plane** | El comerciante pide el dominio desde el **admin**, pero la actualización de Trusted Domains usa la **llave de management de Stack Auth** que vive en el **control plane** (nunca en la sesión del comerciante). Flujo al **cambiar** dominio (viejo→nuevo): verificar propiedad (TXT DNS) → cert/CDN → activo: set `primary_domain=nuevo` + add nuevo a Trusted Domains → 301 viejo→nuevo → quitar viejo de Trusted Domains tras gracia. **Verificar la propiedad ANTES de confiar** el dominio (anti-hijack de callbacks). Engancha en la API interna existente (`PATCH /api/internal/tenants/[id]` con `primaryDomain`), que hoy setea el dominio sin verificación → HU-174 lo hace gated por estado |

---

### HU-175 — Dominios de envío de email por tenant (SPF/DKIM/DMARC → verificado) · E17 (toca E8)

> Como comercio, quiero enviar los correos desde mi propio dominio verificado, para entregabilidad y marca.

**Estimación:** L (8 puntos)
**Módulo:** gestión de dominio de envío por tenant, verificación vía proveedor de email (SES/Postmark)
**Estado:** 🔲 Pendiente (roadmap) — extiende HU-161 al modelo multi-tenant

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Alta de dominio de envío | Registros DNS a crear (SPF, DKIM, DMARC, return-path) |
| AC-2 | Máquina de estados | **pendiente → validación DNS → verificado/activo** (sin cert/CDN: es email, no web) |
| AC-3 | Verificación | Vía el proveedor de email activo (HU-159/161); estado visible en el admin de la tienda |
| AC-4 | Activo | Los emails del tenant salen con su `from`/dominio; si falla, cae al dominio de la plataforma |
| AC-5 | Unicidad | Un dominio de envío por tenant; no reutilizable entre tenants |

---

## Detalle · E17 — Facturación por suscripción / SaaS billing (HU-192…194)

> Convierte el control plane en **plataforma SaaS que cobra a sus tenants**. Ojo con la distinción clave: esto es **Merkiai cobrándole al negocio-cliente** por usar la plataforma, y es **independiente** de las pasarelas (Wompi/Bold/Tu Compra/MercadoPago pagos) que cada tenant usa para cobrarle a **sus** compradores. Todo **🔲 (roadmap)**. Depende de HU-172 (control plane) y HU-173 (planes/entitlements).

### HU-192 — Abstracción `BillingProvider` (PayZen · Mercado Pago Suscripciones · Stripe) · E17

> Como plataforma, quiero una interfaz de facturación por suscripción intercambiable (mismo patrón que pagos/envíos/email), para cobrar a los tenants por distintos proveedores sin acoplar el código.

**Estimación:** L (8 puntos)
**Módulo:** `packages/@merkiai/billing` (interfaz + factory), config en control plane
**Estado:** 🔲 Pendiente (roadmap) — **enabler de HU-193/194**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz | `BillingProvider` con `createCustomer`, `createSubscription`, `updateSubscription`, `cancelSubscription`, `getSubscription` y `verifyWebhook` |
| AC-2 | Proveedores | **PayZen**, **Mercado Pago Suscripciones** (recomendado para arranque en CO/COP con métodos locales) y **Stripe** (expansión internacional), registrados en un factory con **proveedor activo** configurable |
| AC-3 | Config | Credenciales + proveedor activo desde el control plane; llaves sensibles vía service_role (no expuestas al plano de tienda) |
| AC-4 | Webhooks firmados | Cada proveedor verifica firma/HMAC + idempotencia (mismo hardening que las pasarelas de pago: fail-closed, replay window, `processed_webhook_events`) |
| AC-5 | Portabilidad | Cambiar de proveedor no cambia el modelo de datos (`plans`/`subscriptions`); el mapeo vive en cada implementación |

---

### HU-193 — Planes, suscripciones y ciclo de vida del tenant · E17

> Como operador, quiero suscribir cada tenant a un plan y que su estado se sincronice con el proveedor de billing, para gobernar el acceso según el pago.

**Estimación:** L (8 puntos)
**Módulo:** tablas `plans` (ext. HU-173) + `subscriptions`, webhooks de billing → estado, control plane
**Estado:** 🔲 Pendiente (roadmap) — usa HU-192; alimenta el plan efectivo de HU-173

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Suscripción por tenant | `subscriptions` (`tenant_id → plan_id`, `status`, `current_period_end`, `provider`, `provider_ref`); un tenant tiene una suscripción activa |
| AC-2 | Ciclo de vida | `status ∈ {trialing, active, past_due, suspended, canceled}` gobernado por los webhooks del proveedor (`payment_failed`, `subscription.updated`, etc.) |
| AC-3 | Plan efectivo | El plan de la suscripción activa determina los entitlements (HU-173); trial expira a `past_due` si no hay pago |
| AC-4 | Prorrateo/cambios | Upgrade/downgrade delega prorrateo al proveedor; el cambio de plan aplica entitlements al confirmarse |
| AC-5 | Auditoría | Cambios de estado y de plan quedan auditados (HU-146) |

---

### HU-194 — Suspensión por impago (dunning + gate de tenant) · E17

> Como operador, quiero pausar el servicio de un tenant que no paga (sin borrar sus datos) y reactivarlo al regularizarse, para proteger el negocio sin penalizar la recuperación.

**Estimación:** M (5 puntos)
**Módulo:** gate de tenant en middleware (`@merkiai/tenancy`), estados de dunning, control plane
**Estado:** 🔲 Pendiente (roadmap) — usa HU-193

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | `past_due` (gracia) | Periodo de gracia configurable: sigue operando con banner/avisos y recordatorios (dunning); reintentos delegados al proveedor |
| AC-2 | `suspended` | Vencida la gracia, el gate pone la tienda en **solo-lectura o página "servicio pausado por facturación"**; storefront público apagado o con aviso |
| AC-3 | Sin pérdida de datos | Suspender **no** borra datos; reactivar restablece el servicio al instante al confirmarse el pago (webhook → `active`) |
| AC-4 | Alcance | El gate aplica al plano de tienda (`apps/web`/`apps/admin`); el control plane sigue accesible para regularizar |
| AC-5 | Auditoría/aviso | Suspensión y reactivación se auditan (HU-146) y notifican al tenant por email (HU-159) |

---

## Detalle · E17 — Niveles de aislamiento de datos + promoción a BD dedicada (HU-200)

> Materializa el **routing de BD por plan** de la Arquitectura de referencia (punto 6): del default *pooled + RLS* a **schema o BD dedicada** según el plan del cliente, gestionado por Merkiai desde el control plane. Todo **🔲 (roadmap)**. Depende de HU-156 (costura `db_ref` + factory) y se acopla a HU-173 (plan) y HU-172 (control plane).

### HU-200 — Niveles de aislamiento de datos (routing por plan) · E17

> Como operador de plataforma, quiero enrutar cada tenant a su almacenamiento según su plan (compartido / schema / BD dedicada) y poder promover un tenant sin reescribir la app, para ofrecer aislamiento y residencia de datos como parte de la oferta comercial.

**Estimación:** XL (13+ puntos)
**Módulo:** `tenants.db_ref` + connection factory (`@merkiai/tenancy`), herramientas de provisioning/migración en el control plane, orquestación de migraciones multi-destino
**Estado:** 🔲 Pendiente (roadmap) — depende de HU-156; se acopla a HU-172/173

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Routing por tenant | El connection factory resuelve el cliente de datos por tenant desde `tenants.db_ref`; **default = BD compartida** (pooled + RLS) |
| AC-2 | Tres niveles | Soporta **compartido** (tablas + RLS), **schema dedicado** (un `schema` por tenant) y **BD/proyecto dedicado** (proyecto Supabase propio o **Neon** a escala) tras el mismo factory |
| AC-3 | Ligado al plan | El nivel es un *entitlement* del plan (HU-173), asignable y observable desde el control plane; residencia de datos por región cuando aplique |
| AC-4 | Promoción sin reescritura | Migrar un tenant `compartido → dedicado` = exportar sus filas (por `tenant_id`) + cambiar `db_ref`, **auditado** (HU-146) y sin downtime perceptible; reversible |
| AC-5 | Migraciones multi-destino | El esquema se versiona y se aplica de forma consistente a **todos** los destinos (BD compartida + schemas + BDs dedicadas) |
| AC-6 | RLS defensa en profundidad | Con BD dedicada la RLS se mantiene igualmente como segunda barrera |
| AC-7 | Observabilidad/costos | Métricas y costo por destino visibles en el control plane (base para pricing del nivel) |

---

## Detalle · E17 — Despliegue e infraestructura dedicada por tenant (HU-360…363)

> **Contexto.** HU-200 enruta la **BD** por plan (compartido / schema / BD dedicada vía `db_ref` + connection factory). Pero ofrecer infraestructura dedicada "de verdad" (servidor propio, residencia de datos, cumplimiento) abre tres huecos que HU-200 no cubre: (1) un **despliegue de app aislado** por cliente, no solo la BD; (2) promover las **variables de entorno de infra** a **config por-tenant gestionada en la consola** (hoy `SUPABASE_URL`/`JWT_SECRET`/`SERVICE_ROLE`/DSN son globales por env); (3) **custodia cifrada de los secretos de esa infra por-tenant** (no en env global ni en texto plano en la BD de plataforma).
>
> **No bloquean el MVP.** Café y fundación salen en **pooled + RLS** (BD compartida). Este tier es para **plan enterprise / residencia de datos**, cuando un cliente lo exija. Todo **🔲 (roadmap)**. Dependen de HU-200 (routing de datos) y HU-172/173 (control plane + plan).

### HU-360 — Modo de despliegue dedicado (app-tier) por tenant · E17

> Como operador, quiero poder desplegar la app de un cliente en una **instancia aislada** (su propio servidor/deploy, no solo su BD), para ofrecer aislamiento de cómputo, residencia y cumplimiento como parte del plan enterprise.

**Estimación:** XL (13+ puntos) · **Módulo:** perfil de despliegue por tenant (`shared` | `dedicated`) en el control plane; plantilla de deploy parametrizada (mismo código, env/config por instancia); enrutamiento de dominio→instancia; runbook de alta/baja · **Estado:** 🔲 Pendiente (roadmap).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Modo por plan | El plan define `deployment_mode` (`shared` por defecto / `dedicated`); visible y asignable desde la consola |
| AC-2 | Mismo código | La instancia dedicada corre **el mismo build**, parametrizada por config/secretos de ese tenant (sin fork de código) |
| AC-3 | Enrutamiento | El dominio del tenant resuelve a su instancia dedicada; el plano compartido no la toca |
| AC-4 | Alta/baja | Aprovisionar y retirar una instancia dedicada es un procedimiento auditado y reversible (runbook) |
| AC-5 | Sin regresión | El modo `shared` (pooled) sigue siendo el default; nada cambia para los tenants compartidos |

### HU-361 — Configuración de infraestructura por-tenant en la consola (env → config) · E17

> Como operador, quiero gestionar desde la consola las **variables de infraestructura por tenant** (endpoint y claves de su BD dedicada, DSN de monitoreo, base URL), para no depender de env globales cuando un tenant tiene infra propia.

**Estimación:** L (8 puntos) · **Módulo:** modelo de config de infra por tenant en la **BD de plataforma** (ligado a `db_ref`), UI en la consola, y resolución en el **connection factory** / arranque de la instancia · **Estado:** 🔲 Pendiente (roadmap) — extiende HU-200 (lado "gestión en consola").

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Modelo por-tenant | Por tenant dedicado: endpoint/anon/service de su BD, `JWT_SECRET` de esa instancia, DSN de Sentry, base URL — en la BD de plataforma, referenciados por `db_ref` |
| AC-2 | Resolución | El connection factory (HU-156) y el arranque resuelven esta config por tenant en runtime; el tenant compartido usa la env global como hoy |
| AC-3 | Consola | Panel para ver/editar la config de infra de un tenant dedicado, gated al operador (Project Permission) |
| AC-4 | Nunca al cliente | Estas variables jamás se exponen al admin del tenant ni al navegador (solo operador + server) |
| AC-5 | Validación | "Probar conexión" antes de activar un destino dedicado (evita dejar un tenant sin BD) |

### HU-362 — Custodia cifrada de secretos de infra por-tenant (vault) · E17 (toca E14)

> Como responsable, quiero que los secretos de infraestructura de cada tenant dedicado (connection strings, service keys, JWT secret) se guarden **cifrados en reposo** y nunca en texto plano ni en env global, para que un compromiso de la BD de plataforma no exponga las infraestructuras de los clientes.

**Estimación:** L (8 puntos) · **Módulo:** cifrado en reposo (Supabase Vault / KMS / gestor externo) para los secretos por-tenant de HU-361; descifrado solo server-side con mínimo privilegio; rotación por-tenant · **Estado:** 🔲 Pendiente (roadmap) — extiende HU-206/228 al caso multi-tenant dedicado.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cifrado en reposo | Los secretos de infra por tenant se almacenan cifrados (Vault/KMS); la BD de plataforma nunca los guarda en claro |
| AC-2 | Acceso mínimo | Solo el proceso server del control plane/instancia los descifra, en memoria, por request; nunca el cliente ni logs |
| AC-3 | Rotación por-tenant | Rotar el secreto de un tenant no afecta a otros; procedimiento auditado (extiende HU-228) |
| AC-4 | Auditoría | Todo acceso/rotación queda auditado (HU-146) y alertable (HU-170) |

### HU-363 — Orquestación de aprovisionamiento de infra dedicada + migración · E17

> Como operador, quiero aprovisionar (y promover) la infraestructura dedicada de un tenant de forma orquestada —crear su BD, migrar sus datos, sembrar y custodiar sus secretos—, para ofrecer el tier dedicado sin pasos manuales frágiles.

**Estimación:** XL (13+ puntos) · **Módulo:** orquestador en el control plane que compone HU-200 (migración/promoción de datos) + HU-361 (config) + HU-362 (secretos), idempotente y con rollback · **Estado:** 🔲 Pendiente (roadmap) — puede ejecutarse como fase final de HU-200.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Alta orquestada | "Promover a dedicado" crea el destino (Supabase/Neon), migra las filas del tenant (HU-200 AC-4), guarda sus secretos (HU-362) y cambia `db_ref` — en un flujo auditado |
| AC-2 | Idempotente + rollback | Si un paso falla, revierte los previos; re-ejecutar no duplica |
| AC-3 | Sin downtime perceptible | La promoción se hace con corte mínimo/ventana controlada; reversible |
| AC-4 | Verificación | Chequeo post-promoción (lectura/escritura acotada al tenant en el nuevo destino) antes de dar por activo |

---

## Detalle · E17 — Abstracción del proveedor de identidad (HU-201)

> Garantiza que migrar de **Stack Auth** a otro proveedor de identidad sea de bajo costo, con el mismo patrón interfaz+factory de pagos/email/billing. Ver `docs/identidad-abstraccion-y-migracion.md`. **🔲 (roadmap; base ya implementada).**

### HU-201 — `IdentityProvider` intercambiable (identidad/RBAC/provisioning) · E17

> Como arquitecto, quiero que la app dependa de una abstracción de identidad y no de Stack Auth directamente, para poder migrar de proveedor escribiendo solo un adaptador.

**Estimación:** L (8 puntos)
**Módulo:** interfaz `@merkiai/tenancy/identity` + adaptador(es) por proveedor; consumidores (guards, provisioning) vía la interfaz
**Estado:** 🔲 Pendiente (roadmap) — **base implementada:** interfaz `IdentityProvider` + adaptador Stack Auth (console) + `platform-auth` refactorizado a la interfaz

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz agnóstica | `getCurrentUser`, `hasPlatformPermission`, `hasOrgPermission`, provisioning (`createOrg`/`addMember`/`grantOrgPermission`/`inviteMember`/`setOrgMetadata`) con vocabulario neutral (org = tenant) |
| AC-2 | Adaptador | Implementación Stack Auth **parametrizable por proyecto** (sesión = console; provisioning de orgs = proyecto admin); único archivo acoplado al proveedor |
| AC-3 | Consumidores agnósticos | Guards, provisioning y onboarding usan la interfaz; migrar = nuevo adaptador + SDK cliente/handler + config del dashboard |
| AC-4 | Portabilidad de datos | Aislamiento en RLS por claim `tenant_id` (no en el proveedor); permisos por IDs neutrales (`platform:operate`, `store:admin`) |
| AC-5 | Provisioning por API vs dashboard | Documentado qué se automatiza por API (crear org, miembros, permisos, metadata) vs qué es solo dashboard (definición de permisos, OAuth, MFA, plantillas, JWT keys, dominios) |

---

