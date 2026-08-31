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
>
> **Avance (storefront, validado en vivo con `prueba1`):** ✅ catálogo/`shop` tenant-scoped; ✅ `store_config`/nav/footer/tema por tenant (`(public)/layout` + root layout + `generateMetadata` reciben cliente RLS + `tenantId`); ✅ migración `e17/08` RLS anon-tenant de `themes`; ✅ redirect de host sin tenant → `merkiai.com` (middleware, apex excluido, fail-safe). **Bug encontrado y corregido:** la **home `/`** seguía mostrando contenido del default porque `getWebHomeData(db)` pasaba el cliente tenant-scoped SOLO a `page_sections`, pero `getFeaturedProducts`/`getBlogPosts`/`getBestSellingProducts`/`getCategories` se llamaban **sin `db`** → service-role + tenant por defecto. Corregido propagando `db` a todas las sub-queries. **Pendiente:** auditar el resto de páginas del storefront (`blog`, `[slug]`, PDP) para confirmar que ninguna lea con service-role/default; y el registro de comprador (customer) al tenant resuelto.

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
>
> **Decisión de acceso del dueño (aprobada).** El admin autoriza por `profiles.role` (BD del admin), **no** por el Team de Stack Auth. El dueño de un tenant debe ser **`super_admin` de SU tienda**, y como el admin **tiene prohibido crear/promover `super_admin`** (regla anti-escalada de `/usuarios`), el **único** origen válido del primer super_admin es el **control plane**: la consola llama al endpoint interno del admin `POST /api/internal/owners` (auth `x-internal-secret`) que crea el `profiles {super_admin, tenant_id}`. Ese endpoint es el único autorizado a asignar `super_admin`. **Seguridad — hecho:** (a) `middleware` del admin deja pasar `/api/internal` (antes redirigía el POST server-to-server a `/login` 307 → el `fetch` seguía el redirect y la consola lo tomaba como falso éxito: el `profiles` nunca se creaba, sin logs — **causa raíz de "Sin acceso"**); (b) **guard centralizado** `withInternalAuth` (fail-closed 500 si secreto ausente/<24, rate-limit por IP 429, secreto timing-safe 401) → ninguna ruta `/api/internal` puede olvidar el chequeo; (c) **logging** de intentos fallidos (401/429/500) para visibilidad; (d) helper de la consola con `redirect:'manual'` → un 3xx ya no se cuela como éxito. **Pendiente (config de despliegue):** allowlist de red / URL privada consola↔admin; secreto de aprovisionamiento dedicado y rotable (hoy comparte `INTERNAL_API_SECRET`). Defensa en profundidad presente: el `profiles` solo da acceso si además existe sesión real en el Stack Auth del admin.
>
> **Idempotencia del Team (mejora pendiente).** Stack Auth **permite display names repetidos**: `createTeam` siempre crea un Team nuevo con id distinto, así que cada intento de aprovisionar genera un Team duplicado (no son huérfanos de un borrado). El aprovisionamiento debe ser idempotente: si el tenant ya tiene `stack_team_id`, **reusarlo** en vez de crear; y al reintentar tras fallo parcial, no recrear. Registrar limpieza de los duplicados ya existentes desde el dashboard de Stack Auth.

> **HU-215 · Aprovisionamiento idempotente del Team (control plane).** *(E17; deriva de HU-209/HU-201.)* Stack Auth **permite display names repetidos**: `createTeam` siempre crea un Team nuevo con id distinto, así que reintentos/reprovisiones generan **Teams duplicados** (observado: 3 `prueba1`). Fuente de verdad = `tenants.stack_team_id`. AC: (a) `ensureTenantTeam` — si el tenant ya tiene `stack_team_id`, **reusarlo** (no crear); si no, crear y persistir; (b) `provisionTenant` usa `ensureTenantTeam` (no crea Team a ciegas); (c) el flujo "Invitar dueño" **repara** tenants parciales (sin Team): crea el Team la primera vez y reusa después → idempotente; (d) `deleteTenant` ya borra el Team best-effort (`deleteOrg`). Limpieza manual de los duplicados existentes desde el dashboard de Stack Auth. **Pequeña (S).** ✅ Implementada (a/b/c).

> **HU-216 · Auditoría anti service-role en el storefront (RLS por tenant obligatoria).** *(E17; deriva de HU-156/HU-207.)* En el plano de tienda, `createServerClient` (service-role) **omite RLS** → cualquier uso en lectura/escritura de datos de tenant es una **brecha cross-tenant**. Auditado todo `apps/web`. **Corregido:** `(account)/account/profile` y `checkout/page` leían `customers` con service-role → ahora `getRequestUserDb` (RLS `authenticated`); `api/auth/welcome` (registro del comprador) y `api/newsletter` no ponían `tenant_id` → ahora resuelven el tenant por host y escriben `customers`/`newsletter_subscribers` acotados (por eso el comprador caía al default). **Enforcement:** `apps/web/.eslintrc.json` con `no-restricted-imports` que **prohíbe `createServerClient` en el storefront** (error de lint), con **allowlist** solo para rutas máquina-a-máquina sin sesión (webhooks/reconcile/checkout/shipping). **Pendiente (allowlisted, deuda):** esas rutas siguen usando service-role legítimamente (no hay sesión/host), pero deben **acotar por el `tenant_id` de la entidad que procesan** — en particular los **webhooks/reconcile** leen `payment_config`/`store_config` **sin tenant** → cargan la config del **default** (llaves de pasarela equivocadas para tenants no-default): hay que resolver `order.tenant_id` y leer la config de ESE tenant. También `api/checkout` `saveAddressForUser` debe setear `tenant_id`. **Media (M).**

> **HU-217 · StoreShell + contexto de tienda + base para Templates.** *(E17/E2; deriva de HU-207/157.)* **Problema:** cada grupo de ruta del storefront (`(public)`, `cart`, `checkout`, `(account)`) tiene su propio `layout.tsx` que **re-resuelve** tenant/config/nav/footer y **re-monta** Navbar/Footer → duplicación (causó que `cart`/`checkout`/`(account)` mostraran la marca del **default**) e inconsistencia. **Objetivo:** base limpia, uniforme, replicable y escalable para el futuro sistema de **Templates por tenant** (presets que cambian totalmente la disposición/visual reutilizando las abstracciones). **Alcance (por pasos):** **(1) `getStoreContext()`** request-scoped y **cacheado** (`React.cache`): resuelve UNA vez `{ tenantId, db, config, nav, footer, theme, entitlements }` — única fuente de verdad del tenant activo. **(2) `<StoreShell variant>`** componible que consume el contexto y pinta Navbar/Footer/tema; los 4 layouts se vuelven delgados (`checkout`=minimal, `account`=+sidebar) y **ninguno vuelve a leer config** → tenant-scoping en un solo punto (imposible de olvidar; cierra la fuga de `/cart`). **(3) Guard/lint** que obliga a que toda lectura del storefront pase por un `db` con tenant (extiende el `no-restricted-imports` de HU-216). **(4) Registry de bloques** (`{ tipo → componente }`) sobre `page_sections`/`section_items`: la página se renderiza resolviendo template → secciones → bloque; **agregar un template = preset + variantes, sin tocar rutas**. **(5) Campo `template`** en el tenant (aunque hoy solo exista "default") para dejar el *seam* listo. **Regla:** separar **datos** (repositorio/query-functions + contexto, reutilizables por toda tienda) de **presentación** (shell + templates + registry, intercambiable). **M** (1+2+3 chico; 4+5 base del motor de templates, incremental). Arranca por **1+2+3**.

> **HU-218 · Contrato único de bloques + Constructor de páginas schema-driven.** *(E2/E13; deriva de HU-217 y HU-044…057 CMS unificado.)* **Problema:** los campos configurables de cada sección viven hoy en **tres sitios que no se hablan** — columnas tipadas de `page_sections` (`title/subtitle/body/cta/image`), `settings` JSONB ad-hoc (Historia lo lee), y `section_items` repetibles (Hero lo lee) — y **cada bloque React decide qué leer** mientras **el formulario del admin lo hardcodea aparte**. Agregar o adaptar un bloque obliga a tocar SQL + bloque web + form admin + validación (4 lugares) → incoherencia web↔admin y fricción. Newsletter y blog además son ambiguos: son *función* (Resend/suscriptores, CRUD de posts) **y** *bloque* (form / preview) a la vez. **Objetivo:** un **modelo mental de 3 capas** — **Marco** (StoreShell: logo/menú/footer/tema), **Páginas** (bloques sobre `page_sections`), **Funciones** (pagos/emails/envíos) — y un **contrato único por bloque** que sea fuente de verdad para render web, editor admin y validación. **Alcance (por pasos):** **(1) `blockSchemas`** declarativo (módulo compartido, p.ej. `@merkiai/blocks` o `database/src/blocks`): una definición por `section_type` con sus campos (label, tipo de input, repetible, defaults, fuente de datos); de ahí se **derivan** `DEFAULT_BLOCKS`/`HOME_LAYOUTS` de HU-217. **(2) Normalizar** cada bloque web para leer del `section` con forma del schema (unifica Historia/Hero/Newsletter al mismo contrato). **(3) `<SectionEditor>` genérico** en el admin que **auto-genera el formulario** desde el schema — un editor para la home y para cualquier página (“Constructor de páginas”: lista secciones, reordena, toggle `enabled`, edita); migrar `/api/admin/home` y `/cms/[resource]` a él. **(4) Zod** derivado del mismo schema en la API del admin. **(5) Templates:** override de layout + defaults por bloque, y **selector de template en el admin** (cierra el pendiente de HU-217). **Regla de consistencia:** columnas comunes = base compartida; todo lo específico del tipo va en `settings`, siempre declarado en el schema. Newsletter/blog: el **bloque** solo lleva copy/params de display; la **función** (Resend/suscriptores/CRUD) se queda en su área. **M** (incremental; 1+2 base, 3+4 UX admin, 5 motor de templates). Arranca por **1**.

> **Cluster “Templates parametrizables + diseño por IA” (HU-219…226).** *(E3/E13/E16; se apoya en HU-217/218 y en el contrato `blockSchemas`.)* **Visión:** el Constructor de páginas (HU-218) es la base sobre la que se **crean Templates que visten la Web**; todo parametrizable para que un asistente de IA, desde prompts/conversación, genere diseños adaptados y personalizados (**feature de plan, se cobra**), y para armar **templates de arranque por nicho** que un cliente nuevo elige y aplica en el onboarding. Estas 8 HU llenan huecos NO cubiertos por las plantillas existentes (HU-121 theme/variantes, HU-122a/b/c disposición, HU-128 preview/publish, HU-129 paquetes, HU-143 apariencia por chat, HU-144 imágenes IA, HU-169 onboarding):
>
> - **HU-219 · Constructor de páginas visual (schema-driven).** *(E13; productiza HU-218 pasos 3-5; toca “drag-and-drop de secciones” de E13.)* Editor visual para **componer cualquier página** desde bloques del `blockSchemas`: agregar/quitar/reordenar/toggle, editar con formulario auto-generado, y **vista previa en vivo**. A diferencia de HU-122 (variantes declaradas por dev), aquí el usuario compone la página. **M/L.**
> - **HU-220 · Template como preset de composición reutilizable.** *(E3/E2; refina/supera HU-121 en el modelo schema-driven.)* Un Template = **layout por página** (orden de bloques) + **defaults/contenido de bloque** + **binding de theme** + **etiqueta de nicho**, guardado como entidad reusable con CRUD y **“aplicar a esta tienda”** (siembra `pages`/`page_sections`). HU-121 modela template≈theme+variantes; esto añade la **composición de páginas** como preset. **L.**
> - **HU-221 · Templates de arranque por nicho + selección en onboarding.** *(E13/E17; extiende HU-169 + HU-220.)* Catálogo curado de templates por nicho (café, moda, servicios…) y un paso en el onboarding para **elegir uno y sembrar la tienda** en un clic. HU-169 cubre marca/pago/envío/dominio/legales, no la elección de diseño de arranque. **M.**
> - **HU-222 · Contrato de salida estructurada + validación/sanitización de diseños IA (enabler de seguridad).** *(E16/E2; depende de HU-218.4 zod.)* Toda salida de IA se emite **estructurada al `blockSchemas`**, se valida con zod y se **sanitiza** (sin HTML/script arbitrario; tokens de theme acotados), **fail-closed** (diseño inválido no se aplica). Puente que hace segura la generación por IA. **M.**
> - **HU-223 · Generación de copy por bloque/página con IA.** *(E16; depende de HU-135 proveedor IA + HU-222.)* La IA redacta title/subtitle/body/CTA hacia `page_sections` respetando el schema, el tono y la marca. Alimenta al generador integral. **M.**
> - **HU-224 · Generador de diseño integral por IA conversacional (“vestir la web”).** *(E16; monetizado; orquesta HU-143 apariencia + HU-144 imágenes + HU-223 copy + HU-222 validación.)* Desde una conversación/brief, la IA **compone el sitio completo** (elige layout, genera copy y theme, ± imágenes) y produce un **Template en borrador** para previsualizar (HU-128) antes de publicar. HU-143 solo cambia apariencia; esto compone páginas+contenido. **XL (dividir).** Pieza central del cobro.
> - **HU-225 · Entitlement y medición del generador de diseño IA.** *(E17; depende de entitlements/billing HU-172/173/192-194.)* Flag por plan, **cupos de generaciones** y gating + upsell del feature “diseño por IA”. **M.**
> - **HU-226 · Historial de versiones y rollback de páginas/templates.** *(E2/E13; complementa HU-128; realiza el roadmap “historial de versiones”.)* Snapshots por publicación y **restaurar** una versión anterior — imprescindible cuando la IA muta el diseño. **M.**

> **Cluster “Endurecimiento de aislamiento” (HU-227…230).** *(E14/E17; deriva de la auditoría post-HU-216/158.)* La RLS por tenant es la frontera dura para clientes `anon`/`authenticated`, pero quedan **islas de service-role** (webhooks/reconcile/checkout/welcome/newsletter/shipments/upload/auth-lookup/owners) sin red de seguridad RLS, más riesgos de custodia de secretos y de resolución por host. Hallazgos y trabajo:
>
> - **HU-227 · Endurecer las islas de service-role con JWT de máquina + RLS.** *(E14/E17.)* Reemplazar service-role por un **JWT de tenant de máquina** (rol `authenticated` o rol dedicado + claim de servicio) en las islas que YA conocen el tenant (por `order.tenant_id` u host), de modo que la **RLS sea red de seguridad** aunque se olvide un `.eq('tenant_id')`. Queda como único borde service-role/`security definer` el **bootstrap** que resuelve el tenant (lookup mínimo host/gateway_ref→tenant_id, idealmente función `security definer` que solo devuelve `tenant_id`). Incluye **RLS sobre `storage.objects`** por prefijo de path (llevar el aislamiento de Storage al motor). Además: **guard con dientes en runtime** (wrapper que exija `tenant_id` en las islas) que complemente el `no-restricted-imports` (lint) de HU-216, y extenderlo a `apps/admin`. **M/L.**
> - **HU-228 · Custodia y rotación de secretos.** *(E14.)* `SUPABASE_JWT_SECRET` permite firmar cualquier `tenant_id`+`is_admin` → suplantación total: documentar custodia, rotación y alcance mínimo. **Secreto interno por app** (hoy `INTERNAL_API_SECRET` es compartido entre las 3 apps → un leak crea owners/super_admin). Auditar dónde se leen los secretos. **S/M.**
> - **HU-229 · Cerrar el fail-open de la resolución por host.** *(E17.)* `resolveTenant()` cae al tenant **por defecto** si el control-plane falla y un `Host` forjado puede apuntar escrituras a otro tenant (acotado por RLS a los datos de ese tenant, pero indeseable). Antes de multi-tenant real: **fail-closed** (rechazar si el host no resuelve), verificación de host/allowlist de dominios, y no cachear el fallback. **M.**
> - **HU-230 · StorageProvider intercambiable + separación por tenant (el tipo de storage afecta el plan).** *(E14/E17.)* Abstracción `StorageProvider` (Supabase/S3/R2/GCS) análoga a Payment/Email; **toda clave lleva `tenantId` como prefijo de path** y `ownsKey()` bloquea el borrado cruzado; `upload` confina el service-role al borde. **Base implementada** (provider Supabase + `getStorageProvider()` + upload/DELETE con auth y guard). **Pendiente:** selección de proveedor/credenciales **por plan** (bucket compartido vs propio), migración de assets legacy al path por tenant, y RLS de `storage.objects` (comparte con HU-227). **M.**

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
