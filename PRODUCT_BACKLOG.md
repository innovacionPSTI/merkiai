# Merkiai — Product Backlog & Documentación de Producto

> **Producto:** Merkiai — plataforma de e-commerce general y personalizable (white-label)  
> **Desarrollo:** Parquesoft TI  
> **Versión:** 1.3 · Agosto 2026 (Pasarela única · Bold · Validación manual de pago)  
> **Stack:** Next.js 16 · Supabase · Stack Auth · Tailwind CSS · Turborepo  
> **Pilares:** CMS + e-commerce · integraciones intercambiables (pagos/envíos/email) · componentes de IA

---

## 1. Objetivos del Proyecto

### 1.1 Objetivo General

Desarrollar una plataforma de e-commerce **general y reutilizable** que permita a cualquier negocio vender productos en línea, gestionar su contenido (páginas, secciones, blog, servicios) y administrar el negocio desde un panel, con **integraciones intercambiables** de pagos, envíos y email seleccionables sin código, una **arquitectura extensible con componentes de IA**, y una identidad visual configurable por instancia. El catálogo, los textos y ejemplos de este documento (café, maquila, asesorías) son ilustrativos de una instancia posible, no un vertical obligatorio de la plataforma.

---

### 1.2 Objetivos Específicos

#### Producto — Sitio Público

**OE-01 — Canal de venta directa**
Habilitar una tienda en línea funcional (CMS e-commerce general) que permita al consumidor final explorar, filtrar, seleccionar y comprar productos con variantes, integrando pasarelas de pago colombianas — Wompi, MercadoPago, **Tu Compra** (integrador REST) y **Bold** — con una activa a la vez.

**OE-02 — Experiencia de compra fluida**
Implementar un flujo de compra completo —carrito persistente, checkout de tres pasos, confirmación de orden y seguimiento de pedido— que minimice la fricción y maximice la conversión.

**OE-03 — Posicionamiento de servicios B2B**
Crear páginas dedicadas para los servicios de Maquila & Tueste y Asesorías Profesionales con información detallada y acceso directo a cotización vía WhatsApp, captando clientes empresariales sin requerir transacción en línea.

**OE-04 — Generación de contenido y SEO**
Proveer un módulo de blog editorial ("Notas de Café") para publicar contenido de valor sobre café de especialidad, mejorar el posicionamiento orgánico en buscadores y construir comunidad alrededor de la marca.

**OE-05 — Construcción de base de clientes**
Permitir el registro e inicio de sesión de clientes para acceder a historial de pedidos y datos personales, y capturar correos electrónicos a través de un formulario de suscripción al boletín.

**OE-06 — Logística integrada**
Integrar la API de Skydropx para cotizar tarifas de envío en tiempo real durante el checkout, generar guías automáticamente tras el pago y actualizar el estado del pedido mediante webhooks.

#### Producto — Panel de Administración

**OE-07 — Gestión centralizada del catálogo**
Ofrecer un CRUD completo de productos con soporte para múltiples variantes (tueste × peso × molienda × método), control de inventario y carga de imágenes a Supabase Storage.

**OE-08 — Gestión operativa de pedidos**
Permitir al equipo de Merkiai visualizar todos los pedidos, actualizar su estado en un flujo definido (Pendiente → Procesando → Enviado → Entregado), descargar guías de envío y programar recolecciones masivas con Skydropx.

**OE-09 — Control de contenido editorial**
Brindar un panel para crear, editar, publicar y despublicar artículos del blog con previsualización antes de publicar.

**OE-10 — Configuración de banners y hero**
Permitir gestionar los slides del carrusel hero y las imágenes de las secciones de servicios sin requerir cambios de código.

**OE-11 — Control de accesos por roles**
Implementar un sistema de roles (super_admin, admin, editor, customer) con Row Level Security en Supabase, de modo que cada usuario solo acceda a las secciones que le corresponden.

#### Técnicos

**OE-12 — Arquitectura escalable en monorepo**
Estructurar el proyecto como monorepo Turborepo con dos aplicaciones (web pública + admin) y paquetes compartidos (UI, base de datos, configuración), facilitando el mantenimiento y la adición de nuevas apps a futuro.

**OE-13 — Rendimiento y SEO técnico**
Aplicar Incremental Static Regeneration (ISR) en páginas de catálogo y blog, generar metadatos dinámicos por página, y configurar sitemap.xml y robots.txt para maximizar la indexación.

**OE-14 — Seguridad y cumplimiento**
Proteger las rutas del panel admin y el área de cliente mediante middleware de autenticación con Stack Auth, aplicar políticas RLS en todas las tablas de Supabase y manejar secrets únicamente como variables de entorno o mediante tablas singleton accesibles solo con `service_role_key`.

**OE-15 — Integridad referencial y buenas prácticas de base de datos**
Garantizar que el modelo de datos tenga claves foráneas explícitas con políticas ON DELETE apropiadas, índices compuestos para los patrones de consulta más frecuentes, CHECK constraints para enumeraciones críticas, triggers `updated_at` para auditoría, y comentarios de tabla/columna que documenten el esquema directamente en la base de datos. El esquema debe ser expresable como un único archivo canónico ejecutable en Supabase desde cero.

**OE-16 — CMS unificado sin modelos paralelos**
Consolidar todo el contenido gestionable (banners, secciones del home, testimonios, páginas de servicios, páginas legales) en el modelo único `pages → page_sections → section_items`, eliminando cualquier tabla paralela que represente conceptos equivalentes. El admin debe tener una sola interfaz para editar cualquier contenido sin ambigüedad.

---

## 2. Product Backlog

> **Leyenda de estado** (criterio validado ago-2026: código + cableado + pruebas): **✅** = implementado con pruebas unitarias/integración definidas · **🟡** = implementado y cableado, **sin pruebas** definidas · **🔲** = no implementado.

### 2.0 Mapa de Épicas (v2 — organización por dominio)

> **Reorganización (ago-2026):** el backlog se reagrupa **por dominio** para eliminar colisiones de numeración y la dispersión de temas. La antigua *Épica 15 — Proveedores intercambiables* se **disuelve**: sus HU transversales se reparten a Pagos, Envíos y Emails. Las tablas y secciones de detalle más abajo conservan su contenido histórico; **este mapa es la fuente de verdad de la organización**.

**Plataforma y arquitectura**

| Épica (v2) | Alcance | HU / códigos |
|-----------|---------|--------------|
| **E1 · Fundación e infraestructura** | Monorepo Turborepo, DB Supabase, RLS, Storage, Stack Auth base, envs | F-01…10 |
| **E2 · Arquitectura y CMS unificado** | Refactor limpio, modelo `pages → page_sections → section_items`, integridad DB, generalización, export/import · *(roadmap: i18n [114a/b/c], biblioteca de medios, import/export extensible, historial de versiones; **preparación para servicios: bounded contexts + contratos, eventos de dominio + outbox, propiedad de datos por dominio**)* | HU-044…057, migraciones canónicas, HU-114a/b/c, HU-115/123/127/165, **HU-195/196/197** 🔲 |

**Sitio público**

| Épica (v2) | Alcance | HU / códigos |
|-----------|---------|--------------|
| **E3 · Sitio público: layout, home y navegación** | Navbar, footer, 404, mantenimiento, hero, secciones del home, newsletter · *(roadmap: plantillas de diseño, variantes de disposición [122a/b/c], preview/publish, paquetes de plantilla, accesibilidad)* | N-01…07, H-01…08, HU-121, HU-122a/b/c, HU-128/129/154 🔲 |
| **E4 · Tienda y catálogo** | Grid, filtros dinámicos, PDP, variantes genéricas · *(roadmap: reseñas, búsqueda, wishlist, filtro de precio, bundles/kits)* | T-01…15, HU-101…104, HU-168 🔲 |
| **E5 · Carrito** | Store Zustand, drawer, cupón, envío gratis, sync con BD · *(roadmap: carrito abandonado, motor de descuentos/promociones)* | C-01…08, HU-109/147 🔲 |
| **E10 · Blog** | Listado, artículo, SEO por post, draft mode | B-01…08 |
| **E11 · Páginas de contenido y servicios** | Landing configurables vía CMS (maquila/asesorías como instancia de ejemplo) | SV-01…06 |

**Comercio y operación**

| Épica (v2) | Alcance | HU / códigos |
|-----------|---------|--------------|
| **E6 · Pagos y pasarelas** | Checkout 3 pasos; pasarela única (`active_provider`); Wompi, MercadoPago, **Tu Compra integrador** (PSE/Nequi/Daviplata/Referenciado), **Bold**; webhooks firmados + **anti-forja/anti-subpago/idempotencia**; confirmación con estado real; validación manual del admin; fallback/reconcile · *(roadmap: devoluciones/reembolsos [107a/b], pasarela internacional, gift cards/saldo, impuestos multi-región)* | P-01…12, PRV-04…07, HU-082…096 (pagos), HU-107a/b, HU-108/148/149, HU-164 (pricing) / HU-166 (DIAN), HU-188a…e (Tu Compra integrador) / HU-189 (UX config pagos) / HU-190 (hardening webhooks) |
| **E7 · Envíos** | Skydropx (OAuth, cotización, guías, webhook, pickups), tarifa fija, proveedor intercambiable, UX de tarifas · *(roadmap: click & collect)* | S-01…08, PRV-01…03, HU-110 🔲 |
| **E8 · Emails y newsletter** | Resend, plantillas, proveedor intercambiable, newsletter broadcast · *(roadmap: notificaciones multicanal WhatsApp/SMS, EmailProvider multi-proveedor [SES/Postmark/SMTP], plantillas editables, entregabilidad/DKIM + suppression, email_log, newsletter externo Beehiiv y similares)* | E-01…05, PRV-08/09, HU-153/159/160/161/162/163 🔲 |
| **E9 · Inventario y stock** | Descuento/reposición por estado de pago, backorder, topes de cantidad en el front · *(roadmap: back-in-stock, alertas de stock bajo)* | HU-097…100, HU-105/106 🔲 |
| **E18 · Inventario multi-ubicación y fulfillment** *(roadmap)* | Ubicaciones (bodegas/tiendas/puntos de retiro), stock por `(variante, ubicación)`, ruteo de fulfillment, transferencias, click & collect por ubicación; incluye migración del stock único actual | HU-176…183 🔲 |

**Cuentas y administración**

| Épica (v2) | Alcance | HU / códigos |
|-----------|---------|--------------|
| **E12 · Autenticación y Mi Cuenta** | Login/register (Stack Auth), pedidos, perfil, direcciones, tracking · *(roadmap: login social, reorder, consulta como invitado, portabilidad/borrado de datos, fidelización/puntos)* | A-01…10, HU-060, HU-111/112/150/151/167 🔲 |
| **E13 · Panel de administración** | CRUD catálogo/pedidos/contenido, roles, configuración, temas, newsletter, export/import · *(roadmap: reportes exportables, drag-and-drop de secciones, carga CSV de productos, drag generalizado, export CSV, acciones masivas, importadores CSV, onboarding/setup wizard)* | AD-01…38, HU-116/120/124/126/130/131/132/169 🔲 |
| **E14 · Despliegue, seguridad e identidad del panel** | Vercel + CI/CD, hardening (rate limit, CSP, firmas), favicon, colores del admin, responsive · *(roadmap: 2FA, registro de auditoría, respaldos + restore programado, RBAC de datos, consentimiento de cookies, monitoreo de errores/APM, hardening PCI DSS)* | HU-061…064, HU-079…081, HU-117/125/133/134/146/152/170, HU-184…187 (PCI) 🔲 |

**Transversales**

| Épica (v2) | Alcance | HU / códigos |
|-----------|---------|--------------|
| **E15 · SEO y rendimiento** | Metadata, sitemap, robots, ISR, OG/Twitter, JSON-LD, analytics · *(roadmap: gestor de redirects 301, monitoreo Core Web Vitals)* | SEO-01…09, HU-080, HU-113/155 🔲 |
| **E16 · Aplicación inteligente (IA)** *(roadmap)* | Capa de IA transversal: cimientos (proveedor swappable, eventos, vector store) + features (generación de contenido, asistente de compra [138a/b], búsqueda semántica/visual, personalización, clustering, patrones de compra, apariencia por chat, generación de imágenes, detección de fraude) | IA-01…03, HU-118/119, HU-135…145 🔲 |

**Plataforma multi-tienda**

| Épica (v2) | Alcance | HU / códigos |
|-----------|---------|--------------|
| **E17 · Plataforma multi-tienda (multi-tenant) + SaaS** *(roadmap)* | Varias tiendas (tenants) desde un mismo despliegue. **Aislamiento por tenant con RLS como frontera dura** (JWT con claim `tenant_id`, patrón oficial Hexclave↔Supabase; rol `authenticated`/`anon` sujeto a RLS, service-role solo en control plane; GUC como fallback server-only). Resolución por dominio/subdominio, panel multi-tienda. Nuevo **plano de plataforma**: `apps/console` (operador SaaS, con **BD de plataforma en proyecto Supabase propio**: registro de tenants/planes/subscripciones/`db_ref`) + packages `@merkiai/tenancy` (contexto + entitlements + connection factory) y `@merkiai/billing` (suscripción). `apps/web` y `apps/admin` comparten la BD del plano de tienda. Incluye **planes/entitlements**, **facturación por suscripción** (BillingProvider intercambiable: PayZen · Mercado Pago Suscripciones · Stripe), **suspensión por impago**, **niveles de aislamiento de datos por plan** (compartido/schema/BD dedicada vía `db_ref` + connection factory) y **dominios** (web custom DNS→cert→CDN→activo y dominios de envío). Spike de auth+RLS previo | HU-171 (spike auth+RLS), HU-156/157/158, HU-172/173/174/175, **HU-192/193/194 (billing)**, **HU-200 (aislamiento por plan)** 🔲 |

> **Nota:** algunas HU son transversales y aparecen en su épica primaria (p. ej. HU-080 JSON-LD vive en E15 SEO aunque toca la PDP). Los códigos históricos (F-, N-, T-, PRV-, etc.) se conservan; las secciones de detalle 2.x son un apéndice de historias.

---

### Épica 1 — Fundación e Infraestructura

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| F-01 | Configurar monorepo Turborepo con pnpm workspaces | Alta | ✅ |
| F-02 | Definir design system: colores, tipografía, componentes base | Alta | ✅ |
| F-03 | Crear schema de base de datos con todas las tablas y relaciones (incluye `customers` y `customer_addresses`) | Alta | ✅ |
| F-04 | Implementar RLS (Row Level Security) en Supabase | Alta | ✅ |
| F-05 | Configurar buckets de Storage en Supabase | Alta | ✅ |
| F-06 | Integrar Stack Auth para autenticación | Alta | ✅ |
| F-07 | Crear middleware de protección de rutas por rol | Alta | ✅ |
| F-08 | Configurar variables de entorno y .env.example documentado | Alta | ✅ |
| F-09 | Configurar fuentes personalizadas Ahsing y Geeeki | Alta | ✅ |
| F-10 | Definir seed data inicial (categorías y banners) | Media | ✅ |

---

### Épica 2 — Sitio Público — Layout y Navegación

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| N-01 | Navbar global con logo, links y sticky scroll | Alta | ✅ |
| N-02 | Menú hamburger para móvil con drawer lateral | Alta | ✅ |
| N-03 | Iconos de cuenta y carrito con badge numérico | Alta | ✅ |
| N-04 | Footer con links, WhatsApp y redes sociales (Instagram, Facebook, TikTok) con iconos SVG — habilitables y configurables desde admin | Alta | ✅ |
| N-05 | Página 404 personalizada con estilo VPS | Media | ✅ |
| N-06 | Página de mantenimiento con logo VPS | Baja | ✅ |
| N-07 | Breadcrumb dinámico en páginas internas | Media | ✅ |

---

### Épica 3 — Home

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| H-01 | Hero carrusel con autoplay, fade, dots y flechas; imagen separada para mobile/desktop | Alta | ✅ |
| H-02 | Sección de productos destacados (grid 3 columnas) | Alta | ✅ |
| H-03 | Sección de servicios Maquila y Asesorías (split) | Alta | ✅ |
| H-04 | Preview de tienda con categorías y collage | Media | ✅ |
| H-05 | Sección Historia / "Vivir para Servir" | Media | ✅ |
| H-06 | Preview del blog con últimos artículos | Media | ✅ |
| H-07 | Formulario de suscripción al newsletter | Media | ✅ |
| H-08 | ISR (revalidación cada 60 segundos) | Alta | ✅ |

---

### Épica 4 — Tienda y Catálogo

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| T-01 | Página de tienda con grid de productos | Alta | ✅ |
| T-02 | Filtros por tueste, peso y método de preparación | Alta | ✅ |
| T-03 | Ordenamiento por destacados, precio ascendente/descendente | Media | ✅ |
| T-04 | URL params sincronizados con filtros activos | Media | ✅ |
| T-05 | Página de detalle de producto con galería de imágenes | Alta | ✅ |
| T-06 | Selector de variantes (tueste, peso, molienda) | Alta | ✅ |
| T-07 | Selector de cantidad con botones +/− | Alta | ✅ |
| T-08 | Badges de confianza (envío gratis, garantía, devoluciones) | Media | ✅ |
| T-09 | Sección de productos relacionados | Media | ✅ |
| T-10 | Imágenes con recorte en arco estilo Pergamino | Media | ✅ |
| T-11 | Rutas de producto dinámicas con `force-dynamic` (nuevos productos visibles sin redeploy) | Alta | ✅ |
| T-12 | Metadatos SEO dinámicos por producto | Alta | ✅ |
| T-13 | Sidebar de filtros: panel sticky desktop + drawer mobile deslizable | Alta | ✅ |
| T-14 | Filtros dinámicos generados desde `variant_options` de los productos activos | Alta | ✅ |
| T-15 | "Desde $X" en tarjetas con múltiples precios; swatches de color para atributos de color | Media | ✅ |

---

### Épica 5 — Carrito de Compras

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| C-01 | Store de carrito con Zustand + persistencia en localStorage | Alta | ✅ |
| C-02 | Drawer lateral del carrito accesible desde cualquier página | Alta | ✅ |
| C-03 | Agregar/eliminar/actualizar cantidad desde el drawer | Alta | ✅ |
| C-04 | Página de carrito completa con resumen de pedido | Alta | ✅ |
| C-05 | Envío gratis configurable desde admin: toggle habilitar/deshabilitar + monto mínimo editable; barra de progreso en carrito | Media | ✅ |
| C-06 | Campo de cupón de descuento | Media | ✅ |
| C-07 | Sincronización del carrito con BD para usuarios logueados | Media | ✅ |
| C-08 | Cierre del drawer con tecla Escape y bloqueo de scroll | Alta | ✅ |

---

### Épica 6 — Checkout y Pagos

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| P-01 | Checkout de 3 pasos en una sola página (sin recarga) | Alta | ✅ |
| P-02 | Formulario de contacto (email) | Alta | ✅ |
| P-03 | Formulario de dirección de envío | Alta | ✅ |
| P-04 | Selector de método de pago (Wompi / MercadoPago) | Alta | ✅ |
| P-05 | Creación de orden en Supabase al confirmar | Alta | ✅ |
| P-06 | Página de confirmación de pedido con número de orden | Alta | ✅ |
| P-07 | Integración real de Wompi (hosted checkout con firma SHA256) | Alta | ✅ |
| P-08 | Integración real de MercadoPago (preference + redirect) | Alta | ✅ |
| P-09 | Webhook Wompi — actualización automática de estado de pago | Alta | ✅ |
| P-10 | Webhook MercadoPago — actualización automática de estado de pago | Alta | ✅ |
| P-11 | Pre-llenado de dirección de envío desde `customer_addresses` si el usuario está logueado | Media | ✅ |
| P-12 | Generación automática de número de orden correlativo (VPS-XXXX) | Alta | ✅ |

---

### Épica 7 — Envíos (Skydropx)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| S-01 | Autenticación OAuth 2.0 con Skydropx y cache de token | Alta | ✅ |
| S-02 | Cotización de tarifas en tiempo real al ingresar dirección | Alta | ✅ |
| S-03 | Cálculo automático de dimensiones del paquete según el carrito | Alta | ✅ |
| S-04 | Mostrar opciones de transportadora y tarifa al cliente | Alta | ✅ |
| S-05 | Generar guía de envío automáticamente tras pago confirmado | Alta | ✅ |
| S-06 | Guardar tracking_number y label_url en la orden | Alta | ✅ |
| S-07 | Webhook Skydropx — actualizar estado de pedido automáticamente | Alta | ✅ |
| S-08 | Email automático al cliente con número de tracking | Media | ✅ |

---

### Épica 8 — Páginas de contenido y servicios  ·  *(v2: E11)*

> Páginas de servicio/landing **configurables desde el CMS**. Maquila y Asesorías son una **instancia de ejemplo** (vertical café), no un requisito de la plataforma general.

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| SV-01 | Página Maquila con hero, servicios incluidos y FAQ | Alta | ✅ |
| SV-02 | Botón WhatsApp con mensaje pre-cargado para maquila | Alta | ✅ |
| SV-03 | Página Asesorías con hero, servicios y formulario | Alta | ✅ |
| SV-04 | Botón WhatsApp con mensaje pre-cargado para asesorías | Alta | ✅ |
| SV-05 | Acordeón de preguntas frecuentes en Maquila | Media | ✅ |
| SV-06 | Carrusel de testimonios en Asesorías | Baja | ✅ |

---

### Épica 9 — Blog

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| B-01 | Listado de artículos con artículo destacado | Alta | ✅ |
| B-02 | Filtro de artículos por categoría | Media | ✅ |
| B-03 | Grid de artículos secundarios (3 columnas) | Alta | ✅ |
| B-04 | Página de artículo individual con breadcrumb | Alta | ✅ |
| B-05 | Compartir artículo por WhatsApp | Media | ✅ |
| B-06 | Artículos relacionados al pie del artículo | Media | ✅ |
| B-07 | Metadatos SEO por artículo | Alta | ✅ |
| B-08 | Generación estática de rutas (generateStaticParams) | Alta | ✅ |

---

### Épica 10 — Autenticación y Mi Cuenta

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| A-01 | Página de Login con Stack Auth | Alta | ✅ |
| A-02 | Página de Registro con Stack Auth | Alta | ✅ |
| A-03 | Middleware de protección /account/* y /admin/* | Alta | ✅ |
| A-04 | Dashboard de Mi Cuenta (stats de pedidos, datos personales) | Alta | ✅ |
| A-05 | Historial de pedidos del cliente | Alta | ✅ |
| A-06 | Editar datos personales del perfil | Media | ✅ |
| A-07 | Cerrar sesión (LogoutButton con useUser().signOut()) | Alta | ✅ |
| A-08 | Creación de perfil en `profiles` al registrarse como admin | Alta | ✅ |
| A-09 | Mirror de cliente web en `customers` al registrarse + vinculación de pedidos previos | Alta | ✅ |
| A-10 | Gestión de direcciones guardadas (`customer_addresses`) — API GET/POST con manejo de `is_default` | Media | ✅ |

---

### Épica 11 — Panel de Administración

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| AD-01 | Layout admin con sidebar y topbar | Alta | ✅ |
| AD-02 | Dashboard con métricas: ventas hoy, pedidos pendientes, productos | Alta | ✅ |
| AD-03 | Tabla de pedidos recientes en dashboard | Alta | ✅ |
| AD-04 | Listado de productos con precio rango, stock y estado | Alta | ✅ |
| AD-05 | Formulario de creación/edición de producto | Alta | ✅ |
| AD-06 | Builder de variantes de producto (tueste × peso × molienda) | Alta | ✅ |
| AD-07 | Upload de imágenes de producto a Supabase Storage | Alta | ✅ |
| AD-08 | Listado de pedidos con filtros por estado | Alta | ✅ |
| AD-09 | Detalle de pedido: cliente, items, timeline de estado | Alta | ✅ |
| AD-10 | Actualizador de estado de pedido desde el admin | Alta | ✅ |
| AD-11 | Vista de envío con tracking y botón descargar guía | Media | ✅ |
| AD-12 | Modal de despacho masivo (pickups Skydropx) | Media | ✅ |
| AD-13 | Gestión de banners del hero (CRUD con drag & drop) | Alta | ✅ |
| AD-14 | Formulario de edición de slide con imagen web + imagen mobile | Alta | ✅ |
| AD-15 | Gestión de imágenes de sección servicios | Media | ✅ |
| AD-16 | Listado de artículos del blog con estado publicado/borrador | Alta | ✅ |
| AD-17 | Formulario de creación/edición de artículo (Markdown, imagen portada, SEO, publicado/borrador) | Alta | ✅ |
| AD-18 | Vista previa de artículo antes de publicar (Draft Mode) | Media | ✅ |
| AD-19 | Listado de clientes: con cuenta (Stack Auth) y sin cuenta (solo en pedidos) con badge de tipo | Media | ✅ |
| AD-20 | Gestión de roles y usuarios — invitar (crea en Stack Auth + email de contraseña), cambiar rol, eliminar | Alta | ✅ |
| AD-21 | Configuración de pasarelas de pago | Alta | ✅ |
| AD-22 | Configuración de número WhatsApp desde BD (`store_config`) | Alta | ✅ |
| AD-23 | CRUD de categorías con imagen de portada y drag-to-reorder | Media | ✅ |
| AD-24 | Upload y gestión de logo desde panel admin | Alta | ✅ |
| AD-25 | Auto-creación de buckets en Supabase Storage al subir primera imagen | Media | ✅ |
| AD-26 | Redes sociales configurables (Instagram, Facebook, TikTok): URL + toggle habilitado por red | Alta | ✅ |
| AD-27 | Editor de contenido legal (Términos y Política de privacidad) en Markdown con tabs | Alta | ✅ |
| AD-28 | Envío gratis configurable: toggle habilitar + monto mínimo editable desde admin | Alta | ✅ |
| AD-29 | Hub de secciones web: toggles enable/disable para cada sección del home; CRUD inline de servicios dinámicos | Alta | ✅ |
| AD-30 | Dashboard adaptado por rol: admin (ventas/métricas), vendedor (urgencias/stock), gestor_tienda (contenido/cupones) | Alta | ✅ |
| AD-31 | Sidebar con grupos colapsables y navegación rol-aware; auto-expande el grupo activo | Media | ✅ |
| AD-32 | Sistema de temas: crear y activar perfiles de colores y tipografía; preview en tiempo real; aplicado al sitio sin redeploy | Alta | ✅ |
| AD-33 | Gestión de newsletter desde admin: lista de suscriptores con estado activo/inactivo y exportación CSV; formulario de campaña con Markdown + broadcast vía Resend; confirmar antes de enviar | Alta | ✅ |
| AD-34 | CRUD de tipos de variante globales (`/variantes`): nombre, valores (uno por línea), display_type pill/swatch, toggle activo, preview de pills | Alta | ✅ |
| AD-35 | ProductForm reescrito: seleccionar tipos globales → botón "Generar combinaciones" produce la matriz cartesiana; preserva datos de variantes existentes al regenerar | Alta | ✅ |
| AD-36 | Favicon configurable: campo `favicon_url` en `store_config`; upload con drag-drop y preview en `/configuracion/general`; inyectado en `<head>` del sitio web vía `generateMetadata` | Media | ✅ |
| AD-37 | Identidad visual propia del panel admin: tabla `admin_config` singleton con `accent_color` y `sidebar_color`; paleta corporativa slate/indigo por defecto; configurable desde `/sistema/apariencia` con color pickers y presets; CSS vars inyectadas server-side en cada request; independiente de los temas del sitio web | Alta | ✅ |
| AD-38 | Export/Import actualizado a v3: snapshot incluye `admin_config` y `themes`; import idempotente soporta v1/v2/v3; respuesta devuelve versión del snapshot | Media | ✅ |

---

### Épica 12 — Emails Transaccionales

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| E-01 | Integrar Resend como proveedor de emails (configurado desde admin) | Alta | ✅ |
| E-02 | Email de confirmación de pedido (disparado desde webhook al aprobar) | Alta | ✅ |
| E-03 | Email de cambio de estado a "Enviado" con tracking | Alta | ✅ |
| E-04 | Email de bienvenida al registrarse (disparado desde /api/auth/welcome) | Media | ✅ |
| E-05 | Email de confirmación de suscripción al newsletter | Media | ✅ |

---

### Épica 13 — SEO y Rendimiento

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| SEO-01 | Metadatos globales con template de título | Alta | ✅ |
| SEO-02 | Metadatos dinámicos por producto y artículo | Alta | ✅ |
| SEO-03 | ISR en tienda y blog (revalidación 60s) | Alta | ✅ |
| SEO-04 | Generación estática de rutas de producto y blog | Alta | ✅ |
| SEO-05 | sitemap.xml dinámico | Media | ✅ |
| SEO-06 | robots.txt | Media | ✅ |
| SEO-07 | Open Graph y Twitter Card por página | Media | ✅ |
| SEO-08 | Optimización de imágenes con next/image + Supabase CDN | Alta | ✅ |
| SEO-09 | Vercel Analytics o Plausible | Baja | ✅ |

---

### Épica 15 — Arquitectura de Proveedores Intercambiables  ·  *(v2: DISUELTA)*

> **Reorganización v2:** esta épica era **transversal**. Sus HU se redistribuyen por dominio: pagos (**PRV-04…07 → E6**), envíos (**PRV-01…03 → E7**) y email (**PRV-08/09 → E8**). La tabla se conserva como referencia histórica de la arquitectura *swappable*.

> **Leyenda de estado** (validado contra el código en ago-2026): **✅** = código + cableado + pruebas unitarias/integración definidas · **🟡** = código + cableado, **sin pruebas** definidas · **🔲** = no implementado.

| ID | Historia | Prioridad | Estado | Evidencia de pruebas |
|----|----------|-----------|--------|----------------------|
| PRV-01 | Interfaz `ShippingProvider` con métodos `calculateRate()` y `createShipment()`; Skydropx como implementación concreta | Alta | ✅ | `shipping/__tests__/{factory,fixed-rate,skydropx-provider,types}.test.ts` |
| PRV-02 | Selector excluyente de proveedor de envíos en admin: `precio_fijo` o una integración activa (Skydropx u otras) | Alta | ✅ | `shipping-config.integration.test.ts` |
| PRV-03 | Checkout calcula el costo de envío exclusivamente con el proveedor activo configurado | Alta | ✅ | `checkout.integration.test.ts`, `shipping-rates.integration.test.ts` |
| PRV-04 | Interfaz `PaymentGateway` con métodos `createPayment()` y `verifyWebhook()`; Wompi y MercadoPago como implementaciones concretas | Alta | ✅ | `wompi.test.ts`, `mercadopago.test.ts`, `webhook-wompi/mercadopago.integration.test.ts` |
| PRV-05 | Toggle independiente por pasarela de pago en `/configuracion/pagos` (Wompi, MercadoPago, Tu Compra) | Alta | ✅ | `payment-config.integration.test.ts` |
| PRV-06 | Checkout muestra únicamente las pasarelas con `enabled = true` | Alta | ✅ | `checkout.integration.test.ts` (casos 503 pasarela inactiva) |
| PRV-07 | Integración Tu Compra como tercera pasarela de pago con webhook y redireccionamiento | Alta | 🔲 | En progreso vía **HU-188** (modalidad integrador `confirmacionTransaccionMedioPago`, multi-método). Núcleo (gateway/webhook/reconcile/URLs) listo; falta el checkout por método (PSE→Nequi/Daviplata→Referenciado→Tarjeta) |
| PRV-08 | Interfaz `EmailProvider` con método `send({ to, subject, html })`; Resend como implementación concreta | Media | ✅ | `packages/database/.../email.test.ts`, `apps/admin/.../email.test.ts` (POST a Resend, headers, errores) |
| PRV-09 | Selector de proveedor de email activo en `/configuracion/email`; campo `email_provider` en `store_config` | Media | ✅ | `email-provider.test.ts` (factory `getEmailProvider`) + `store-config.test.ts` (round-trip `email_provider`) |

---

## 3. Historias de Usuario

Las historias siguen el formato: **"Como [rol], quiero [acción] para [beneficio]."**  
Cada historia incluye sus criterios de aceptación y el estado de implementación.

---

### Módulo: Navegación y Experiencia General

---

**HU-001 — Navbar global**
> Como visitante del sitio, quiero ver una barra de navegación clara en todas las páginas para encontrar rápidamente cualquier sección del sitio.

**Criterios de aceptación:**
- La navbar contiene el logo VPS, los links principales y los iconos de cuenta y carrito.
- Al hacer scroll más de 20px, la navbar cambia de transparente a fondo `#FFF0D1` con sombra.
- El ícono del carrito muestra un badge numérico con la cantidad de ítems.
- En móvil, los links se ocultan y aparece un botón hamburger que despliega un drawer lateral.

**Estado:** ✅ Implementado

---

**HU-002 — Carrito desde cualquier página**
> Como comprador, quiero acceder a mi carrito desde cualquier página del sitio sin perder mi posición de navegación, para revisar mis productos sin interrumpir mi experiencia.

**Criterios de aceptación:**
- Al hacer clic en el ícono del carrito se abre un drawer lateral con todos los ítems.
- El drawer se puede cerrar haciendo clic en el overlay, con el botón X o presionando Escape.
- El scroll del body se bloquea mientras el drawer está abierto.
- Desde el drawer se puede modificar cantidad, eliminar ítems y proceder al checkout.

**Estado:** ✅ Implementado

---

### Módulo: Home

---

**HU-003 — Hero carrusel**
> Como visitante, quiero ver un hero visual impactante al ingresar al sitio para entender rápidamente quién es Merkiai y qué ofrece.

**Criterios de aceptación:**
- El hero ocupa el 100% del viewport en desktop y 70% en móvil.
- Los slides hacen transición con fade cada 5 segundos de forma automática.
- Existen controles de navegación (flechas y dots) para moverse manualmente entre slides.
- Cada slide puede tener título, subtítulo, un CTA principal y una imagen o color de fondo.
- El contenido de los slides se gestiona desde el panel de administración.

**Estado:** ✅ Implementado

---

**HU-004 — Servicios en home**
> Como potencial cliente B2B, quiero ver los servicios de Maquila y Asesorías en la página principal para contactar fácilmente a Merkiai sin buscar en el menú.

**Criterios de aceptación:**
- La sección muestra dos bloques lado a lado: Maquila y Asesorías.
- Cada bloque tiene un título en Ahsing, una descripción breve y un botón de WhatsApp.
- El botón abre WhatsApp con un mensaje pre-cargado específico para cada servicio.
- En móvil los bloques se apilan verticalmente.

**Estado:** ✅ Implementado

---

**HU-005 — Suscripción al newsletter**
> Como visitante interesado en café, quiero suscribirme al boletín de Merkiai para recibir recetas, orígenes y novedades en mi correo.

**Criterios de aceptación:**
- El formulario acepta un email y muestra un mensaje de confirmación al enviar.
- El email se guarda en la tabla `newsletter_subscribers` de Supabase.
- Si el email ya existe, se actualiza su estado a activo sin mostrar error al usuario.
- El formulario valida el formato del correo antes de enviar.

**Estado:** ✅ Implementado

---

### Módulo: Tienda

---

**HU-006 — Explorar el catálogo de café**
> Como comprador, quiero ver todos los cafés disponibles en una página de tienda organizada para comparar opciones y elegir la que más me guste.

**Criterios de aceptación:**
- Los productos se muestran en un grid de 3 columnas en desktop, 2 en tablet y 1 en móvil.
- Cada tarjeta muestra imagen, nombre, categoría, variante predeterminada y precio.
- Existe un botón "Agregar" que añade el producto al carrito directamente desde la tarjeta.
- La página carga con ISR y se revalida cada 60 segundos.

**Estado:** ✅ Implementado

---

**HU-007 — Filtrar el catálogo**
> Como comprador, quiero filtrar los cafés por tueste, peso y método de preparación para encontrar rápidamente el producto que se adapta a mi gusto.

**Criterios de aceptación:**
- Los filtros disponibles son: tueste (claro, medio, oscuro), peso (250g, 500g, 1kg) y método (espresso, filtrado, cold brew).
- Los filtros son acumulativos y se pueden combinar.
- El número de productos que coincide con los filtros se actualiza en tiempo real.
- Existe un botón "Limpiar filtros" cuando no hay resultados.
- Los filtros activos se reflejan en los parámetros de la URL.

**Estado:** ✅ Implementado

---

**HU-008 — Ver detalle de un producto**
> Como comprador, quiero ver toda la información de un café —imágenes, origen, notas de sabor, variantes disponibles y precio— en una página dedicada para tomar una decisión de compra informada.

**Criterios de aceptación:**
- La página muestra una galería con imagen principal y thumbnails navegables.
- Se muestran los atributos del café (origen, proceso, altitud si aplica) desde la descripción.
- El comprador puede seleccionar tueste, peso y molienda disponibles para ese producto.
- El precio se actualiza según la variante seleccionada.
- Existe selector de cantidad y botones "Agregar al carrito" y "Comprar ahora".
- Al pie se muestran hasta 3 productos relacionados de la misma categoría.
- La página tiene metadatos SEO dinámicos (título y descripción del producto).

**Estado:** ✅ Implementado

---

**HU-009 — Agregar al carrito**
> Como comprador, quiero agregar un producto con la variante y cantidad que elijo para acumular mis selecciones antes de pagar.

**Criterios de aceptación:**
- Al agregar un producto, si ya existe esa variante en el carrito se incrementa la cantidad.
- El carrito persiste en localStorage y sobrevive recargas de página.
- El badge del carrito en la navbar se actualiza inmediatamente.
- Se puede agregar desde la tarjeta del catálogo o desde el detalle del producto.

**Estado:** ✅ Implementado

---

### Módulo: Carrito y Checkout

---

**HU-010 — Revisar el carrito antes de pagar**
> Como comprador, quiero ver un resumen completo de mi carrito con totales y costos de envío antes de ingresar mis datos de pago.

**Criterios de aceptación:**
- La página de carrito lista todos los productos con imagen, variante, precio unitario y cantidad.
- Se puede modificar la cantidad o eliminar ítems desde esta página.
- Se muestra subtotal, costo de envío y total.
- Si el subtotal supera $100.000 COP, el envío es gratuito.
- Existe un botón para continuar al checkout y otro para seguir comprando.
- Hay un campo de cupón de descuento (UI implementada; validación pendiente).

**Estado:** ✅ Implementado

---

**HU-011 — Completar la compra**
> Como comprador, quiero ingresar mis datos de contacto, dirección de envío y método de pago en un proceso guiado y claro para finalizar mi compra con confianza.

**Criterios de aceptación:**
- El checkout tiene 3 pasos claramente diferenciados: Contacto, Envío y Pago.
- Los pasos se completan en secuencia y se puede regresar al paso anterior.
- El resumen del pedido es visible en todo momento en una columna lateral.
- Se puede elegir entre Wompi y MercadoPago como método de pago.
- Al confirmar, se crea la orden en Supabase con número correlativo (VPS-XXXX).
- El usuario es redirigido a una página de confirmación con el número de orden.

**Estado:** ✅ Implementado (Wompi hosted checkout + MercadoPago preference; usuario redirigido al gateway al confirmar)

---

**HU-012 — Confirmación de pedido**
> Como comprador, quiero recibir una confirmación clara de que mi pedido fue procesado para saber que la transacción fue exitosa y qué sucede a continuación.

**Criterios de aceptación:**
- La página muestra un ícono de éxito, el número de orden y un mensaje explicativo.
- Se indica que el cliente recibirá un email con los detalles y el número de tracking.
- Hay un enlace a "Ver mis pedidos" y otro a "Seguir comprando".
- Se muestra el número de WhatsApp de Merkiai para consultas.

**Estado:** ✅ Implementado

---

### Módulo: Servicios

---

**HU-013 — Conocer el servicio de Maquila**
> Como empresario o emprendedor cafetero, quiero conocer en detalle el servicio de tueste a maquila de Merkiai para evaluar si se adapta a mis necesidades y cotizar.

**Criterios de aceptación:**
- La página tiene un hero de impacto con título en Ahsing y CTA a WhatsApp.
- Se detallan los tres pasos del servicio: recepción, tueste y empaque.
- Existe una sección de preguntas frecuentes en formato acordeón.
- Todos los CTAs abren WhatsApp con mensaje pre-cargado sobre maquila.

**Estado:** ✅ Implementado

---

**HU-014 — Solicitar asesoría profesional**
> Como propietario de cafetería o marca de café, quiero conocer los servicios de asesoría de Merkiai y contactar a un experto para mejorar mi propuesta.

**Criterios de aceptación:**
- La página describe los cuatro tipos de asesoría: catación, perfiles, formación, consultoría.
- Existe un formulario de consulta inicial con campos de nombre, empresa y necesidad.
- El formulario redirige a WhatsApp con la información ingresada pre-cargada en el mensaje.
- El CTA de WhatsApp usa un mensaje diferenciado respecto al de Maquila.

**Estado:** ✅ Implementado

---

### Módulo: Blog

---

**HU-015 — Leer artículos sobre café**
> Como amante del café, quiero explorar el blog de Merkiai para aprender sobre orígenes, métodos de preparación y la cultura cafetera.

**Criterios de aceptación:**
- El listado muestra el artículo más reciente como destacado en formato horizontal.
- Los demás artículos se presentan en un grid de 3 columnas.
- Se puede filtrar por categoría (Orígenes, Preparación, Novedades, Cultura).
- Cada tarjeta muestra imagen, fecha y título.

**Estado:** ✅ Implementado

---

**HU-016 — Leer un artículo completo**
> Como lector, quiero abrir un artículo del blog y leerlo cómodamente con artículos relacionados al final para seguir explorando contenido.

**Criterios de aceptación:**
- El artículo tiene imagen hero, breadcrumb, fecha, título y cuerpo con buen espaciado.
- Hay un extracto destacado al inicio si el artículo lo tiene.
- Al pie se muestran hasta 2 artículos relacionados de la misma categoría.
- Existe un botón para compartir el artículo por WhatsApp.
- La URL es amigable: `/blog/[slug]`.

**Estado:** ✅ Implementado

---

### Módulo: Mi Cuenta

---

**HU-017 — Ver historial de pedidos**
> Como cliente registrado, quiero ver todos mis pedidos anteriores con su estado para saber en qué punto está cada uno de mis envíos.

**Criterios de aceptación:**
- La página lista todos los pedidos del cliente autenticado ordenados por fecha.
- Cada fila muestra número de orden, fecha, total, estado y número de tracking si aplica.
- Los estados tienen colores diferenciados (amarillo: pendiente, verde: entregado, etc.).
- Si no hay pedidos, se muestra un estado vacío con enlace a la tienda.

**Estado:** ✅ Implementado (requiere auth para mostrar datos reales)

---

**HU-018 — Ver mi dashboard de cuenta**
> Como cliente registrado, quiero tener un panel personal donde vea de un vistazo mis pedidos activos y mis datos personales.

**Criterios de aceptación:**
- El dashboard muestra tarjetas con número de pedidos activos y último pedido.
- Se muestran los datos personales (nombre, email, teléfono) con opción de editar.
- Existe un menú lateral para navegar entre secciones de la cuenta.
- La sección está protegida; los visitantes sin sesión son redirigidos al login.

**Estado:** ✅ Implementado (skeleton; datos reales requieren auth)

---

### Módulo: Panel de Administración

---

**HU-019 — Dashboard de métricas**
> Como administrador, quiero ver en un dashboard las métricas más importantes del negocio al iniciar mi jornada para tener contexto antes de operar.

**Criterios de aceptación:**
- El dashboard muestra ventas del día (suma total de órdenes creadas hoy).
- Muestra número de pedidos pendientes y productos activos publicados.
- Lista los 5 pedidos más recientes con estado y total.
- Los datos se cargan en tiempo real desde Supabase (force-dynamic).

**Estado:** ✅ Implementado

---

**HU-020 — Gestionar productos del catálogo**
> Como administrador, quiero ver, crear, editar y despublicar productos del catálogo para mantener la tienda actualizada con información precisa.

**Criterios de aceptación:**
- La tabla muestra imagen, nombre, slug, categoría, rango de precios, stock total y estado.
- El stock total suma todas las variantes activas del producto.
- Se puede buscar productos por nombre.
- Hay botones de "Editar" por producto que abren el formulario de edición.
- El formulario permite subir imágenes, definir variantes con precio y stock individual.

**Estado:** ✅ Implementado (formulario con imágenes, variantes, validación cliente, bloqueo durante uploads)

---

**HU-021 — Gestionar pedidos**
> Como operador de Merkiai, quiero ver todos los pedidos, filtrarlos por estado y actualizar su estado para coordinar el proceso de despacho.

**Criterios de aceptación:**
- La tabla muestra número de orden, cliente, fecha, total, estado y tracking.
- Se puede filtrar por todos los estados disponibles.
- Al entrar al detalle del pedido se ve el timeline visual de estados.
- Se puede cambiar el estado del pedido mediante un selector y un botón de guardado.
- Si el pedido tiene número de tracking, se muestra el botón para descargar la guía PDF.

**Estado:** ✅ Implementado

---

**HU-022 — Gestionar banners del hero**
> Como administrador de contenido, quiero agregar, editar, reordenar y desactivar los slides del carrusel hero sin tocar código para mantener las campañas actualizadas.

**Criterios de aceptación:**
- Se puede previsualizar cada slide con su imagen o color de fondo.
- Se puede activar o desactivar un slide sin eliminarlo.
- Los slides tienen campos editables: imagen, título, subtítulo, texto CTA y URL CTA.
- El orden de los slides es arrastrable.

**Estado:** ✅ Implementado (listado, preview, formulario de edición con imagen web + imagen mobile por slide)

---

**HU-023 — Gestionar artículos del blog**
> Como editor de Merkiai, quiero crear, editar y publicar artículos del blog desde el panel admin para publicar contenido sin depender de un desarrollador.

**Criterios de aceptación:**
- La tabla muestra título, slug, categoría, fecha de publicación y estado (publicado/borrador).
- Existe un botón "Vista previa" que abre el artículo en el sitio público sin publicarlo.
- El formulario tiene campos para título, slug, extracto, contenido (rich text), imagen de portada y categoría.
- Los artículos en borrador no son visibles en el sitio público.

**Estado:** ✅ Implementado (listado, formulario con Markdown, imagen de portada, SEO, toggle publicado/borrador, slug auto-generado, botón "Vista previa ↗")

---

**HU-024 — Controlar accesos por rol**
> Como super administrador, quiero invitar usuarios al panel, asignarles roles y revocarlos para que cada miembro del equipo solo acceda a las secciones que le corresponden.

**Criterios de aceptación:**
- Los roles del panel son: `super_admin`, `admin`, `vendedor`, `gestor_tienda`. El rol `miembro` existe pero sin acceso al panel (estado de invitación pendiente de asignación).
- Al invitar, el usuario se crea en Stack Auth con rol `miembro` y recibe un email "Establece tu contraseña".
- El super_admin puede elevar o reducir el rol de cualquier usuario desde `/usuarios`.
- Las secciones del sidebar se filtran según el rol (`ROLE_CONFIG` en `lib/roles.ts`).
- Las políticas RLS en Supabase bloquean el acceso a nivel de base de datos; el service role lo bypasea.
- Un usuario con rol `miembro` que intente acceder al panel es redirigido al sign-in.

**Estado:** ✅ Implementado

---

**HU-025 — Gestionar identidad y contacto de la tienda desde admin**
> Como administrador, quiero configurar el logo, el número de WhatsApp y los datos de la tienda desde el panel admin, sin tocar el código ni redesplegar, para mantener la identidad de la marca actualizada.

**Criterios de aceptación:**
- La sección Configuración tiene un formulario de "Identidad de la tienda" con campos: logo (imagen), nombre, email y WhatsApp.
- El logo se sube al bucket `logos` de Supabase Storage y la URL se guarda en `store_config.logo_url`.
- El número de WhatsApp acepta solo dígitos (10–15); se muestra un error si no cumple el formato.
- Al guardar, los cambios se aplican inmediatamente sin recargar toda la app.
- El logo aparece en el Navbar y Footer del sitio público.
- El número de WhatsApp se usa en los CTAs de maquila, asesorías, footer y confirmación de pedido.

**Estado:** ✅ Implementado

---

**HU-026 — Configurar redes sociales desde admin**
> Como administrador, quiero poder configurar los enlaces de Instagram, Facebook y TikTok de la tienda desde el panel, y habilitar o deshabilitar cada red de forma independiente, para mantener el footer actualizado sin tocar código.

**Criterios de aceptación:**
- En Configuración → Configuración general aparece una sección "Redes sociales" con tres filas: Instagram, Facebook y TikTok.
- Cada fila tiene un toggle de habilitado y un campo de URL.
- El campo de URL se deshabilita visualmente cuando el toggle está apagado.
- En el footer del sitio público, solo aparecen los iconos de redes que tienen `enabled: true` y URL no vacía.
- Los iconos son los SVG oficiales de cada red.
- Los cambios se aplican en la siguiente carga del sitio (SSR `force-dynamic` en el layout).

**Estado:** ✅ Implementado

---

**HU-027 — Editar términos y política de privacidad desde admin**
> Como administrador, quiero editar el contenido de los Términos y condiciones y la Política de privacidad desde el panel, usando Markdown, para mantener el contenido legal actualizado sin redeploys.

**Criterios de aceptación:**
- En Configuración → Contenido legal hay dos tabs: "Términos y condiciones" y "Política de privacidad".
- El editor es un textarea con sintaxis Markdown; muestra un contador de caracteres y un hint de formato.
- Hay un botón "Guardar contenido legal" que persiste ambos textos en `store_config`.
- El enlace "Ver en sitio ↗" lleva a `/terms` o `/privacy` según el tab activo.
- Las páginas `/terms` y `/privacy` renderizan el Markdown almacenado (h1/h2/h3, bold, italic, listas, links).
- Si el contenido está vacío, las páginas muestran un aviso en lugar de una página en blanco.

**Estado:** ✅ Implementado

---

**HU-028 — Envío gratis configurable desde admin**
> Como administrador, quiero poder habilitar o deshabilitar la promoción de envío gratis y definir el monto mínimo del pedido desde el panel admin, para gestionar incentivos de compra sin cambios de código.

**Criterios de aceptación:**
- En Configuración → Proveedor de envíos existe un toggle "Envío gratis" (habilitado/deshabilitado).
- Cuando está habilitado, se muestra un campo editable con el monto mínimo en COP.
- El campo muestra una vista previa del umbral formateado (ej. "$100.000").
- En el carrito, si el toggle está activo, aparece una barra de progreso que muestra cuánto falta para el envío gratis.
- Si el subtotal supera el umbral, el costo de envío se muestra como "Gratis" (en carrito y en checkout).
- El fallback es tarifa fija si la BD no responde.

**Estado:** ✅ Implementado

---

**HU-029 — Ver todos los clientes en un solo lugar**
> Como administrador, quiero ver en un panel la lista completa de personas que han interactuado con la tienda —tanto las que tienen cuenta registrada como las que compraron como invitados— para llevar un control total y planificar campañas.

**Criterios de aceptación:**
- La tabla muestra clientes con cuenta (Stack Auth) y compradores sin cuenta (solo en `orders`), diferenciados por badge "Con cuenta" / "Sin cuenta".
- Cada fila incluye: nombre, email, teléfono (si está disponible), número de pedidos, total gastado y fecha de último pedido.
- Los administradores del panel (tabla `profiles`) son excluidos de la lista.
- Existe búsqueda por nombre, email o teléfono y filtro por tipo de cliente.
- Los datos se ordenan por actividad más reciente (último pedido o fecha de registro).

**Estado:** ✅ Implementado

---

---

**HU-030 — Controlar qué secciones aparecen en el sitio**
> Como gestor de tienda, quiero habilitar o deshabilitar secciones del home desde el panel para ajustar el contenido sin tocar código.

**Criterios de aceptación:**
- La página `/secciones` lista todas las secciones configurables con su estado actual.
- Cada sección tiene un toggle que persiste en `section_settings`.
- El sitio público respeta los flags: si una sección está deshabilitada, no se renderiza.
- Si la tabla no existe aún, el sitio muestra todas las secciones (fail-open).
- Los servicios dinámicos se gestionan con CRUD inline en la misma página.

**Estado:** ✅ Implementado

---

**HU-031 — Dashboard adaptado a mi rol**
> Como usuario del panel, quiero ver en el dashboard solo la información relevante para mi función para no distraerme con datos que no gestiono.

**Criterios de aceptación:**
- `admin`/`super_admin`: ve ventas hoy/semana/mes, stock crítico, pedidos recientes y top productos.
- `vendedor`: ve conteo de órdenes por estado, pedidos urgentes (resaltados si llevan >2 días pendientes) y productos con stock bajo.
- `gestor_tienda`: ve secciones activas, artículos en borrador, banners hero y cupones próximos a vencer.
- El rol se lee del usuario autenticado; no hay lógica manual de selección.

**Estado:** ✅ Implementado

---

**HU-032 — Crear y activar temas de marca**
> Como administrador, quiero crear perfiles de colores y fuentes y activar el que quiero usar en el sitio, para mantener coherencia visual y probar variaciones de paleta sin redesplegar.

**Criterios de aceptación:**
- Se pueden crear múltiples temas con nombres descriptivos.
- Cada tema configura 7 colores (primary, dark, cream, cream-warm, yellow, yellow-pale, text) y 2 fuentes (display, body).
- Un preview en tiempo real muestra cómo se verá el tema antes de guardarlo.
- Al activar un tema, el sitio público lo refleja en la siguiente carga sin redeploy.
- Solo puede haber un tema activo; activar uno desactiva automáticamente el anterior.
- El tema "Merkiai (Por defecto)" no se puede eliminar.
- Los colores se almacenan en hex; el sitio los convierte a canales RGB para soporte de opacidad de Tailwind.

**Estado:** ✅ Implementado

---

**HU-033 — Gestionar suscriptores y enviar campañas de newsletter**
> Como gestor de tienda, quiero ver la lista de personas suscritas al newsletter y enviarles un correo desde el panel admin para comunicarme con mi audiencia sin herramientas externas.

**Criterios de aceptación:**
- La página `/newsletter` es accesible para `gestor_tienda`, `admin` y `super_admin`.
- La pestaña "Suscriptores" muestra una tabla con email, fecha de suscripción y estado (Activo / Inactivo).
- Las tarjetas de estadísticas muestran el total, cantidad de activos e inactivos.
- El botón "Exportar CSV" descarga un archivo con todos los suscriptores.
- La pestaña "Enviar campaña" tiene campos de asunto y cuerpo en Markdown.
- El sistema indica cuántos destinatarios activos recibirán el correo antes de enviar.
- Al pulsar "Enviar campaña" aparece un diálogo de confirmación antes de ejecutar el envío.
- El envío usa las credenciales Resend guardadas en `store_config`; si no están configuradas, muestra error claro.
- Se envía en lotes de 50 para respetar los límites de Resend.
- Tras enviar, se muestra el resultado: cuántos recibieron el email y cuántos fallaron.
- El formulario acepta Markdown básico (##, **negrita**, *cursiva*, listas) convertido a HTML en el email.

**Estado:** ✅ Implementado

---

## 4. Historias de Usuario — Versión Refinada (con edge cases y story points)

> Esta sección refina las historias más críticas para el negocio agregando: escenarios de borde, criterios de rechazo, estimación de esfuerzo y cobertura de testing.  
> **Escala de estimación:** S = 1–2 pts | M = 3–5 pts | L = 8 pts | XL = 13 pts

---

### HU-R01 — Agregar al carrito (refinada)

> Como comprador, quiero agregar un café con la variante y cantidad que elijo, para que mis selecciones queden guardadas aunque salga del sitio.

**Estimación:** M (3 puntos)  
**Módulo:** Carrito · `store/cart.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Comprador agrega variante nueva | Item aparece en el carrito con qty = cantidad ingresada |
| AC-2 | Comprador agrega la misma variante dos veces | La qty se acumula (no se crea un item duplicado) |
| AC-3 | Comprador agrega desde la tarjeta del catálogo | Qty predeterminada = 1 |
| AC-4 | Comprador agrega desde el detalle de producto | Qty = la elegida en el selector |
| AC-5 | Comprador recarga la página | El carrito persiste (localStorage key `vps-cart`) |
| AC-6 | Comprador abre el sitio en otra pestaña | Ambas pestañas muestran el mismo carrito |

**Escenarios de borde:**

- Si la variante seleccionada tiene `stock = 0`, el botón "Agregar" está deshabilitado y se muestra "Sin stock".
- Si el usuario intenta agregar qty = 0 o qty negativa vía manipulación directa del DOM, el store ignora la operación.
- El `variantId` es el identificador único; dos productos distintos con el mismo `variantId` serían imposibles por diseño del esquema.

**Criterios de rechazo (la historia NO pasa si...):**

- El badge de la navbar no se actualiza inmediatamente tras agregar.
- Agregar el mismo producto dos veces crea dos filas en lugar de sumar la cantidad.
- El carrito desaparece al recargar la página.

**Cobertura de tests:** `src/store/__tests__/cart.test.ts` — 18 casos

---

### HU-R02 — Proceso de checkout (refinada)

> Como comprador con ítems en el carrito, quiero completar mi compra en tres pasos claros para pagar con confianza sin distracciones.

**Estimación:** XL (13 puntos)  
**Módulo:** Checkout · `app/checkout/page.tsx` + `api/checkout/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Paso 1: email vacío al continuar | Mensaje de validación inline; no avanza al paso 2 |
| AC-2 | Paso 1: email inválido (sin @) | Mensaje de validación inline |
| AC-3 | Paso 2: dirección completa | Avanza al paso 3 |
| AC-4 | Paso 2: código postal vacío | Se usa `000000` como fallback para la cotización de Skydropx |
| AC-5 | Paso 3: se confirma el pedido | Se crea la orden en Supabase y se redirige a `/checkout/confirmation?order=VPS-XXXX` |
| AC-6 | Carrito vacío al llegar al checkout | Se redirige a `/cart` con mensaje de carrito vacío |
| AC-7 | Error de red al crear la orden | Se muestra toast de error genérico; el usuario puede reintentar |
| AC-8 | Regresión de paso 3 a paso 2 | Se conservan los datos del formulario previo (no se borran) |

**Escenarios de borde:**

- Si el usuario llega a `/checkout/confirmation` sin haber pasado por el checkout (sin `order` en query), se redirige a `/`.
- El número de orden usa padding cero hasta 4 dígitos (`ORD-0001`); a partir de 9999 sigue incrementando sin padding.
- `shipping_cost` es `0` si el subtotal supera $100.000 COP, independientemente de lo que devuelva Skydropx.

**Criterios de rechazo:**

- El formulario permite avanzar sin email.
- Doble-clic en "Confirmar" crea dos órdenes (debe deshabilitarse el botón durante el fetch).
- Los datos del paso 1 desaparecen al retroceder desde el paso 2.

**Cobertura de tests:** `api/__tests__/checkout.integration.test.ts` — 10 casos

---

### HU-R03 — Configuración del proveedor de envíos desde el admin (nueva)

> Como administrador, quiero seleccionar y configurar el proveedor de envíos desde el panel de administración, sin tocar el código ni redesplegar la aplicación, para poder cambiar o actualizar las credenciales cuando sea necesario.

**Estimación:** M (5 puntos)  
**Módulo:** Admin · `app/configuracion/` + `api/admin/shipping/`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre Configuración → sección Envíos | Muestra el proveedor activo y la tarifa fija actual |
| AC-2 | Admin selecciona "Tarifa fija" y guarda | `shipping_config.provider = 'fixed'`; todos los checkouts usan esa tarifa |
| AC-3 | Admin selecciona "Skydropx" sin credenciales y guarda | Error 400 con lista de campos faltantes |
| AC-4 | Admin ingresa Client ID, Client Secret y Address From ID y guarda | Provider = skydropx, credenciales guardadas en BD |
| AC-5 | Admin recarga la página de configuración | Los campos se pre-rellenan con los valores guardados |
| AC-6 | Client Secret se muestra enmascarado (••••1234) | El secret original nunca se expone en la UI |
| AC-7 | Admin deja el campo Client Secret vacío al guardar | El secret existente no se sobreescribe |
| AC-8 | Admin cambia solo la tarifa fija | Solo ese campo se actualiza; el proveedor activo no cambia |

**Escenarios de borde:**

- Si el administrador cambia a Skydropx pero la API está caída al momento de la siguiente compra, el sistema hace fallback automático a la tarifa fija configurada.
- Los cambios surten efecto en el siguiente request (no hay caché de la config entre requests).

**Criterios de rechazo:**

- El Client Secret se devuelve en texto plano en la respuesta GET.
- Cambiar el proveedor requiere modificar `.env.local` y redesplegar.
- Al activar Skydropx con credenciales vacías, el checkout falla con un error de autenticación en producción.

**Cobertura de tests:** `apps/admin/api/admin/shipping/__tests__/shipping-config.integration.test.ts` — 14 casos

---

### HU-R04 — Cotización de envío multi-proveedor (refinada)

> Como comprador, quiero ver el costo y el tiempo estimado de envío después de ingresar mi dirección para decidir qué transportadora usar, independientemente del proveedor que tenga configurado Merkiai.

**Estimación:** L (8 puntos)  
**Módulo:** `lib/shipping/` + `api/shipping/rates/route.ts`  
**Estado:** ✅ Implementado (arquitectura multi-proveedor)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Proveedor = "fixed", dirección cualquiera | Se devuelve la tarifa fija configurada en el admin |
| AC-2 | Proveedor = "skydropx", dirección válida | Se devuelven 2–4 tarifas reales con precio y días |
| AC-3 | Código postal no provisto | Se usa `000000`; la cotización continúa |
| AC-4 | 1 ítem de 250g | Parcel: 20×15×8 cm, 0.3 kg |
| AC-5 | 2 ítems de 500g | Parcel: 25×20×10 cm, 1.2 kg |
| AC-6 | 3+ ítems de 1kg | Parcel: 35×25×15 cm, ≥3.3 kg |
| AC-7 | Skydropx responde `is_completed: false` | Polling hasta 10 reintentos × 500ms |
| AC-8 | Polling agota los reintentos | SkydropxProvider devuelve `[]`; la API responde con tarifa fija como fallback |
| AC-9 | Token OAuth próximo a expirar (< 60s) | Se renueva automáticamente antes de la petición |
| AC-10 | Skydropx falla con HTTP 503 | SkydropxProvider devuelve `[]` (no lanza); la API responde 500 |
| AC-11 | La respuesta incluye el nombre del proveedor | `{ provider: 'fixed' | 'skydropx', rates: [...] }` |

**Arquitectura de proveedores:**

```
lib/shipping/
├── types.ts                   ← ShippingProvider interface + calculateParcel
├── index.ts                   ← getShippingProvider() factory (lee shipping_config de BD)
└── providers/
    ├── fixed-rate.ts          ← FixedRateProvider (tarifa plana, sin API externa)
    └── skydropx/
        ├── auth.ts            ← OAuth 2.0 con cache por clientId
        └── index.ts           ← SkydropxProvider (polling de cotizaciones)
```

Para agregar un nuevo proveedor (ej. FedEx): crear `providers/fedex/index.ts`, agregar el caso al switch en `index.ts`, y una nueva columna en `shipping_config`.

**Criterios de rechazo:**

- El código del checkout importa `SkydropxProvider` directamente (en lugar de usar la factory).
- Las credenciales del proveedor se leen de `.env` en lugar de la BD.
- El fallo de Skydropx bloquea el checkout con un error visible al comprador.

**Cobertura de tests:** 
- `lib/shipping/__tests__/types.test.ts` — 10 casos (calculateParcel)  
- `lib/shipping/__tests__/fixed-rate.test.ts` — 10 casos  
- `lib/shipping/__tests__/skydropx-auth.test.ts` — 7 casos  
- `lib/shipping/__tests__/skydropx-provider.test.ts` — 9 casos  
- `lib/shipping/__tests__/factory.test.ts` — 8 casos  
- `api/__tests__/shipping-rates.integration.test.ts` — 9 casos

---

### HU-R04 — Actualización de estado de pedido por webhook (refinada)

> Como sistema de logística (Skydropx), necesito notificar a Merkiai sobre cambios en el estado del envío para que los pedidos se actualicen automáticamente sin intervención manual.

**Estimación:** M (5 puntos)  
**Módulo:** Webhooks · `api/webhooks/skydropx/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Evento `shipment.in_transit` | Orden actualizada a `status: 'shipped'` |
| AC-2 | Evento `shipment.out_for_delivery` | Orden actualizada a `status: 'shipped'` |
| AC-3 | Evento `shipment.delivered` | Orden actualizada a `status: 'delivered'` |
| AC-4 | Evento `shipment.exception` | Orden actualizada a `status: 'exception'` |
| AC-5 | Evento desconocido | Responde `{ ok: true }` sin modificar la BD |
| AC-6 | `tracking_number` no existe en ninguna orden | Supabase no falla (no hay fila que actualizar); responde `{ ok: true }` |
| AC-7 | Body JSON malformado | Responde 500 |
| AC-8 | Actualización exitosa | Siempre incluye `updated_at` con timestamp ISO |

**Escenarios de borde:**

- Si Skydropx reenvía el mismo evento dos veces (retry), la actualización es idempotente (misma orden, mismo status).
- El endpoint no valida una firma HMAC en esta versión; en producción se debe agregar validación de `X-Skydropx-Signature` para evitar llamadas fraudulentas.

**Criterios de rechazo:**

- El endpoint retorna 4xx en lugar de 200 para eventos desconocidos (Skydropx dejaría de enviar notificaciones).
- El `updated_at` no se actualiza junto con el `status`.

**Cobertura de tests:** `api/__tests__/webhook-skydropx.integration.test.ts` — 9 casos

---

### HU-R05 — Gestión de estado de pedido desde admin (refinada)

> Como operador de Merkiai, quiero cambiar el estado de un pedido (Pendiente → Procesando → Enviado → Entregado) desde el panel para comunicar el avance al cliente.

**Estimación:** S (2 puntos)  
**Módulo:** Admin · `app/pedidos/[id]/` + `api/admin/orders/[id]/status/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cambio de Pendiente a Procesando | Status actualizado; timeline resalta el nuevo paso |
| AC-2 | Cambio a Enviado | Status actualizado; campo tracking editable visible |
| AC-3 | Cambio a Entregado | Status actualizado; timeline completo |
| AC-4 | ID de orden inexistente | Responde 500 con mensaje de error |
| AC-5 | Todos los estados válidos del flujo | La API acepta y persiste cualquier estado definido |
| AC-6 | `updated_at` siempre se actualiza | El campo `updated_at` tiene el timestamp del cambio |

**Escenarios de borde:**

- Un editor (rol `editor`) no tiene acceso al cambio de estado — el RLS de Supabase bloquea la mutación.
- La regresión de estado (Entregado → Procesando) es posible desde el admin para corrección de errores operativos.

**Criterios de rechazo:**

- El cambio de estado no persiste en la BD (solo actualiza el estado visual).
- No se registra `updated_at` en el cambio.

**Cobertura de tests:** `apps/admin/api/admin/orders/__tests__/order-status.integration.test.ts` — 9 casos

---

### HU-R06 — Generación automática de guía de envío post-pago (nueva)

> Como sistema de pagos, tras confirmar un pago quiero que se genere automáticamente la guía de envío en Skydropx para que el equipo de Merkiai pueda despachar sin intervención manual.

**Estimación:** L (8 puntos)  
**Módulo:** `lib/shipping/shipments.ts` + webhooks Wompi/MercadoPago  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pago Wompi aprobado | `createShipmentForOrder()` ejecutado; `skydropx_shipment_id`, `tracking_number` y `label_url` guardados en la orden |
| AC-2 | Pago MercadoPago aprobado | Ídem AC-1 |
| AC-3 | Skydropx falla | El webhook responde 200 de todas formas; fallo solo loguea en consola |
| AC-4 | Webhook recibido dos veces (retry) | Segunda llamada detecta `skydropx_shipment_id` existente y no crea guía duplicada |
| AC-5 | Provider = 'fixed' | `createShipmentForOrder` retorna `null` sin error |
| AC-6 | Guía creada | Se envía email de tracking al cliente |
| AC-7 | Email de tracking falla | La guía ya está guardada; el fallo de email no revierte nada |

**Criterios de rechazo:**

- El webhook retorna 500 si Skydropx falla (impediría reintentos de pago).
- Se crean guías duplicadas si el webhook se dispara dos veces.
- El `tracking_number` no se guarda en la orden.

**Cobertura de tests:** `lib/shipping/__tests__/shipments.test.ts`

---

### HU-R07 — Previsualización de artículos borrador (nueva)

> Como editor del blog, quiero poder previsualizar un artículo antes de publicarlo para verificar el formato y el contenido sin que sea visible para el público.

**Estimación:** S (2 puntos)  
**Módulo:** `api/draft/enable/route.ts` + `app/(public)/blog/[slug]/page.tsx`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor hace clic en "Previsualizar ↗" en un artículo borrador | Se abre `/blog/[slug]?draft=1` con banner amarillo de "modo borrador" |
| AC-2 | Artículo borrador sin cookie de draft | `notFound()` — el artículo no es accesible públicamente |
| AC-3 | URL con `?draft=1` y cookie activa | Artículo renderiza aunque `published = false` |
| AC-4 | Cookie expira después de 1 hora | El artículo vuelve a ser inaccesible |
| AC-5 | Artículo ya publicado + draft mode | Renderiza normalmente sin banner (pues `!post.published` es false) |
| AC-6 | Secret inválido en `/api/draft/enable` | Responde 401 |

**Criterios de rechazo:**

- Un visitante sin cookie puede ver artículos no publicados directamente.
- El banner de borrador aparece en artículos publicados.

---

### HU-R08 — Edición de perfil en Mi Cuenta (nueva)

> Como cliente registrado, quiero poder actualizar mi nombre y teléfono desde Mi Cuenta para que mis datos estén al día y el checkout se pre-llene correctamente.

**Estimación:** S (2 puntos)  
**Módulo:** `api/account/profile/route.ts` + `components/account/ProfileForm`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente cambia su nombre y guarda | `customers.name` y `user.displayName` actualizados |
| AC-2 | Cliente cambia su teléfono y guarda | `customers.phone` actualizado |
| AC-3 | Campo email deshabilitado | No se puede cambiar el email desde este formulario |
| AC-4 | Usuario no autenticado llama PATCH | Responde 401 |
| AC-5 | Cliente agrega una nueva dirección | Dirección guardada en `customer_addresses`; disponible en el próximo checkout |
| AC-6 | Cliente marca dirección como predeterminada | La dirección previa deja de ser predeterminada |

---

### HU-R09 — Programar recolección masiva Skydropx desde admin (nueva)

> Como operador de bodega, quiero seleccionar varios pedidos enviados y programar una recolección con Skydropx para que el transportista pase a recoger todos los paquetes en una sola visita.

**Estimación:** M (3 puntos)  
**Módulo:** `api/admin/pickups/route.ts` + `components/pedidos/PickupModal`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | No hay pedidos con guía Skydropx | Botón "Programar recolección" deshabilitado con tooltip |
| AC-2 | Operador selecciona pedidos, fecha y ventana horaria | POST a `/api/admin/pickups`; pantalla de éxito |
| AC-3 | Skydropx devuelve error | Se muestra el mensaje de error en el modal |
| AC-4 | Skydropx no está configurado | API responde 503; modal muestra error |
| AC-5 | Modal cerrado antes de enviar | Estado se resetea; no se hace ningún request |

---

### HU-R10 — Variantes genéricas (colores, tallas y otros atributos)

> Como administrador de productos, quiero definir atributos libres para las variantes (color, talla, material, etc.) para que la tienda muestre swatches visuales y filtros adecuados sin estar restringida a café.

**Estimación:** L (5 puntos)  
**Módulo:** `lib/variant-utils.ts` · `components/shop/ShopClient.tsx` · `components/shop/ProductDetail.tsx` · `admin/productos/ProductForm.tsx` · migración `14_product_variants_extended.sql`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Producto tiene `variant_options: ["Color","Talla"]` | Tienda muestra selectores de color y talla |
| AC-2 | Valor de variante es un color (ej. "Rojo") | Se renderiza un swatch con el hex correspondiente |
| AC-3 | Producto tiene múltiples precios | Tarjeta muestra "Desde $X" en lugar de precio único |
| AC-4 | Producto sin `variant_options` JSONB | Sistema usa campos legacy `roast`/`weight`/`grind` sin cambios |
| AC-5 | Variante no disponible para combinación seleccionada | Opción aparece tachada y no puede añadirse al carrito |
| AC-6 | Admin define opciones en ProductForm | `variant_options` y `attributes` se guardan correctamente |

---

### HU-R11 — Selector de transportadora en checkout

> Como cliente, quiero ver las opciones de envío disponibles con su precio y tiempo de entrega para elegir la que prefiero antes de pagar.

**Estimación:** M (3 puntos)  
**Módulo:** `components/checkout/CheckoutClient.tsx` · `api/checkout/route.ts` · `packages/database/src/queries/orders.ts`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente completa datos de envío y pulsa "Ver opciones de envío →" | Se muestran tarifas con carrier, servicio, días y precio |
| AC-2 | Se muestra spinner mientras se calculan las tarifas | Botón deshabilitado; texto "Calculando opciones de envío…" |
| AC-3 | No hay tarifas disponibles | Mensaje ámbar; puede continuar con tarifa fija de respaldo |
| AC-4 | Cliente cambia ciudad o departamento | Tarifas se resetean; debe recalcular antes de continuar |
| AC-5 | Cliente selecciona una tarifa y confirma pedido | `carrier_name` y `skydropx_rate_id` quedan en la orden de BD |
| AC-6 | Proveedor configurado es tarifa fija | No aparece el paso de "Ver opciones"; continúa directo al pago |

---

### HU-R12 — Comboboxes de departamento/ciudad Colombia

> Como cliente, quiero elegir mi departamento y ciudad desde listas con búsqueda filtrada para reducir errores tipográficos en la dirección de envío.

**Estimación:** S (2 puntos)  
**Módulo:** `lib/colombia-locations.ts` · `components/ui/SearchableSelect.tsx` · `CheckoutClient.tsx` · `AddressesForm.tsx` · `ShippingConfigForm.tsx` (admin)  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente abre combobox de departamento | Lista de 33 departamentos ordenada alfabéticamente con filtro |
| AC-2 | Cliente selecciona departamento | Ciudad se limpia y se carga la lista del departamento elegido |
| AC-3 | Ciudad deshabilitada sin departamento | Placeholder "Elige departamento primero"; no es clickeable |
| AC-4 | Ciudad aparece en múltiples departamentos (ej. "Buenaventura") | No hay error de clave duplicada en React |
| AC-5 | Navegación por teclado (↑↓ Enter Escape) | El combobox responde correctamente a todas las teclas |

---

### HU-R13 — Editar y eliminar direcciones en Mi Cuenta

> Como cliente, quiero poder corregir o eliminar mis direcciones guardadas para mantener mi libreta de direcciones actualizada.

**Estimación:** S (2 puntos)  
**Módulo:** `api/account/addresses/[id]/route.ts` · `components/account/AddressesForm.tsx`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente pulsa "Editar" en una dirección | Aparece formulario inline con datos precargados |
| AC-2 | Cliente guarda cambios | Se llama PATCH; datos actualizados en BD y UI |
| AC-3 | Cliente marca como predeterminada | La anterior predeterminada deja de serlo |
| AC-4 | Cliente elimina una dirección (con confirmación) | Dirección eliminada de BD y desaparece de la lista |
| AC-5 | Usuario no autenticado llama PATCH/DELETE | API responde 401 |
| AC-6 | Intento de editar/eliminar dirección de otro cliente | API responde 404 |

---

---

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

## Detalle · E16 — Componentes de IA  *(roadmap)*

> Pilar declarado de la plataforma. Los módulos de IA se integran como **servicios desacoplados** (mismo patrón *swappable* que pagos/envíos/email): un proveedor de IA configurable y componentes que lo consumen. Aún **no implementado** — roadmap.

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| IA-01 | Generación asistida de descripciones y textos SEO de productos con IA | Media | 🔲 |
| IA-02 | Recomendaciones de productos (relacionados / personalizadas) | Baja | 🔲 |
| IA-03 | Asistente de catálogo y atención (chat) sobre el contenido del CMS | Baja | 🔲 |

---

## Detalle · Expansión de roadmap (v17) — HU-101…134

> Historias **propuestas** para llevar la plataforma más allá del MVP hacia un CMS e-commerce white-label completo. Todas están en estado **🔲 (no implementado)** y se mapean a las épicas existentes (no crean épicas nuevas, salvo que se decida separar i18n). Las estimaciones son orientativas (S ≤ 3 pts · M 5 pts · L 8 pts · XL 13+ pts).
>
> **Bloques:** HU-101…119 (catálogo, inventario, pagos, cuentas, SEO, IA) · HU-120…125 (configurabilidad, plantillas de diseño y operación de datos) · **HU-126…134 (personalización avanzada y operación de datos — derivadas del enfoque configurable)**.

### HU-101 — Reseñas y calificaciones de producto · E4

> Como comprador, quiero calificar (1–5 estrellas) y reseñar productos que compré, y leer las reseñas de otros, para decidir con más confianza.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (tabla `product_reviews`), PDP, grid, admin (moderación)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente con pedido entregado del producto | Puede dejar 1 reseña con estrellas + texto; queda `pending` de moderación |
| AC-2 | Admin en el panel | Aprueba, oculta o elimina reseñas; solo las aprobadas se muestran |
| AC-3 | PDP y grid | Muestran promedio de estrellas y conteo; PDP lista reseñas aprobadas paginadas |
| AC-4 | Usuario no autenticado o sin compra | No puede reseñar (control server-side) |

---

### HU-102 — Búsqueda de productos con autocompletado · E4

> Como comprador, quiero buscar productos por texto libre y ver sugerencias mientras escribo, para encontrar rápido lo que quiero.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (Navbar search + `/api/search`), índice full-text en Postgres
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Escribir en el buscador del navbar | Autocompletado con nombre + thumbnail (debounce); busca en nombre, descripción y categoría |
| AC-2 | Enviar la búsqueda | Página de resultados reutilizando el grid de `/shop` con el término aplicado |
| AC-3 | Sin resultados | Estado vacío con sugerencias o CTA a catálogo |
| AC-4 | Rendimiento | Índice `tsvector`/`pg_trgm`; respuesta < 300 ms en catálogos medianos |

---

### HU-103 — Lista de deseos / favoritos · E4

> Como comprador, quiero guardar productos como favoritos para comprarlos después.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`wishlists`), PDP/grid (corazón), `/account`
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario autenticado marca un favorito | Persiste por cuenta; visible en `/account` |
| AC-2 | Invitado marca un favorito | Persiste en localStorage y se fusiona al iniciar sesión |
| AC-3 | Producto sin stock en la wishlist | Se indica el estado; enlaza a "avísame cuando vuelva" (HU-105) |

---

### HU-104 — Filtro por rango de precio · E4

> Como comprador, quiero filtrar el catálogo por rango de precio para ajustar la búsqueda a mi presupuesto.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web/src/components/shop/ShopClient.tsx`, query de productos
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Control de rango (slider o min/max) | Filtra el grid; combinable con los filtros de variante existentes |
| AC-2 | Estado en la URL | El rango se refleja en query params (compartible, SSR-friendly) |
| AC-3 | Rango sin coincidencias | Estado vacío consistente con los demás filtros |

---

### HU-105 — Avísame cuando vuelva (back-in-stock) · E9

> Como comprador interesado en un producto agotado, quiero dejar mi correo para que me avisen cuando vuelva a haber stock.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`stock_notifications`), PDP, hook de reposición de stock, email
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Producto/variante agotado sin backorder | Se muestra formulario "Avísame cuando vuelva" en la PDP |
| AC-2 | Reposición de stock (RPC/edición admin) | Se envía email a los suscriptores de esa variante y se marca como notificado |
| AC-3 | Idempotencia | Cada suscriptor recibe un solo aviso por evento de reposición |

---

### HU-106 — Alertas de stock bajo para el admin · E9

> Como operador, quiero que el panel me avise cuando un producto cae por debajo de un umbral, para reponer a tiempo.

**Estimación:** S (3 puntos)
**Módulo:** admin (dashboard/badge), `products.low_stock_threshold`
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Umbral configurable por producto (o global) | Se guarda en BD |
| AC-2 | Stock ≤ umbral | Badge/indicador en el dashboard y en el listado de productos |
| AC-3 | Filtro "stock bajo" | El admin puede listar solo los productos por debajo del umbral |

---

### HU-107 — Devoluciones y reembolsos (RMA) · E6  *(dividida en 107a/107b)*

> **L dividida:** el flujo de devolución y el reembolso vía pasarela tienen complejidad y dependencias distintas.

#### HU-107a — Workflow de devolución (RMA) · E6

> Como operador, quiero gestionar solicitudes de devolución (solicitud → aprobación → estado) desde el panel, para ordenar el postventa.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`returns`), admin (pedido → devolución), inventario
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido `approved`/`delivered` | Se inicia devolución (total o por ítem) con motivo y estado |
| AC-2 | Stock | Opción de reponer el stock de los ítems devueltos (reusa RPC de inventario) |
| AC-3 | Trazabilidad | Historial de la devolución asociado al pedido (auditable, HU-146) |

#### HU-107b — Reembolso vía pasarela · E6

> Como operador, quiero ejecutar el reembolso (a la pasarela o como saldo a favor) al aprobar una devolución, para cerrar el ciclo de dinero.

**Estimación:** M (5 puntos)
**Módulo:** API de refund de la pasarela activa, `refunds`, admin
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-107a; opción de crédito reusa HU-148

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Devolución aprobada (HU-107a) | Se registra reembolso: vía API de la pasarela si la soporta, o manual |
| AC-2 | Alternativa saldo a favor | Puede reembolsarse como store credit (HU-148) en lugar de dinero |
| AC-3 | Consistencia | Estado del pedido y del reembolso quedan sincronizados y auditados |

---

### HU-108 — Pasarela internacional (Stripe / PayPal) · E6

> Como negocio con clientes fuera de Colombia, quiero ofrecer una pasarela global para vender internacionalmente.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database/src/providers/payment/StripeGateway.ts` (o PayPal), factory, webhook, config admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Nueva clase que implementa `PaymentGateway` | Se registra en el factory y en `active_provider` sin tocar el checkout |
| AC-2 | Configuración en `/configuracion/pagos` | Nueva pestaña con credenciales + URL de webhook (patrón existente) |
| AC-3 | Webhook con verificación de firma | Actualiza la orden y aplica stock igual que las demás pasarelas |
| AC-4 | Seguridad | La pasarela se deriva del servidor (consistente con HU-092) |

---

### HU-109 — Recuperación de carrito abandonado · E5 (toca E8)

> Como negocio, quiero recordar por email a quienes dejaron el carrito sin comprar, para recuperar ventas.

**Estimación:** L (8 puntos)
**Módulo:** captura de carrito (`abandoned_carts`), tarea programada, plantilla de email (E8)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario con email conocido deja el carrito | Se persiste el carrito con timestamp |
| AC-2 | Pasado el umbral (ej. 4 h) sin compra | Se envía email de recordatorio con enlace de recuperación |
| AC-3 | El cliente completa la compra | Se marca recuperado y no se reenvía |
| AC-4 | Configurable | Umbral y activación gestionables desde el admin |

---

### HU-110 — Retiro en tienda / click & collect · E7

> Como comprador local, quiero elegir "retiro en tienda" en vez de envío, para no pagar despacho.

**Estimación:** M (5 puntos)
**Módulo:** checkout (paso Envío), `shipping_config` (puntos de retiro), admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Método "retiro en tienda" habilitado | Aparece como opción sin costo en el paso de envío |
| AC-2 | Selección de punto de retiro | El cliente elige entre los puntos configurados; se guarda en la orden |
| AC-3 | Estados del pedido | Flujo adaptado (listo para retiro / retirado) en lugar de guía de envío |

---

### HU-111 — Login social (Google / Apple) · E12

> Como usuario, quiero iniciar sesión con Google o Apple para no crear otra contraseña.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web/src/stack.ts` + páginas de auth (Stack Auth OAuth)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Botones de proveedor en `/login` y `/register` | Inician el flujo OAuth de Stack Auth |
| AC-2 | Primer inicio con proveedor social | Se crea el cliente y se dispara el welcome email (reusa flujo actual) |
| AC-3 | Cuenta existente con el mismo email | Se vincula sin duplicar cliente |

---

### HU-112 — Repetir pedido (reorder) · E12

> Como cliente recurrente, quiero recomprar un pedido anterior en un clic.

**Estimación:** S (3 puntos)
**Módulo:** `/account/orders/[id]`, store del carrito
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Botón "Repetir pedido" en el detalle | Agrega al carrito los ítems disponibles del pedido |
| AC-2 | Ítem sin stock o descontinuado | Se omite con aviso; el resto se agrega |
| AC-3 | Cantidades | Respetan los topes de stock (HU-099/100) |

---

### HU-113 — Gestor de redirects 301 · E15

> Como administrador, quiero definir redirecciones 301 de URLs viejas a nuevas desde el panel, para no perder tráfico ni SEO al renombrar rutas o slugs.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`redirects`), `apps/web/middleware.ts`, admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin crea una regla `origen → destino` | Se persiste y valida (evita loops/duplicados) |
| AC-2 | Visita a una URL con regla | El middleware responde 301 al destino |
| AC-3 | Cambio de slug de producto/página | Se sugiere crear el redirect automáticamente |

---

### HU-114 — Internacionalización (i18n) · E2  *(dividida en 114a/114b/114c)*

> **XL dividida.** La i18n se entrega en tres HU incrementales. Candidata a épica propia si se prioriza como eje.

#### HU-114a — i18n: modelo de traducciones + idioma por defecto · E2

> Como plataforma, quiero un modelo de datos de traducciones y la gestión de idiomas (por defecto + adicionales), para que páginas, productos y strings admitan variantes por idioma.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (modelo de traducciones), config de idiomas en admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Idiomas configurables | Se define idioma por defecto + adicionales desde el admin |
| AC-2 | Contenido traducible | Páginas, secciones, productos y strings de UI admiten variante por idioma en el modelo |
| AC-3 | Fallback | Si falta traducción, se resuelve al idioma por defecto sin romper la página |

#### HU-114b — i18n: enrutamiento por locale + hreflang + sitemap · E2

> Como visitante, quiero navegar el sitio en mi idioma con URLs por locale, para que buscadores y usuarios accedan a la versión correcta.

**Estimación:** M (5 puntos)
**Módulo:** routing i18n de Next, `hreflang`, sitemap por idioma
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-114a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Prefijo/locale por idioma | Cada idioma tiene su ruta; se resuelve el contenido traducido |
| AC-2 | SEO | `hreflang` correcto entre versiones y sitemap por idioma |
| AC-3 | Coherencia con redirects | Compatible con el gestor de redirects (HU-113) |

#### HU-114c — i18n: UI de traducción en el admin · E2

> Como editor, quiero una interfaz para traducir contenido idioma por idioma (con estado de completitud), para gestionar los idiomas sin tocar datos crudos.

**Estimación:** M (5 puntos)
**Módulo:** admin (editor multi-idioma), indicador de cobertura de traducción
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-114a; sinergia con HU-118 (traducción por IA)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor por idioma | Alterna idioma y edita cada campo traducible |
| AC-2 | Completitud | Muestra qué contenido falta por traducir por idioma |
| AC-3 | Asistencia IA | Punto de integración para "traducir con IA" (HU-118) |

---

### HU-115 — Biblioteca de medios reutilizable · E2

> Como editor, quiero una biblioteca central de imágenes para reutilizarlas en productos, páginas y blog sin volver a subirlas.

**Estimación:** L (8 puntos)
**Módulo:** admin (media library sobre Supabase Storage), selector reutilizable
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Vista de biblioteca | Lista/busca los medios subidos con metadatos (nombre, tamaño, alt) |
| AC-2 | Selector reutilizable | Productos, secciones CMS y blog eligen desde la biblioteca o suben nuevo |
| AC-3 | Gestión | Renombrar, editar `alt` y eliminar (con aviso si está en uso) |

---

### HU-116 — Reportes de ventas exportables · E13

> Como administrador, quiero métricas de ventas por rango de fecha y exportarlas, para analizar el negocio fuera del panel.

**Estimación:** M (5 puntos)
**Módulo:** admin (dashboard/reportes), export CSV/XLSX
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección de rango de fechas | Ventas, pedidos, ticket promedio y top productos del período |
| AC-2 | Exportar | Descarga CSV/XLSX del período seleccionado |
| AC-3 | Permisos | Solo roles con acceso a reportes lo ven |

---

### HU-117 — 2FA del panel de administración · E14

> Como responsable de seguridad, quiero segundo factor para los administradores, para reforzar el acceso al panel. *(El registro de auditoría se separó a la HU-146.)*

**Estimación:** M (5 puntos)
**Módulo:** Stack Auth (2FA), middleware admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin habilita 2FA | Se exige segundo factor en el login del panel |
| AC-2 | Rol y cobertura | El 2FA aplica a los roles con acceso al panel; recuperación segura |
| AC-3 | Sesión | La verificación se respeta en el middleware de rutas admin |

---

### HU-118 — Traducción automática de contenido con IA · E16

> Como editor, quiero generar traducciones del contenido con IA para poblar rápido los idiomas de HU-114.

**Estimación:** M (5 puntos)
**Módulo:** proveedor de IA (patrón swappable), integración con el modelo de traducciones
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-114

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Página/producto con idioma faltante | Botón "Traducir con IA" genera un borrador editable |
| AC-2 | Revisión humana | La traducción queda como borrador hasta aprobación |
| AC-3 | Proveedor configurable | Usa el proveedor de IA activo (mismo patrón que pagos/envíos) |

---

### HU-119 — Búsqueda semántica de productos · E16

> Como comprador, quiero que la búsqueda entienda intención y sinónimos (no solo coincidencia exacta), para encontrar productos aunque no use las palabras exactas.

**Estimación:** L (8 puntos)
**Módulo:** embeddings + búsqueda vectorial (pgvector), sobre `/api/search` (HU-102)
**Estado:** 🔲 Pendiente (roadmap v17) — evolución de HU-102

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Consulta con sinónimos o descripción vaga | Devuelve productos relevantes por similitud semántica |
| AC-2 | Fallback | Si el proveedor de IA no está disponible, cae a la búsqueda full-text (HU-102) |
| AC-3 | Indexación | Los embeddings se regeneran al crear/editar productos |

---

### HU-120 — Reordenar secciones de página con drag-and-drop · E13 (toca E2)

> Como editor de contenido, quiero arrastrar y soltar las secciones de una página para cambiar su orden, en vez de editar números de orden manualmente.

**Estimación:** M (5 puntos)
**Módulo:** admin (editor de páginas), `page_sections.order_index`, endpoint de reordenamiento
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor de una página con varias secciones | El admin arrastra una sección y suelta en otra posición |
| AC-2 | Al soltar | Se persiste el nuevo `order_index` de todas las secciones afectadas (una sola llamada por lote) |
| AC-3 | La web pública | Renderiza las secciones en el nuevo orden inmediatamente |
| AC-4 | Accesibilidad | El reordenamiento también es posible por teclado (mover arriba/abajo) |

---

### HU-121 — Sistema de plantillas de diseño (layout presets) · E3 (toca E2/E13)

> Como administrador, quiero que "Apariencia" gestione **plantillas de diseño** —el theme actual como plantilla por defecto— y poder crear plantillas adicionales y activar una, para cambiar la organización visual del sitio sin tocar código.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`layouts` / extensión de `themes`), admin `/sistema/apariencia`, capa de resolución de plantilla activa
**Estado:** 🔲 Pendiente (roadmap v17) — *base del sistema; el render por componente va en HU-122*
> **Nota de independencia:** este es el theming del **storefront** (tokens `--brand-*`/`--theme-*`, por-tenant, editable por el comerciante) — **independiente** del design system de paneles (HU-210, `--mk-*`). En E17 pasa a fila-por-tenant vía **HU-207**. No debe acoplarse al preset de panel (HU-213).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Estado inicial | El theme actual (colores + tipografía) queda registrado como **plantilla por defecto**, sin cambios visibles |
| AC-2 | Crear plantilla | El admin crea una plantilla nueva a partir de la actual (colores, tipografía y variantes de disposición) |
| AC-3 | Activar plantilla | Solo una activa a la vez (mismo patrón que el theme actual); la selección se persiste |
| AC-4 | Resolución | La web pública lee la plantilla activa en el servidor e inyecta sus tokens/variantes |

---

### HU-122 — Variantes de disposición por plantilla · E3  *(dividida en 122a/122b/122c)*

> **XL dividida** por superficie, para entregar valor incremental (no todo-o-nada). Todas dependen de HU-121.

#### HU-122a — Framework de variantes + navbar y home · E3 (toca E2)

> Como administrador, quiero el mecanismo de variantes de disposición y aplicarlo a navbar y home, para empezar a personalizar la estructura visual.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (registro de variantes por superficie), `packages/ui`, render por plantilla activa
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-121

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Registro de variantes | Framework que declara ≥2 variantes por superficie y las resuelve por plantilla activa |
| AC-2 | Navbar y home | Ambas superficies exponen variantes seleccionables desde Apariencia |
| AC-3 | Render y fallback | Render sin recompilar; si no hay variante, usa la de la plantilla por defecto |
| AC-4 | Extensibilidad | Agregar una variante = registrar componente + declararlo, sin tocar checkout ni queries |

#### HU-122b — Variantes de grid de tienda y PDP · E3

> Como administrador, quiero variantes de disposición para el grid de tienda y la página de producto, para adaptar la experiencia de catálogo.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (shop grid, PDP), sobre el framework de HU-122a
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-122a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Grid de tienda | ≥2 variantes (p. ej. columnas/densidad/tarjeta) seleccionables por plantilla |
| AC-2 | PDP | ≥2 variantes de layout de producto |
| AC-3 | Consistencia | Reusa el framework y el fallback de HU-122a |

#### HU-122c — Variante de carrito · E3

> Como administrador, quiero variantes de disposición del carrito (drawer/página), para cerrar la personalización de las superficies clave.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (carrito/drawer), sobre el framework de HU-122a
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-122a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Carrito | ≥2 variantes de disposición seleccionables por plantilla |
| AC-2 | Consistencia | Reusa framework/fallback de HU-122a; respeta la lógica de carrito existente |

---

### HU-123 — Import/Export extensible y versionado · E2

> Como administrador, quiero exportar e importar toda la configuración y el contenido del sitio en un paquete versionado que incluya los cambios actuales y tolere futuras adiciones, para clonar, respaldar o migrar una instancia.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (export/import), admin, esquema de paquete con versión
**Estado:** 🔲 Pendiente (roadmap v17) — evoluciona el export/import actual

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar | Genera un paquete con páginas, secciones, ítems, nav, **plantillas de diseño (HU-121/122)**, productos, categorías, variantes y configuración; con número de versión de esquema |
| AC-2 | Importar una versión anterior | Migración tolerante: campos nuevos toman valores por defecto; no falla por claves desconocidas |
| AC-3 | Colisiones | Estrategia clara (omitir/actualizar) por clave estable (`key`/`slug`/`nav_key`) |
| AC-4 | Extensibilidad | Añadir una entidad futura al export solo requiere registrarla en el manifiesto, sin reescribir el importador |

---

### HU-124 — Carga masiva de productos por CSV · E13 (toca E4/E9)

> Como operador, quiero subir un archivo `.CSV` para crear o actualizar muchos productos y su inventario de una vez, en lugar de cargarlos uno por uno.

**Estimación:** L (8 puntos)
**Módulo:** admin (importador CSV), validación + mapeo de columnas, upsert de productos/variantes/stock
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Subida de CSV + plantilla descargable | El admin mapea columnas a campos (nombre, slug, precio, categoría, stock, variantes…) |
| AC-2 | Previsualización y validación | Muestra filas válidas/erróneas antes de confirmar; no importa nada si el usuario cancela |
| AC-3 | Importación | Crea o actualiza (upsert por `slug`/SKU); reporta creados, actualizados y errores por fila |
| AC-4 | Inventario | El stock de cada variante se establece/ajusta respetando el modelo de inventario existente |
| AC-5 | Idempotencia | Reimportar el mismo archivo no duplica productos |

---

### HU-125 — Respaldo (backup) de productos, pedidos y clientes · E14 (toca E13)

> Como administrador, quiero generar respaldos de productos, pedidos y clientes, para proteger los datos y poder restaurarlos o auditarlos.

**Estimación:** M (5 puntos)
**Módulo:** admin (exportación de respaldo), `packages/database`, opcional tarea programada
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Generar respaldo | Descarga un archivo (CSV/JSON) por dominio: productos, pedidos y clientes |
| AC-2 | Alcance y permisos | Solo roles autorizados; los datos sensibles se manejan con service_role del lado servidor |
| AC-3 | Programación (opcional) | Se puede agendar un respaldo periódico automático |
| AC-4 | Integridad | El respaldo es consistente (snapshot) y documenta fecha/versión para restauración |

---

### HU-126 — Reordenamiento drag-and-drop generalizado · E13

> Como editor/operador, quiero arrastrar para reordenar también los ítems del menú, las imágenes de un producto y las categorías, con la misma interacción que las secciones de página (HU-120).

**Estimación:** M (5 puntos)
**Módulo:** admin (nav, galería de producto, categorías), utilidad de reordenamiento reutilizable
**Estado:** 🔲 Pendiente (roadmap v17) — generaliza HU-120

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Listado ordenable (nav, imágenes, categorías) | Se arrastra un ítem y se persiste el nuevo `order_index` por lote |
| AC-2 | Imagen principal de producto | Reordenar define la imagen destacada (posición 0) |
| AC-3 | Consistencia | Reusa el mismo componente/endpoint que HU-120 (una sola implementación) |
| AC-4 | Accesibilidad | Alternativa por teclado (subir/bajar) en todos los listados |

---

### HU-127 — Historial de versiones y restauración de contenido CMS · E2

> Como editor, quiero ver el historial de cambios de una página y restaurar una versión anterior, para deshacer errores con seguridad al manipular contenido y layout.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`content_revisions`), admin (editor de páginas)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Guardar cambios de una página/secciones | Se registra una revisión con autor y timestamp |
| AC-2 | Ver historial | Lista de revisiones con diferencias legibles |
| AC-3 | Restaurar | Vuelve el contenido a una revisión previa (creando una nueva revisión, sin perder historial) |
| AC-4 | Alcance | Cubre secciones, ítems y su orden (compatible con HU-120/126) |

---

### HU-128 — Vista previa y publicación de plantillas (borrador/publicado) · E3

> Como administrador, quiero previsualizar una plantilla de diseño antes de activarla y publicarla cuando esté lista, para probar cambios de layout sin afectar la web en producción.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (modo preview con token), admin `/sistema/apariencia`, estado borrador/publicado de la plantilla
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-121/122

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editar una plantilla no activa | Se puede abrir una vista previa del sitio con esa plantilla (URL/token de preview, no visible al público) |
| AC-2 | Publicar | La plantilla en borrador se activa de forma atómica; el público la ve al publicar |
| AC-3 | Descartar | Se pueden abandonar los cambios en borrador sin afectar la plantilla activa |
| AC-4 | Seguridad | El preview solo es accesible con sesión admin o token firmado |

---

### HU-129 — Paquetes de plantilla exportables/importables · E3 (toca E2)

> Como administrador, quiero exportar una plantilla completa (colores, tipografías, variantes de disposición y, opcionalmente, contenido de ejemplo) como un paquete e importarla en otra instancia, para reutilizar diseños entre proyectos.

**Estimación:** M (5 puntos)
**Módulo:** export/import (extiende HU-123), admin Apariencia
**Estado:** 🔲 Pendiente (roadmap v17) — se apoya en HU-121/122/123

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar plantilla | Genera un paquete versionado con theme + variantes de disposición (± contenido de ejemplo) |
| AC-2 | Importar plantilla | Crea la plantilla como borrador (no activa), lista para previsualizar (HU-128) |
| AC-3 | Compatibilidad | Tolerante a versiones (reusa el esquema versionado de HU-123) |
| AC-4 | Colisiones | No sobreescribe la plantilla activa; nombra/versiona la importada |

---

### HU-130 — Exportar productos a CSV · E13

> Como operador, quiero exportar el catálogo (o una selección filtrada) a `.CSV`, como contraparte de la carga masiva, para editar en hoja de cálculo y reimportar.

**Estimación:** S (3 puntos)
**Módulo:** admin (listado de productos), exportador CSV
**Estado:** 🔲 Pendiente (roadmap v17) — simétrico de HU-124

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar desde el listado | Descarga CSV con columnas compatibles con el importador (HU-124) |
| AC-2 | Respeta filtros | Exporta solo lo filtrado/seleccionado si aplica |
| AC-3 | Ciclo redondo | El CSV exportado puede reimportarse sin transformación manual |

---

### HU-131 — Acciones masivas / edición por lote en listas del admin · E13

> Como operador, quiero seleccionar varios registros y aplicar acciones en lote (cambiar precio, categoría, stock, publicar/despublicar), para administrar el catálogo con eficiencia.

**Estimación:** M (5 puntos)
**Módulo:** admin (listas con selección múltiple), endpoints de actualización por lote
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección múltiple en el listado | Barra de acciones masivas con las operaciones disponibles |
| AC-2 | Aplicar cambio en lote | Actualiza todos los seleccionados en una operación; reporta resultado |
| AC-3 | Seguridad y confirmación | Requiere confirmación en acciones destructivas; respeta permisos por rol |

---

### HU-132 — Importadores CSV para otras entidades · E13

> Como operador, quiero importar por CSV también clientes, cupones, categorías y posts del blog, con el mismo flujo de la carga de productos.

**Estimación:** M (5 puntos)
**Módulo:** admin (importador genérico reutilizable), validación/mapeo por entidad
**Estado:** 🔲 Pendiente (roadmap v17) — generaliza HU-124

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección de entidad + CSV + plantilla | Mapeo de columnas por entidad (clientes, cupones, categorías, posts) |
| AC-2 | Validación previa | Previsualización con filas válidas/erróneas antes de confirmar |
| AC-3 | Upsert e informe | Crea/actualiza por clave estable y reporta creados/actualizados/errores |
| AC-4 | Reutilización | Comparte el motor de importación con HU-124 (una sola base) |

---

### HU-133 — Restauración desde respaldo + respaldos programados · E14

> Como administrador, quiero restaurar datos a partir de un respaldo y programar respaldos automáticos periódicos, para recuperación ante desastres, no solo generación manual.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (restore), tarea programada, admin
**Estado:** 🔲 Pendiente (roadmap v17) — extiende HU-125

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cargar un respaldo (HU-125) | Previsualiza el contenido y valida versión/integridad antes de restaurar |
| AC-2 | Restaurar | Aplica el respaldo (con estrategia clara de colisión) de forma transaccional |
| AC-3 | Programación | Respaldos automáticos periódicos (diario/semanal) con retención configurable |
| AC-4 | Seguridad | Solo `super_admin`; operación auditada (compatible con HU-117/134) |

---

### HU-134 — Control de acceso por rol para importar/exportar/respaldar · E14 (toca E13)

> Como responsable, quiero controlar por rol quién puede importar, exportar y respaldar datos, porque estas operaciones mueven información sensible en volumen.

**Estimación:** S (3 puntos)
**Módulo:** `roles.ts`, guards de las rutas de import/export/backup, admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Rol sin permiso | No ve ni puede invocar import/export/backup (server-side) |
| AC-2 | Configuración de permisos | Los permisos de estas operaciones se definen por rol |
| AC-3 | Auditoría | Cada import/export/backup queda registrado (actor, entidad, fecha) |

---

## Detalle · E16 (v2) — Aplicación inteligente: HU-135…143

> **Visión ampliada:** E16 evoluciona de "componentes de IA" sueltos a una **capa de inteligencia** transversal de la plataforma. Se construye en dos niveles: **(A) cimientos** —proveedor de IA intercambiable, captura de eventos de comportamiento y almacén de vectores— y **(B) features** que los consumen (asistente de compra, búsqueda visual, personalización, clustering, patrones de compra y personalización de apariencia por chat). Regla de oro: la IA se **cimienta en datos reales del catálogo/tienda** (RAG/grounding), nunca inventa productos, precios ni stock, y respeta la misma seguridad server-side del checkout (HU-092). Todo **🔲 (roadmap)**.
>
> **Amplía** IA-01/02/03 y HU-118/119 (ya definidas): IA-02 → HU-140 (personalización por comportamiento) · IA-03 → HU-138 (asistente transaccional) · HU-119 (búsqueda semántica) ↔ HU-139 (búsqueda visual, mismo vector store).

### Cimientos (habilitadores)

### HU-135 — Capa de proveedor de IA configurable (swappable) · E16

> Como plataforma, quiero una abstracción de proveedor de IA (igual patrón que pagos/envíos/email), para conectar distintos modelos (LLM, embeddings, visión) sin acoplar las features.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database/src/providers/ai/*` (interfaz + factory), config admin, fail-safe
**Estado:** 🔲 Pendiente (roadmap v18) — **base de todo E16**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `AIProvider` (chat, embeddings, visión) | Implementaciones intercambiables registradas en un factory |
| AC-2 | Configuración en el admin | Proveedor activo + credenciales + modelo por tarea; una sola llave sensible vía service_role |
| AC-3 | Resiliencia | Si el proveedor falla/está caído, las features degradan con fallback (no rompen la tienda) |
| AC-4 | Coste/latencia | Respuestas cacheables; llamadas asíncronas donde aplique |

---

### HU-136 — Captura de eventos de comportamiento (telemetría de tienda) · E16

> Como plataforma, quiero registrar eventos (vistas de producto, búsquedas, add-to-cart, compras) asociados a sesión/usuario, para alimentar personalización, clustering y análisis de patrones.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`events`/`interactions`), captura en web, consentimiento
**Estado:** 🔲 Pendiente (roadmap v18) — **dato base de HU-140/141/142**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interacción del usuario (view, search, add-to-cart, purchase) | Se registra el evento con timestamp, producto/categoría y sesión/usuario |
| AC-2 | Consentimiento y privacidad | Respeta consentimiento; datos personales minimizados y con retención configurable |
| AC-3 | Invitados y autenticados | Eventos anónimos se fusionan al perfil al iniciar sesión |
| AC-4 | Valor inmediato | Empieza a capturar desde ya, aunque las features de IA lleguen después (dato acumulativo) |

---

### HU-137 — Infraestructura de embeddings / vector store · E16

> Como plataforma, quiero indexar productos (texto e imagen) como vectores en Postgres (`pgvector`), para habilitar búsqueda semántica y visual y recomendaciones por similitud.

**Estimación:** M (5 puntos)
**Módulo:** `pgvector`, pipeline de indexación al crear/editar productos, servicio de similitud
**Estado:** 🔲 Pendiente (roadmap v18) — **base de HU-119/139/140**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Crear/editar producto | Se generan/actualizan embeddings de texto (y de imagen si aplica) |
| AC-2 | Consulta por similitud | Búsqueda vectorial eficiente (índice) con umbral configurable |
| AC-3 | Reindexado | Job para regenerar embeddings ante cambio de modelo/proveedor |
| AC-4 | Fallback | Sin vectores disponibles, las features degradan a full-text (HU-102) |

---

### Features inteligentes

### HU-138 — Asistente virtual de compra · E16  *(dividida en 138a/138b)*

> **XL dividida** por nivel de riesgo: primero conversar/recomendar (solo-lectura), luego ejecutar acciones (transaccional).

#### HU-138a — Asistente conversacional (RAG, solo lectura) · E16

> Como comprador, quiero un asistente que entienda lo que busco y me recomiende y compare productos del catálogo, para decidir más fácil.

**Estimación:** L (8 puntos)
**Módulo:** chat sobre RAG del catálogo/CMS (HU-135/137)
**Estado:** 🔲 Pendiente (roadmap v18) — evoluciona IA-03

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pregunta en lenguaje natural | Responde con productos reales del catálogo (grounding); nunca inventa productos/precios/stock |
| AC-2 | Comparar/recomendar | Sugiere y compara productos existentes; enlaza a la PDP |
| AC-3 | Continuidad | Usa historial de sesión y, si hay, perfil del usuario (HU-136/140) |
| AC-4 | Fallback | Si la IA no está disponible, ofrece búsqueda/navegación estándar |

#### HU-138b — Acciones transaccionales del asistente · E16

> Como comprador, quiero que el asistente ejecute acciones (agregar al carrito, guiarme al checkout), para avanzar la compra desde el chat.

**Estimación:** L (8 puntos)
**Módulo:** capa de acciones acotadas sobre HU-138a, integración con carrito/checkout
**Estado:** 🔲 Pendiente (roadmap v18) — depende de HU-138a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | "Agregar al carrito" desde el chat | Ejecuta la acción y **confirma** antes de acciones sensibles; respeta stock (HU-098/100) |
| AC-2 | Guiar al pago | Conduce al checkout seguro; cualquier paso de pago pasa por el flujo del servidor (HU-092), el asistente no lo elude |
| AC-3 | Límites | Acciones acotadas y auditables (HU-146); nunca modifica precios ni datos de otros usuarios |

---

### HU-139 — Búsqueda visual de productos (por imagen) · E16

> Como comprador, quiero subir o tomar una foto y encontrar productos iguales o similares del catálogo, para buscar por imagen en vez de palabras.

**Estimación:** L (8 puntos)
**Módulo:** embeddings de imagen (HU-135/137), UI de carga/cámara, resultados por similitud
**Estado:** 🔲 Pendiente (roadmap v18) — comparte vector store con HU-119

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Subir/capturar una imagen | Devuelve productos visualmente similares ordenados por afinidad |
| AC-2 | Sin coincidencias claras | Estado vacío con sugerencias o búsqueda textual alternativa |
| AC-3 | Privacidad | La imagen se procesa de forma efímera; no se almacena sin consentimiento |
| AC-4 | Rendimiento | Reusa el índice vectorial (HU-137); respuesta acotada |

---

### HU-140 — Sugerencias personalizadas por usuario · E16

> Como comprador, quiero recomendaciones adaptadas a mi comportamiento y gustos (no solo "relacionados"), para descubrir productos relevantes para mí.

**Estimación:** L (8 puntos)
**Módulo:** perfil de usuario + eventos (HU-136), similitud (HU-137), motor híbrido
**Estado:** 🔲 Pendiente (roadmap v18) — profundiza IA-02

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario con historial | Home/PDP muestran recomendaciones personalizadas por su comportamiento |
| AC-2 | Cold-start (sin historial) | Fallback a contenido/similitud (HU-137) y populares, sin degradar la UX |
| AC-3 | Explicabilidad | Se indica el porqué ("porque viste…", "afín a tus gustos") |
| AC-4 | Medición | Se puede A/B testear el lift (CTR/conversión/AOV) |

---

### HU-141 — Segmentación por clustering de afinidad/gustos · E16

> Como negocio, quiero agrupar clientes por afinidad y gustos (clustering) para dirigir campañas, recomendaciones y contenido a cada segmento.

**Estimación:** L (8 puntos)
**Módulo:** clustering sobre eventos/embeddings (HU-136/137), segmentos en admin
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Datos suficientes | Se generan segmentos de clientes con características legibles |
| AC-2 | Uso de segmentos | Alimentan personalización (HU-140), newsletter y campañas |
| AC-3 | Admin | El operador ve, nombra y ajusta segmentos; tamaño y rasgos por segmento |
| AC-4 | Privacidad | Segmentación agregada; respeta consentimiento y retención (HU-136) |

---

### HU-142 — Análisis de patrones de comportamiento de compra · E16

> Como administrador, quiero insights sobre patrones de compra (secuencias, productos que se compran juntos, estacionalidad, abandono), para tomar decisiones de catálogo y marketing.

**Estimación:** M (5 puntos)
**Módulo:** analítica sobre eventos/pedidos (HU-136), panel de insights (± resumen con LLM)
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Panel de patrones | Productos comprados juntos, secuencias frecuentes, tendencias temporales |
| AC-2 | Resumen accionable | Opción de resumen en lenguaje natural con recomendaciones (grounded en los datos) |
| AC-3 | Export | Los insights se pueden exportar (compatible con HU-116) |
| AC-4 | Alcance | Solo roles con acceso a analítica |

---

### HU-143 — Personalización de apariencia por chat/LLM · E16

> Como administrador, quiero describir en lenguaje natural cómo quiero que se vea el sitio ("hazlo más minimalista y en tonos verdes") y que la IA lo traduzca en cambios de plantilla, para personalizar la apariencia sin tocar controles uno por uno.

**Estimación:** L (8 puntos)
**Módulo:** LLM (HU-135) → cambios sobre el sistema de plantillas (HU-121/122), como borrador
**Estado:** 🔲 Pendiente (roadmap v18) — depende de HU-121/122/128 y HU-135

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Instrucción en lenguaje natural | La IA propone cambios de colores, tipografía y variantes de disposición dentro del esquema de plantillas |
| AC-2 | Nunca auto-publica | Los cambios se aplican como **borrador** para previsualizar (HU-128) antes de publicar |
| AC-3 | Validación | Los cambios se validan contra el esquema de plantilla (no rompe el layout) |
| AC-4 | Reversible | Se puede descartar y volver a la plantilla activa sin efectos |

---

### HU-144 — Generación de imágenes y variantes visuales de producto con IA · E16

> Como operador de catálogo, quiero generar o mejorar imágenes de producto con IA (fotos de estudio, fondos limpios, variantes por color/ambiente), para publicar catálogo visual de calidad sin sesión fotográfica por cada producto.

**Estimación:** L (8 puntos)
**Módulo:** proveedor de IA de imagen (HU-135), admin (editor de producto), Storage + biblioteca de medios (HU-115)
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Imagen base o descripción del producto | La IA genera opciones (fondo limpio, ambientada, variantes por color) para elegir |
| AC-2 | Revisión humana | Las imágenes generadas quedan como propuestas; el operador aprueba antes de publicarlas |
| AC-3 | Almacenamiento | Las aprobadas se guardan en Storage y en la biblioteca de medios (HU-115) |
| AC-4 | Trazabilidad y derechos | Se marca la imagen como generada por IA; proveedor configurable (HU-135) |
| AC-5 | Fallback | Si el proveedor no está disponible, la carga manual de imágenes sigue funcionando |

---

### HU-145 — Detección de fraude y anomalías en pedidos · E16

> Como operador, quiero que la plataforma señale pedidos con patrones sospechosos (montos atípicos, velocidad anormal, datos inconsistentes), para revisarlos antes de despachar y reducir contracargos.

**Estimación:** L (8 puntos)
**Módulo:** scoring sobre eventos/pedidos (HU-136), señal en el panel de pedidos, reglas + modelo
**Estado:** 🔲 Pendiente (roadmap v18) — se apoya en HU-136

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido con patrón atípico | Recibe un score de riesgo y se resalta en el listado de pedidos para revisión |
| AC-2 | Explicabilidad | Se indica el motivo del riesgo (regla/señal disparada), no solo un número |
| AC-3 | Acción del operador | Puede marcar como revisado/legítimo o retener; queda auditado (HU-117) |
| AC-4 | No bloqueante | Nunca cancela pedidos de forma automática; solo señala para decisión humana |
| AC-5 | Privacidad | Usa datos mínimos necesarios; respeta consentimiento y retención (HU-136) |

---

## Detalle · v18 — Nuevas HU (HU-146…155) y Épica E17

> Nuevas historias derivadas de la revisión del roadmap. Incluyen el **registro de auditoría** extraído de HU-117 (enabler de HU-133/134/145/107b) y capacidades de comercio, privacidad y operación. Todas **🔲 (roadmap)**.

### HU-146 — Registro de auditoría (enabler) · E14

> Como responsable, quiero un registro central de acciones sensibles del panel (quién, qué, cuándo, sobre qué), para trazabilidad, seguridad y cumplimiento.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`audit_log`), hooks en acciones sensibles, vista en admin
**Estado:** 🔲 Pendiente (roadmap v17) — extraída de HU-117; la consumen HU-133/134/145/107b

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Acción sensible (config, rol, precio, pago, import/export, backup) | Registra actor, acción, entidad, valores y timestamp |
| AC-2 | Consulta | Filtrable por actor/fecha/tipo/entidad; solo `super_admin` |
| AC-3 | Integridad | Registro append-only (no editable); retención configurable |

---

### HU-147 — Motor de descuentos y promociones · E5 (toca E4/E6)

> Como negocio, quiero reglas de promoción más allá de cupones (2x1/BOGO, escalonado por volumen, por categoría o por carrito), para ejecutar campañas comerciales.

**Estimación:** L (8 puntos)
**Módulo:** motor de reglas de promoción, aplicación en carrito/checkout, admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definir promoción | Tipos: BOGO, descuento escalonado, por categoría, por monto de carrito, con vigencia |
| AC-2 | Aplicación | Se aplica automáticamente en el carrito; combinable/excluyente según configuración |
| AC-3 | Coexistencia con cupones | Reglas claras de acumulación con los cupones existentes |
| AC-4 | Seguridad | El cálculo del total es autoridad del servidor (consistente con el checkout) |

---

### HU-148 — Gift cards / saldo a favor (store credit) · E6

> Como negocio, quiero emitir gift cards y saldo a favor que el cliente use como medio de pago, para fidelizar y para resolver reembolsos como crédito.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`gift_cards`/`store_credit`), checkout (medio de pago), admin
**Estado:** 🔲 Pendiente (roadmap v17) — soporta reembolso como crédito (HU-107b)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Emitir/canjear gift card | Código con saldo aplicable en el checkout (validación server-side) |
| AC-2 | Saldo a favor por cuenta | El cliente ve y usa su store credit en la compra |
| AC-3 | Reembolso como crédito | Una devolución (HU-107) puede acreditarse como saldo |
| AC-4 | Integridad | Movimientos de saldo auditados (HU-146); sin doble gasto |

---

### HU-149 — Motor de impuestos multi-región · E6 (toca E7)

> Como negocio que vende en varias regiones, quiero calcular impuestos según reglas por región/producto, para cumplir y mostrar precios correctos.

**Estimación:** L (8 puntos)
**Módulo:** reglas de impuesto por región/categoría, cálculo en checkout, admin
**Estado:** 🔲 Pendiente (roadmap v17) — se conecta con HU-108 (internacional) y HU-114 (i18n)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Reglas configurables | Tasa por región y categoría (incluido/excluido en precio) |
| AC-2 | Checkout | El impuesto se calcula por la dirección/región y se muestra desglosado |
| AC-3 | Reportes | Los impuestos recaudados aparecen en reportes (HU-116) |

---

### HU-150 — Consulta de pedido como invitado · E12

> Como comprador sin cuenta, quiero consultar el estado de mi pedido con su número y correo, para hacer seguimiento sin registrarme.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web` (búsqueda de pedido), verificación por número + email
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Número de pedido + email | Muestra estado y tracking si coinciden (verificación server-side) |
| AC-2 | Datos que no coinciden | No revela información; mensaje neutro |
| AC-3 | Privacidad | Solo expone lo necesario del pedido; sin datos sensibles |

---

### HU-151 — Portabilidad y borrado de datos del cliente · E12 (toca E14)

> Como cliente, quiero exportar o eliminar mis datos personales, para ejercer mis derechos de privacidad (derecho al olvido).

**Estimación:** M (5 puntos)
**Módulo:** `/account` (solicitud), proceso server-side, anonimización de histórico
**Estado:** 🔲 Pendiente (roadmap v17) — requerido si se captura comportamiento (HU-136)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Solicitud de exportación | El cliente descarga sus datos (perfil, pedidos, direcciones) |
| AC-2 | Solicitud de borrado | Se elimina/anonimiza su información conservando lo legalmente requerido (p. ej. facturación) |
| AC-3 | Auditoría | La operación queda registrada (HU-146) |

---

### HU-152 — Consentimiento y gestión de cookies · E14 (toca E2/E16)

> Como visitante, quiero controlar qué cookies/telemetría acepto, para navegar respetando mi privacidad; y como plataforma, para habilitar legalmente la analítica.

**Estimación:** M (5 puntos)
**Módulo:** banner/preferencias de consentimiento, gating de telemetría (HU-136)
**Estado:** 🔲 Pendiente (roadmap v17) — **desbloquea legalmente HU-136**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Primera visita | Banner con aceptar/rechazar/preferencias por categoría |
| AC-2 | Sin consentimiento | La telemetría de comportamiento (HU-136) no se activa |
| AC-3 | Persistencia | La preferencia se recuerda y es revocable en cualquier momento |

---

### HU-153 — Notificaciones multicanal (WhatsApp / SMS) · E8

> Como negocio, quiero enviar notificaciones transaccionales también por WhatsApp/SMS además de email, para llegar mejor al cliente.

**Estimación:** L (8 puntos)
**Módulo:** proveedor de mensajería intercambiable (patrón swappable), plantillas, config admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Evento transaccional (pago, envío) | Se puede notificar por el/los canales configurados |
| AC-2 | Proveedor configurable | Canal y credenciales gestionables desde el admin (mismo patrón que email/pagos) |
| AC-3 | Preferencias y consentimiento | Respeta opt-in del cliente y el canal elegido |

---

### HU-154 — Accesibilidad (a11y / WCAG) · E3 (transversal)

> Como usuario con discapacidad, quiero que el sitio cumpla criterios de accesibilidad, para navegar y comprar sin barreras.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` + `packages/ui` (semántica, foco, contraste, teclado, ARIA)
**Estado:** 🔲 Pendiente (roadmap v17) — transversal a todo el sitio público

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Navegación por teclado | Todos los flujos clave (catálogo, carrito, checkout) operables por teclado con foco visible |
| AC-2 | Lectores de pantalla | Semántica y ARIA correctos; imágenes con `alt` |
| AC-3 | Contraste y objetivos | Cumple contraste AA y tamaños mínimos táctiles |
| AC-4 | Verificación | Auditoría automatizada (axe) en CI como criterio |

---

### HU-155 — Monitoreo de rendimiento / Core Web Vitals · E15

> Como responsable, quiero monitorear Core Web Vitals y presupuesto de rendimiento, para mantener rápida la tienda (impacto directo en conversión y SEO).

**Estimación:** M (5 puntos)
**Módulo:** captura de Web Vitals, reporte, presupuesto en CI
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Métricas reales de usuario | Se capturan LCP/INP/CLS y se reportan por página |
| AC-2 | Presupuesto | Umbrales de rendimiento verificables (alerta si se degradan) |
| AC-3 | Acción | Panel/reporte que prioriza las páginas más lentas |

---

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
**Estado:** 🔲 Pendiente (roadmap v18).
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
**Estado:** 🔲 Pendiente (roadmap v18)

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
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definición | Bundle = componentes + precio, desde el admin |
| AC-2 | Compra | PDP y carrito lo tratan como una línea; el inventario descuenta cada componente (RPC de stock, HU-098) |
| AC-3 | Precio | El precio del bundle entra al pipeline (HU-164) |
| AC-4 | Stock | Backorder/disponibilidad según el componente más restrictivo |

---

### HU-169 — Onboarding / asistente de configuración inicial · E13

> Como nuevo comercio (white-label), quiero un asistente guiado de primer arranque (marca, pago, envío, dominio, legales), para dejar la tienda operativa sin fricción.

**Estimación:** M (5 puntos)
**Módulo:** wizard en admin, checklist de setup
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Wizard de arranque | Identidad/tema, pasarela activa, proveedor de envío, dominio, legales |
| AC-2 | Estado | Checklist con lo pendiente; se puede retomar |
| AC-3 | Multi-tienda | En E17, aplica por tienda |

---

### HU-170 — Monitoreo de errores en runtime (APM / error tracking) · E14

> Como responsable, quiero capturar y agrupar errores de runtime (front y back) con contexto, para detectar y resolver incidencias.

**Estimación:** M (5 puntos)
**Módulo:** integración de error tracking (Sentry o similar), source maps, alertas
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Captura | Errores de cliente y servidor con traza y contexto (usuario/tenant) |
| AC-2 | Gestión | Agrupación, alertas, entorno y release asociados |
| AC-3 | Privacidad | Sin PII innecesaria; respeta consentimiento (HU-152) |

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

---

### HU-174 — Dominios personalizados de la web pública (DNS → certificado → CDN → activo) · E17

> Como comercio, quiero conectar mi propio dominio a mi tienda con un proceso guiado y verificable, para operar bajo mi marca.

**Estimación:** XL (13+ puntos)
**Módulo:** gestión de dominios + máquina de estados; integración con CDN/host para certificado + propagación
**Estado:** 🔲 Pendiente (roadmap) — extiende HU-157

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

## Detalle · E18 — Inventario multi-ubicación y fulfillment (HU-176…183)  *(roadmap)*

> **Épica nueva.** Introduce el concepto de **ubicaciones** (tipo Shopify Locations): el stock pasa de `por variante` a `por (variante, ubicación)`, con fulfillment por lugar, transferencias y retiro por punto. Es un **cambio de modelo fundacional** que toca inventario (E9), envíos (E7), catálogo (E4) y admin (E13), y hereda el aislamiento de E17. Incluye una HU dedicada a **migrar lo ya implementado** sin ruptura. Todo **🔲 (roadmap)**.

### HU-176 — Modelo de ubicaciones (`locations`) · E18

> Como negocio, quiero definir ubicaciones (bodegas, tiendas físicas, puntos de retiro) con dirección y capacidades, para gestionar inventario y fulfillment por lugar.

**Estimación:** M (5 puntos)
**Módulo:** tabla `locations` (con `store_id`), toggles, admin
**Estado:** 🔲 Pendiente (roadmap) — **cimiento de E18**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CRUD | Ubicación con dirección y toggles (¿surte envíos?, ¿permite retiro?) |
| AC-2 | Multi-tenant | `store_id` por ubicación (aislamiento heredado de E17) |
| AC-3 | Default | Una ubicación por defecto obligatoria (para compatibilidad y backfill) |

---

### HU-177 — Inventario por ubicación (`inventory_levels`) + RPCs por ubicación · E18

> Como plataforma, quiero llevar el stock por `(variante, ubicación)` con operaciones atómicas por ubicación, para reflejar existencias reales por lugar.

**Estimación:** L (8 puntos)
**Módulo:** tabla `inventory_levels`, RPCs `decrement/restore` con `p_location_id`
**Estado:** 🔲 Pendiente (roadmap) — **enabler del modelo**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Modelo | `inventory_levels(variant_id, location_id, stock)` único por par |
| AC-2 | RPCs por ubicación | `decrement/restore_variant_stock` reciben `location_id`; respetan `allow_backorder`; atómicos e idempotentes |
| AC-3 | Disponibilidad agregada | Vista de stock total por variante (suma de ubicaciones) para consumidores que no distinguen ubicación |
| AC-4 | Concurrencia | Mismo control de carrera que el modelo actual |

---

### HU-178 — Migración del modelo de stock único → multi-ubicación · E18

> Como equipo, quiero migrar el modelo actual (stock único por variante) al multi-ubicación **sin pérdida ni ruptura**, para adoptar el nuevo enfoque de forma segura.

**Estimación:** L (8 puntos)
**Módulo:** migración de datos + refactor de los consumidores existentes
**Estado:** 🔲 Pendiente (roadmap) — **contempla los cambios de lo ya implementado**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Backfill | Se crea la ubicación por defecto y el `product_variants.stock` actual se copia a `inventory_levels` de esa ubicación |
| AC-2 | Compatibilidad | `product_variants.stock` se conserva como **agregado derivado** (o se deprecia) con lectura agregada durante la transición |
| AC-3 | Refactor de consumidores | Se adaptan: `stock.ts` (`applyStockForOrder`/`restoreStockForOrder` → por ubicación de fulfillment), RPCs (HU-098), topes del front `getStockForVariants`/PDP (HU-100), back-in-stock (HU-105), alertas (HU-106), validación 409 del checkout y el campo de stock en `ProductForm` (admin) |
| AC-4 | Cutover por fases | Con retrocompatibilidad; se prueba que el flujo actual (una sola ubicación) queda idéntico |
| AC-5 | Seguro | No rompe órdenes ni stock existentes; reversible |

---

### HU-179 — Ruteo de fulfillment (origen del despacho) · E18

> Como operador, quiero que cada pedido se surta desde una ubicación (por disponibilidad, cercanía o manual), para definir el origen del envío o el punto de retiro.

**Estimación:** L (8 puntos)
**Módulo:** asignación de ubicación de fulfillment por orden, integración con envíos (E7)
**Estado:** 🔲 Pendiente (roadmap) — depende de HU-177

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Asignación | Regla por disponibilidad + cercanía a la dirección, o selección manual |
| AC-2 | Descuento | El stock se descuenta en la ubicación asignada (HU-177) |
| AC-3 | Envíos | El origen del despacho alimenta la cotización/guía (E7/Skydropx) |
| AC-4 | Sin cobertura | Pedido sin ubicación con stock suficiente → estado claro para el operador |

---

### HU-180 — Transferencias de stock entre ubicaciones · E18

> Como operador, quiero mover stock entre ubicaciones con trazabilidad, para reabastecer y balancear existencias.

**Estimación:** M (5 puntos)
**Módulo:** movimientos de inventario (transfer), auditoría
**Estado:** 🔲 Pendiente (roadmap) — depende de HU-177

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Transferencia | Origen → destino con cantidades; ajusta ambos `inventory_levels` atómicamente |
| AC-2 | Trazabilidad | Historial de movimientos auditable (HU-146) |
| AC-3 | Estados | Pendiente / en tránsito / recibida (si aplica) |

---

### HU-181 — Click & collect con stock por ubicación · E18 (integra HU-110)

> Como comprador, quiero elegir retiro en una tienda que tenga el producto en stock, para recogerlo donde sí hay disponibilidad.

**Estimación:** M (5 puntos)
**Módulo:** PDP/checkout muestran disponibilidad por ubicación de retiro
**Estado:** 🔲 Pendiente (roadmap) — extiende HU-110 con HU-177

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección | El paso de retiro (HU-110) muestra solo ubicaciones con `permite_retiro` y stock del ítem |
| AC-2 | Reserva | Al elegir, se reserva/descuenta en esa ubicación |
| AC-3 | Consistencia | Retiro = ubicación de fulfillment (HU-179) |

---

### HU-182 — Gestión de ubicaciones e inventario en el admin · E18

> Como operador, quiero administrar ubicaciones y ajustar el stock por ubicación desde el panel, para operar el inventario multi-lugar.

**Estimación:** M (5 puntos)
**Módulo:** admin (CRUD ubicaciones, edición de niveles por ubicación)
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Ubicaciones | CRUD (HU-176) desde el panel |
| AC-2 | Niveles | Edición de stock por `(variante, ubicación)`; vista de niveles en el producto |
| AC-3 | Permisos | Por rol; en multi-tenant, acotado a la tienda (E17) |

---

### HU-183 — Reportes de inventario y alertas de stock bajo por ubicación · E18

> Como operador, quiero ver el inventario y recibir alertas de stock bajo por ubicación, para reponer donde falta.

**Estimación:** M (5 puntos)
**Módulo:** reportes por ubicación (extiende HU-106/116)
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Inventario por ubicación | Vista con filtros; export (compatible con HU-116/130) |
| AC-2 | Alertas | Stock bajo por `(variante, ubicación)` — extiende el umbral de HU-106 |
| AC-3 | Permisos | Solo roles autorizados |

---

## Detalle · Hardening PCI DSS (HU-184…187) · E14

> Refuerza el cumplimiento de **PCI DSS**. Contexto: la plataforma usa **flujo redirect/hosted** (el cliente digita la tarjeta en la pasarela), por lo que **no almacena, procesa ni transmite datos de tarjeta (CHD)** → alcance mínimo **SAQ A**. Este bloque cierra los controles operativos que faltan para sostener ese alcance. Se apoya en **HU-117 (MFA admin)** y **HU-146 (auditoría)**, que son parte del cumplimiento. Todo **🔲 (roadmap)**.

### HU-184 — Gestión y rotación de llaves de pasarela · E14 (toca E6)

> Como responsable de seguridad, quiero cifrar, rotar y limitar el acceso a las llaves de las pasarelas de pago, para reducir el riesgo de fuga (PCI DSS req. 3 y 8).

**Estimación:** L (8 puntos)
**Módulo:** cifrado/secrets manager para los secretos de `payment_config`, rotación, mínimo privilegio
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cifrado en reposo | Secretos de pasarela cifrados / gestionados por un secrets manager; acceso solo server-side (`service_role`) |
| AC-2 | Rotación | Procedimiento de rotación de llaves sin downtime; cada rotación queda auditada (HU-146) |
| AC-3 | Mínimo privilegio | Solo roles autorizados leen/editan credenciales (compatible con HU-134) |
| AC-4 | No exposición | Nunca se devuelven en claro al cliente (ya enmascaradas; mantener) |

---

### HU-185 — Política de logging seguro (sin datos sensibles) · E14

> Como responsable, quiero que los logs no contengan datos sensibles (PAN aunque venga enmascarado, secretos, payloads completos de pago), para cumplir PCI DSS req. 3 y 10.

**Estimación:** M (5 puntos)
**Módulo:** capa de logging con redacción; revisión de `console.*` en webhooks
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Redacción | Campos sensibles (PAN, secretos, tokens) redactados u omitidos en logs |
| AC-2 | Webhooks | No se loguea el payload completo de pago por defecto |
| AC-3 | Retención/acceso | Logs con retención y acceso controlados (compatible con HU-146/170) |

---

### HU-186 — Conformidad PCI DSS: alcance SAQ A + evidencia · E14 (toca E6)

> Como responsable, quiero documentar y mantener el alcance SAQ A y la evidencia de conformidad, para la atestación con el adquirente.

**Estimación:** M (5 puntos)
**Módulo:** documentación de alcance, checklist SAQ A, recopilación de AOC de proveedores
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Alcance documentado | La app no almacena/procesa/transmite CHD; flujo redirect a pasarelas PCI-compliant |
| AC-2 | Checklist SAQ A | TLS, control de accesos, MFA admin (HU-117), auditoría (HU-146) y gestión de llaves (HU-184) cubiertos |
| AC-3 | Evidencia | AOC/atestaciones PCI de Wompi/MercadoPago/Bold recopiladas |
| AC-4 | Guardarraíl | Alerta si se introduce un flujo que rompa SAQ A (widget embebido → SAQ A-EP) |

---

### HU-187 — Integridad de scripts de la página de pago (PCI DSS 4.0 · 6.4.3 / 11.6.1) · E14

> Como responsable, quiero controlar y detectar cambios en los scripts de las páginas que intervienen en el pago, para cumplir PCI DSS 4.0 si se usa cualquier JS de pasarela en el propio checkout.

**Estimación:** M (5 puntos)
**Módulo:** inventario de scripts + integridad (CSP/SRI), detección de manipulación
**Estado:** 🔲 Pendiente (roadmap) — aplica si se pasa de redirect a widget embebido (SAQ A-EP)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Inventario | Lista autorizada de scripts en páginas de pago; CSP restrictiva + SRI donde aplique |
| AC-2 | Detección | Se detectan cambios/manipulación en la página de pago |
| AC-3 | Aplicabilidad | En modo redirect puro se documenta como no-aplicable; se activa al embeber JS de pasarela |

---

### HU-188 — Tu Compra: modalidad INTEGRADOR (API REST · token JWT · multi-método) · E6

> Como plataforma, quiero integrar Tu Compra en su **modalidad integrador** (`confirmacionTransaccionMedioPago`, transaccional por medio de pago, con `Referencia`=order_number), para cobrar y correlacionar los pedidos. Reemplaza tanto el modelo antiguo (form-POST+MD5) como el intento con `crearBotonPago` (botón reutilizable, sin referencia). **Configurable** para cualquier comercio (medios habilitados e IDs de método parametrizables), no atado a la config de una pasarela concreta.

**Estimación:** XL (13+ puntos) → **dividida en 188a–188d + 188e (enabler)**
**Módulo:** `TuCompraGateway` (integrador), `payment_config` (config de medios + llave de firma), `orders` (seguimiento), factory, admin (URLs + config de medios), checkout (flujo por medio), webhook (URL de Confirmación + firma), reconcile
**Estado:** 🔲 En progreso (v20). Alcance confirmado: **PSE, Nequi, Daviplata, Referenciado**. **Tarjeta queda FUERA** (cifrado RSA rompe PCI SAQ A) y se **quitó** de la interfaz de administración. **HU-088 queda reemplazada por esta HU.** **Hecho:** gateway integrador (`/autenticar`, `/confirmacionTransaccionMedioPago`, `listarBancos`, `/consultarEstadoTransaccion`, `finalizaPagoDaviplata`, `verifyConfirmationSignature`, `mapStatus`), config de medios (`tucompra_methods`) + llave de firma (`tucompra_encryption_key`) + seguimiento persistido (`orders.tucompra_codigo_seguimiento/numero_transaccion`), flujo por medio en el checkout, webhook con verificación de **firmaTuCompra** + re-consulta autoritativa, reconcile web+admin, tests. **Pendiente:** validación end-to-end en sandbox de los 4 medios. Doc: `desarrolladores.tucompra.net/manuales/rest` + `Tu-Compra-Integracion-Referencia.md` (raíz del workspace).

**Sub-HU:**

- **HU-188a · PSE** — `MetodoPago` con `campo1`=código banco, **`campo2`=nombre banco**, `campo3`=tipo persona, `campo4`=URL retorno; `listarBancos` puebla el selector; respuesta `urlBanco` → **redirección al banco**. (IDs demo 41 / prod 3.)
- **HU-188b · Nequi** — push: `CodigoRespuesta 2` PENDIENTE → pantalla "aprueba en tu app Nequi" + **polling** de `consultarEstadoTransaccion` (vigencia 15 min). Sin redirección.
- **HU-188c · Daviplata** — OTP: `CodigoRespuesta 2` → el cliente ingresa el OTP → `finalizaPagoDaviplata {codigoSeguimiento, terminal, tokenSeguridad, codigoOTP}` → confirma.
- **HU-188d · Referenciado** — `MetodoPago` solo `id`; respuesta `urlBanco` = **PDF/comprobante** con código de barras; pedido pendiente hasta el pago en efectivo.
- **HU-188e · Enabler** — persistir `CodigoSeguimiento`/`numeroTransaccion` (migración 28), llave de firma `tucompra_encryption_key`, verificación de `firmaTuCompra` en el webhook y re-consulta autoritativa por API.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Credenciales reales | `payment_config` guarda **usuario**, **clave**, **terminal** (Id Sistema), **URL base** (demo/prod) y **llave de encriptación** (MD5, firma); expuestos en el admin. La llave RSA (tarjeta) no se usa. |
| AC-2 | Autenticación | `POST /autenticar` con `{usuario, clave, terminal}` → `tokenSeguridad` (JWT) en cada servicio; manejo de `codigoRespuesta` |
| AC-3 | Flujo por medio | Cada medio tiene su flujo: **PSE** redirige a `urlBanco`; **Nequi** push+polling; **Daviplata** OTP+`finalizaPagoDaviplata`; **Referenciado** PDF/comprobante. Todos con `Referencia`=order_number. **NO** `crearBotonPago` |
| AC-4 | Multi-método configurable | Medios habilitados (**PSE/Nequi/Daviplata/Referenciado**) e **IDs de `MetodoPago`** parametrizables por entorno (Tabla de Valores). **Tarjeta excluida** por PCI SAQ A. |
| AC-5 | URLs configurables | **URL de Confirmación** (server-to-server, webhook autoritativo por `Referencia`) y **URL de Retorno** (navegador → confirmación) visibles/copiables en el admin |
| AC-6 | Seguridad y pruebas | Deriva del `active_provider` (HU-092); **verificación de `firmaTuCompra`** (MD5) + estado autoritativo por API (nunca el cliente); `CodigoSeguimiento` persistido para consultar estado y finalizar Daviplata; tests de gateway/reconcile |

---

### HU-189 — Rediseño UX de configuración de pagos (entorno Demo/Producción + selector visual de métodos) · E6 (toca E13)

> Como administrador, quiero configurar las pasarelas de forma clara —ver de un vistazo cuál está **activa** y si es **Demo** o **Producción**, y habilitar/ordenar los métodos de Tu Compra sin editar JSON—, para operar sin errores.

**Estimación:** M (5 puntos)
**Módulo:** admin `PaymentConfigForm` (entorno, badges, selector de métodos con drag-and-drop)
**Estado:** 🔲 Pendiente (v19)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Entorno por pasarela | Indicador **Demo/Producción**: toggle donde la API lo permite (Bold `sandbox`, Tu Compra URL base), badge **auto-detectado** donde lo implica la credencial (Wompi `pub_test/pub_prod`, MercadoPago `TEST/APP_USR`) |
| AC-2 | Estado activo claro | La pasarela **activa** y su entorno se ven de un vistazo (badge "Activa · Demo/Producción") |
| AC-3 | Tu Compra sin JSON | Reemplaza el textarea por una **lista de métodos** (**PSE/Nequi/Daviplata/Referenciado** — Tarjeta excluida por PCI) con switch de habilitado + **drag-and-drop para ordenar** |
| AC-4 | IDs por entorno | El toggle Demo/Prod aplica los IDs correctos por método desde una tabla interna (PSE 41/3, Nequi 72, Daviplata 71, Referenciado 45); editable en modo avanzado |
| AC-5 | Reflejo en checkout | El orden/habilitados se reflejan en el selector de medio del checkout |
| AC-6 | UX | Estético, intuitivo y accesible por teclado |

---

### HU-190 — Endurecimiento de confirmaciones de pago (anti-forja + anti-subpago) · E6

> Como plataforma, quiero que ninguna confirmación de pago pueda ser forjada ni por un monto menor al del pedido, para que solo se marquen como pagados los pedidos realmente pagados por su valor total. Aplica a **todas las pasarelas** (Wompi, MercadoPago, Bold, Tu Compra).

**Estimación:** M (5 puntos)
**Módulo:** `lib/wompi`, `BoldGateway`, `TuCompraGateway`, webhooks (wompi/mercadopago/bold/tucompra), `lib/payment-guards`, reconcile (web+db), `GET /api/checkout/status`
**Estado:** ✅ Implementado (v20)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | El estado nunca viene del cliente | Solo se acepta un pago aprobado si (a) la firma del webhook es válida o (b) se re-consulta el estado a la API autenticada del proveedor. Un pedido inexistente no actualiza nada |
| AC-2 | Wompi fail-closed | `verifyWompiWebhook` **rechaza** si falta el events-secret o el checksum (antes hacía bypass) y compara con `timingSafeEqual` |
| AC-3 | Bold fail-closed | `verifyWebhook` rechaza en **producción** con llave secreta vacía; `timingSafeEqual`; llave vacía solo en sandbox |
| AC-4 | Tu Compra / MercadoPago | Tu Compra: firma `firmaTuCompra` (timing-safe) + re-consulta autoritativa. MercadoPago: re-consulta el pago con nuestro token (ignora el estado del body) |
| AC-5 | Anti-subpago | Al aprobar, se verifica que el monto pagado cubre `order.total` (`amountCoversOrder`); si es menor → el pedido queda `pending` y se registra en el log |
| AC-6 | Superficie mínima | `GET /api/checkout/status` con rate-limit por IP; los endpoints de reconcile/finalize también; sin exponer datos del cliente |
| AC-7 | Ventana de replay (Wompi) | Se rechaza (401) un webhook de Wompi con `x-timestamp` fuera de ±5 min (`isWompiTimestampFresh`) |
| AC-8 | Firma MercadoPago | Verificación de `x-signature` (`verifyMercadoPagoSignature`, HMAC del manifest `id;request-id;ts`) cuando hay `mercadopago_webhook_secret`; defensa en profundidad sobre la re-consulta |
| AC-9 | Idempotencia por evento | Tabla `processed_webhook_events` (PK provider+event_id); un reintento del mismo evento se ignora (200 idempotent). Aplica a las 4 pasarelas (`markWebhookEventProcessed`) |

**Pendiente (hardening futuro):** purga programada de `processed_webhook_events`; `x-signature`/replay para Bold si su API lo expone.

---

### HU-191 — Consolidar `shipping_profiles` en `customer_addresses` (deuda de modelo de datos) · E12 (toca E2/E6)

> Como plataforma, quiero un **único origen de verdad** para las direcciones de envío del comprador, para eliminar la redundancia entre `shipping_profiles` (perfil único por email, sin FK) y `customer_addresses` (múltiples direcciones por `customer_id`, con `is_default`), simplificando el modelo y evitando datos divergentes.

**Contexto:** Hoy coexisten dos tablas que guardan lo mismo (nombre, teléfono, dirección, ciudad, departamento, código postal). `shipping_profiles` es anterior y se llena desde `/api/shipping-profile` + `ShippingProfileForm` (Mi Cuenta), indexada por email y **sin relación con `customers`**. `customer_addresses` es el modelo correcto (FK a `customers`, varias direcciones, `is_default`, `label`) y ya alimenta el checkout. Mantener ambas genera incoherencia (un usuario puede tener perfil y direcciones distintos) y una tabla huérfana respecto al grafo de `customers`.

**Estimación:** M (5 puntos)
**Módulo:** `migrations/upgrade.sql` (+ `01_schema.sql`), `queries/shipping-profile.ts` (deprecar), `queries/customer-addresses.ts`, `api/shipping-profile/` → `api/account/addresses/`, `components/account/ShippingProfileForm.tsx`, checkout (pre-llenado)
**Estado:** 🔲 Pendiente (deuda técnica detectada en la revisión del modelo v20)
**Depende de:** que el usuario esté autenticado (Stack Auth) para tener `customer_id`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Fuente única | Las direcciones de envío viven **solo** en `customer_addresses`. La UI de "perfil de envío" pasa a gestionar la dirección **por defecto** (`is_default = true`) de ese cliente |
| AC-2 | Migración de datos | Migración idempotente que copia cada `shipping_profiles` a `customer_addresses` del `customer` con el mismo email (match por `customers.email`), marcándola `is_default` si el cliente no tiene otra; filas sin cliente asociado se omiten y se registran |
| AC-3 | Deprecación de la tabla | Tras migrar, `shipping_profiles` queda **deprecada**: se elimina la tabla y su índice (o se conserva un periodo con comentario "DEPRECATED" antes del `DROP`), y se retiran `getShippingProfile`/`upsertShippingProfile` |
| AC-4 | API unificada | `/api/shipping-profile` se elimina o se redirige a `/api/account/addresses`; la cuenta usa el CRUD de direcciones existente (crear/editar/borrar/def.) |
| AC-5 | Cuenta (Mi Cuenta) | `ShippingProfileForm` se reemplaza por (o se integra en) la gestión de direcciones; editar "mi dirección" = editar/crear la dirección por defecto |
| AC-6 | Checkout coherente | El pre-llenado del checkout toma la dirección `is_default` del cliente (una sola lógica; hoy ya usa `customer_addresses`) |
| AC-7 | Unicidad de default | Se garantiza a lo sumo **una** `is_default = true` por `customer_id` (constraint parcial `UNIQUE (customer_id) WHERE is_default` o control en la app) |
| AC-8 | Coherencia de modelo | Ninguna tabla queda huérfana del grafo de `customers`; RLS solo-`service_role` se mantiene; tests de migración + queries en verde |

> Nota: es un refactor de datos con feature vivo (`/api/shipping-profile`). Ejecutar en 2 fases si se despliega en caliente: (1) migrar datos + doble escritura, (2) `DROP` de `shipping_profiles` cuando ya nadie la lea.

---

## 11. Resumen de Cobertura  *(por dominio, v2)*

> Criterio: **✅** implementado con pruebas · **🟡** implementado sin pruebas · **🔲** no implementado.

| Épica (v2) | Ítems | ✅ | 🟡 | 🔲 |
|-----------|:----:|:--:|:--:|:--:|
| E1 · Fundación e infraestructura | 10 | 10 | 0 | 0 |
| E2 · Arquitectura y CMS unificado | 26 | 16 | 0 | 10 |
| E3 · Sitio público (layout, home, navegación) | 22 | 15 | 0 | 7 |
| E4 · Tienda y catálogo | 20 | 15 | 0 | 5 |
| E5 · Carrito | 10 | 8 | 0 | 2 |
| E6 · Pagos y pasarelas | 32 | 22 | 0 | 10 |
| E7 · Envíos | 12 | 11 | 0 | 1 |
| E8 · Emails y newsletter | 13 | 7 | 0 | 6 |
| E9 · Inventario y stock | 6 | 4 | 0 | 2 |
| E10 · Blog | 8 | 8 | 0 | 0 |
| E11 · Páginas de contenido y servicios | 6 | 6 | 0 | 0 |
| E12 · Autenticación y Mi Cuenta | 17 | 11 | 0 | 6 |
| E13 · Panel de administración | 46 | 38 | 0 | 8 |
| E14 · Despliegue, seguridad e identidad del panel | 24 | 7 | 0 | 17 |
| E15 · SEO y rendimiento | 12 | 10 | 0 | 2 |
| E16 · Aplicación inteligente (IA) *(roadmap)* | 17 | 0 | 0 | 17 |
| E17 · Plataforma multi-tienda + SaaS (control plane, billing, aislamiento, identidad) *(roadmap)* | 14 | 0 | 0 | 14 |
| E18 · Inventario multi-ubicación y fulfillment *(roadmap)* | 8 | 0 | 0 | 8 |
| **TOTAL** | **303** | **188** | **0** | **115** |

**Lectura:** del **MVP** (191 ítems) el 98 % tiene código (✅+🟡 = 188) y el 95 % tiene pruebas (✅ = 181). El roadmap **v17** suma **34 HU 🔲** (HU-101…134) para un total de 225. Bloque HU-101…119: catálogo, inventario, pagos, cuentas, SEO e IA. Bloque HU-120…125 (configurabilidad y operación de datos): drag-and-drop de secciones, **sistema de plantillas de diseño** (theme por defecto + variantes de disposición de navbar/home/tienda/PDP/carrito), import/export extensible y versionado, carga masiva de productos por CSV y respaldos de productos/pedidos/clientes. Bloque **HU-126…134 (personalización avanzada y operación de datos):** drag-and-drop generalizado, historial de versiones del CMS, vista previa/publicación y paquetes de plantilla, export CSV de productos, acciones masivas, importadores CSV multi-entidad, restauración + respaldos programados y control de acceso por rol a operaciones de datos. Bloque **E16 v2 — aplicación inteligente (HU-135…145):** cimientos (proveedor de IA intercambiable, captura de eventos, vector store) y features (asistente de compra, búsqueda visual, personalización, clustering, patrones de compra, apariencia por chat, generación de imágenes y detección de fraude). Revisión **v18:** se dividieron 5 HU grandes en incrementos (HU-107→a/b, HU-114→a/b/c, HU-122→a/b/c, HU-138→a/b, y HU-117 quedó solo 2FA), se extrajo el **registro de auditoría** (HU-146) como enabler, se sumaron HU-147…155 (descuentos, gift cards, impuestos multi-región, consulta de pedido como invitado, portabilidad/borrado de datos, consentimiento de cookies, notificaciones multicanal, accesibilidad y Core Web Vitals) y se creó la épica **E17 · Multi-tienda** (HU-156…158). Bloque **v18 (emails):** EmailProvider multi-proveedor, plantillas editables, entregabilidad, email_log y newsletter externo (Beehiiv y similares) — HU-159…163. Bloque **v19 (enablers de plataforma):** pipeline de pricing unificado, webhooks salientes/API pública, facturación electrónica (DIAN), fidelización, bundles, onboarding, monitoreo de errores y spike de auth multi-tenant — HU-164…171. Épica **E18 · Inventario multi-ubicación** (HU-176…183): ubicaciones tipo Shopify (stock por variante+ubicación, fulfillment por lugar, transferencias, click & collect), con migración del stock único actual. Bloque **hardening PCI DSS** (HU-184…187): gestión/rotación de llaves, logging seguro, alcance SAQ A + evidencia e integridad de scripts de pago (la plataforma usa flujo redirect/hosted → no maneja datos de tarjeta → alcance mínimo SAQ A). Revisión **v19 (Tu Compra):** al contrastar contra la doc oficial se detectó que la integración de Tu Compra usa un modelo antiguo (form-POST + MD5) que **no corresponde** a su API REST (token JWT + cifrado de valores); PRV-07 pasa de 🟡 a 🔲 y se agrega la HU-188 correctiva. Además, rate-limit/CSP (HU-062) pasó a ✅ con pruebas. Bloque **v21 (SaaS billing E17):** se incorpora facturación por suscripción con `BillingProvider` intercambiable (PayZen, Mercado Pago Suscripciones, Stripe), planes+suscripciones+ciclo de vida y suspensión por impago — HU-192…194; y se fija la arquitectura de tenancy (Stack Auth Teams, RLS como frontera con GUC por request + rol Postgres dedicado, `apps/console` + packages `@merkiai/tenancy` y `@merkiai/billing`). Bloque **v22 (preparación para servicios):** se mantiene el **monolito modular** pero se adoptan desde ya las prácticas que dejan lista la costura hacia microservicios — bounded contexts + contratos (HU-195), eventos de dominio + outbox (HU-196), propiedad de datos por dominio (HU-197), propagación de contexto de tenant por red (HU-198) y observabilidad distribuida (HU-199). Bloque **v23 (aislamiento de datos por plan):** costura de routing de BD (`tenants.db_ref` + connection factory en `@merkiai/tenancy`) con tres niveles ligados al plan — compartido (pooled+RLS) / schema dedicado / BD-proyecto dedicado (Supabase propio o **Neon**) — y promoción sin reescritura (HU-200). Bloque **v24 (identidad):** abstracción `IdentityProvider` (identidad/RBAC/provisioning) para migrar de Stack Auth con solo un adaptador — HU-201. Bloque **v25 (seguridad transversal E14):** CORS + hardening de endpoints internos (HU-202), CSP endurecida con nonce + sanitización XSS de contenido de tenant (HU-203), rate limiting distribuido + anti-abuso/captcha (HU-204), validación zod en bordes + CSRF + fix de inyección de filtros (HU-205), rotación de secretos + escaneo de dependencias/SCA (HU-206). Total roadmap: **115 HU 🔲** (303 ítems); ver el plan de olas más abajo. **Revisión v20:** se cerraron los **5 🟡** con pruebas dedicadas (selector de email → `email-provider.test.ts`, tracking en Mi Cuenta → `getOrdersByCustomerEmail` en `orders.test.ts`, JSON-LD → `json-ld.test.ts`, responsive admin → `AdminSidebar.test.tsx`, fuentes de tema → `theme-css.test.ts`) → **0 🟡**; cobertura ✅ pasa a 188.

---

## 11.1 Roadmap por olas de entrega  *(plan de fases · v19)*

> Ordena las HU 🔲 por **valor + dependencias + riesgo**. Regla base: los *enablers* y las decisiones de cimientos van primero, porque posponerlos encarece todo lo demás. El *sizing* es orientativo (S=3 · M=5 · L=8 · XL=13 pts).
>
> **Estado (ago-2026):** los cimientos de E17 ya se adelantaron a la Ola 0 (decisión: multi-tenant desde día 1). Hecho: **HU-171 ✅** (spike auth+RLS + `@merkiai/tenancy`), **HU-172 ✅** (consola de tenants desplegada en `merkiai.com`), **HU-201 ✅** (abstracción de identidad), **HU-202/203 ✅** (deny-Origin server-to-server + XSS markdown). En curso: **HU-156/157/173/194 🟡** (RLS de catálogo + resolución host→tenant núcleo + entitlements + gate de suspensión). Los marcadores ✅/🟡/🔲 en las filas reflejan este avance.
>
> **Dos decisiones estratégicas que reordenan el plan:** (1) si el modelo de negocio es **white-label multi-cliente desde ya**, sube los **cimientos de E17** (HU-171 spike auth+RLS → HU-156 `tenant_id`+RLS+rol dedicado) y **i18n** (HU-114a/b/c) a la Ola 0/1 — introducir `tenant_id`/RLS e idiomas después de decenas de features es el refactor más caro del backlog. La **facturación/entitlements** (HU-172/173/192/193/194) y **dominios** (HU-174/175) pueden ir después, en la Ola 7. (2) Si el mercado es solo hispanohablante y una sola tienda, **i18n y facturación internacional se posponen o descartan**.

| Ola | Foco | HU (🔲) | Prioridad | Size aprox. |
|-----|------|---------|-----------|-------------|
| **0 · Cimientos y decisiones** | Enablers que desbloquean todo (incluye **endurecer el monolito modular**) | **HU-171 ✅** (spike auth+RLS) · HU-164 🔲 (pipeline pricing) · HU-146 🔲 (auditoría) · HU-136 🔲 (eventos) + HU-152 🔲 (cookies) · HU-159 🔲 (EmailProvider) · **HU-195/196/197 🔲** (bounded contexts+contratos · eventos+outbox · propiedad de datos por dominio) · cerrar los 🟡 | **Alta** | ~75 pts |
| **1 · Conversión y catálogo** | Quick wins de venta | HU-102 · HU-101 · HU-104 · HU-103 · HU-105 · HU-106 · HU-113 · HU-147 · HU-148 · HU-168 | **Alta** | ~55 pts |
| **2 · Operación y postventa** | Admin operable | HU-120 · HU-126 · HU-124 · HU-130 · HU-131 · HU-132 · HU-116 · HU-107a/b · HU-125 · HU-133 · HU-134 · HU-112 · HU-150 · HU-160 · HU-162 | Alta/Media | ~70 pts |
| **3 · Confianza, privacidad, seguridad y rendimiento** | Seguridad, PCI y UX | HU-117 (2FA) · HU-146 (auditoría) · **HU-184…187 (hardening PCI)** · HU-151 · HU-154 · HU-155 · HU-170 · **HU-199 🔲 (observabilidad distribuida)** · **HU-202 ✅ / HU-203 ✅** (CORS/deny-Origin + sanitización XSS de markdown) · **HU-204…206 🔲** (rate-limit distribuido/CSRF · validación · rotación de secretos/SCA) · HU-111 · HU-153 · HU-161 | Media/Alta | ~110 pts |
| **4 · Personalización visual** | Theming white-label (definir modelo único primero) | HU-121 · HU-122a/b/c · HU-128 · HU-129 · HU-123 · HU-127 · HU-115 | Media | ~65 pts |
| **5 · Internacional y fiscal** | Expansión (según mercado) | HU-114a/b/c · HU-149 · HU-108 · HU-166 (DIAN) · HU-110 · HU-109 · HU-163 · HU-167 | Media / depende de mercado | ~75 pts |
| **6 · Aplicación inteligente (IA)** | Capa de IA | HU-137 · IA-01 · HU-119 · HU-139 · HU-140 · IA-02 · HU-138a/b · HU-142 · HU-141 · HU-118 · HU-143 · HU-144 · HU-145 · IA-03 (+ HU-135 si no se hizo en Ola 0) | Media / estratégica | ~110 pts |
| **7 · Multi-tienda + SaaS (E17)** | Escala white-label + facturación (cimientos ya adelantados) | **HU-171 ✅** (spike auth+RLS) · **HU-156 🟡** (tenant_id+RLS+rol dedicado; flujos con sesión diseñados, falta validar aislamiento de compradores en staging + cablear) · **HU-157 🟡** (resolución host→tenant: **núcleo cableado** home/catálogo/PDP dinámicos + RLS de catálogo; falta cola de URLs canónicas y singletons no-catálogo) · **HU-158 🟡** (multi-tienda: selector de workspace + tenant activo por cookie + resolutor + guardia de login + **switcher en topbar** + **admin_config/tema por tenant activo** ✅; falta forzar resolutor post-login [tras provisioning real] + scoping del resto de queries del admin [productos/pedidos/contenido + config-pages] al tenant activo) · **HU-172 ✅** (consola tenants, desplegada en `merkiai.com`) · **HU-173 🟡** (planes/entitlements: CRUD de planes + asignación a tenant en la consola ✅, enforcement de límite de **productos** en admin ✅; falta límite de **usuarios** [depende HU-158] y límites en onboarding) · HU-192 🔲 (BillingProvider) · HU-193 🔲 (suscripciones) · **HU-194 🟡** (suspensión: gate en middleware; falta cablear a eventos de billing) · HU-198 🔲 (contexto de tenant por red) · HU-200 🔲 (aislamiento de datos por plan) · **HU-201 ✅** (abstracción de identidad) · HU-174 🔲 (dominios web) · HU-175 🔲 (dominios de envío) · **HU-207 🟡** (config por tenant: los 4 singletons [store/payment/admin/shipping] por tenant + `e17/07` [UNIQUE + RLS] ✅; falta blog/nav host + wiring de callers al tenant resuelto) · **HU-208 ✅** (shell consola: nav/logout) · **HU-209 🟡** (aprovisionamiento: orquestación+rollback+Team+dueño ✅; falta seed config [HU-207], rol por defecto y verificación en vivo) · **HU-210 ✅** (design system paneles: `@merkiai/ui` panel) · **HU-211 ✅** (rediseño consola) · **HU-212 🔲** (rediseño admin) · **HU-213 🔲** (paneles→Tailwind + tokens compartidos) · **HU-214 🟡** (Stack Auth prod: **guardias de sesión en los 3 logins ✅** [arreglan no-redirect OAuth; **admin Google verificado en vivo → /dashboard ✅**]; falta config: OAuth propio por proyecto, account-linking, Trusted Domains base, cookie/afterSignIn, **+ flujo Email OTP completo en consola** [chooser de método + campo de código]) · HU-165 🔲 · HU-169 🔲 | Estratégica | ~220 pts |

> **HU-207 · Contenido y config por tenant (cierre de lecturas del storefront).** *(Deriva de HU-156; **bloqueada por HU-158 · onboarding**.)* Lo ya hecho: catálogo + páginas CMS (`(public)/[slug]`) host-scoped por RLS (`e17/02/06`). Lo que falta **depende de crear filas de config por tenant en el onboarding** y toca los 4 layouts, por eso va con HU-158: (a) cablear **blog** (lista/detalle) y **Navbar (`nav_items`)** a `getRequestCatalogDb()`; (b) convertir los **config singletons** `store_config`/`admin_config`/`payment_config`/`shipping_config` de fila `id=1` a **fila-por-tenant** (singleton ya relajado en `e17/03`; leer por `tenant_id`; seed en onboarding) + RLS — con `payment_config`/`admin_config` **nunca** expuestos a `anon` (solo lectura server-side); (c) `getStoreConfig`/`getPaymentConfig` leen por tenant, no por `id=1`. El hardening fail-closed ya está aplicado en catálogo/contenido/comprador; esta HU lo extiende a contenido/config al construir el multi-store.

> **HU-208 · Shell de la consola (layout, navegación, logout, sesión).** *(E17; deriva de HU-172.)* Hoy `apps/console` es una sola página sin chrome. Falta: **layout con cabecera** (marca + email del operador + **botón de logout** con `useStackApp().signOut()`), **navegación/sidebar** (Tenants · Planes · Dominios · Auditoría), estados de carga/vacío/error, responsive y branding Merkiai. AC: logout invalida la sesión de Stack Auth y redirige a `/login`; la nav resalta la sección activa; `/no-autorizado` con enlace de salida. **Pequeña (S/M).**

> **HU-214 · Stack Auth en producción: OAuth propio + sesión robusta + linking.** *(E14/E17; auth de web/admin/console.)* Cierra los problemas de login OAuth observados. (a) **OAuth keys propias por proyecto** (reemplazar las *Shared keys* de dev de Google) con **Authorized redirect URIs por subdominio** (`web *.merkiai.com`, `admin.`, `console.`) — quita la marca de Stack Auth en el consent y elimina el salto cross-site extra que dropea la cookie en el primer retorno. (b) **Guardia de sesión en las páginas de login**: si ya hay usuario → redirigir (`useUser({or:'redirect'})`/`router.replace`), para que el retorno de Google reenvíe siempre (hoy solo redirige el flujo credencial). (c) **Política de account-linking OAuth por proyecto**: habilitar enlazar OAuth a una cuenta existente por email verificado (resuelve `CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE` cuando el mismo correo tenía password) — o documentar "un método por cuenta". (d) **Verificar y blindar el `cookieDomain`**: mantener cookies **host-scoped** (por subdominio); **prohibido** `Domain=.merkiai.com` (filtraría sesiones de compradores entre tiendas). (e) Revisar `SameSite`/`afterSignIn` por app. (f) **Trusted Domains base** de Stack Auth (cada app es un proyecto ⇒ su propia lista): **web** = `*.merkiai.com` (wildcard, si Stack Auth lo soporta; validar) o mecanismo por-tenant de HU-209, **+** dominios propios (HU-174); **admin** = solo `admin.merkiai.com` (host fijo, sin wildcard); **console** = solo `console.merkiai.com` (host fijo, sin wildcard); `localhost` en dev. El wildcard/automatización aplica **solo al proyecto web**. (g) **Flujo de Email OTP / magic link completo (bug de la consola):** hoy `LoginScreen` mezcla el form de contraseña con un botón "enviar enlace" que reusa el mismo campo de correo y **no hay paso para ingresar el código** que llega (Stack Auth `sendMagicLinkEmail` devuelve un `nonce` + código de 6 dígitos → falta el campo de verificación + `signInWith…(nonce, code)`). Arreglo: **separar los dos métodos** (contraseña vs Email OTP) y **dejar elegir desde el inicio** con cuál iniciar; para OTP, agregar el paso enviar → ingresar código → verificar. Aplica a la **consola** (y reutilizable en web/admin). Ojo: los *Trusted Domains* (permitidos por Stack Auth) son **distintos** de los *Authorized redirect URIs* del OAuth de Google (Google Cloud) — hay que configurar **ambos**. AC: login con Google redirige correcto en las 3 apps; cookies host-scoped verificadas; sin conflicto de contact-channel; Trusted Domains cubren subdominios y dominios propios.

> **HU-210 · Design system de paneles internos (console + admin).** *(E14/E2; base de HU-211/212.)* Biblioteca de componentes y tokens compartida (en `packages/ui`), **abstraída de patrones de paneles SaaS de referencia** (no del dominio): **Sidebar** con grupos etiquetados + íconos + estado activo + colapsable + selector de contexto arriba y **menú de usuario/logout** abajo; **Topbar** con búsqueda, notificaciones, idioma y avatar/menú; **PageHeader** (título + descripción + acción primaria arriba-derecha); **Card/Panel**, **StatCard** (KPIs), **Tabs** (subnav de configuración), **DataTable** con panel de filtros lateral, **Badge/Pill** de estado, **EmptyState** (ícono + mensaje + CTA), **Toast**. Tokens de color/espaciado/radio/sombra/tipografía. AC: componentes reutilizables, accesibles, responsive y temables (Merkiai). No copia features de terceros; solo el *layout/organización*.
>
> **⚠️ Regla de oro — dos sistemas de apariencia independientes (no fusionar):** existen DOS capas de tokens separadas y `packages/ui` alberga componentes de ambas, pero cada uno lee **su namespace**:
> - **Tokens de PANEL** (`--mk-*`): chrome de las herramientas (console + admin). Fuente: este design system + `admin_config` (AD-37, colores del admin). No se ve en la tienda.
> - **Tokens de STOREFRONT** (`--brand-*`/`--theme-*`): apariencia de la **tienda por-tenant**, editable por el comerciante desde el admin (`themes`/`theme-css`, HU-081/121/122); dinámicos, inyectados en `apps/web`.
>
> Prohibido que el storefront herede el preset de panel (rompería el white-label: cada tienda se tematiza sola) y viceversa. El rediseño de paneles (HU-210/211/212) y el theming de la tienda (HU-081/121/122 + HU-207) son **carriles paralelos**. Referencia: AD-37 AC-8 ("los dos sistemas son completamente independientes").

> **HU-213 · Unificar paneles en Tailwind + preset de tokens compartido.** *(E14; refina HU-210, opcional/mejora.)* Migrar el design system de paneles de estilos inline a **Tailwind con un preset compartido** para console + admin (fuente única de tokens `--mk-*`). Alcance: (a) `packages/config` (o `packages/ui`) exporta un **preset de Tailwind** con los tokens de panel mapeados a variables CSS (color/radio/sombra/spacing/tipografía); (b) `tailwind.config` de **web, admin y console** usa `presets: [panelPreset]` e incluye `packages/ui/src/**` en `content`; (c) **añadir Tailwind a la consola** (config + postcss + globals con `@tailwind`); (d) reescribir `@merkiai/ui/panel` con clases Tailwind (mismo diseño). Mantiene **estrictamente separados** los namespaces `--mk-*` (panel) y `--brand-*`/`--theme-*` (storefront). No requiere quitar Tailwind de nada. AC: consola y admin con el mismo lenguaje visual; storefront intacto; tests + type-check verdes.

> **HU-211 · Rediseño visual de la consola (control plane).** *(E17; aplica HU-210.)* Reemplaza el shell básico actual por el design system: sidebar agrupado (**Plataforma:** Tenants · Planes · Dominios · Auditoría) con íconos y activo; topbar con operador + logout; **StatCards** (nº tenants, activos/suspendidos, nº planes); listas en cards con badges de estado y acción primaria "Nuevo tenant"/"Crear plan" arriba-derecha; formularios en paneles; estados vacíos. Mantiene la funcionalidad de HU-172/173/208.

> **HU-212 · Rediseño visual del admin (panel de tienda).** *(E13/E14; aplica HU-210.)* Sube el panel actual al mismo lenguaje visual: **StatCards** de KPIs (ventas hoy/semana/mes, pedidos pendientes), tabs en Configuración (Marca/Tema/Dominios/Envío/Localización), listas/tablas con búsqueda + filtros laterales, badges de estado de pedido, estados vacíos con CTA, y consistencia de cards/espaciado/tipografía. Respeta los colores configurables del admin (`admin_config`) y los roles (`ROLE_CONFIG`). **Bug puntual detectado:** en `configuracion/pagos` (Tu Compra) los **toggles de medios de pago se ven desfasados** (el control switch no queda alineado con su fila) — corregir alineación al subir esa vista al design system.

> **HU-209 · Aprovisionamiento de tenant (orquestación al crear).** *(E17; deriva de HU-171/172/158.)* Hoy `createTenant` solo inserta la fila `tenants`. Falta orquestar, de forma **idempotente y con rollback**, al crear un tenant desde la consola: (a) **validar + reservar el subdominio** (único; resuelve por wildcard `*.merkiai.com`, sin DNS por-tenant); (b) **crear el Team en Stack Auth** (proyecto del admin) con `serverMetadata` = `{tenant_id, plan, status}`; (c) **crear/asociar al usuario dueño** e **otorgarle el Team Permission** de admin de tienda (rol); (d) **sembrar la config del tenant** (fila-por-tenant de `store_config`/`payment_config`/… — se solapa con HU-207); (e) disparar hooks/eventos (`tenant.provisioned`); (f) **registrar el subdominio en los Trusted Domains de Stack Auth** (proyecto **web**, donde el comprador inicia sesión) — o confirmar que un **wildcard `*.merkiai.com`** en Trusted Domains lo cubre (validar soporte de wildcard en Stack Auth; si lo soporta, es config única y (f) no es por-tenant). Si un paso falla, revierte los previos. AC: crear tenant deja la tienda operable end-to-end (subdominio sirve su catálogo vacío + dueño puede entrar al admin + el **login del comprador funciona** en ese subdominio). **Grande (L).** Es el prerequisito operativo para dar de alta clientes reales.
>
> **Matriz de dependencias (HU-209).**
> - **Consume / bloqueada por:** **HU-214** (Stack Auth prod: el paso (b/c) usa el proyecto admin — con las vars presentes en la consola, si `createOrg`/`inviteMember` falla se hace rollback; requiere que el proyecto admin tenga *Teams/creación server-side* habilitada) · **HU-207** (el paso (d) seed de config **es** HU-207; sin él el tenant nace sin `store/payment/admin/shipping_config`) · **HU-158** (resolutor post-login + tenant activo: sin él el dueño no "entra a su tienda") · **HU-201 ✅** (abstracción de identidad: `adminIdentity.createOrg/inviteMember`) · **HU-173 🟡** (FK `plan`→`plans.key`; "elegir plan al crear" + límites en onboarding es su parte pendiente).
> - **Alimenta / desbloquea:** **HU-174** (dominio propio → sync de Trusted Basedomains; el paso (f)) · **HU-175** (dominios de envío por tenant) · **HU-194** (ciclo `active/suspended` que escribe HU-209, conectado a billing) · **HU-200/HU-198** (usa `data_isolation`/`db_ref` que HU-209 escribe; MVP nace `shared`, no bloquea).
> - **Bug abierto (bloquea la prueba en vivo):** `createTenant` traga el error en `catch {}` y no hay feedback (`useActionState`) → el fallo de `createOrg` es invisible y el rollback deja la lista sin cambios. **Fix previo obligatorio:** (1) surface de error/warnings en el form; (2) no hacer *hard rollback* cuando el tenant ya se creó — degradar a **parcial "Team pendiente"** (coherente con el texto de ayuda del form); (3) selector de plan en el form (default `free`). Ver HU-211 (usabilidad consola).

**Épica condicional — E18 · Inventario multi-ubicación (HU-176…183, ~50 pts):** solo aplica si el negocio maneja **varias bodegas/tiendas físicas** o click & collect con stock real por punto. Si es una sola ubicación, el modelo actual (stock único) basta. Cuando aplique, va en la **Ola 2** (operación) y su enabler es HU-177 (inventario por ubicación) + HU-178 (migración del stock único, que **debe preceder** a ruteo/transferencias/retiro). Si las ubicaciones son por tenant, alinéala **después de E17** (o diseña `location` con `store_id` desde el inicio).

**Enablers que deben preceder a su bloque** (dependencias duras): HU-164 (pricing) antes de descuentos/gift cards/impuestos/puntos · HU-159 (EmailProvider) antes de plantillas/entregabilidad/email_log · HU-136 (eventos) + HU-152 (cookies) antes de personalización/clustering/fraude · HU-121 + modelo único de theming antes de variantes de layout · HU-171 (spike auth) antes de E17 · HU-135 (proveedor IA) + HU-137 (vectores) antes de las features de IA.

---

## 12. Criterios de Definición de "Hecho" (DoD)

Para que una historia de usuario se considere completamente implementada debe cumplir:

1. **Funcionalidad** — La feature se comporta según todos los criterios de aceptación descritos.
2. **Responsive** — La interfaz funciona correctamente en móvil (375px), tablet (768px) y desktop (1280px+).
3. **Design system** — Se usan los colores, fuentes y componentes definidos en `packages/config` y `packages/ui`.
4. **Errores** — Los estados de error (red, validación, servidor) son manejados y comunicados al usuario.
5. **TypeScript** — No hay errores de tipo (`pnpm type-check` pasa sin errores).
6. **Seguridad** — Las rutas protegidas verifican la sesión y el rol antes de renderizar.
7. **Performance** — Las páginas de catálogo y blog usan ISR; las imágenes usan `next/image` con lazy loading.
8. **Testing** — Los componentes y rutas de misión crítica tienen pruebas unitarias y/o de integración que pasan (`pnpm test`). La cobertura global no debe bajar del 70% de ramas y 80% de funciones.

---

## 13. Cómo ejecutar las pruebas

```bash
# Desde la raíz del monorepo:
pnpm test                     # ejecuta todos los tests en todos los packages
pnpm test:coverage            # genera reporte de cobertura HTML

# Por package específico:
cd apps/web && pnpm test
cd apps/admin && pnpm test
cd packages/database && pnpm test

# En modo watch (desarrollo):
cd apps/web && pnpm test:watch
```

### Suite de pruebas implementada

> El conteo autoritativo lo da `pnpm test`. Resumen por paquete (ago-2026):

| Paquete | Suites | Tests |
|---------|:------:|:-----:|
| `packages/database` | 13 | 135 |
| `apps/web` | 26 | 296 |
| `apps/admin` | 12 | 165 |
| **TOTAL** | **51** | **596** |

Cobertura destacada: pasarelas (Wompi/MercadoPago/Tu Compra/**Bold** + factory + webhooks con firma), reconcile Bold (web+compartido), inventario/stock (`stock.test.ts`, clamp del carrito, 409 de checkout), validación manual de pago, envíos (Skydropx + fixed), CMS/queries, y las rutas admin (config, temas, usuarios, pedidos).

---

### HU-034 — Tipos de variante globales (nueva)

> Como administrador, quiero crear y editar plantillas de atributo reutilizables (tipo "Tueste" con valores Claro/Medio/Oscuro) para asignarlas a cualquier producto y generar sus variantes automáticamente.

**Estimación:** M (5 puntos)
**Módulo:** Admin · `app/variantes/` + `api/admin/variant-types/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre `/variantes` | Tabla con todos los tipos (nombre, pills de valores, display_type, activo) |
| AC-2 | Admin crea nuevo tipo "Color" con valores "Rojo\nAzul\nVerde" | Se crea la fila; pills visibles en la tabla |
| AC-3 | Admin edita el tipo "Tueste" y cambia un valor | Se actualiza en BD; los productos que lo usan lo reflejan en el próximo render |
| AC-4 | Admin desactiva un tipo | Deja de aparecer en el selector del ProductForm |
| AC-5 | Admin intenta crear tipo con nombre duplicado | Error 409; mensaje claro en el modal |
| AC-6 | Admin elimina un tipo | Se elimina de la BD; los productos que lo referenciaban quedan con `variant_options` desactualizado |
| AC-7 | display_type = 'swatch' guardado | Persiste en BD (UI de swatch pendiente en la tienda) |

**Criterios de rechazo:**
- El modal no valida nombre vacío.
- Se permiten valores duplicados dentro del mismo tipo.
- Un rol `vendedor` puede acceder a `/variantes` (requiere al menos `admin`).

---

### HU-035 — Matriz de combinaciones de variantes (nueva)

> Como administrador de productos, quiero seleccionar los tipos de variante aplicables a un producto y generar automáticamente todas las combinaciones posibles para no tener que crearlas una a una.

**Estimación:** L (8 puntos)
**Módulo:** Admin · `app/productos/ProductForm.tsx`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin selecciona "Tueste" (3) y "Peso" (3) y pulsa "Generar combinaciones" | Se generan 9 filas de variante, cada una con `attributes: {Tueste: X, Peso: Y}` |
| AC-2 | Admin modifica el precio de una variante y vuelve a generar | La variante con el mismo par de atributos conserva el precio editado |
| AC-3 | Admin agrega "Molienda" (4) a un producto que ya tenía 9 variantes | Se generan 12 nuevas variantes; las 9 existentes se fusionan preservando precios/stock |
| AC-4 | Producto sin tipos seleccionados | El botón "Generar combinaciones" está deshabilitado |
| AC-5 | Variante generada guardada en BD | `product_variants.attributes` contiene el mapa correcto; `products.variant_options` tiene la lista de tipos |
| AC-6 | Admin elimina manualmente una variante de la tabla | No reaparece al guardar (solo "Generar" recrea la matriz) |

**Escenarios de borde:**
- Producto con 1 tipo de 1 valor → 1 variante generada.
- Producto con 3 tipos de 4 valores cada uno → 64 variantes (se muestran todas en tabla con scroll).

**Criterios de rechazo:**
- "Generar combinaciones" borra precios/stock de variantes existentes que tengan el mismo par de atributos.
- `attributes` queda como `{}` en lugar del mapa correcto tras guardar.

---

### HU-036 — Filtros de tienda con sidebar responsivo (nueva)

> Como comprador, quiero filtrar productos usando un panel lateral claro en desktop y un drawer deslizable en móvil para encontrar el café que busco sin perder de vista el catálogo.

**Estimación:** M (5 puntos)
**Módulo:** Web · `components/shop/ShopClient.tsx`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Desktop (≥ lg) | Panel sticky de 224px a la izquierda, visible siempre sin scroll |
| AC-2 | Mobile (< lg) | Botón "Filtros" en la cabecera; al pulsarlo aparece drawer deslizante desde la izquierda |
| AC-3 | Filtro de categoría | Filtra productos por `category_id` |
| AC-4 | Filtro de atributo dinámico | Los atributos disponibles se extraen de `variant_options` de los productos activos |
| AC-5 | Múltiples filtros combinados | Producto aparece solo si cumple TODOS los filtros activos |
| AC-6 | Sin resultados | Mensaje "No hay productos con esos filtros" + botón "Limpiar" |
| AC-7 | Cerrar drawer mobile | Tap en overlay o botón × cierra el drawer |

**Criterios de rechazo:**
- El panel se superpone al grid de productos en desktop.
- Los filtros se borran al cerrar el drawer mobile.
- La lista de atributos es hardcoded en lugar de calcularse desde los productos.

---

### HU-037 — Categorías con imagen y reordenamiento (nueva)

> Como administrador, quiero gestionar las categorías del catálogo con imagen de portada y poder reordenarlas arrastrándolas para controlar cómo se presentan en la tienda.

**Estimación:** M (5 puntos)
**Módulo:** Admin · `app/categorias/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre `/categorias` | Tabla con imagen (thumbnail), nombre, slug, descripción y estado |
| AC-2 | Admin sube imagen al crear/editar categoría | Imagen en bucket `banners`; `image_url` guardado en BD |
| AC-3 | Admin arrastra una fila a otra posición | `order_index` de las filas afectadas se actualiza en BD vía PATCH paralelos |
| AC-4 | Admin activa/desactiva categoría | Campo `active` actualizado; categorías inactivas no aparecen en la tienda |
| AC-5 | Imagen en proceso de subida al guardar | Botón "Guardar" bloqueado con texto "Subiendo..." |
| AC-6 | Slugs duplicados | Error 409 del API; mensaje claro en el modal |

**Criterios de rechazo:**
- El reorder no persiste al recargar la página.
- El modal acepta guardar mientras hay un upload en progreso.

---

### HU-038 — Integridad referencial del carrito (nueva)

> Como sistema, quiero que los ítems del carrito en BD siempre referencien productos y variantes válidos para que el carrito nunca contenga datos inconsistentes que rompan el checkout.

**Estimación:** S (2 puntos)
**Módulo:** DB · `migrations/01_schema.sql` (tabla `cart_items`) + `api/account/cart/route.ts`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Se elimina un producto | Todos sus `cart_items` se eliminan automáticamente (ON DELETE CASCADE) |
| AC-2 | Se elimina una variante | El ítem del carrito correspondiente se elimina (ON DELETE CASCADE) |
| AC-3 | Frontend envía ítem sin `productId` | El route filtra el ítem antes de insertar; no se genera error 23503 |
| AC-4 | `addItem` desde ProductDetail | `productId: product.id` incluido siempre |
| AC-5 | `addItem` desde ShopClient | `productId: product.id` incluido siempre |
| AC-6 | `addItem` desde FeaturedProducts | `productId: product.id` incluido siempre |

**Criterios de rechazo:**
- Al eliminar un producto desde admin, quedan `cart_items` huérfanos.
- El checkout falla con error FK cuando el carrito tiene un ítem sin `productId`.

---

---

### HU-039 — Búsqueda en catálogo de productos del admin (nueva)

> Como administrador, quiero buscar productos por nombre desde el listado `/productos` para localizar rápidamente un ítem sin necesidad de hacer scroll por todo el catálogo.

**Estimación:** XS (1 punto)
**Módulo:** Admin · `app/productos/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin escribe en el campo de búsqueda | Tras 400ms de pausa, la página se recarga con `?q=término` |
| AC-2 | Búsqueda con resultado | Solo se muestran productos cuyo nombre contiene el término (case-insensitive) |
| AC-3 | Búsqueda sin resultado | Mensaje `Sin resultados para "término"` en lugar de tabla vacía |
| AC-4 | Búsqueda vacía | Se muestran todos los productos |
| AC-5 | Filtrado en Supabase | El `.ilike('name', '%q%')` se ejecuta server-side, no client-side |

**Criterios de rechazo:**
- La búsqueda hace un fetch por cada tecla presionada sin debounce.
- El filtrado se hace sobre el array local en lugar de en la query.

---

### HU-040 — Notificación de estado de pedido al cliente (nueva)

> Como cliente, quiero recibir un email automático cuando mi pedido cambia a "Enviado", "Entregado" o "Cancelado" para estar informado del progreso sin necesidad de consultar el panel.

**Estimación:** S (2 puntos)
**Módulo:** Admin · `api/admin/orders/[id]/status/` · `lib/email.ts`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Estado cambia a `shipped` con tracking | Email al cliente con número de tracking y transportadora |
| AC-2 | Estado cambia a `shipped` sin tracking | Email al cliente sin bloque de tracking (HTML condicional) |
| AC-3 | Estado cambia a `delivered` | Email de confirmación de entrega |
| AC-4 | Estado cambia a `cancelled` | Email de notificación de cancelación |
| AC-5 | Estado cambia a `processing` | No se envía email |
| AC-6 | `resend_api_key` no configurado en `store_config` | No se intenta enviar; ningún error visible |
| AC-7 | Resend devuelve error | El cambio de estado en BD se mantiene; error en logs del servidor; respuesta HTTP 200 intacta |

**Criterios de rechazo:**
- El email bloquea la respuesta HTTP (el vendedor espera más de 1s).
- Un fallo de Resend devuelve 500 al cliente del API.

---

### HU-041 — Notas internas en pedidos (nueva)

> Como vendedor, quiero agregar notas privadas a un pedido (instrucciones especiales, comentarios de preparación) que solo el equipo interno pueda ver, sin que aparezcan en ninguna comunicación al cliente.

**Estimación:** S (2 puntos)
**Módulo:** Admin · `app/pedidos/[id]/` · `api/admin/orders/[id]/notes/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Vendedor escribe nota y pulsa "Guardar nota" | Nota guardada en `orders.internal_notes`; indicador "✓ Guardado" por 2s |
| AC-2 | Nota sin cambios | Botón "Guardar nota" no visible |
| AC-3 | Nota borrada (campo vacío) | `internal_notes` se guarda como `null` |
| AC-4 | Error de red | Indicador "Error al guardar" |
| AC-5 | Acceso por `gestor_tienda` | 403 Permisos insuficientes |
| AC-6 | Campo en BD | Migración `16_order_notes.sql` agrega `internal_notes TEXT` con `ADD COLUMN IF NOT EXISTS` |

**Criterios de rechazo:**
- Las notas son visibles en emails al cliente o en el sitio público.
- `gestor_tienda` puede guardar notas.

---

### HU-042 — Página de detalle de cliente (nueva)

> Como vendedor, quiero ver el perfil completo de un cliente (datos de contacto, estadísticas de compra e historial de pedidos) desde el listado de clientes para responder preguntas de soporte sin salir de la sección.

**Estimación:** S (3 puntos)
**Módulo:** Admin · `app/clientes/[email]/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Click en fila de cliente | Navega a `/clientes/[email]` con email URL-encoded |
| AC-2 | Cliente con cuenta registrada | Badge "Con cuenta" + fecha de registro |
| AC-3 | Cliente invitado (solo orders) | Badge "Invitado"; sección de contacto sin fecha de registro |
| AC-4 | Estadísticas | Total de pedidos, total gastado en COP, ticket promedio |
| AC-5 | Historial de pedidos | Tabla con número, fecha, productos, total, estado y link "Ver" a `/pedidos/[id]` |
| AC-6 | Email inexistente | 404 |

**Criterios de rechazo:**
- La página hace múltiples queries que se podrían consolidar.
- Los emails con caracteres especiales (`+`, `@`) no se decodifican correctamente.

---

### HU-043 — Búsqueda y paginación en listado de pedidos (nueva)

> Como vendedor, quiero buscar pedidos por número, nombre o email del cliente y navegar por páginas de 30 resultados para gestionar el volumen de órdenes eficientemente.

**Estimación:** S (3 puntos)
**Módulo:** Admin · `app/pedidos/`
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Búsqueda por número de pedido (`ORD-0042`) | Filtra resultados con `.or()` en Supabase |
| AC-2 | Búsqueda por nombre del cliente | Funciona con coincidencia parcial |
| AC-3 | Búsqueda por email del cliente | Funciona con coincidencia parcial |
| AC-4 | Sin resultados con `q` activo | Mensaje `Sin resultados para "término"` |
| AC-5 | Paginación | 30 pedidos por página; contador "X–Y de Z pedidos" |
| AC-6 | Filtro de estado combinado con búsqueda | Los parámetros `status`, `q` y `page` se preservan entre navegaciones |
| AC-7 | Nueva búsqueda | Reinicia `page` a 1 automáticamente |

**Criterios de rechazo:**
- El filtro de estado y la búsqueda son mutuamente excluyentes.
- La paginación hace `select('*')` sin `.range()`.

---

*Merkiai · Parquesoft TI · Julio 2026*
