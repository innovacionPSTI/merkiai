# Commerce CMS — Estado del Proyecto
> **Última actualización:** Agosto 2026 (v22) · **Stack:** Next.js 16 · Supabase · Stack Auth · Tailwind · Turborepo

---

## ✅ Implementado

### Monorepo (raíz)
- `package.json` con Turborepo + pnpm workspaces
- `turbo.json` con pipelines build/dev/lint
- `pnpm-workspace.yaml`
- `.gitignore` y `.prettierrc`
- `.env.example` con todas las variables documentadas

### `packages/config`
- `tailwind.config.ts` — paleta base compartida (fuentes, sombras, borderRadius arch). Los colores de web y admin son completamente independientes vía CSS custom properties.
- `tsconfig.json` compartido

### `packages/database`
- `src/types.ts` — tipos TypeScript completos de todas las tablas (incluye `payment_config`; campos Resend; `free_shipping_*` en `shipping_config`; `terms_content`, `privacy_content`, `instagram/facebook/tiktok_url/enabled` en `store_config`; `favicon_url` en `store_config`; tabla `admin_config` singleton)
- `src/client.ts` — `createBrowserClient()` y `createServerClient()`
- `src/queries/` — products, orders, blog, shipping-config, store-config, payment-config, **admin-config**
- `supabase/migrations/21_favicon_url.sql` — columna `favicon_url TEXT` en `store_config`
- `supabase/migrations/22_admin_config.sql` — tabla singleton `admin_config` (accent_color, sidebar_color) con CHECK constraint y RLS
- `supabase/migrations/1_initial_schema.sql` — schema completo para Stack Auth: `products` con `variant_options JSONB`; `product_variants` con `attributes JSONB` + dimensiones de envío; `banners` con `image_url_mobile`; `orders` con `coupon_code`; RLS habilitado; buckets de Storage
- `supabase/migrations/2_shipping_config.sql` — tabla `shipping_config` (multi-proveedor, envío gratis, credenciales Skydropx, 8 campos `origin_*`) + tabla `shipping_profiles`
- `supabase/migrations/3_store_config.sql` — tabla `store_config` singleton con branding, Resend, contenido legal (Markdown), redes sociales, mantenimiento y analytics
- `supabase/migrations/4_payment_config.sql` — tabla `payment_config` singleton con credenciales Wompi y MercadoPago
- `supabase/migrations/5_customers.sql` — tabla `customers` (mirror Stack Auth) + FK `orders.customer_id → customers.id` + tabla `cart_items` con FKs a `customers`, `products` y `product_variants` (ON DELETE CASCADE)
- `supabase/migrations/6_customer_addresses.sql` — tabla `customer_addresses` (N direcciones por cliente para pre-llenar checkout)
- `supabase/migrations/7_content_settings.sql` — agrupa `section_settings` (toggles del home), `coupons`, `testimonials` y `themes`; seed de secciones y tema Commerce CMS por defecto
- `supabase/migrations/8_variant_types.sql` — tabla `variant_types` (plantillas reutilizables de atributo); RLS SELECT público + escritura service_role (sin seed de ejemplo)
- `supabase/migrations/9_indexes.sql` — índices de rendimiento: `products.category_id`, `product_variants.product_id`, `orders.customer_id/customer_email/status/created_at/coupon_code`, `banners (section, active, order_index)`, `blog_posts (published, published_at)` (9 archivos totales — compactados en v9 desde los 16 originales)
- `src/queries/coupons.ts` — `getCoupons`, `getCouponByCode`, **`validateCoupon` (función pura)**, `createCoupon`, `updateCoupon`, `deleteCoupon`, `incrementCouponUsage`
- `src/queries/testimonials.ts` — `getTestimonials(onlyActive)`, `createTestimonial`, `updateTestimonial`, `deleteTestimonial`
- `src/queries/cart.ts` — `getCartItems`, `upsertCartItem`, `removeCartItem`, `clearCart`, `replaceCart`
- `src/queries/sections.ts` — `getSectionSettings()` (lista todas ordenadas por `order_index`), `isSectionEnabled(key)` (fail-open: devuelve `true` si la tabla no existe)
- `src/queries/themes.ts` — `getThemes()`, `getActiveTheme()`, `createTheme()`, `updateTheme()`, `setActiveTheme()`, `deleteTheme()` (protege activo y predeterminado)
- `src/queries/orders.ts` — `CreateOrderInput` incluye `carrier_name`, `skydropx_rate_id` y `coupon_code` para persistir la transportadora y el cupón usados en el pedido
- `src/queries/variant-types.ts` — `getVariantTypes(activeOnly?)`, `getVariantTypeById`, `createVariantType`, `updateVariantType`, `deleteVariantType`; helper `toVariantType()` deserializa JSONB `values` como `string[]`
- `src/types.ts` — añadidas tablas `order_items` (con `image_url`), `section_settings`, `themes`; añadida función `increment_coupon_usage` en `Database['public']['Functions']`; `variant_options` en `products`, `attributes`+`weight_kg`+`length_cm`+`width_cm`+`height_cm` en `product_variants`

### `packages/ui`
- `Button`, `Badge`, `ProductCard`, `Spinner` — componentes base con variantes VPS
- `cn()` utility (clsx + tailwind-merge)

### `apps/web` — Sitio público
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
- `globals.css` — fuentes Ahsing/Geeeki, utilidades arch/scrollbar; **valores por defecto de CSS custom properties** para colores brand (`--brand-primary`, `--brand-cream`, etc. como canales RGB) y fuentes (`--font-display`, `--font-body`)
- `tailwind.config.ts` — **overrides de colores** usando `rgb(var(--brand-xxx) / <alpha-value>)` para soporte de modificadores de opacidad en runtime; fontFamily apunta a `--font-display` y `--font-body`
- `app/layout.tsx` — **carga tema activo** con `getActiveTheme()` e **inyecta `<style>`** en el `<head>` con CSS vars sobreescritas; pre-carga Playfair Display e Inter como alternativas de fuente

**Auth (Stack Auth):**
- `src/stack.ts` — `StackServerApp` (tokenStore: nextjs-cookie, urls custom: /login, /register, /account)
- `src/middleware.ts` — protege `/account/*`; redirige a `/login?returnTo=...` si sin sesión
- `src/app/handler/[...stack]/page.tsx` — catch-all handler (password-reset, email-verification, etc.)
- `src/app/(auth)/layout.tsx` — layout centrado con logo para páginas de auth
- `src/app/(auth)/login/page.tsx` — formulario con estilo de marca, `signInWithCredential`, returnTo param
- `src/app/(auth)/register/page.tsx` — formulario con estilo de marca, `signUpWithCredential`, dispara welcome email
- `src/components/auth/LogoutButton.tsx` — client component con `useUser().signOut()`
- `src/app/api/auth/welcome/route.ts` — POST: obtiene user de Stack Auth, envía bienvenida vía Resend

**Layout:**
- `Navbar` — sticky; carrito badge; hamburger mobile; acepta prop `logoUrl`; muestra "Iniciar sesión" o icono Mi Cuenta segú `useUser()` (Stack Auth)
- `Footer` — links, redes sociales, WhatsApp; acepta props `logoUrl` y `whatsapp` desde layout servidor

**Layouts de grupo (server components):**
- `(public)/layout.tsx` — async, llama `getStoreConfig()` una vez, pasa `logoUrl` y `whatsapp_number` a Navbar y Footer
- `(account)/layout.tsx` — idem, misma configuración

**Store:**
- `store/cart.ts` — Zustand + localStorage, addItem/removeItem/updateQty/subtotal; **`syncToServer` + `loadFromServer`** para usuarios logueados

**Páginas:**
| Ruta | Archivo | Modo |
|------|---------|------|
| `/` | `app/(public)/page.tsx` | ISR 60s |
| `/shop` | `app/(public)/shop/page.tsx` | ISR 60s |
| `/shop/[slug]` | `app/(public)/shop/[slug]/page.tsx` | `force-dynamic` (nueva ruta visible inmediatamente) |
| `/blog` | `app/(public)/blog/page.tsx` | ISR 60s |
| `/blog/[slug]` | `app/(public)/blog/[slug]/page.tsx` | SSG+ISR |
| `/[slug]` | `app/(public)/[slug]/page.tsx` | `force-dynamic` — páginas CMS dinámicas (`pages` + `page_sections`) |
| `/cart` | `app/cart/page.tsx` | Client — tarifa y umbral de envío gratis desde BD vía `/api/shipping/config`; barra de progreso hacia envío gratis |
| `/checkout` | `app/checkout/page.tsx` | 3 pasos — paso 2: comboboxes departamento/ciudad Colombia; si provider=skydropx muestra "Ver opciones de envío →" → lista de transportadoras con precio y días → usuario elige antes de continuar al pago; `shipping_rate` completo (id, carrier_name, service_name, days) se persiste en la orden |
| `/terms` | `app/(public)/terms/page.tsx` | `force-dynamic` — contenido desde el CMS (`getPageWithSections('terms')`) |
| `/privacy` | `app/(public)/privacy/page.tsx` | `force-dynamic` — contenido desde el CMS (`getPageWithSections('privacy')`) |
| `/checkout/confirmation` | `app/checkout/confirmation/page.tsx` | async, WhatsApp desde BD |
| `/` | `app/(public)/page.tsx` | ISR 60s |
| `/shop` | `app/(public)/shop/page.tsx` | ISR 60s |
| `/shop/[slug]` | `app/(public)/shop/[slug]/page.tsx` | `force-dynamic`; OG image desde `images[0].url` |
| `/blog` | `app/(public)/blog/page.tsx` | ISR 60s |
| `/blog/[slug]` | `app/(public)/blog/[slug]/page.tsx` | SSG+ISR; Draft Mode con cookie `__merkiai_draft`; banner borrador |
| `/account` | `app/(account)/account/page.tsx` | SSR · user real |
| `/account/profile` | `app/(account)/account/profile/page.tsx` | SSR · editar nombre, teléfono y direcciones |
| `/account/orders` | `app/(account)/account/orders/page.tsx` | SSR |
| `not-found.tsx` | `app/not-found.tsx` | Página 404 personalizada |
| `sitemap.ts` | `app/sitemap.ts` | Sitemap dinámico: rutas estáticas + productos activos + posts publicados |
| `robots.ts` | `app/robots.ts` | robots.txt: bloquea `/api/`, `/account/`, `/checkout/` |

> **Nota Next.js 15:** En rutas dinámicas `params` es un `Promise`. Se debe tipar como `params: Promise<{ slug: string }>` y usar `const { slug } = await params`.

**API Routes:**
| Ruta | Función |
|------|---------|
| `POST /api/checkout` | Crea orden en Supabase + genera URL de pago Wompi o preferencia MercadoPago |
| `POST /api/newsletter` | Upsert suscriptor + email de confirmación vía Resend (solo en primera suscripción) |
| `GET /api/shipping/config` | Config pública de envío (provider, fixed_rate, free_shipping_*) — para carrito y checkout |
| `POST /api/shipping/rates` | Cotiza envío multi-proveedor (Skydropx o tarifa fija) |
| `POST /api/auth/welcome` | Upsert en `customers` + vincula pedidos previos + email de bienvenida |
| `GET /api/account/addresses` | Devuelve direcciones guardadas del cliente logueado |
| `POST /api/account/addresses` | Guarda nueva dirección; maneja `is_default` de forma exclusiva |
| `PATCH /api/account/addresses/[id]` | Edita campos de una dirección guardada; si `is_default=true` limpia la default previa |
| `DELETE /api/account/addresses/[id]` | Elimina dirección verificando que pertenece al cliente |
| `GET /api/account/profile` | Devuelve nombre y teléfono del customer logueado |
| `PATCH /api/account/profile` | Actualiza nombre y teléfono; sincroniza `displayName` en Stack Auth |
| `GET /api/draft/enable` | Activa modo borrador (cookie `__merkiai_draft` 1h) + redirect a `/blog/[slug]?draft=1` |
| `POST /api/webhooks/wompi` | Verifica firma SHA256, actualiza estado de pago → `createShipmentForOrder()` → email de tracking |
| `POST /api/webhooks/mercadopago` | Consulta pago en API MP, actualiza estado → `createShipmentForOrder()` → email de tracking |
| `POST /api/webhooks/skydropx` | Mapea `workflow_status` / eventos PRO a estado de orden; envía email de tracking al entrar en tránsito |
| `GET /api/maintenance-status` | Retorna `{maintenance_mode}` desde `store_config`; ISR 60s |
| `POST /api/checkout/coupon` | Valida cupón (código + subtotal); retorna `{code, type, value, discount}` o error |
| `GET /api/account/cart` | Retorna items del carrito en BD para el usuario logueado |
| `POST /api/account/cart` | Reemplaza todo el carrito en BD (sincronización completa) |
| `DELETE /api/account/cart` | Limpia el carrito en BD |

**Componentes:**
- `HeroCarousel` — autoplay 5s, fade, dots, flechas; usa `<picture>` + `<source media="(max-width: 768px)">` para mostrar imagen mobile en móvil e imagen desktop en escritorio
- `Footer` — iconos SVG oficiales de Instagram, Facebook y TikTok; se muestran solo si están `enabled: true` y tienen URL configurada; recibe prop `social` desde el layout servidor
- `LegalPage` — componente compartido para `/terms` y `/privacy`; converter Markdown→HTML sin dependencias externas (h1/h2/h3, **bold**, *italic*, listas, links); muestra aviso si el contenido está vacío
- `FeaturedProducts` — grid 3 col, add to cart
- `ServicesSection` — async, llama `Promise.all` para URLs de WhatsApp desde BD
- `NewsletterSection` — POST a API route
- `CartDrawer` — slide-in desde derecha, overlay, Escape key
- `ShopClient` — filtros de categoría y atributos dinámicos desde `variant_options`; swatches de color cuando el valor es un color; "Desde $X" cuando hay múltiples precios; "Ver opciones" vs "Agregar" según cantidad de variantes
- `ProductDetail` — galería, selector variantes genérico (cualquier atributo: color/talla/etc.), strikethrough para variantes no disponibles, add to cart
- `lib/variant-utils.ts` — `getProductOptions`, `getVariantAttrs`, `getVariantLabel` (retrocompat. con catálogos legacy), `isColorValue`, `COLOR_HEX` (20 colores españoles → hex)
- `lib/colombia-locations.ts` — 33 departamentos + ~400 municipios; `DEPARTMENTS` (lista ordenada), `getCitiesForDepartment(dept)` (lista ordenada por depto)
- `components/ui/SearchableSelect.tsx` — combobox reutilizable: input + dropdown filtrado, nav por teclado (↑↓ Enter Escape), cierre en click externo, checkmark en seleccionado, key única por índice (evita duplicados como "Buenaventura")
- `components/account/ProfileForm` — editar nombre y teléfono del cliente; PATCH a `/api/account/profile`
- `components/account/AddressesForm` — lista, agregar, **editar inline** y eliminar direcciones; comboboxes departamento/ciudad; botón "Predeterminada"; PATCH+DELETE a `/api/account/addresses/[id]`
- `components/pedidos/PickupModal` — modal para seleccionar órdenes y programar recolección Skydropx
- `components/testimonials/TestimonialsCarousel` — carrusel automático (5s), 3 cards visibles, dots + flechas, pausa en hover; usa datos de BD
- `components/auth/CartSyncOnLogin` — componente invisible montado en root layout; detecta login y sincroniza carrito localStorage ↔ BD
- `lib/whatsapp.ts` — async, lee número desde `getStoreConfig()` en BD; fallback `573XXXXXXXXX`
- `lib/wompi.ts` — `buildWompiCheckoutUrl` (firma SHA256), `verifyWompiWebhook`, `mapWompiStatus`; sin process.env
- `lib/mercadopago.ts` — `createMercadoPagoPreference`, `getMercadoPagoPayment`, `mapMercadoPagoStatus`, `isMercadoPagoSandbox`; sin process.env
- `lib/email.ts` — `sendOrderConfirmation`, `sendShippingNotification`, `sendWelcomeEmail`, `sendNewsletterConfirmation` vía Resend (fetch directo); credenciales como parámetros; **`buildEmailConfig()`** construye `EmailConfig` con `storeName` (desde `store_config.store_name`) y `siteUrl` (desde `NEXT_PUBLIC_SITE_URL`) — elimina todos los valores hardcodeados en plantillas
- `lib/markdown.ts` — **conversor Markdown→HTML sin dependencias externas**, compartido entre blog y páginas legales; soporta h1/h2/h3 (con o sin espacio tras `#`), **bold**, *italic*, `code`, links y listas; extraído de `LegalPage.tsx`; aplicado en `/blog/[slug]/page.tsx`
- `lib/shipping/types.ts` — interfaces `ShippingAddress`, `ShippingRate`, `Parcel`, `calculateParcel()`
- `lib/shipping/index.ts` — factory `getShippingProvider()` + exports de providers
- `lib/shipping/providers/fixed/index.ts` — `FixedRateProvider`: devuelve tarifa fija desde config
- `lib/shipping/providers/skydropx/auth.ts` — OAuth 2.0 client_credentials con cache de token por clientId
- `lib/shipping/providers/skydropx/index.ts` — `SkydropxProvider`: cotización con `address_from` inline (sin `postal_code` — Skydropx Colombia solo requiere `area_level1`+`area_level2`), `declared_amount` calculado desde el total del carrito (requerido por PRO API), polling hasta `is_completed`, extrae tracking de `included[0].attributes`; `createShipment()` completo
- `lib/shipping/shipments.ts` — `createShipmentForOrder(orderNumber)`: carga orden → config → destination → parcel → guía → actualiza orden; idempotente; nunca lanza

### `apps/admin` — Panel de administración
**Setup:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- `globals.css` — **paleta corporativa slate/indigo** como CSS vars por defecto (`--brand-primary`: indigo-600 `#4F46E5`; `--brand-sidebar`: slate-900 `#0F172A`); independiente del sitio web
- `tailwind.config.ts` — reescrito con tokens CSS var para todos los colores brand (incluye `brand-sidebar`); sin colores hardcoded
- `app/layout.tsx` — StackProvider/StackTheme; inyecta `<style>` con CSS vars de `admin_config` en cada request; helpers `hexToRgb` + `darkenHex`

**Auth (Stack Auth):**
- `src/stack.ts` — `StackServerApp` (tokenStore: nextjs-cookie)
- `src/middleware.ts` — protege todas las rutas excepto `/handler/*`; redirige a `/handler/sign-in`
- `src/app/handler/[...stack]/page.tsx` — catch-all handler Stack Auth

**Auth y Roles:**
- `src/lib/roles.ts` — reescrito con `AssignableRole = AdminRole | 'miembro'`; `ADMIN_ROLES`, `ASSIGNABLE_ROLES`, `ROLE_LABELS` (incluyendo miembro), `isAdminRole()` retorna false para miembro
- Roles disponibles: `super_admin`, `admin`, `vendedor`, `gestor_tienda`, `miembro` (sin acceso al panel), `customer`

**Layout:**
- `AdminSidebar` — sidebar `bg-brand-sidebar` (CSS var, configurable desde BD); **grupos colapsables** (Catálogo, Ventas, Contenido, Apariencia, Configuración, **Sistema**); visibilidad filtrada por rol; auto-expande el grupo activo; sub-ítems de Configuración (General, Envíos, Pagos, Emails, Legal); Sistema agrupa Usuarios + **Apariencia del Panel**; Newsletter en grupo Contenido
- `AdminTopbar` — barra superior con búsqueda y avatar

**Componentes:**
- `ImageUpload` — drag & drop, preview, upload a Supabase Storage; prop `onUploadStateChange` notifica al padre cuando hay upload en progreso; prop `sizeClass` para controlar dimensiones (ej. `w-48 h-48` para logo cuadrado)

**Páginas implementadas:**
| Ruta | Contenido |
|------|-----------|
| `/dashboard` | **Dashboard adaptado por rol**: admin ve ventas/métricas/stock; vendedor ve estado de órdenes urgentes y stock bajo; gestor_tienda ve secciones web, blog, banners y cupones próximos a vencer |
| `/productos` | Tabla CRUD con precio rango, stock badge, estado |
| `/productos/nuevo` | Formulario de creación con variantes, imágenes, SEO |
| `/productos/[id]` | Formulario de edición |
| `/pedidos` | Tabla con filtros por estado |
| `/pedidos/[id]` | Detalle completo: timeline, items, cliente, dirección, pago, tracking |
| `/banners` | Vista previa de slides; cada banner soporta imagen web + imagen mobile |
| `/categorias` | CRUD de categorías |
| `/blog` | Tabla artículos con estado publicado/borrador |
| `/clientes` | Tabla unificada: lee desde `customers` (Supabase) en lugar de Stack Auth API; compradores sin cuenta desde `orders`; búsqueda y filtros |
| `/usuarios` | CRUD de usuarios del panel: invitar (crea en Stack Auth con rol `miembro` + envía email de contraseña), cambiar rol, eliminar |
| `/blog/nuevo` | Formulario de creación de artículo: título, slug auto-generado, imagen de portada, categoría, toggle publicado/borrador, extracto, contenido Markdown, SEO |
| `/blog/[id]` | Formulario de edición de artículo; botón eliminar; botón "Previsualizar ↗" — activa Draft Mode mediante cookie |
| `/configuracion` | → redirige a `/configuracion/general` |
| `/configuracion/general` | `StoreConfigForm` — WhatsApp, logo, nombre, email, redes sociales, **modo mantenimiento**, **analytics toggle**, **favicon** (upload con preview) |
| `/sistema/apariencia` | `AdminConfigForm` — color picker para acento (botones/nav) y sidebar del panel; presets de paleta; vista previa en tiempo real; guarda en `admin_config` |
| `/configuracion/envios` | `ShippingConfigForm` — tarifa fija, envío gratis, Skydropx, dirección de origen con comboboxes departamento/ciudad Colombia (solo admin/super_admin) |
| `/configuracion/pagos` | `PaymentConfigForm` — pasarela activa + Demo/Prod: Wompi, MercadoPago, Tu Compra, Bold (solo admin/super_admin) |
| `/configuracion/emails` | `EmailConfigForm` — Resend (solo admin/super_admin) |
| `/configuracion/legal` | `LegalConfigForm` — editor Markdown Términos/Privacidad |
| `/cupones` | CRUD de cupones — código (uppercase), tipo (%), valor, mínimo de pedido, usos máximos, expiración, estado activo; badges Activo/Inactivo/Expirado/Agotado |
| `/testimonios` | CRUD de testimonios — nombre, cargo, contenido, avatar, rating estrellas, orden, toggle visible; vista en tarjetas |
| `/secciones` | **Hub central de contenido configurable**: toggles para habilitar/deshabilitar secciones del home (hero, productos destacados, servicios, más vendidos, blog preview, newsletter); CRUD inline de servicios (banners de tipo `services`) |
| `/configuracion/temas` | **Editor de temas** — crear/editar perfiles de colores y tipografía; color pickers por campo brand; selector fuente display (Cormorant / Playfair) y body (DM Sans / Inter); preview en tiempo real; activar tema → se aplica al sitio inmediatamente |
| `/newsletter` | **Gestión de newsletter** — pestaña Suscriptores (tabla con email, fecha, estado activo/inactivo + exportar CSV) y pestaña Enviar campaña (formulario asunto + cuerpo Markdown, preview destinatarios activos, confirmación, feedback de resultado) |

**API Admin:**
| Ruta | Función |
|------|---------|
| `POST /api/admin/products` | Crea producto con variantes e **imágenes** (bug fix: ya no ignora el campo `images` del body) |
| `GET/PATCH /api/admin/products/[id]` | Edita producto y variantes |
| `DELETE /api/admin/products/[id]` | Elimina producto y variantes (FK) |
| `PATCH /api/admin/orders/[id]/status` | Actualiza estado de orden |
| `GET /api/shipping/config` | Config pública de envío sin credenciales (provider, fixed_rate, free_shipping_enabled, free_shipping_min_amount) — usada por carrito y checkout |
| `GET /api/admin/shipping` | Lee config de envíos (client_secret enmascarado) |
| `PATCH /api/admin/shipping` | Guarda config de envíos con validación; acepta `free_shipping_enabled` y `free_shipping_min_amount` |
| `GET /api/admin/config` | Lee `store_config` (WhatsApp, nombre, email, logo, Resend, legal, redes sociales); enmascara `resend_api_key` |
| `PATCH /api/admin/config` | Guarda `store_config`; valida WhatsApp (10–15 dígitos); acepta Resend, `terms_content`, `privacy_content`, `instagram/facebook/tiktok_url/enabled` |
| `GET /api/admin/payment-config` | Lee `payment_config`; devuelve secrets enmascarados + flags `has_*` |
| `PATCH /api/admin/payment-config` | Guarda credenciales Wompi/MP; valida prefijo `pub_`; no sobreescribe secrets vacíos |
| `GET /api/admin/usuarios` | Lista usuarios del panel (roles `super_admin`, `admin`, `vendedor`, `gestor_tienda`, `miembro`) desde Supabase |
| `POST /api/admin/usuarios` | Crea usuario: `stackServerApp.createUser()` → insert en `profiles` con UUID generado en servidor → envía email "Establece tu contraseña" vía Stack Auth REST API con `secret-server-key` |
| `PATCH /api/admin/usuarios/[id]` | Cambia rol (`AssignableRole`); solo super_admin puede asignar super_admin |
| `DELETE /api/admin/usuarios/[id]` | Elimina usuario del panel |
| `POST /api/admin/blog` | Crea artículo del blog; detecta slug duplicado (409) |
| `PATCH /api/admin/blog/[id]` | Edita artículo; gestiona `published_at` automáticamente |
| `DELETE /api/admin/blog/[id]` | Elimina artículo |
| `POST /api/admin/upload` | Sube archivo a Supabase Storage; **auto-crea el bucket** si no existe |
| `DELETE /api/admin/upload` | Elimina archivo de Storage |
| `POST /api/admin/pickups` | Programa recolección en Skydropx PRO (fecha + ventana horaria + lista de shipment_ids) |
| `GET /api/admin/pickups` | Lista recolecciones programadas (paginado) |
| `GET /api/admin/coupons` | Lista todos los cupones |
| `POST /api/admin/coupons` | Crea cupón (código → uppercase); detecta duplicado (409) |
| `PATCH /api/admin/coupons` | Edita cupón o cambia estado activo/inactivo |
| `DELETE /api/admin/coupons` | Elimina cupón |
| `GET /api/admin/testimonios` | Lista todos los testimonios (incluyendo inactivos) |
| `POST /api/admin/testimonios` | Crea testimonio |
| `PATCH /api/admin/testimonios` | Edita testimonio o cambia visibilidad |
| `DELETE /api/admin/testimonios` | Elimina testimonio |
| `GET /api/admin/sections` | Lista todas las secciones web con estado `enabled` |
| `PATCH /api/admin/sections/[key]` | Habilita o deshabilita una sección del sitio |
| `GET /api/admin/themes` | Lista todos los temas de color/tipografía |
| `POST /api/admin/themes` | Crea un nuevo tema (inactivo por defecto) |
| `PATCH /api/admin/themes/[id]` | Edita campos del tema; `{ setActive: true }` lo activa globalmente |
| `DELETE /api/admin/themes/[id]` | Elimina tema (no permite borrar activo ni predeterminado) |
| `GET /api/admin/newsletter` | Lista todos los suscriptores de newsletter ordenados por fecha descendente |
| `POST /api/admin/newsletter/send` | Broadcast de email a todos los suscriptores activos vía Resend; lee credenciales desde `store_config`; envío en lotes de 50; retorna `{total, sent, failed}` |
| `PATCH /api/admin/sistema` | Actualiza `admin_config` (accent_color, sidebar_color); solo super_admin y admin |
| `GET /api/admin/export` | Snapshot JSON v3: store_config, **admin_config**, **themes**, nav_items, pages, page_sections, section_items |
| `POST /api/admin/import` | Restaura snapshot v3 idempotente; compatible con v2 y v1 (legacy keys ignoradas) |
| `GET /api/admin/cms/[resource]` | Lista todos los registros del recurso CMS (`pages`, `sections`, `items`, `section-settings`); soporta filtro por query param (`page_key`, `section_id`) |
| `POST /api/admin/cms/[resource]` | Crea un nuevo registro; valida campos requeridos según config del recurso; retorna 201 con el registro creado |
| `PATCH /api/admin/cms/[resource]` | Actualiza un registro por pk (`key` o `id`); require pk en body; retorna error si no hay campos para actualizar |
| `DELETE /api/admin/cms/[resource]` | Elimina un registro por pk en query param; `pkNumeric` convierte id a número para `page_sections` y `section_items` |

---

## 🆕 Completado en v16 — Pasarela de pago única (`active_provider`)

Se reorganizó la configuración de pagos con la misma lógica de "Proveedor activo" de envíos: **solo una pasarela puede estar activa a la vez**; al seleccionar una, las demás quedan inactivas.

- [x] **Migración 24** — `payment_config.active_provider TEXT DEFAULT 'none' CHECK(none/wompi/mercadopago/tucompra)`; back-fill desde los booleanos previos; `DROP` de `wompi_active`/`mercadopago_active`/`tucompra_active`. `01_schema.sql` canónico actualizado (además incorpora las columnas de Tu Compra que faltaban) ✅
- [x] **Factory** — `getActiveProvider(config)` (fail-closed: si la pasarela activa no tiene credenciales → `'none'`); `getPaymentGateway` valida contra `active_provider`; `getActiveGateways` devuelve `[activa]` o `[]` ✅
- [x] **Admin** — `PaymentConfigForm` con selector "Proveedor activo" (Ninguna/Wompi/MercadoPago/Tu Compra) + badge Activa/Inactiva por sección; ruta `PATCH /api/admin/payment-config` valida el valor y que la pasarela a activar tenga credenciales completas (400 con `missing` si faltan) ✅
- [x] **Seguridad en checkout** — el `POST /api/checkout` **ignora el `payment_method` del cliente** y deriva la pasarela del servidor (`getActiveProvider`). Cierra el bypass de forzar una pasarela distinta a la activa ✅
- [x] **Modo manual (`'none'`)** — sin pasarela activa el pedido se crea con `payment_method: 'manual'` y `payment_status: 'pending'`, **sujeto a validación del administrador**; no se genera pago en línea. `CheckoutClient` muestra "Pago coordinado con la tienda" y redirige a confirmación ✅
- [x] **Tests** — `checkout.integration` reescrito (incluye caso manual + prueba de no-bypass de pasarela), `payment-config.integration` y webhooks actualizados al nuevo modelo ✅

### Bold (HU-093) + URLs de webhook (HU-094)
- [x] **BoldGateway** (`packages/database/.../BoldGateway.ts`) — API "link de pagos": `POST /online/link/v1` con `Authorization: x-api-key`, total en COP, `callback_url` a confirmación y `metadata.reference = order_number`; devuelve `payload.url`. Verificación de webhook **HMAC-SHA256(base64(body))** contra `x-bold-signature` (llave vacía en sandbox); `mapStatus` (SALE_APPROVED/REJECTED, VOID_*) y `extractWebhookData` ✅
- [x] **Webhook `/api/webhooks/bold`** — verifica firma **antes** de tocar estado; **idempotente** (reintento de pago ya aprobado → 200 sin reprocesar); dispara email + guía en aprobado ✅
- [x] **Migración 24 (sobrescrita)** — añade `bold_api_key`, `bold_secret_key`, `bold_sandbox`; `active_provider` CHECK incluye `'bold'`; `01_schema.sql` y `types.ts` actualizados; `payment_method` de orders acepta `'bold'` y `'manual'` ✅
- [x] **Admin** — opción **Bold** en el selector "Proveedor activo" + credenciales; validación de credenciales al activar (secret opcional en sandbox); factory y `getActiveProvider` con case `'bold'` (fail-closed) ✅
- [x] **URLs de webhook por pasarela** — componente `WebhookUrl` muestra `${NEXT_PUBLIC_SITE_URL}/api/webhooks/<provider>` (copiable) en cada sección (Wompi, MercadoPago, Tu Compra, Bold), con nota de dónde registrarla ✅
- [x] **Tests** — `bold-gateway.test.ts` (10), `webhook-bold.integration.test.ts` (5), caso Bold en `checkout.integration` ✅

### Fallback de estado Bold (HU-095)
- [x] **`BoldGateway.queryStatusByReference`** — consulta el servicio de fallback `GET /payments/webhook/notifications/<ref>?is_external_reference=true` (por `metadata.reference` = order_number), prioriza `SALE_APPROVED`, devuelve el estado mapeado o `null` ✅
- [x] **`reconcileBoldOrder` (`apps/web/src/lib/bold-reconcile.ts`)** — guard `bold` + `pending`, estado tomado SOLO de la API autenticada de Bold, idempotente, mismos efectos que el webhook (email + guía) ✅
- [x] **Disparadores** — endpoint público `POST /api/checkout/bold/reconcile` (rate-limited 6/min por IP) invocado una vez desde la confirmación (`BoldReconcileOnLoad`); endpoint admin `POST /api/admin/orders/[id]/reconcile-bold` (guard admin) + botón "Verificar pago con Bold" en el detalle del pedido ✅
- [x] **Fix (ago-2026): reconcile compartido sin salto HTTP** — el núcleo `reconcileBoldOrder` se movió a `@merkiai/database` (`lib/bold-reconcile.ts`); el endpoint admin lo llama **directo** (antes hacía `fetch` a `NEXT_PUBLIC_SITE_URL`, que en local fallaba con `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`). Al aprobar, el admin envía email `sendPaymentConfirmed`. Test `bold-reconcile.test.ts` en database (5). **Nota:** en desarrollo local los webhooks de Bold no llegan a `localhost` (usar túnel o el botón de verificación) ✅
- [x] **Tests** — `bold-gateway.test.ts` ampliado (13 total), `bold-reconcile.test.ts` (5) ✅

### Validación manual del pago por el admin (HU-096)
- [x] **`PATCH /api/admin/orders/[id]/payment-status`** — guard admin (super_admin/admin/vendedor); acepta solo `approved`/`rejected`; al aprobar fija `payment_status='approved'` + `status='processing'`; email de confirmación al cliente (fire-and-forget) ✅
- [x] **`sendPaymentConfirmed`** — email compartido en `@merkiai/database` ("hemos confirmado tu pago"); re-exportado en admin ✅
- [x] **UI** — `PaymentStatusValidator` (botones "Confirmar pago"/"Rechazar pago") en el detalle del pedido, visible mientras el pago no esté aprobado ✅
- [x] **Fix constraint BD** — `orders_payment_method_check` ampliado a `('wompi','mercadopago','tucompra','bold','manual')` en `01_schema.sql` y `upgrade.sql` (antes solo permitía wompi/mercadopago → rompía los pedidos `manual`) ✅
- [x] **Tests** — `payment-status.integration.test.ts` (5) + `sendPaymentConfirmed` en `email.test.ts` ✅

### Reposicionamiento a CMS general (des-branding)
- [x] **Marca eliminada** — todas las referencias a "VPS Coffee" quitadas de docs (README, PROGRESS, BACKLOG, DEPLOYMENT, STACK_AUTH_SETUP y sub-READMEs), seeds canónicos y fixtures de tests; dominios `vpscoffee.com` → `shop.example.com`. Las migraciones históricas (1–23) se dejan como registro ✅
- [x] **Nombre genérico** — la documentación usa "Commerce CMS" como nombre de plataforma (placeholder; el nombre real se configura por instancia en `store_config`) ✅
- [x] **Reposicionamiento** — README y objetivos del backlog reescritos como **CMS de e-commerce general y personalizable (white-label)** con tres pilares: CMS + e-commerce, integraciones intercambiables (pagos/envíos/email) y **componentes de IA** (arquitectura extensible para generación de contenido, recomendaciones y asistencia). Ejemplos de café/maquila marcados como ilustrativos, no como vertical obligatorio ✅
- [x] Suites verdes tras el renombrado: **web 26/290, database 11/124, admin 12/165** ✅

### Reorganización del backlog por dominio (v2)
- [x] **Mapa de Épicas v2** — el backlog se reagrupa por dominio (E1–E16) eliminando colisiones de numeración (había tres "Épica 9/10/11" con doble significado) y la dispersión de temas. El mapa vive en `PRODUCT_BACKLOG.md §2.0` y es la fuente de verdad ✅
- [x] **Épica 15 (Proveedores intercambiables) disuelta** — sus HU transversales se redistribuyen: gateways de pago → **E6 Pagos**, envío → **E7 Envíos**, email → **E8 Emails** ✅
- [x] **Pagos consolidados** en **E6 · Pagos y pasarelas** (checkout + Wompi/MP/Tu Compra/Bold + validación manual + fallback) ✅
- [x] **Renombres:** Épica 8 → *Páginas de contenido y servicios* (genérica, maquila/asesorías como ejemplo); secciones de detalle colisionadas renumeradas a su épica v2 (E2/E14/E8/E15/E6/E9) ✅
- [x] **Nueva E16 · Componentes de IA** (roadmap: IA-01 descripciones, IA-02 recomendaciones, IA-03 asistente) ✅
- [x] **Tabla de cobertura regenerada** por dominio: 190 ítems → 177 ✅ / 7 🟡 / 6 🔲 (93 % con pruebas, 97 % con código) ✅

**Mapa v2 resumido (18 épicas):** E1 Fundación · E2 Arquitectura+CMS · E3 Sitio público · E4 Tienda · E5 Carrito · **E6 Pagos** · **E7 Envíos** · **E8 Emails y newsletter** · **E9 Inventario** · E10 Blog · E11 Contenido/servicios · E12 Auth/Mi Cuenta · E13 Panel admin · E14 Despliegue/seguridad · E15 SEO · **E16 Aplicación inteligente (IA) 🔲** · **E17 Plataforma multi-tienda / control plane + SaaS billing 🔲** · **E18 Inventario multi-ubicación 🔲**.

> **Nota:** el MVP (191 ítems, E1–E15 salvo IA) está completo (188 ✅ / 0 🟡 tras v20). Las épicas E16–E18 y las HU-101…200 son **roadmap** (109 🔲), incluyendo la arquitectura multi-tenant + SaaS billing (E17, HU-192…194), la preparación para servicios (HU-195…199) y el aislamiento de datos por plan (HU-200). La fuente de verdad es `PRODUCT_BACKLOG.md` §2.0 (mapa), §11 (cobertura) y §11.1 (plan de olas).

---

### Expansión del roadmap (v17–v19) — planificación

> Ampliación del backlog de **191 → 280 ítems** (181 ✅ / 7 🟡 / 92 🔲). Solo **planificación** (HU redactadas con criterios de aceptación y dependencias); sin cambios de código salvo los fixes listados por separado.

- [x] **v17 — Expansión por dominio (HU-101…134):** catálogo (reseñas, búsqueda, wishlist, precio), inventario (back-in-stock, stock bajo), pagos (RMA, pasarela internacional), cuentas (login social, reorder, guest order), SEO (redirects 301), operación (drag-and-drop, CSV, acciones masivas, backups) y configurabilidad (plantillas de diseño, import/export, media library) ✅
- [x] **v17 — E16 ampliada a "Aplicación inteligente" (HU-135…145):** cimientos (proveedor de IA swappable, captura de eventos, vector store) + features (asistente de compra, búsqueda visual, personalización, clustering, patrones de compra, apariencia por chat, generación de imágenes, detección de fraude) ✅
- [x] **v18 — Emails y newsletter (HU-159…163):** `EmailProvider` multi-proveedor (SES/Postmark/SMTP), plantillas editables, entregabilidad (SPF/DKIM/DMARC + suppression), `email_log`, y newsletter externo (Beehiiv y similares) ✅
- [x] **v18 — Divisiones de HU grandes:** HU-107→a/b, HU-114→a/b/c (i18n), HU-122→a/b/c (layouts), HU-138→a/b (asistente); registro de auditoría extraído a HU-146 ✅
- [x] **v19 — Enablers de plataforma (HU-164…171):** pipeline de pricing unificado, webhooks salientes/API pública, facturación electrónica (DIAN), fidelización, bundles, onboarding, monitoreo de errores (APM) y spike de auth multi-tenant ✅
- [x] **Épica nueva E17 · Plataforma multi-tienda / control plane (HU-156/157/158, HU-171…175):** multi-tenant (aislamiento por `store_id`/RLS, resolución por dominio, panel multi-tienda), consola de administración de todos los tenants, planes/entitlements, y gestión de dominios (web custom con ciclo DNS→cert→CDN→activo, y dominios de envío). **Decisión de auth:** Stack Auth + aislamiento en BD; FusionAuth solo si se requiere identidad separada por tienda / branding de auth por tienda / self-hosting ✅
- [x] **Épica nueva E18 · Inventario multi-ubicación y fulfillment (HU-176…183):** ubicaciones tipo Shopify (stock por variante+ubicación, ruteo de fulfillment, transferencias, click & collect por ubicación), **incluye migración del stock único actual** (HU-178) ✅
- [x] **Plan de olas (§11.1):** las HU 🔲 ordenadas en 8 fases por valor + dependencias + riesgo, con sizing aproximado; enablers primero (pricing, auditoría, eventos+cookies, EmailProvider, IA, spike auth). Decisiones estratégicas señaladas: adelantar E17/i18n si el negocio es white-label multi-cliente ✅
- [x] **Tu Compra reescrita a la modalidad INTEGRADOR (HU-188):** al probar contra la doc oficial se descartó el modelo antiguo (form-POST+MD5) y el `crearBotonPago` (botón, sin referencia). Se implementó `confirmacionTransaccionMedioPago` (con `Referencia`=order_number → `urlBanco`), `listarBancos`, `consultarEstadoTransaccion`, **config de medios habilitados con IDs por demo/prod** (`tucompra_methods`), **URL de Confirmación + Retorno** en el admin, webhook autoritativo y **checkout cableado** (PSE con selector de banco, Nequi/Daviplata con celular, Referenciado). Pendiente: método **Tarjeta** (RSA → rompe SAQ A) y validación sandbox. PRV-07 y HU-188 en 🔲 (funcional, sin cerrar E2E) ✅
- [x] **HU-189 — Rediseño UX de configuración de pagos:** indicador **Demo/Producción** por pasarela, estado activo claro y selector visual de métodos de Tu Compra (switches + drag-and-drop, IDs por entorno) en lugar del JSON ✅ *(en implementación)*
- [x] **Tu Compra v20 — flujos por medio + firma + seguimiento (HU-188 dividida en 188a–e):** tras leer TODA la doc REST + el PDF de integración se implementaron los 4 medios con su flujo real: **PSE** (`campo2`=nombre banco → `urlBanco` redirect), **Nequi** (push + polling), **Daviplata** (OTP → `finalizaPagoDaviplata`), **Referenciado** (PDF/comprobante). Se **persiste `CodigoSeguimiento`/`numeroTransaccion`** (migración 28) — obligatorio para consultar estado y finalizar Daviplata. Se añadió **verificación de `firmaTuCompra`** (MD5 con `tucompra_encryption_key`) en el webhook + re-consulta autoritativa. **Tarjeta excluida** por PCI (quitada del admin). **HU-088 marcada REEMPLAZADA por HU-188.** Documento de contexto: `Tu-Compra-Integracion-Referencia.md` (raíz del workspace). Tests: gateway (campo2, finalizaPagoDaviplata, firma) + reconcile verdes; tsc web/admin limpio. Pendiente: validación E2E en sandbox ✅
- [x] **Hardening de confirmaciones de pago (todas las pasarelas):** auditoría contra forja de confirmaciones ("cambiar el estado a OK para un pago inexistente"). Principio: el estado NUNCA viene del cliente/payload sin verificar — solo por firma válida o re-consulta server-to-server. **Correcciones:** Wompi `verifyWompiWebhook` ahora **falla cerrado** (rechaza) si el secreto/checksum está vacío + `timingSafeEqual` *(antes hacía bypass con secreto vacío → forja de `APPROVED`)*; Bold `verifyWebhook` rechaza en **producción** con llave secreta vacía; Tu Compra firma con `timingSafeEqual`; MercadoPago ya re-consulta el pago (ignora el estado del body); `GET /api/checkout/status` con rate-limit por IP. Se limpiaron los componentes muertos `TuCompraReconcileOnLoad`/`BoldReconcileOnLoad`. **Verificación de monto (anti-subpago) en las 4 pasarelas:** al aprobar se comprueba que el valor pagado cubre `order.total` (helper `amountCoversOrder`; Wompi `amount_in_cents`, MP `transaction_amount`, Bold `data.amount.total`, Tu Compra `valorPagado`); si es menor → el pedido queda `pending` (no se auto-cumple). ✅
- [x] **Cotización de envío Skydropx — piso de valor declarado + mensaje inline (v20):** Skydropx PRO rechaza cotizar con `declared_amount` < 10.000 (422). El piso de seguridad estaba en 1.000 → un pedido de $1.000 fallaba. Ahora `declaredAmount = max(valorPedido, 10.000)` (el valor declarado es solo para seguro/aduana). Además, los errores de cotización se **traducen a mensajes amigables** (`lib/shipping/rate-errors.ts`: total muy bajo, dirección/código postal, genérico) y el checkout los muestra **inline** (estado `ratesError`) en vez del texto genérico; permite continuar con tarifa estándar. Test: `rate-errors.test.ts`; web tsc limpio ✅
- [x] **Cierre de los 5 🟡 (v20) — features sin pruebas → ✅:** se escribieron pruebas dedicadas para las 5 features que estaban implementadas sin test. **PRV-09** (selector de proveedor de email) → `email-provider.test.ts` (factory `getEmailProvider`) + round-trip `email_provider`/`analytics_enabled` en `store-config.test.ts`. **HU-060** (tracking en Mi Cuenta) → `getOrdersByCustomerEmail` en `orders.test.ts` (email en minúsculas, orden desc, `tracking_number`/`carrier_name`). **HU-080** (JSON-LD) → builders extraídos a `lib/json-ld.ts` + `json-ld.test.ts`. **HU-081** (fuentes de tema) → `buildThemeCSS`/mapas extraídos a `lib/theme-css.ts` + `theme-css.test.ts`. **HU-079** (AdminSidebar responsive) → `AdminSidebar.test.tsx` (nav por rol, drawer hamburguesa, expansión de grupos). Refactors de extracción sin cambio de comportamiento (layout y páginas importan los nuevos libs). Cobertura: **0 🟡** (antes 5), ✅ pasa a **188/288**. Verde: database 168 · web 329 · admin 169; tsc limpio ✅
- [x] **Estado de despliegue e iteración (v20):** migraciones 28/29 aplicadas en Supabase y credenciales/URLs de Tu Compra configuradas en el admin; **PSE validado E2E** (Nequi/Daviplata pendientes de que Tu Compra los active en el terminal demo); `pnpm build` del monorepo OK. **Emails Resend operativos**: se envían por el proveedor activo en la confirmación de pago, en el envío (tracking) y en los cambios de estado del pedido — con plantillas HTML **fijas en código** (`lib/email`). La personalización por tipo/estado desde el admin está redactada como **HU-160** (refinada para incluir plantillas por estado del pedido y activar/desactivar por tipo).
- [x] **Simplificación de migraciones + coherencia del modelo (v20):** se **eliminaron los 29 archivos de migración numerados** (`1_*`…`29_*`), redundantes porque su contenido ya está consolidado en `01_schema.sql` (despliegue nuevo) y `upgrade.sql` (BD existente). Quedan **solo 2 archivos** de migración. Revisión de coherencia del modelo (24 tablas): se detectó y corrigió que `admin_config` y `processed_webhook_events` eran las **únicas 2 tablas sin RLS** → ahora **RLS habilitado en las 24** (solo-`service_role`, sin política pública). Sin FKs faltantes; las tablas sin FK son intencionales (config singletons, catálogos/logs, snapshots inmutables `orders.items`/`coupon_code`). Deuda técnica anotada y redactada como **HU-191** (E12): consolidar `shipping_profiles` en `customer_addresses` (fuente única de direcciones). Validado: 24/24 con RLS, paréntesis balanceados, sin REFERENCES/POLICY colgantes; database 160 tests verdes. Docs de migraciones actualizadas (README raíz, DEPLOYMENT, database/README, migrations/README) ✅
- [x] **Hardening transversal de webhooks (v20):** (1) **ventana de replay** en Wompi — rechaza `x-timestamp` fuera de ±5 min (`isWompiTimestampFresh`); (2) **firma `x-signature` de MercadoPago** (`verifyMercadoPagoSignature`, HMAC del manifest `id;request-id;ts`) con nuevo campo `mercadopago_webhook_secret` en admin, como defensa en profundidad sobre la re-consulta; (3) **idempotencia por id de evento** en las 4 pasarelas vía tabla `processed_webhook_events` (PK provider+event_id) y helper `markWebhookEventProcessed` (migración 29). Tests: web 316 + database 160 verdes; tsc web/admin limpio ✅
- [x] **Checkout UX (Tu Compra) — mensajes inline + confirmación con estado real:** los errores del checkout (documento faltante, banco no seleccionado, rechazo de Tu Compra) se muestran **inline** (banner rojo) en vez de `alert()`; en PSE demo, `estado OK` (banco aprobado, sin `urlBanco`) → confirmación, y `CodigoRespuesta 1` (RECHAZADAS) marca el pedido `rejected` (no queda pendiente huérfano) y responde **402 Payment Required** con `rejected:true` (no 502, que implicaría fallo de servidor) + mensaje limpio (sin prefijo técnico "00-"); el checkout lo muestra inline como rechazo y permite reintentar con otro banco/medio. La **página de confirmación** ahora refleja el **estado real** del pago tras el reconcile (aprobado / en proceso / rechazado, con acciones acordes y "Reintentar el pago") vía `GET /api/checkout/status` + polling; reemplaza el "¡Pedido confirmado!" fijo. Verde: web tsc + 302 tests ✅
- [x] **Hardening PCI DSS (HU-184…187):** la plataforma usa **flujo redirect/hosted** en todas las pasarelas (Wompi/MercadoPago/Tu Compra/Bold) — **no almacena, procesa ni transmite datos de tarjeta (CHD)** → alcance mínimo **SAQ A**. Se añadieron HU de gestión/rotación de llaves, logging seguro (sin datos sensibles), documentación de alcance SAQ A + evidencia (AOC de proveedores) e integridad de scripts de pago (PCI 4.0 6.4.3/11.6.1, si se pasa a widget embebido). MFA admin (HU-117) y auditoría (HU-146) forman parte del cumplimiento y se priorizan en la Ola 3. Total roadmap: **96 HU 🔲** (284 ítems) ✅
- [x] **v21 — Arquitectura multi-tenant + SaaS billing (E17 refinada, HU-192…194):** se **fijó la arquitectura de referencia** de la plataforma multi-tienda (fuente de verdad en `PRODUCT_BACKLOG.md §Detalle E17`). **Tenancy:** pooled single-DB + `tenant_id` + RLS (no schema/BD-por-tenant). **Identidad:** Stack Auth Teams = tenants (no FusionAuth). **Aislamiento (prima seguridad, cero fugas):** RLS como **frontera dura**. *(Estrategia validada contra doc oficial Hexclave↔Supabase, ago-2026:)* primaria = **JWT con claim `tenant_id`** (patrón oficial: `accessToken` callback + policies `auth.jwt() ->> 'tenant_id'`) usando el rol `authenticated`/`anon` sujeto a RLS; **GUC por request + rol dedicado** como fallback server-only (webhooks/cron/ISR); **service-role solo en el control plane** (omite RLS); los singletons de config (`store_config`/`payment_config`/`shipping_config`/`admin_config`/`themes`) pasan de `id=1` a **fila por tenant**. **Monorepo:** nuevo `apps/console` + packages `@merkiai/tenancy` (contexto GUC + entitlements) y `@merkiai/billing`. **Billing:** abstracción `BillingProvider` intercambiable (**PayZen · Mercado Pago Suscripciones · Stripe**) — HU-192; planes+suscripciones+ciclo de vida (`active/past_due/suspended`) — HU-193; **suspensión por impago** (dunning + gate de tenant, sin pérdida de datos) — HU-194. Se reescribieron HU-156 (tenant_id+RLS+rol dedicado), HU-171 (spike auth+RLS con decisión de referencia) y HU-173 (planes acoplados a billing). Solo planificación/arquitectura; sin cambios de código ✅
- [x] **v23 — Aislamiento de datos por plan (HU-200):** costura de **routing de BD** desde el inicio — columna `tenants.db_ref` + **connection factory** en `@merkiai/tenancy`. Tres niveles ligados al plan del cliente (gestionados por Merkiai desde el control plane): **compartido** (pooled + RLS, default), **schema dedicado** y **BD/proyecto dedicado** (proyecto Supabase propio o **Neon** a escala, con scale-to-zero). Como `tenant_id` está en todo, **promover** un tenant = exportar filas + cambiar `db_ref`, sin reescritura; RLS se mantiene como defensa en profundidad. Se acopla a HU-173 (`data_isolation` como entitlement de plan). **Separación de BD por plano:** Merkiai (control plane) corre sobre **su propio proyecto Supabase desde el inicio** (registro de tenants/planes/subscripciones/billing/`db_ref`/auditoría; service-role, sin RLS de tenant); **web y admin comparten** la BD del plano de tienda (misma data, separados por identidad, no por datos); el plano de tienda resuelve `host→tenant_id→db_ref` vía API/caché del control plane, sin tocar la BD de plataforma. Recomendación: no cambiar el default pooled+RLS del plano de tienda; solo promover por residencia/compliance o tenant *whale*. Total roadmap: **109 HU 🔲** (297 ítems) ✅
- [~] **v25 — HU-156 (cimientos multi-tenant) · EN PROGRESO:** (1) **Mapeo** de los **81 usos de `createServerClient`** (service-role) en `docs/HU-156-service-role-mapping.md`: 66 **TENANT** → `createTenantClient` (RLS), 12 **PRIVILEGED** (webhooks/reconcile/stock/idempotencia) → service-role acotado, 1 INFRA; con el patrón de **inyección de cliente** en las queries y la tabla de **envs por proyecto** (web/admin/control-plane). (2) **Migración `tenant_id` no disruptiva** (`supabase/migrations/e17/01_tenant_id.sql`): `tenant_id` NOT NULL DEFAULT tenant por defecto en 19 tablas tenant-scoped + índices y en 4 config singleton (conservando `CHECK id=1`); la app single-tenant sigue funcionando. (3) **BD de plataforma mínima** (`supabase/platform/01_platform_schema.sql`, proyecto Supabase propio): tabla `tenants` (status/plan/data_isolation/`db_ref`/`stack_team_id`) con RLS solo-service-role + seed del tenant por defecto. (4) **Inyección de cliente en las 17 queries** (`packages/database/src/queries/*`): cada función recibe `db: Db = createServerClient()` (default = service-role actual → **no disruptivo**); nuevo tipo `Db` en `client.ts`. Piloto en `products.ts` validado (168 tests verdes) y replicado a los 16 restantes vía codemod ts-morph (75 funciones; sin restos de `createServerClient()` interno). Los archivos PRIVILEGED (`lib/*-reconcile`, `stock`, `webhook-idempotency`) quedan en service-role. (5) **Cableado tenant client — Opción B (rol `anon`), preparado:** `@merkiai/tenancy` gana `mintTenantJwt({ role })` (`authenticated`|`anon`) + `createTenantClient<Schema>` genérico (13 tests verdes). **RLS de catálogo** en `e17/02_rls_catalog.sql` (staging): reemplaza las lecturas públicas amplias por `TO anon, authenticated USING (tenant_id = auth.jwt()->>'tenant_id')` en `categories`/`products`/`product_variants`. Helper **`apps/web/src/lib/tenant-db.ts`** (`getTenantDb`): cliente rol `anon` + JWT con `tenant_id` (tenant por defecto por ahora; host en HU-157). Dep `@merkiai/tenancy` añadida a `apps/web`. **Cableado** en `shop/page.tsx`: `getProducts(undefined, getTenantDb())`. **✅ VALIDADO EN LA APP REAL (staging):** `/shop` sirve el catálogo con **rol `anon` + JWT `tenant_id` bajo RLS** (ya no service-role). Primer flujo con aislamiento real end-to-end funcionando. Setup aplicado: `pnpm install` (`@merkiai/tenancy`), `SUPABASE_JWT_SECRET` en env, `e17/02_rls_catalog.sql` aplicado. **PDP cableada y ✅ VALIDADA** (`shop/[slug]` carga producto + relacionados bajo RLS anon); `getStoreConfig` sigue en service-role (singleton). Vitrina pública (catálogo + PDP) completa con aislamiento real por tenant. (6) **Análisis de integridad referencial** (`docs/HU-156-integridad-referencial-multitenant.md`): identificadas 2 fallas estructurales del multi-tenant — UNIQUE globales de negocio (bloquean 2º tenant) y FKs sin `tenant_id` (fuga cross-tenant); + `docs/modelo-datos-modulos-y-relaciones.md` (módulos + tablas-puente futuras + checklist obligatorio al crear tablas). (7) **`e17/03_unique_por_tenant.sql` — ✅ APLICADO Y VALIDADO** (staging): 14 UNIQUE globales → `(tenant_id, clave)` + `page_sections.section_key` + 4 singletons de config relajados a una fila por tenant (`UNIQUE(tenant_id)`). `/shop` + admin siguen OK. Falla de integridad #1 (bloqueante para 2º tenant) **cerrada**. (8) **`e17/04_fk_compuestas.sql` — ✅ APLICADO Y VALIDADO** (staging): `UNIQUE (id, tenant_id)` en 7 padres + **11 FK compuestas** `(col, tenant_id)` + **PK compuesta** `(tenant_id, key)` en `pages` y `media_assets`. Verificaciones de referencias cross-tenant en 0; `/shop`, PDP y admin OK. **Integridad referencial multi-tenant de HU-156 cerrada (fallas #1 y #2).** BD blindada para onboardear tenants. **Siguiente:** home/sitemap y flujos con sesión (rol `authenticated`); HU-157 (host); (#3 chequeo de huérfanos → con el control plane). **Pendiente:** convertir singletons a fila-por-tenant; RLS para el resto de tablas (orders/cart/…); resolución por host (HU-157).
- [~] **v26 — HU-157 (URLs por tenant) · EN PROGRESO:** `NEXT_PUBLIC_SITE_URL`/`ADMIN_URL` pasan a **fallback**; la URL es por tenant (subdominio/dominio propio). Análisis+inventario en `docs/HU-157-urls-por-tenant.md`. Hecho: helper `apps/web/src/lib/base-url.ts` (`baseUrlFromRequest`/`tenantBaseUrl`/`resolveBaseUrl`); **checkout cableado** (`webhookUrl`/`returnUrl` salen del host del tenant, no de env); columnas `subdomain`/`primary_domain` en `tenants` (`platform/02_tenant_domains.sql`). Seam de resolución: `apps/web/src/lib/tenant-context.ts` (`resolveTenant`/`TenantResolver`/`singleTenantResolver`) + `getRequestTenantDb()` en `tenant-db.ts` (comportamiento sin cambios: resuelve al tenant por defecto; páginas aún no lo usan para no romper ISR). **2 decisiones abiertas** (doc): (a) origen del lookup host→tenant — API del control plane vs path de lectura acotado; (b) renderizado dinámico vs ISR por host. Pendiente: cambiar páginas a `getRequestTenantDb`, y cablear SEO/emails/PaymentConfigForm/usuarios a la canónica del tenant.
- [~] **v27 — Control plane · primer ladrillo (HU-157/172) · EN PROGRESO:** decisión (1a) tomada — el lookup host→tenant va por **API interna del control plane** (no se le da a web acceso a la BD de plataforma). Creado **`apps/console`** (tercer app: package.json/next.config/tsconfig/vercel.json + layout/page mínimos) con el endpoint **`GET /api/internal/resolve-tenant?host=`** que lee `tenants` de la BD de plataforma (service-role) y devuelve `{tenantId, subdomain, primaryDomain, dbRef, plan, status}`, protegido por header `x-internal-secret` = `INTERNAL_API_SECRET`. En web: `controlPlaneResolver` (fetch al endpoint) enchufado en `resolveTenant()` — se activa si `CONTROL_PLANE_URL`+`INTERNAL_API_SECRET` están; si no, sigue el `singleTenantResolver` (sin cambios). Requiere `pnpm install` (nuevo workspace app + dep). **Siguiente:** desplegar el control-plane (Vercel) sobre el proyecto Supabase de plataforma; setear envs; activar la resolución real.
- [~] **v28 — HU-172 (gestión de tenants · API) · EN PROGRESO:** en `apps/console`, API que reemplaza el provisioning por SQL — `GET/POST /api/internal/tenants` (listar/crear con validación de subdominio y 409 en duplicado) y `PATCH /api/internal/tenants/[id]` (suspender/reactivar `status`, `plan`, `data_isolation`, `primary_domain`, `db_ref`). Helpers `platform-db.ts` (service-role plataforma) y `auth.ts` (`hasInternalSecret`). Protegido por `x-internal-secret` (**interino**; gate real = Stack Auth `platform:operate`, pendiente). Resolve-tenant refactorizado a los helpers. **✅ VALIDADO (staging):** listar → tenant por defecto; **crear** "Tienda Demo" (`subdomain: demo`) por API (ya no SQL); **suspender** (`status: suspended`) persistido. Provisioning de tenants operativo. **Consola UI + auth (HU-172, cierre):** `apps/console` gana **Stack Auth** (proyecto propio) — `stack.ts`, handler catch-all, `StackProvider` en layout, `middleware.ts` (sesión salvo `/handler` y `/api/internal`), `requirePlatformOperator()` (Project Permission **`platform:operate`**) y `/no-autorizado`. **Consola** (`app/page.tsx`, server component): lista tenants + formularios (crear / suspender-reactivar) vía **server actions** gated por `platform:operate` (reemplaza el secreto para la operación humana; el secreto queda solo para `/api/internal` máquina-a-máquina). Requiere: 3er proyecto Stack Auth (control-plane) + definir el permiso `platform:operate` + `pnpm install` (`@stackframe/stack`). **No verificado localmente.**
- [~] **v29 — HU-194 (gate de suspensión) · EN PROGRESO:** en `apps/web`, el middleware consulta el estado del tenant por host (vía la API interna del control plane, con caché 30 s) y si es `suspended`/`canceled` reescribe a **`/servicio-pausado`** (nueva página). **Solo activo si `CONTROL_PLANE_URL`+`INTERNAL_API_SECRET` están** (single-tenant sin cambios). Los webhooks de pago se excluyen del gate (deben seguir llegando). `ResolvedTenant` ahora incluye `status`. **Pendiente:** gate de solo-lectura fino (past_due con gracia), y bloqueo también en el admin del tenant.
- [~] **v30 — Login branded (console + admin) · EN PROGRESO:** componente reutilizable **`LoginScreen`** en `@merkiai/ui` (split-screen estilo referencia: panel de marca con titular/tarjetas-concepto/chips + card de login), **temeable por variables CSS** (marca Merkiai por defecto: verde) y **contenido 100% editable** por config (`LoginContent`/`LoginBrand`). Estilos inline (sin Tailwind) → funciona en console. **Console:** `/login` con Stack Auth (credencial + Google) + `lib/login-content.ts`; `signIn` → `/login`; middleware permite `/login`. **Admin:** `/login` (solo credencial, sin Google) + `lib/login-content.ts`; `signIn` → `/login`; `PUBLIC_PATHS` y middleware actualizados; sign-up sigue bloqueado. Requiere `pnpm install` (console suma `@merkiai/ui`). **No verificado localmente.** Naming propuesto: renombrar `apps/console` → `apps/console` (pendiente de confirmación).
- [~] **v31 — Rename `control-plane` → `console` + abstracción de identidad (HU-201) · EN PROGRESO:** (1) **Rename:** `apps/control-plane` → **`apps/console`** (`@merkiai/console`), `vercel.json`/filtros de build y referencias en docs actualizados; env `CONTROL_PLANE_URL` se conserva (concepto "control plane"). (2) **Abstracción de identidad (HU-201):** interfaz **`IdentityProvider`** en `@merkiai/tenancy/identity` (agnóstica: `getCurrentUser`/`hasPlatformPermission`/`hasOrgPermission` + provisioning `createOrg`/`addMember`/`grantOrgPermission`/`inviteMember`/`setOrgMetadata`); **adaptador Stack Auth** (`console/src/lib/identity.ts`, parametrizable por proyecto: sesión=console, provisioning=admin); `platform-auth` refactorizado a la interfaz. (3) **Doc `docs/identidad-abstraccion-y-migracion.md`:** qué se automatiza por **nuestra API** (crear org/tenant, miembros, permisos, metadata) vs **solo dashboard** de Stack Auth (definición de permisos, OAuth, MFA, plantillas, JWT keys, dominios), + estrategia de migración de proveedor. Backlog: **HU-201** agregada (E17 = 14; total **110 🔲 / 298 ítems**). No verificado localmente.
- [~] **v32 — Seguridad transversal / hardening (HU-202…206) · EN PROGRESO:** análisis de gaps de CORS/XSS/hardening → 5 HU nuevas en E14: **HU-202** CORS + endpoints internos (deny cross-origin, timing-safe, charset de host), **HU-203** CSP endurecida con nonce + sanitización XSS del contenido de tenant (`dangerouslySetInnerHTML` en blog/páginas/legales/descripciones), **HU-204** rate-limit distribuido + captcha/anti-brute-force, **HU-205** validación zod en bordes + CSRF + fix de inyección de filtros, **HU-206** rotación de secretos + SCA (Dependabot/Snyk) + validación de uploads. **Fix aplicado ya:** `resolve-tenant` valida el host con charset estricto (evita inyección en el filtro PostgREST `.or`). Backlog: E14 = 24; total **115 🔲 / 303 ítems**.
- [~] **v33 — Seguridad (adelanto HU-202/203) + HU-173 (planes/entitlements) · EN PROGRESO:** **HU-203 (parcial):** sanitización XSS del contenido de tenant en `markdownToHtml` (escape HTML + `href` seguro contra `javascript:`/`data:`) + `markdown.test.ts`. **HU-202 (parcial):** `hasInternalSecret` con **timing-safe** + rechazo de `Origin` (deny navegador) en los `/api/internal` del console. **HU-173 (parcial):** catálogo `plans` (features/limits) en BD de plataforma + FK `tenants.plan` + seed (`platform/03_plans.sql`); módulo puro `@merkiai/tenancy/entitlements` (`hasFeature`/`withinLimit`/`limitOf`, **16/16 tests** con isolation); `resolve-tenant` devuelve entitlements y `ResolvedTenant` los transporta. **Guard reusable de entitlements** en `apps/web/src/lib/entitlements.ts` (`tenantHasFeature` UI, `requireFeature`/`requireWithinLimit` → 403 API), **sin cablear a ninguna feature** (POS/dropshipping/IA no están construidos → se gatean cuando existan; límites products/users al iniciar onboarding). Fix: `db` sin definir en `resolve-tenant` corregido. Pendiente: gestión de planes en consola. No verificado en apps localmente (correr type-check web/console).
- [~] **v34 — HU-156 flujos con sesión (enabler + diseño RLS) · EN PROGRESO:** **enabler:** `getUserTenantDb(userId)` / `getRequestUserTenantDb(userId)` en `tenant-db.ts` → cliente rol **`authenticated`** (JWT con `sub`=usuario + `tenant_id`) para cuenta/checkout. **Diseño RLS** en `docs/HU-156-rls-flujos-con-sesion.md`: políticas por propiedad para `customers`/`customer_addresses`/`cart_items` (comprador ve solo lo suyo) y `orders` SELECT-only (crear/stock/webhooks siguen privilegiados); admin de tienda queda en vía privilegiada (HU-158). **No cableado a las páginas** (evita re-cablear checkout/cuenta a ciegas). **Requisito antes de cablear:** aplicar las políticas en staging + **validar aislamiento entre compradores** (A no ve datos de B).
- [x] **v36 — Base completa en verde para commit:** corrida completa en máquina: `pnpm -r type-check` verde (web/admin/console) y `pnpm -r test` **702 pruebas verdes** (database 168 · tenancy 16 · console 10 · web 339 · admin 169). **Fix:** 9 suites de rutas API del admin (`*.integration.test.ts`) fallaban al **cargar** con `ReferenceError: Request is not defined` — Next 16 referencia el global `Request`, ausente bajo jsdom. Se añadió el pragma `@jest-environment node` al docblock de las 9 (mismo patrón que ya usaban `cms`/`payment-status`). No fue regresión de código ni cambio de versión (`pnpm install`: *downloaded 0*); inconsistencia preexistente. Handlers de servidor ahora corren en entorno node (correcto). **Listo para commit.**
- [~] **v35 — Console listo para desplegar + probado (base para commit) · EN PROGRESO:** validación extraída a `console/src/lib/validation.ts` (`normalizeHost`/`isValidHost`/`isValidSubdomain`) y cableada en las rutas (elimina duplicación). **Jest añadido al console** (config + deps) con **10 pruebas verdes**: `validation.test.ts` (incl. rechazo de inyección PostgREST) + `auth.test.ts` (`hasInternalSecret`: secreto correcto/incorrecto/ausente + rechazo de `Origin`). Validado en sandbox aislado. **`apps/console/README.md`**: despliegue Vercel, envs, setup del 3er proyecto Stack Auth + permiso `platform:operate`, seguridad de `/api/internal`. **Antes de commit (tu máquina):** `pnpm install` + `pnpm -r type-check` + `pnpm -r test` verdes.
- [x] **v24 — Spike HU-171 (auth + RLS multi-tenant) · CERRADO ✅:** **PoC validado E2E contra Supabase real (2026-08-24)** — con RLS `tenant_id = auth.jwt()->>'tenant_id'` y JWT firmado con el **Legacy JWT secret** (HS256, `aud: authenticated`): tenant A ve solo sus filas, B solo la suya, sin token → `[]` (fail-closed), e insert cruzado → `42501` (RLS bloquea **lectura y escritura**). **Hallazgo:** el proyecto usa **JWT Signing Keys asimétricas**, pero el Legacy secret **sigue verificando** → camino A (HS256) viable hoy; **producción evaluará Third-Party Auth con Stack Auth (JWKS)** en HU-156. Entregables: **ADR-001** (cerrado) + paquete **`@merkiai/tenancy`** (12/12 tests, type-check limpio). Sigue **HU-156**. primer paso de implementación de E17 (Ola 0). Entregables: **ADR-001** (`docs/adr/ADR-001-auth-rls-multitenant.md`) con la decisión (Stack Auth Teams=tenants, RLS por **JWT-claim** primaria, GUC fallback, service-role solo control plane) y los **riesgos a cerrar en PoC** (firma HS256 vs asimétrica, `SET LOCAL` sobre el pooler). **PoC en `packages/@merkiai/tenancy`** (paquete nuevo, aislado, no cableado a producción): `mintTenantJwt`/`verifyTenantJwt` (claim `tenant_id`), `createTenantClient` (rol authenticated, sujeto a RLS) vs `createPlatformClient` (service-role, solo control plane), `resolveTenantByHost`/`assertTenantContext` (fail-closed), **connection factory** `resolveDbTarget` (routing por `db_ref`), y `poc/policies.example.sql` (RLS `auth.jwt()->>'tenant_id'`). **Pruebas:** `isolation.test.ts` — **12/12 verdes** (aislamiento cross-tenant, fail-closed sin JWT, rechazo de token forjado, routing por `db_ref`); type-check limpio. **Pendiente para cerrar el spike:** validar contra el proyecto Supabase real (aplicar la policy, probar E2E) y confirmar los riesgos del ADR. Deps nuevas: `jose` (firma JWT) en `@merkiai/tenancy` — correr `pnpm install` local.
- [x] **v22 — Preparación para extracción a servicios (HU-195…199):** decisión: *de momento se endurece el **monolito modular**, no se extraen microservicios*, pero se adoptan **desde ya** las prácticas que dejan lista la costura. Base verificada en el código: la lógica de dominio (`packages/database`) **no depende de Next**, los providers usan **interfaz+factory**, y los webhooks ya tienen firma+idempotencia; **falta** capa de eventos async (no existe hoy) y la BD es compartida por service-role. HU nuevas: **HU-195** bounded contexts + contratos zod (Ola 0), **HU-196** eventos de dominio + outbox (Ola 0; base de HU-136/165), **HU-197** propiedad de datos por dominio — un dominio solo escribe sus tablas (Ola 0), **HU-198** propagación del contexto de tenant por red — token firmado + re-fijar GUC (Ola 7), **HU-199** observabilidad distribuida — correlation id + OpenTelemetry (Ola 3, extiende HU-170). Total roadmap: **108 HU 🔲** (296 ítems) ✅

---

### E9 · Control de inventario y stock (HU-097/098/099)
- [x] **HU-097 — `allow_backorder` por producto** — migración 25 (`products.allow_backorder`) + checkbox en `ProductForm` + API/types ✅
- [x] **HU-098 — Movimiento de stock por estado de pago** — RPC atómicas `decrement_variant_stock`/`restore_variant_stock` (respetan backorder); helper compartido `applyStockForOrder`/`restoreStockForOrder` **idempotente** (flags `orders.stock_applied/stock_restored`); descuento cableado en los 4 webhooks + validación manual + reconcile Bold; **reposición** al cancelar/rechazar; **validación 409** en el checkout ✅
- [x] **HU-099 — Topes en el front** — PDP topa la cantidad al stock (deshabilita "+", "Agotado"); `clampQty` en el store del carrito; `CartItem` con `stock`/`allowBackorder` ✅
- [x] **Tests** — `stock.test.ts` (6: idempotencia + mapeo) + caso 409 en `checkout.integration` ✅
- [x] **HU-100 — Guardas de stock en todos los puntos de agregar** — quick-add en `/shop` (ShopClient) y home (FeaturedProducts) con guarda "Agotado" y propagación de `stock`/`allowBackorder`; botón "+" del carrito deshabilitado al máximo con aviso "Máximo N"; 4 tests de clamp en `cart.test.ts`. Suites verdes: **web 26/296, database 12/130, admin 12/165**; `tsc` limpio ✅

---

## 🔧 Pendiente de implementar

> **Estado (v22):** el **MVP está completo** (188 ✅ / 0 🟡). El trabajo pendiente es el **roadmap de expansión**: **109 HU 🔲** (HU-101…200) en las épicas E16 (IA), E17 (multi-tienda/control plane + SaaS billing + aislamiento por plan), E18 (multi-ubicación), la preparación para servicios (HU-195…199) y refuerzos de E2–E15. Está priorizado en **8 olas** con dependencias explícitas — ver `PRODUCT_BACKLOG.md §11.1 (Roadmap por olas)`. Ya no quedan 🟡 (se cerraron en v20).

### Completado recientemente (v3)
- [x] **Skydropx PRO completo** — OAuth2 client_credentials, cotización (quotations API), creación automática de guías post-pago (`createShipmentForOrder`), webhooks de tracking, pickups masivos desde admin ✅
- [x] **Página 404** personalizada con motivo de "taza vacía", links de recuperación ✅
- [x] **SEO técnico** — `sitemap.xml` dinámico (productos + blog), `robots.txt`, Open Graph + Twitter Card por producto y artículo ✅
- [x] **Edición de perfil** en `/account/profile` — nombre, teléfono, y gestión de direcciones guardadas ✅
- [x] **Email de confirmación de newsletter** — vía Resend, solo en primera suscripción ✅
- [x] **Modal de despacho masivo** — `PickupModal` en `/pedidos` para seleccionar órdenes con guía y programar recolección Skydropx ✅
- [x] **Blog Draft Mode** — botón "Previsualizar" en el editor activa cookie `__merkiai_draft` por 1h; artículo se renderiza con banner de borrador ✅

### Completado en v4
- [x] **Sub-navegación de Configuración** — sidebar con grupo expandible y 5 sub-rutas (General, Envíos, Pagos, Emails, Legal) ✅
- [x] **Modo mantenimiento** — toggle en admin → middleware Next.js redirige todo el sitio; caché 60s; página `/maintenance` con WhatsApp ✅
- [x] **Cupones de descuento** (C-06) — tabla `coupons`, `validateCoupon` (función pura), API checkout `/coupon`, campo con "Aplicar" en resumen del checkout, CRUD en `/cupones` del admin ✅
- [x] **Selección de transportadora** (S-04) — checkout muestra radio buttons con tarifas Skydropx disponibles; el cliente elige su opción de envío ✅
- [x] **Carrusel de testimonios** (SV-06) — CRUD en `/testimonios` del admin; carrusel automático con 3 cards en `/asesorias`; solo se muestra si hay testimonios activos ✅
- [x] **Sincronización carrito con BD** (C-07) — `cart_items` en Supabase; `CartSyncOnLogin` detecta login, fusiona localStorage + BD; mutations fire-and-forget hacia `/api/account/cart` ✅
- [x] **Vercel Analytics** (SEO-09) — `<Analytics />` condicional según `store_config.analytics_enabled`; toggle en `/configuracion/general` ✅
- [x] **next/image con Supabase CDN** (SEO-08) — `next.config.ts` con `remotePatterns` para `supabase.co`; imágenes optimizadas con `<Image>` ✅

### Completado en v5
- [x] **Secciones web configurables** — tabla `section_settings`; página `/secciones` en admin con toggles enable/disable; home respeta flags; fail-open (si no existe la tabla, todas las secciones se muestran) ✅
- [x] **Servicios dinámicos** — servicios separados de banners; CRUD inline en `/secciones`; `ServicesSection.tsx` renderiza N paneles desde BD; auto-detección de WhatsApp en CTA ✅
- [x] **Dashboard por rol** — `admin/super_admin`: ventas hoy/semana/mes, stock crítico, pedidos recientes, top productos; `vendedor`: conteo por estado, órdenes urgentes (rojo si >2 días), stock bajo; `gestor_tienda`: secciones activas, blog borradores, banners hero, testimonios inactivos, cupones por vencer ✅
- [x] **Sidebar con grupos colapsables** — NavGroup/NavLeaf/NavLeafWithSubs; grupos: Catálogo, Ventas, Contenido, Administración; visibility filtrada por rol; auto-expande grupo activo ✅
- [x] **Roles actualizados** — `secciones` añadida a AdminSection; vendedor acotado a ventas; gestor_tienda incluye secciones/testimonios/cupones/configuracion ✅
- [x] **Sistema de temas** — tabla `themes`; CSS custom properties en web (`rgb(var(--brand-xxx) / <alpha-value>)`) para soporte de opacidad; layout inyecta tema activo como `<style>` en `<head>`; fuentes opcionales Playfair Display e Inter pre-cargadas; editor en `/configuracion/temas` con color pickers, selectores de fuente y preview en vivo ✅
- [x] **Corrección de tipos Database** — `order_items`, `section_settings`, `themes` añadidas a `Database['public']['Tables']`; `increment_coupon_usage` añadida a `Functions`; ambas apps pasan `tsc --noEmit` sin errores ✅

### Completado en v6
- [x] **Gestión de newsletter desde admin** — página `/newsletter` bajo grupo Contenido (accessible para gestor_tienda+); pestaña suscriptores con tabla y exportación CSV; pestaña composición con formulario Markdown + broadcast vía Resend en lotes; confirmación antes de enviar ✅
- [x] **Conversor Markdown compartido** — `lib/markdown.ts` extraído a librería compartida; `/blog/[slug]` y `LegalPage.tsx` lo usan; corregida detección de títulos sin espacio tras `#` (ej. `##texto`) ✅
- [x] **`'newsletter'` en roles y sidebar** — `AdminSection` extendido; `ROLE_CONFIG` actualizado para super_admin, admin y gestor_tienda; ítem 📧 Newsletter añadido al grupo Contenido ✅

### Completado en v7
- [x] **Eliminación de valores hardcodeados en emails** — `lib/email.ts` reescrito: `storeName` y `siteUrl` vienen de `store_config` y `NEXT_PUBLIC_SITE_URL`; helper `buildEmailConfig()` actualizado en los 5 callers (wompi, mercadopago, skydropx, newsletter, welcome); `admin/newsletter/send/route.ts` corregido (footer ya no tiene `shop.example.com` hardcodeado) ✅
- [x] **Consolidación de migraciones** — reducidas de 19 a 13 archivos; 6 `ALTER TABLE` eliminados (6_email_config, 10_shipping_free_threshold, 11_legal_content, 12_social_links, 13_skydropx_origin_address, 14_maintenance_mode); sus columnas incorporadas en las migraciones CREATE TABLE originales (2 y 4); archivos renumerados sin colisiones; ambas apps pasan `tsc --noEmit` ✅

### Completado en v8
- [x] **Sistema de variantes genérico** — `variant_options JSONB` en `products` + `attributes JSONB` en `product_variants`; `lib/variant-utils.ts` con `getProductOptions`, `getVariantAttrs`, `getVariantLabel`, `isColorValue`, `COLOR_HEX` (20 colores); retrocompatible con campos legacy `roast`/`weight`/`grind`; `ShopClient` con swatches de color, "Desde $X", filtros dinámicos; `ProductDetail` con selector genérico ✅
- [x] **Dimensiones de envío en variantes** — `weight_kg`, `length_cm`, `width_cm`, `height_cm` en `product_variants`; migración 14 compacta las dos extensiones anteriores (15→14) ✅
- [x] **Comboboxes Colombia** — `lib/colombia-locations.ts` con 33 departamentos y ~400 municipios; `SearchableSelect` reutilizable (filtro, teclado, key por índice para evitar duplicados como "Buenaventura"); aplicado en checkout, admin/configuracion/envios y Mi Cuenta/perfil ✅
- [x] **Fix Skydropx 422** — eliminado `postal_code` de cotizaciones (Skydropx CO solo requiere area_level1+area_level2); `declared_amount` calculado desde el total del carrito (campo requerido por PRO API) ✅
- [x] **Selector de tarifa en checkout** — paso 2 separado: "Ver opciones de envío →" carga tarifas Skydropx y las muestra con carrier, servicio, días y precio; usuario elige antes de continuar; `shipping_rate` completo (`id`, `carrier_name`, `service_name`, `days`) persistido en `orders.carrier_name` y `orders.skydropx_rate_id` ✅
- [x] **Direcciones editables en Mi Cuenta** — `PATCH /api/account/addresses/[id]` (editar campos, manejar default exclusivo) + `DELETE /api/account/addresses/[id]`; `AddressesForm` reescrito con edición inline, botón Predeterminada y Eliminar ✅

### Completado en v9
- [x] **Tipos de variantes globales** — tabla `variant_types` (migración 15); CRUD completo en `/variantes` del admin; integrado en `ProductForm` con matriz cartesiana automática (Generar combinaciones → cada variante hereda `attributes` JSONB con los valores correctos); `AdminSidebar` + `roles.ts` actualizados; seed Tueste/Peso/Molienda ✅
- [x] **ProductForm reescrito** — selección de tipos globales, botón "Generar combinaciones" (producto cartesiano), preserva datos existentes al re-generar, campo `attributes` por variante; páginas de nuevo/editar reciben `variantTypes: VariantType[]` ✅
- [x] **ShopClient con sidebar de filtros** — layout sticky desktop + drawer mobile; `FilterPanel` compartido; checkboxes visuales; atributos dinámicos desde `variant_options` de los productos ✅
- [x] **Categorías con imagen y drag-to-reorder** — `CategoryFormModal` con `ImageUpload` (bucket `banners`), `uploadsInProgress` counter, `SavedCategory` exportada; `CategoriasClient` con HTML5 drag-and-drop, handle visual, thumbnail, actualización paralela vía PATCH ✅
- [x] **Auditoría DB e integridad referencial** — migración 16: FKs en `cart_items`, 6 índices de rendimiento, columna `orders.coupon_code` (bug fix: pérdida silenciosa de datos), RLS `variant_types`, índices compuestos para banners y blog_posts; `types.ts` y `queries/orders.ts` actualizados; ambas apps pasan `tsc --noEmit` ✅

### Completado en v10
- [x] **CMS de contenido y SEO por página** — migraciones 10–15: `trust_badges`, `pages`, `nav_items`, reestructuración de contenido (`page_sections` + `section_items` + `section_settings` unificados), `media_assets`, `store_seo`; editor unificado `/contenido` con árbol de navegación y editor de secciones; `/home` con editor de banners + section settings; rutas dinámicas `[slug]` con `generateMetadata()` leyendo `meta_title` y `meta_description` por página ✅
- [x] **Export/Import de contenido (JSON)** — `GET /api/admin/export` genera snapshot de 7 tablas (`store_config`, `nav_items`, `pages`, `page_sections`, `section_items`, `section_settings`, `banners`) con `Content-Disposition: attachment`; `POST /api/admin/import` restaura idempotentemente usando upsert con claves estables (`nav_key`, `section_key`, `key`); widget `DataTransferWidget` en `/configuracion/general`; respuesta 207 en errores parciales ✅
- [x] **Dashboard con stats reales** — `super_admin`/`admin` leen ventas hoy/semana/mes desde `orders`; `vendedor` ve conteo por estado y stock bajo; `gestor_tienda` ve banners home activos (filtro `page_key IS NULL`) ✅
- [x] **Fix sidebar naming** — "Contenido > Contenido" renombrado a "Contenido > Páginas" (icono 📄); doble anidado "Configuración > Configuración" eliminado promoviendo `NavLeafWithSubs` a nivel raíz del NAV array; tipo `NavNode` extendido; auto-expande cuando `pathname` comienza con `/configuracion` ✅
- [x] **Fix roles en /testimonios y /cupones** — guard hardcodeado `super_admin | admin` reemplazado por `canAccess()` de `lib/roles.ts`; `gestor_tienda` accede correctamente a ambas secciones ✅
- [x] **Búsqueda y paginación en /pedidos** — `searchParams: Promise<...>` (Next.js 16); búsqueda `.or()` por `order_number`, `customer_name`, `customer_email`; paginación 30/página con count exacto; componente `PedidosSearch` client debounced 400ms; `filterHref()` helper preserva params al navegar ✅
- [x] **Notas internas en pedidos** — migración `16_order_notes.sql` añade `internal_notes TEXT`; `PATCH /api/admin/orders/[id]/notes` (acceso vendedor+); componente `OrderNotes` con textarea auto-guardable y feedback "✓ Guardado" ✅
- [x] **Email de notificación al cambiar estado** — `apps/admin/src/lib/email.ts` con `sendShippingNotification` y `sendStatusNotification` (fetch directo a Resend, credenciales desde `store_config`); `PATCH /orders/[id]/status` dispara email automático para `shipped` (tracking + carrier), `delivered` y `cancelled`; fire-and-forget, nunca bloquea la respuesta ✅
- [x] **Búsqueda en /productos** — `searchParams: Promise<...>` en `ProductosPage`; filtro `.ilike('name', ...)` en Supabase; `ProductosSearch` client component debounced; empty state diferenciado con/sin búsqueda ✅
- [x] **Página de detalle de cliente** — `/clientes/[email]` con datos de perfil (si existe en `customers`), estadísticas (pedidos, total gastado, ticket promedio) e historial de pedidos con link a `/pedidos/[id]`; badge "Con cuenta" / "Invitado"; 404 si el email no existe ✅
- [x] **Filas clickeables en /clientes** — `Link` a `/clientes/[email]` con `encodeURIComponent`; hover suave; cursor pointer en toda la fila ✅
- [x] **Fix OrderStatusUpdater** — `router.refresh()` después de guardar actualiza timeline y chip de estado sin reload manual; indicador "✓ Actualizado" / "Error al guardar" por 2.5s ✅
- [x] **Next.js 16 compat** — todos los `params` y `searchParams` en page/route files tipados como `Promise<...>` y awaited ✅

### Completado en v11
- [x] **CMS Home — Parte A: imagen mobile en banners** — campo `image_url_mobile` en `BannerFormState`; estado `pickerTarget: 'desktop' | 'mobile'`; dos botones de picker separados (🖼️ desktop / 📱 mobile); `HomeClient.tsx` actualizado; export/import ya cubiertos por `select('*')` y upsert completo ✅
- [x] **CMS Home — Categorías dinámicas** — `getCategories()` añadida a `packages/database/src/queries/products.ts`; `Promise.all` en `page.tsx` ahora incluye las categorías; sección "Tienda" en home renderiza links dinámicos desde BD (`.slug` + `.name`) en lugar de array hardcodeado ✅
- [x] **CMS Home — Guard `enabled('historia')`** — sección Historia envuelta en `{enabled('historia') && ...}`, controlable desde el panel admin sin código ✅
- [x] **Metadata JSONB generalizada en `section_settings`** — migración 17: columna `metadata JSONB NULL`; seed de sección 'historia' con título, subtítulo y CTA como JSON; admin muestra editor inline para cualquier sección que tenga metadata; web lee con fallbacks a strings hardcodeados; patrón extensible a cualquier sección futura ✅
- [x] **Análisis arquitectural** — identificadas 5 categorías de deuda técnica: (1) rutas API zombie sin auth (`/api/admin/banners`), (2) directorios zombie `/banners/` y `/secciones/` con ~800 líneas de código muerto, (3) código duplicado entre apps (SearchableSelect, colombia-locations, email.ts, skydropx/auth.ts), (4) dos modelos CMS coexistentes (banners+section_settings vs pages+page_sections), (5) páginas legales /privacy y /terms fuera del CMS ✅

### Completado en v13 — Épica 10: CMS Unificado + Limpieza Arquitectural

- [x] **HU-052 — API CMS genérica** — `GET|POST|PATCH|DELETE /api/admin/cms/[resource]` maneja pages/sections/items; 4 endpoints legacy eliminados; 35 tests de integración ✅
- [x] **HU-053 — Migración 19: CMS unificado** — banners, section_settings y testimonials migrados a `page_sections` + `section_items` y tablas eliminadas. `section_items` extendido con `image_url_mobile`, `link_url`, `cta_text`, `metadata JSONB` ✅
- [x] **HU-054 — packages/database actualizado** — `types.ts` refleja el nuevo schema; `queries/home.ts` reescrito (`getWebHomeData` con `homeSections`); `queries/content.ts` actualizado (`updateSectionItem` con metadata como Json); archivos zombie `banners.ts`, `testimonials.ts`, `sections.ts` eliminados ✅
- [x] **HU-055 — apps/web actualizado** — home reescrito para leer secciones del CMS unificado; `HeroCarousel`, `ServicesSection`, `TestimonialsSection` reciben datos de `section_items` ✅
- [x] **HU-056/057 — apps/admin limpiado** — `ContenidoClient.tsx` extendido con editor por tipo (hero/services/testimonials/cards/faq); directorios zombie `/home`, `/testimonios` y sus API routes eliminados; `AdminSidebar` y `roles.ts` actualizados ✅
- [x] **Migración 20 — integridad y rendimiento** — NOT NULL en metadata, índices compuestos, índice GIN (JSONB), triggers `updated_at` en section_items/nav_items, CHECK constraint `section_type` con normalización de valores desconocidos a `'text'` ✅
- [x] **Esquema canónico compactado** — `01_schema.sql` unifica las 20 migraciones en un solo archivo limpio para despliegue desde cero; seeds separados `01_config.sql` y `02_content.sql` ✅
- [x] **Limpieza total de código muerto** — export/import routes, cms route, dashboard actualizados; JSDoc actualizado para eliminar referencias a tablas eliminadas ✅
- [x] **`tsc --noEmit --skipLibCheck` limpio** — sin errores en apps/web y apps/admin ✅
- [x] **Tests `home.test.ts` reescritos** — cubre la nueva firma `getWebHomeData()` con `homeSections` anidados, fail-open por query y mocks de Supabase actualizados ✅

### Completado en v12 — Épica 9: Arquitectura Limpia y Generalización CMS
- [x] **HU-044 — Eliminar rutas API zombie** — eliminadas `/api/admin/banners/` (sin auth guard, security hole), `/api/admin/sections/` y `/api/admin/pages/` (legacy, sin usar); ~800 líneas de código muerto removidas ✅
- [x] **HU-045 — Eliminar directorios zombie** — eliminados `/banners/`, `/secciones/` y `/paginas/` en apps/admin; las rutas en sidebar ya apuntaban a `/home` y `/contenido` ✅
- [x] **HU-046 — Consolidar `SearchableSelect` en `packages/ui`** — componente movido a `packages/ui/src/SearchableSelect.tsx`; admin usa `@merkiai/ui`; web mantiene copia local por limitación de Turbopack con `'use client'` en barrels ✅
- [x] **HU-047 — Consolidar `colombia-locations` en `packages/ui`** — `DEPARTMENTS`, `COLOMBIA_LOCATIONS`, `getCitiesForDepartment` movidos a `packages/ui/src/colombia-locations.ts`; eliminados de web, admin y database; tests actualizados al nuevo import ✅
- [x] **HU-048 — Consolidar `email.ts` compartido** — creado `packages/database/src/lib/email.ts` con `EmailConfig`, `sendShippingNotification` y `sendStatusNotification` (unificadas con firma flexible); `apps/admin/src/lib/email.ts` reducido a 2 líneas de re-export; `apps/web/src/lib/email.ts` conserva solo funciones web-only (`buildEmailConfig`, `sendOrderConfirmation`, `sendNewsletterConfirmation`, `sendWelcomeEmail`) e importa el resto de `@merkiai/database` ✅
- [x] **HU-049 — Migrar `/privacy` y `/terms` al CMS** — migración `18_legal_pages.sql`: seed idempotente de páginas + secciones de texto por defecto; rutas web actualizan a `getPageWithSections()` con fallback a `store_config` para compatibilidad retroactiva; `meta_title` y `meta_description` desde la página del CMS ✅
- [x] **HU-050 — Crear `getWebHomeData()`** — `packages/database/src/queries/home.ts` consolida las 6 queries paralelas del home; `apps/web/(public)/page.tsx` hace una sola llamada; nombre `getWebHomeData` evita colisión con `getHomeData` existente en `sections.ts` (admin editor) ✅
- [x] **`packages/ui` zero-dependency** — `cn.ts` reescrito en JS puro sin `clsx`/`tailwind-merge`; resuelve fallo de build por resolución estricta de pnpm en Vercel ✅
- [x] **`tsc --noEmit` limpio** — sin errores en apps/web y apps/admin después de todos los cambios ✅

### Completado en v14 — Favicon + Identidad corporativa del panel
- [x] **HU-058 — Favicon configurable** — migración `21_favicon_url.sql`; campo `favicon_url` en `store_config` + tipo; UI `ImageUpload` en `/configuracion/general` con preview inline; `generateMetadata` en `apps/web` inyecta `icons: { icon, shortcut }` y `<link rel="icon">` en `<head>` ✅
- [x] **HU-059 — Admin con identidad visual propia** — separación total de temas web y admin:
  - `admin_config` singleton (migración `22_admin_config.sql`): `accent_color` y `sidebar_color`; CHECK constraint; RLS; seed corporativo `#4F46E5` / `#0F172A`
  - `packages/database/src/queries/admin-config.ts`: `AdminConfig`, `getAdminConfig()`, `updateAdminConfig()`; registro en `types.ts`
  - `apps/admin/tailwind.config.ts` reescrito: colores `brand-*` como `rgb(var(--xxx) / <alpha-value>)`; nuevo token `brand-sidebar` para fondo del sidebar
  - `apps/admin/globals.css` reescrito: paleta corporativa slate/indigo por defecto en CSS vars
  - `apps/admin/layout.tsx`: `getAdminConfig()` → `hexToRgb`/`darkenHex` → `<style>` inyectado en `<head>` sobreescribe vars de globals.css
  - `AdminSidebar`: `bg-brand-sidebar` en `<aside>` (antes `bg-brand-primary`)
  - `roles.ts`: nueva `AdminSection` `'sistema'`; disponible para `super_admin` y `admin`
  - `AdminSidebar`: grupo Sistema ampliado con `/sistema/apariencia` (sección `'sistema'`)
  - `PATCH /api/admin/sistema`: guard super_admin/admin; upsert en `admin_config`
  - `/sistema/apariencia/page.tsx` + `AdminConfigForm.tsx`: color pickers, presets de paleta, vista previa en tiempo real
  - Export/Import actualizado a **v3**: incluye `admin_config` y `themes`; import maneja los 3 versiones; respuesta devuelve `version` del snapshot ✅

### Completado en v15 — Épica 15: Proveedores Intercambiables (Iteraciones 1-6)

#### Iteraciones 1-4 (sesión anterior)
- [x] **HU-082/083/084** — `ShippingProvider` + `SkydropxProvider` + `FixedPriceProvider` + factory; selector admin; checkout usa factory ✅
- [x] **HU-085/086/087** — `PaymentGateway` + `WompiGateway` + `MercadoPagoGateway` + factory; toggles admin; checkout solo muestra pasarelas activas ✅
- [x] **HU-088** — `TuCompraGateway` (MD5 signature, sandbox/prod); webhook `/api/webhooks/tucompra`; tipo `tucompra` en `payment_method` ✅
- [x] **HU-089/090** — `EmailProvider` + `ResendProvider` + factory `getEmailProvider()`; campo `email_provider` en `store_config`; selector en admin ✅
- [x] **HU-060** — Tracking en Mi Cuenta: `/account/orders/[id]` con timeline visual (pending→processing→shipped→delivered); tracking number, tabla de ítems, dirección, totales; verificación de propiedad por email ✅
- [x] **`/api/checkout/gateways`** — endpoint público que devuelve pasarelas activas; `CheckoutClient` las carga dinámicamente con fallback ✅

#### Iteración 5 — Polish
- [x] **HU-079 — Responsive admin** — `AdminSidebar` self-contained: hamburger fijo `top-0 left-0 z-50 md:hidden`, overlay backdrop, `<aside>` con `fixed md:relative` + `translate-x` animation; layout.tsx añade `pl-14 md:pl-0` al topbar ✅
- [x] **HU-080 — JSON-LD structured data** — schema `Product` (con offers, brand, images) en `/shop/[slug]`; schema `Article` (con author/publisher desde store_config) en `/blog/[slug]` ✅
- [x] **HU-081 — Fuentes adicionales en editor de temas** — añadidos `Lora` y `Merriweather` como display; `Montserrat` y `Nunito` como body; registrados en `FONT_DISPLAY_MAP`/`FONT_BODY_MAP` del web layout y en `TemasClient.tsx` ✅
- [x] **Tests newsletter** — `newsletter.integration.test.ts`: 10 casos para GET/POST con auth, validaciones, Resend mock ✅
- [x] **Tests admin-config/sistema** — `sistema.integration.test.ts` + `admin-config.test.ts`: cobertura de `getAdminConfig`, `updateAdminConfig`, PATCH /api/admin/sistema (auth, filtro falsy, propagación de errores) ✅

#### Iteración 6 — Infraestructura y Seguridad
- [x] **HU-061 — GitHub Actions CI/CD** — `.github/workflows/ci.yml`: TypeScript check → tests → deploy web+admin a Vercel en `main`; preview URL con comentario en PR para branches ✅
- [x] **HU-062 — Security hardening**:
  - `/api/admin/*` — todos protegidos con `getAdminUser()` (ya estaban) ✅
  - Wompi webhook — HMAC SHA256 con `eventsSecret` (ya implementado) ✅
  - MercadoPago webhook — pull model: el estado se consulta directamente a la API de MP con nuestro `access_token`, sin depender del cuerpo del webhook ✅
  - TuCompra webhook — MD5 signature verification ✅
  - **Rate limiting** en `/api/checkout` — 10 req/min por IP, respuesta 429 con `Retry-After` ✅
  - **CSP headers** en `apps/web/next.config.ts` — `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` ✅
  - **CSP headers** en `apps/admin/next.config.ts` — mismas directivas (sin Google Fonts, con Stack Auth domain) ✅

#### Épica 15 — Estado final
- [x] **HU-082 a HU-090** — todas completas ✅
- [x] `tsc --noEmit --skipLibCheck` pasa en `apps/web` y `apps/admin` ✅

> **⚠️ Corrección de validación (ago-2026):** al verificar contra el código bajo el criterio "código + cableado + pruebas definidas", se detectaron huecos de cobertura respecto a lo que este log daba por cerrado:
> - **Tu Compra (HU-088 / PRV-07):** `TuCompraGateway.ts` y su webhook existen y están cableados, pero **no hay ningún test** que los referencie (a diferencia de Wompi y MercadoPago, que sí tienen unit + integration). Estado real: 🟡 sin pruebas.
> - **Security hardening (HU-062):** los guards de auth y la verificación de firma de webhooks sí están probados, pero el **rate limiting** (`checkout/route.ts`) y los **CSP headers** (`next.config.ts`) no tienen pruebas que cubran el 429 ni los headers. Estado real: 🟡 parcial.
> - **HU-060 (tracking), HU-079 (responsive admin), HU-080 (JSON-LD), HU-081 (fuentes):** implementados y cableados pero sin pruebas. Estado real: 🟡.
> - **Resend / envío de emails (PRV-08):** confirmado con pruebas (`email.test.ts` en `packages/database` y `apps/admin`). ✅

---

## 🚀 Cómo continuar

### 1. Instalar dependencias
```bash
cd merkiai
pnpm install
```

### 2. Copiar fuentes
Copiar `typogama-ahsing.otf` y `Geeeki-Regular.otf` a:
- `apps/web/public/fonts/`
- `apps/admin/public/fonts/`

### 3. Configurar variables de entorno
```bash
cp .env.example apps/web/.env.local
cp .env.example apps/admin/.env.local
# Editar ambos archivos con las keys reales
```

### 4. Ejecutar schema y seeds en Supabase
Abrir el SQL Editor de Supabase (ver `migrations/README.md`).

**Despliegue NUEVO** (3 archivos):
```
packages/database/supabase/migrations/01_schema.sql   ← esquema canónico completo (único archivo)
packages/database/supabase/seeds/01_config.sql        ← tema, variantes, categorías, nav base
packages/database/supabase/seeds/02_content.sql       ← páginas, secciones e ítems CMS
```

**Actualizar una BD EXISTENTE** (1 archivo idempotente):
```
packages/database/supabase/migrations/upgrade.sql     ← consolida 21–25 (favicon, admin_config, proveedores, pasarela única + Bold, inventario)
```

> **Compactación (v16):** `01_schema.sql` es la **única fuente de verdad** del esquema (incluye todo hasta v16: `active_provider`+Bold, `email_provider`, inventario/RPC, etc.). Los archivos numerados `1_*`…`25_*` se conservan **solo como registro histórico** y no forman parte del flujo de despliegue. Para actualizar una instancia previa se usa un único `upgrade.sql`.

### 5. Levantar el proyecto
```bash
pnpm dev
# Web:   http://localhost:3000
# Admin: http://localhost:3001
```

---

## 📁 Estructura de archivos

```
merkiai/
├── apps/
│   ├── web/src/
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── layout.tsx          — async; carga store_config, pasa logoUrl+whatsapp
│   │   │   │   ├── page.tsx            — Home
│   │   │   │   ├── shop/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [slug]/page.tsx — force-dynamic; params: Promise<{slug}>
│   │   │   │   ├── blog/
│   │   │   │   ├── privacy/            — contenido desde el CMS
│   │   │   │   ├── terms/              — contenido desde el CMS
│   │   │   │   └── [slug]/             — páginas CMS dinámicas
│   │   │   ├── (account)/
│   │   │   │   └── layout.tsx          — async; carga store_config
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   │   └── confirmation/       — async; WhatsApp desde BD
│   │   │   ├── api/
│   │   │   │   ├── checkout/route.ts   — crea orden + URL pago Wompi/MP
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── skydropx/route.ts
│   │   │   │   │   ├── wompi/route.ts  — verifica firma, actualiza orden, email
│   │   │   │   │   └── mercadopago/route.ts — consulta MP API, actualiza orden, email
│   │   │   │   ├── newsletter/
│   │   │   │   └── shipping/rates/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx          — acepta prop logoUrl
│   │   │   │   └── Footer.tsx          — acepta props logoUrl y whatsapp
│   │   │   ├── home/
│   │   │   │   ├── HeroCarousel.tsx    — <picture> con imagen mobile/desktop
│   │   │   │   ├── FeaturedProducts.tsx
│   │   │   │   ├── ServicesSection.tsx — async; WhatsApp desde BD
│   │   │   │   └── NewsletterSection.tsx
│   │   │   ├── shop/
│   │   │   └── cart/
│   │   ├── store/cart.ts
│   │   └── lib/
│   │       ├── whatsapp.ts             — async; lee desde BD
│   │       ├── wompi.ts                — buildWompiCheckoutUrl, verifyWompiWebhook, mapWompiStatus
│   │       ├── mercadopago.ts          — createMercadoPagoPreference, getMercadoPagoPayment, etc.
│   │       ├── email.ts                — sendOrderConfirmation, sendShippingNotification, sendWelcomeEmail
│   │       ├── markdown.ts             — markdownToHtml(); h1/h2/h3, bold, italic, code, links, listas
│   │       └── skydropx/
│   │
│   └── admin/src/
│       ├── app/
│       │   ├── dashboard/
│       │   ├── productos/
│       │   │   ├── page.tsx            — listado
│       │   │   ├── nuevo/page.tsx      — formulario crear
│       │   │   ├── [id]/page.tsx       — formulario editar
│       │   │   └── ProductForm.tsx     — form compartido; upload tracking, validación cliente
│       │   ├── pedidos/
│       │   ├── banners/
│       │   ├── categorias/
│       │   ├── blog/
│       │   ├── clientes/
│       │   │   ├── page.tsx            — Server Component: fusiona Stack Auth users + orders por email
│       │   │   └── ClientesClient.tsx  — búsqueda, filtros con/sin cuenta, tabla con badge de tipo
│       │   ├── usuarios/
│       │   │   └── UsuariosClient.tsx  — invitar (siempre como miembro), cambiar rol, eliminar
│       │   ├── cupones/
│       │   ├── testimonios/
│       │   ├── secciones/
│       │   │   ├── page.tsx            — Server Component: carga section_settings + services banners
│       │   │   └── SeccionesClient.tsx — toggles enable/disable + CRUD inline de servicios
│       │   ├── newsletter/
│       │   │   ├── page.tsx            — Server Component: auth guard (gestor_tienda+) + carga suscriptores
│       │   │   └── NewsletterClient.tsx — tabs: Suscriptores (tabla + CSV) y Enviar campaña (Markdown + broadcast)
│       │   ├── configuracion/
│       │   │   ├── page.tsx            — redirige a /configuracion/general
│       │   │   ├── general/
│       │   │   │   └── page.tsx        — StoreConfigForm (WhatsApp, logo, nombre, email, redes, mantenimiento, analytics)
│       │   │   ├── envios/
│       │   │   │   └── page.tsx        — ShippingConfigForm (proveedor, tarifa fija, envío gratis, Skydropx, origen)
│       │   │   ├── pagos/
│       │   │   │   └── page.tsx        — PaymentConfigForm (Wompi + MP)
│       │   │   ├── emails/
│       │   │   │   └── page.tsx        — EmailConfigForm (Resend API key + from email)
│       │   │   ├── legal/
│       │   │   │   └── page.tsx        — LegalConfigForm (Markdown Términos + Privacidad)
│       │   │   └── temas/
│       │   │       ├── page.tsx        — Server Component: auth guard + getThemes()
│       │   │       └── TemasClient.tsx — ThemeCard, ThemeModal, ThemePreview; color pickers, font selectors, live preview
│       │   └── api/admin/
│       │       ├── products/           — POST (crea con imágenes), GET/PATCH/DELETE [id]
│       │       ├── orders/[id]/status/
│       │       ├── shipping/           — GET+PATCH con validación y secret masking
│       │       ├── config/             — GET+PATCH store_config + Resend; enmascara resend_api_key
│       │       ├── payment-config/     — GET+PATCH payment_config; secrets ••••last4 + has_* flags
│       │       ├── upload/             — POST/DELETE con auto-create de bucket
│       │       ├── sections/
│       │       │   └── [key]/route.ts  — PATCH: habilita/deshabilita sección
│       │       ├── themes/
│       │       │   ├── route.ts        — GET (listar) + POST (crear)
│       │       │   └── [id]/route.ts   — PATCH (editar o setActive) + DELETE (guarda activo/default)
│       │       └── newsletter/
│       │           ├── route.ts        — GET: lista newsletter_subscribers ordenados por fecha
│       │           └── send/route.ts   — POST: broadcast a suscriptores activos vía Resend (lotes 50); Markdown→HTML inline
│       └── components/
│           ├── layout/                 — AdminSidebar (grupos colapsables, rol-aware), AdminTopbar
│           └── ImageUpload.tsx         — drag & drop; onUploadStateChange callback
│
├── packages/
│   ├── ui/src/
│   ├── database/src/
│   │   ├── lib/
│   │   │   └── email.ts                — EmailConfig, sendShippingNotification, sendStatusNotification (compartidas)
│   │   ├── queries/
│   │   │   ├── products.ts             — getProducts, getProductBySlug, getFeaturedProducts, getBestSellingProducts, getCategories
│   │   │   ├── orders.ts
│   │   │   ├── blog.ts
│   │   │   ├── banners.ts
│   │   │   ├── shipping-config.ts
│   │   │   ├── store-config.ts         — getStoreConfig / updateStoreConfig
│   │   │   ├── coupons.ts              — getCoupons, validateCoupon (pura), CRUD, incrementCouponUsage
│   │   │   ├── testimonials.ts         — getTestimonials(onlyActive), CRUD
│   │   │   ├── cart.ts                 — getCartItems, upsertCartItem, removeCartItem, clearCart, replaceCart
│   │   │   ├── sections.ts             — getSectionSettings(), isSectionEnabled(), getHomeData() (admin editor)
│   │   │   ├── themes.ts               — getThemes(), getActiveTheme(), createTheme(), updateTheme(), setActiveTheme(), deleteTheme()
│   │   │   ├── content.ts              — getPages, getPageBySlug, getPageWithSections, CRUD pages/sections/items
│   │   │   ├── nav.ts                  — getNavItems, CRUD nav_items
│   │   │   ├── media.ts                — getMediaAssets, CRUD media_assets
│   │   │   └── home.ts                 — getWebHomeData() (consolida 6 queries paralelas del home público)
│   │   └── supabase/
│   │       ├── migrations/               — SOLO 2 archivos (los numerados 1_*…29_* se consolidaron)
│   │       │   ├── 01_schema.sql          — ★ esquema canónico completo (24 tablas, RLS 24/24, triggers, RPC)
│   │       │   └── upgrade.sql            — parche idempotente para BD existentes
│   │       └── seeds/                     — 01_config.sql (tema/variantes/categorías/nav) + 02_content.sql (CMS)
│   └── config/
│
├── .env.example
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 🔑 Variables de entorno necesarias

Ver `.env.example` en la raíz del proyecto para la lista completa.
Las más críticas para arrancar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> **Nota:** El número de WhatsApp ya **no** se configura via variable de entorno. Se gestiona desde el panel admin en `/configuracion` y se persiste en la tabla `store_config`.

---

*Proyecto Commerce CMS · Parquesoft TI · Julio 2026*
