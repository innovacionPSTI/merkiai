# Detalle · Vertical Servicios/Educación — E20, E21, E22 + Portal Institucional E23

> **Origen.** Análisis de referencia de las propuestas FUNIAJC (CMS WordPress vs. Next.js a medida). La Propuesta B *es* la arquitectura de Merkiai; el vertical "servicios/educación" se cubre **añadiendo módulos gated por plan**, sin cambiar el concepto. Hotmart y canales externos cerrados quedan **fuera** por decisión de negocio.
>
> **Principios transversales (aplican a todas las HU de este archivo):**
> - **Esencia Merkiai:** módulos *opt-in por plan* (entitlements, HU-173/239), proveedores *swappables* (mismo patrón pagos/envíos/email/billing), montados sobre el **Constructor + motor CMS** (`page_sections`/`section_items`, schema-driven) y **multi-tenant con RLS**.
> - **Guarded / no romper la tienda viva:** toda lógica de dinero/estado corre solo si la tienda tiene el módulo configurado; el checkout de **pago único** actual (vps-coffee) queda intacto.
> - **Server-authoritative:** montos, estados y transiciones se recomputan/validan en el servidor; los webhooks son la fuente de verdad del ciclo de vida.
> - **Aislamiento dedicado (servidor/BD propia):** **no es épica nueva** — es **HU-200** (E17, niveles de aislamiento por plan vía `db_ref` + connection factory, costura ya preparada en HU-156 AC-7). Este vertical es un *consumidor* de ese nivel de aislamiento, no lo reimplementa.

---

## Épica E20 — Servicios y cobros recurrentes

> Correr y **cobrar servicios de forma recurrente** (matrículas, cuotas, membresías) desde el storefront del tenant, con **su** pasarela. **Distinto del billing SaaS de E17** (ese cobra Merkiai→tenant; esto cobra tenant→su cliente final).

### HU-310 — Abstracción de cobro recurrente (`RecurringCharge`) sobre los proveedores de pago · E20

> Como plataforma, quiero una costura de **cobro recurrente/tokenización** sobre los proveedores de pago existentes (mismo patrón swappable), para habilitar matrículas/cuotas sin acoplar el código a una pasarela.

**Estimación:** L (8 puntos) · **Módulo:** extensión de la abstracción de pagos (`integration_instances`/registry) con capacidad `recurring`; interfaz `createRecurringToken`/`chargeToken`/`scheduleCharge`/`cancelRecurring` + `verifyWebhook` · **Estado:** 🔲 Pendiente — *enabler* de HU-312/313.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Capacidad declarada | Cada proveedor declara si soporta recurrencia/tokenización (Wompi, Mercado Pago sí; Tu Compra/Bold según API); el registry lo expone |
| AC-2 | Interfaz swappable | `RecurringProvider` con tokenización, cobro por token, programación y cancelación; factory con proveedor activo por tenant |
| AC-3 | Sin PCI en servidor | La tokenización ocurre en el proveedor (SAQ A); Merkiai nunca almacena PAN/CVV |
| AC-4 | Guarded | Sin módulo recurrente configurado, el checkout actual (pago único) no cambia |

### HU-311 — Membresía/inscripción mínima (anclaje del cobro) · E20

> Como operador, quiero una entidad **membresía/inscripción** con estado, para saber quién está matriculado/activo y gatear/reportar — anclaje de los cobros recurrentes (**Opción 2** del análisis).

**Estimación:** M (5 puntos) · **Módulo:** tablas `memberships` (`tenant_id`, `customer_id`, `item_ref`, `status`, `started_at`, `current_period_end`, `provider_ref`) + RLS; capa de datos + ciclo de estado puro y testeable · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Entidad mínima | `membership` liga `customer ↔ item/programa` con `status` (`active/past_due/suspended/ended`) y vigencia; `tenant_id` + RLS |
| AC-2 | Ciclo gobernado por pago | El estado lo mueven los eventos de cobro (HU-313), no edición manual libre (salvo acción administrativa auditada) |
| AC-3 | Costura a futuro | Diseñada para que un **tipo de producto "plan"** (futuro, Opción 3) la cree automáticamente, sin reescritura |
| AC-4 | Reportable | Consultas "activos / morosos / dados de baja" por tenant |

### HU-312 — Planes de pago / matrícula en el checkout (server-side, guarded) · E20

> Como comprador, quiero inscribirme y pagar una matrícula (única con cuotas, o recurrente), para acceder al servicio/programa.

**Estimación:** L (8 puntos) · **Módulo:** flujo de checkout que crea `membership` + token recurrente + primer cobro; recomputa montos server-side · **Estado:** 🔲 Pendiente — usa HU-310/311.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Alta de matrícula | Checkout crea la membresía (`active`/`trialing`), tokeniza y hace el **primer cobro** con la pasarela del tenant |
| AC-2 | Montos autoritativos | Precio/periodicidad se leen de la BD (no del cliente); misma filosofía del checkout actual |
| AC-3 | Guarded | Solo aplica a ítems marcados como recurrentes; el resto del checkout no cambia |
| AC-4 | Idempotencia | Reintento del mismo intento no duplica membresía ni cobro (patrón HU-298) |

### HU-313 — Webhooks de recurrencia → estado de membresía + reintentos (dunning) · E20

> Como plataforma, quiero que los eventos del proveedor gobiernen el estado de la membresía y gestionen reintentos de cobro, para reflejar la realidad de pago sin intervención manual.

**Estimación:** L (8 puntos) · **Módulo:** webhooks de recurrencia por proveedor → transición de `membership.status`; cobros programados + reintentos con backoff; `email_log` + auditoría · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pago exitoso | `active`; registra el cobro y notifica (reutiliza plantillas de correo HU-160 + `email_log` HU-162) |
| AC-2 | Impago | `past_due` → reintentos; tras N fallos `suspended`; avisos al cliente |
| AC-3 | Cancelación | Fin de ciclo o cancelación → `ended`; sin más cobros |
| AC-4 | Firma + idempotencia | Webhook firmado y deduplicado por evento (patrón de webhooks de pago existente) |

### HU-314 — Portal del cliente: gestión de su matrícula · E20

> Como cliente, quiero ver y gestionar mi matrícula/membresía (estado, próximas cuotas, método de pago, cancelar según política), desde Mi Cuenta.

**Estimación:** M (5 puntos) · **Módulo:** sección en `/account` + endpoints scoped por sesión/tenant · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Visibilidad | El cliente ve su estado, historial de cobros y próximo cargo |
| AC-2 | Autogestión | Puede actualizar método de pago y cancelar según la política del tenant (configurable) |
| AC-3 | Scoping | Solo ve lo suyo (RLS/propiedad por sesión), nunca de otros |

### HU-315 — Preset + plan "Servicios/Educación" · E20

> Como operador, quiero un preset y un plan que activen el vertical de servicios, para aprovisionar este tipo de tienda sin trabajo manual.

**Estimación:** S (3 puntos) · **Módulo:** preset de nicho (HU-233/235) + entitlements del plan (HU-173/239) que encienden E20/E21/E22 · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Preset | Secciones/página de arranque orientadas a servicios/educación (servicios, programas, landing, contacto) |
| AC-2 | Plan | Entitlements que activan cobros recurrentes, formularios/trámites y marketing según el plan contratado |

---

## Épica E21 — Formularios, trámites y certificados

> Captura de demanda (formularios/leads/landing) y **gestión de trámites** con emisión de **certificados**. El motor de trámites **generaliza HU-107a (RMA de devoluciones)**, que ya es un flujo *solicitud → revisión → estados → notificación*.

### HU-320 — Form builder como bloque del Constructor · E21

> Como comerciante, quiero construir formularios configurables (campos, validación, obligatoriedad) como un bloque más del Constructor, para capturar información sin pedir desarrollo.

**Estimación:** L (8 puntos) · **Módulo:** tipo de bloque "formulario" schema-driven (sobre `page_sections`/`section_items`) + definición de campos + render en storefront + envío server-side · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Builder-first | El formulario es un bloque del Constructor (no un componente a medida); viaja en los paquetes de Plantilla/Preset |
| AC-2 | Campos configurables | Texto, email, teléfono, select, checkbox, archivo (opcional), con validación y requeridos |
| AC-3 | Envío seguro | Validación server-side, anti-spam/rate-limit (patrón HU-300), consentimiento (HU-152) |
| AC-4 | Multi-tenant | Definición y envíos scoped por `tenant_id` + RLS |

### HU-321 — Captura y bandeja de leads · E21

> Como equipo de marketing/admisiones, quiero ver y exportar los envíos de formularios (leads) y recibir notificación, para gestionarlos.

**Estimación:** M (5 puntos) · **Módulo:** tabla `leads` + bandeja en admin (listado/filtros/export CSV) + notificación (correo) · **Estado:** 🔲 Pendiente — se apoya en HU-320.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Almacén | Cada envío queda como `lead` con origen (formulario/landing) y metadatos de campaña (UTM, enlaza con HU-331) |
| AC-2 | Bandeja admin | Listado paginado, filtros, detalle y export CSV; gated por permiso |
| AC-3 | Notificación | Aviso al equipo (reutiliza infra de correo); best-effort |

### HU-322 — Motor de trámites/solicitudes configurable (generaliza HU-107a) · E21

> Como operador, quiero un motor genérico de solicitudes con estados, adjuntos, revisión y notificaciones, para resolver certificación por experiencia y cualquier otro trámite sin construir cada flujo a medida.

**Estimación:** XL (13 puntos) · **Módulo:** `request_types` (definición de flujo + estados) + `requests` (instancias, adjuntos en storage, historial de estado) + panel de revisión + notificaciones por estado + auditoría. **Refactor:** la devolución (HU-107a) pasa a ser una instancia de este motor · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Flujo configurable | Estados definibles por tipo de trámite (ej. `pendiente/en revisión/aprobado/rechazado`) con transiciones válidas |
| AC-2 | Solicitud pública | Formulario de solicitud con **adjuntos** (CV, soportes) a storage; scoping por tenant |
| AC-3 | Panel de revisión | El equipo cambia estado con comentarios; cada cambio **notifica** al solicitante y queda **auditado** (HU-146) |
| AC-4 | Generalización | HU-107a (RMA) se modela como un `request_type`, sin perder su comportamiento actual |

### HU-323 — Certificados digitales (PDF + verificación pública) · E21

> Como operador, quiero emitir certificados en PDF con datos dinámicos y una URL pública de verificación, para entregar y autenticar constancias.

**Estimación:** L (8 puntos) · **Módulo:** plantilla de certificado + generación PDF server-side con datos del solicitante/membresía + `certificates` (id público, hash) + página de verificación · **Estado:** 🔲 Pendiente — se apoya en HU-322 (y opcionalmente HU-311).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Emisión | Al aprobar un trámite (o completar un programa), se genera el **PDF** con datos dinámicos |
| AC-2 | Verificación | URL pública `/<verify>/<id>` confirma autenticidad (id + hash); no expone PII innecesaria |
| AC-3 | Historial | Certificados emitidos listados en el panel; revocables (auditado) |

### HU-324 — Landing pages / lead magnet · E21

> Como marketing, quiero landing pages duplicables con formulario de captura y Open Graph, para campañas de lead magnet.

**Estimación:** S (3 puntos) · **Módulo:** tipo de página "landing" en el Constructor + bloque de formulario (HU-320) + OG configurable; duplicable vía paquete de página (HU-255) · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Duplicable | Landing como página del Constructor, clonable desde el panel |
| AC-2 | Captura | Incluye bloque de formulario → lead (HU-320/321) con atribución de campaña (HU-331) |
| AC-3 | Compartible | Open Graph/metadatos configurables por landing |

---

## Épica E22 — Marketing & Analytics (transversal)

> Infraestructura de marketing **propia y swappable**. Conecta campañas con landing pages/formularios e inscripciones. **Sin canales externos cerrados (Hotmart excluido).**

### HU-330 — Gestor de píxeles/tracking + consentimiento · E22

> Como marketing, quiero configurar píxeles y analítica (GA4, Meta Pixel, Microsoft Clarity, LinkedIn) desde el panel, respetando el consentimiento, para medir sin pedir desarrollo.

**Estimación:** M (5 puntos) · **Módulo:** config por tenant (`store_config`/instancias) de IDs de tracking + inyección condicionada a **consentimiento** (HU-152) + eventos estándar (PageView, Lead, InitiateCheckout, Purchase) · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Config sin código | IDs de GA4/Meta/Clarity/LinkedIn desde el panel, por tenant |
| AC-2 | Consentimiento | No se cargan scripts sin consentimiento (HU-152); privacidad por defecto |
| AC-3 | Eventos | Eventos de conversión emitidos en checkout y formularios |

### HU-331 — Atribución UTM/campaña ligada a leads e inscripciones · E22

> Como marketing, quiero saber de qué campaña vino cada lead/inscripción, para medir ROI.

**Estimación:** M (5 puntos) · **Módulo:** captura de UTM/origen (cookie/sesión) + persistencia en `lead`/`membership`/`order` + reporte · **Estado:** 🔲 Pendiente — enlaza E20/E21.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Captura | UTM/origen capturado en el primer toque y conservado hasta la conversión |
| AC-2 | Enganche | El origen queda en el lead (HU-321), la inscripción (HU-311) y el pedido |
| AC-3 | Reporte | Conversiones por campaña/fuente en el panel |

### HU-332 — Nurturing / email-marketing swappable (generaliza HU-163) · E22

> Como marketing, quiero conectar un proveedor de email-marketing (Brevo y similares) y disparar secuencias por evento de lead, para nutrir prospectos.

**Estimación:** M (5 puntos) · **Módulo:** **generaliza `NewsletterProvider` (HU-163)** a un `MarketingProvider` swappable (crear contacto, tags por comportamiento, disparar secuencia); config por tenant · **Estado:** 🔲 Pendiente — reutiliza HU-163.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Swappable | Interfaz de proveedor (Brevo, ConvertKit, Mailchimp…) con proveedor activo por tenant; sin acoplar el código |
| AC-2 | Eventos → secuencias | Un lead nuevo/evento dispara la secuencia configurada (bienvenida, seguimiento, recordatorio) |
| AC-3 | Sin canal cerrado | No incluye marketplaces externos cerrados (Hotmart queda fuera) |

---

## Épica E23 — Portal Institucional (tipo UdeA) · horizonte, largo plazo

> **CMS de portal a gran escala**, no una tienda con páginas. Se construye sobre el núcleo (Constructor + multi-tenant + plantillas) **sin reescribir**, y se aborda **después** del vertical servicios. Las HU son de **dimensionamiento** (se detallarán al priorizar la épica).

### HU-340 — Tipos de contenido de portal · E23 *(horizonte)*

> Noticias/eventos, dependencias/facultades, directorios de personas, normativa/documentos como tipos de contenido de primera clase, editables desde el panel.

**Estado:** 🔲 Horizonte. **Nota:** se apoya en el motor CMS schema-driven; el reto es el **volumen de tipos** y sus relaciones.

### HU-341 — Multiportal / sub-portales + navegación jerárquica profunda · E23 *(horizonte)*

> Varios sub-portales bajo un mismo dominio (p. ej. facultades), con navegación jerárquica de varios niveles y herencia de plantilla/tema.

**Estado:** 🔲 Horizonte.

### HU-342 — Buscador y agregadores de contenido + portada dinámica · E23 *(horizonte)*

> Buscador del portal, listados/agregadores (últimas noticias, próximos eventos) y portada compuesta por módulos dinámicos.

**Estado:** 🔲 Horizonte.

### HU-343 — Zonas autenticadas (intranet) + accesibilidad AA + multi-idioma · E23 *(horizonte)*

> Secciones privadas (intranet), **accesibilidad AA** (exigencia del sector público/educativo) y **multi-idioma** apoyándose en E2·i18n (HU-114).

**Estado:** 🔲 Horizonte.

---

## Dependencias y orden sugerido (olas)

1. **Ola A (enablers del vertical):** HU-310 (recurrente) → HU-311 (membresía) → HU-312 (checkout) → HU-313 (webhooks/dunning). En paralelo: HU-320 (form builder) → HU-321 (leads).
2. **Ola B (trámites + marketing):** HU-322 (motor de trámites, incl. refactor de HU-107a) → HU-323 (certificados); HU-330/331/332 (marketing/analytics); HU-324 (landing); HU-314 (portal cliente); HU-315 (preset+plan).
3. **Complemento plataforma:** **HU-200** (aislamiento dedicado, E17) cuando un cliente requiera servidor/BD propia.
4. **Horizonte:** **E23** (Portal Institucional) tras consolidar el vertical servicios.
