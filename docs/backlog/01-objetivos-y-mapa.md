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

