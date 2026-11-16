# Detalle · E28 — Internacionalización y mercados (idiomas, regiones, moneda)

> **Épica:** **E28 · Internacionalización y mercados** (HU-460…468). **Diseño:** **ADR-011**. **Estado:** 🟡 en curso — HU-460 ✅ (v272) · HU-461 ✅ (v273) · HU-468 ✅ (v274) · HU-463 ✅ (v275) · HU-462 ✅ (v276) · HU-465 ✅ (v286) · HU-464 ✅ (v278, sin IA) · HU-466 ✅ (v285, cola larga cubierta) · HU-467 🟡 F1 (v287).
> **Absorbe:** HU-114a → HU-463 · HU-114b → HU-462 · HU-114c → HU-464 (E2).
> **Construye sobre:** listas de precio (HU-407), multi-dominio (HU-279), schema de bloques del Constructor, correos idempotentes (HU-162), entitlements (ADR-002), middleware con tenant + CSP (v270), IA (HU-118).
>
> **Principio:** tres capas con dueño distinto: **interfaz** (Merkiai, catálogos en el repo), **contenido** (comerciante, BD con fallback) y **formatos** (derivados del locale; la moneda sale del dato). **Mercado = país + moneda + precios + locales.** Locales iniciales: `es-CO`, `es-MX`, `es-ES`, `en-US`, **sin mercado prioritario**. Sin configuración adicional, la tienda se comporta exactamente como hoy.
>
> **Orden sugerido:** HU-460 → HU-461 → HU-468 (formatos) → HU-463 → HU-462 → HU-465 → HU-464 → HU-466 (progresiva) → HU-467 (cuando haya un mercado vendible en otra moneda).

---

## HU-460 — Fundaciones i18n: paquete, catálogos y formateadores · E28

> Como equipo de producto, quiero una base común de internacionalización para las tres apps, para que agregar un idioma sea agregar un archivo y no tocar código.

**Talla:** M · **Módulo:** `packages/i18n` (next-intl, catálogos ICU por idioma base + sobrescrituras regionales, espacios `common/web/admin/console/email`), `packages/i18n/format` (`formatMoney`, `formatDate`, `formatNumber`, `formatRelative`), script `pnpm i18n:check` en CI. **Estado:** ✅ en código (v272): paquete `@merkiai/i18n` sin dependencias externas (resolución en cascada + formateador ICU propio compatible con next-intl: interpolación, `plural` con `=N`/`#`, `select`, `number`, escapes); catálogos `es` (referencia), `en`, y regionales `es-CO`/`es-MX`/`es-ES`/`en-US` solo con diferencias; `matchAcceptLanguage` (solo sugerir); formateadores `formatMoney`/`formatMoneyCents`/`formatNumber`/`formatPercent`/`formatDate`/`formatDateTime`/`formatRelative` (default es-CO + COP = salida idéntica a la previa); **los ~88 formateos sueltos de web, admin, consola, database y ui migrados**; guard `scripts/check-i18n.mjs` en CI. La integración en componentes (proveedor/`useT`) llega con HU-462/465/466.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Resolución en cascada | Para `es-MX` se busca la clave en `es-MX`, luego en `es`, luego se devuelve la clave; nunca un texto vacío ni una excepción |
| AC-2 | Sobrescritura regional | `es-ES` muestra "cesta" y `es-CO`/`es-MX` "carrito", con una sola clave y sin duplicar el resto del catálogo |
| AC-3 | Plurales e interpolación | "1 producto" / "3 productos" y su equivalente en inglés con ICU, sin concatenar textos |
| AC-4 | Formatos centralizados | `formatMoney(120000, 'COP', 'en-US')` = `COP 120,000`; en `es-CO` = `$ 120.000`. Los usos sueltos de `toLocaleString`/`Intl` en las apps se reemplazan por los formateadores |
| AC-5 | Moneda del dato | Ningún formateador infiere la moneda desde el locale; la recibe siempre como parámetro |
| AC-6 | Guard de CI | `i18n:check` falla si una clave usada no existe en el catálogo base (`es`) y publica la cobertura por idioma |

## HU-461 — Idiomas y mercados por tienda + entitlements · E28

> Como comerciante, quiero elegir en qué idiomas y para qué países vende mi tienda, para llegar a clientes de otros mercados sin crear otra tienda.

**Talla:** M · **Módulo:** migración `markets` (`tenant_id`, nombre, países, moneda, lista de precios opcional, locales habilitados, locale por defecto, dominio opcional, activo) + `store_config.default_locale`; admin **Configuración → Idiomas y mercados**; entitlements `max_idiomas` (límite) y `markets` (feature) en el catálogo; RLS por tenant. **Estado:** ✅ en código (v273): migración `e17/78_markets.sql` (checks de locales soportados, idioma por defecto habilitado, ISO de moneda; índice único parcial = un solo mercado por defecto; RLS lectura pública por tenant + admin_all; **mercado "Colombia" sembrado para toda tienda existente**); capa `queries/markets.ts` con validación **pura del conjunto completo** (`validateMarkets`: un default activo, límite `max_idiomas` por locales distintos, feature `markets`, moneda base mientras no haya HU-467, dominios y claves únicos) + mercado virtual para tiendas sin filas; entitlements `markets` (default off) y `max_idiomas` (default **1**); admin **Configuración → Idiomas y mercados** (solo admin/super_admin) con tarjetas por mercado, editor, aviso de plan, eliminación con diálogo de marca y **auditoría** (`market.create/update/delete`). *Decisión:* el locale por defecto de la tienda se **deriva** del mercado por defecto (no se duplica en `store_config`).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Por defecto sin cambios | Una tienda existente queda con un mercado "Colombia" (`es-CO`, COP) y se ve exactamente igual que antes |
| AC-2 | Agregar idioma | El comerciante habilita `en-US` en un mercado; el storefront aún no lo publica hasta tener la ruta (HU-462) |
| AC-3 | Límite del plan | Si el plan permite 1 idioma, intentar habilitar un segundo muestra el aviso de mejora de plan y no lo guarda |
| AC-4 | Mercado sin multimoneda | Sin HU-467, un mercado nuevo hereda la moneda base de la tienda y la interfaz lo explica |
| AC-5 | Locale por defecto | Solo puede haber un locale por defecto por tienda y debe estar habilitado |
| AC-6 | Aislamiento | Un tenant no ve ni modifica los mercados de otro (RLS) |

## HU-462 — Rutas del storefront por locale + hreflang + sitemap · E28 *(ex HU-114b)*

> Como visitante y como buscador, quiero URLs propias por idioma y región con sus alternativas declaradas, para llegar a la versión correcta y que Google indexe cada una.

**Talla:** L · **Módulo:** middleware (resolución de locale tras el tenant: prefijo → dominio del mercado → por defecto; cabecera `x-locale`; cookie `merkiai_locale`), rutas `app/[locale]/…` con *rewrite* para el locale sin prefijo, `generateMetadata` con `alternates.languages`, sitemap con `xhtml:link`, `<html lang>`, selector de idioma, aviso de sugerencia. **Estado:** ✅ en código (v276): lógica pura `lib/locale-routing.ts` (prefijo en minúsculas, por defecto sin prefijo con 301, dominio de mercado sin prefijo, cookie `merkiai_locale` solo por elección explícita, sin redirección por `Accept-Language`); el middleware reescribe `/<locale>/…` a la ruta sin prefijo con `x-locale` (sin mover las rutas a `app/[locale]`), aplica las redirecciones de HU-113 conservando el prefijo y lee la configuración de `/api/locales` (cache 60 s por host). `alternatesFor` (canónica autorreferenciada + hreflang recíproco + `x-default`, **solo versiones traducidas** y **slug de cada idioma**) en portada, tienda, ficha, blog y páginas del CMS; `<html lang>` por petición; sitemap con una entrada por versión y sus `xhtml:link`; ficha y blog redirigen (301) al slug del idioma. Selector de idioma (pie) + aviso "¿Ver en …?" con el idioma del navegador (descartable) vía `/api/locale` (solo locales publicados, ruta relativa segura). Con un idioma no cambia nada. *Nota operativa:* un dominio ligado a un mercado debe estar también conectado como dominio de la tienda (HU-279).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Prefijo por locale | `/es-mx/producto/<slug>` sirve la versión `es-MX`; la ruta va en minúsculas; un locale no habilitado responde 404 |
| AC-2 | Por defecto sin prefijo | El locale por defecto se sirve en la URL actual; `/<locale-por-defecto>/…` responde con 301 a la URL sin prefijo |
| AC-3 | hreflang recíproco | Cada página declara `<link rel="alternate" hreflang="es-CO|es-MX|es-ES|en-US">` para las versiones **con contenido propio** + `x-default`; las versiones se enlazan entre sí |
| AC-4 | Canónica | Cada versión tiene canónica a sí misma (no al idioma por defecto) |
| AC-5 | Sitemap | El sitemap lista cada URL con sus alternas (`xhtml:link`) |
| AC-6 | Sin redirección automática | `Accept-Language` y país solo muestran un aviso "¿Ver en …?"; la elección se guarda en cookie; Googlebot recibe la URL pedida |
| AC-7 | Dominio por mercado | Si un mercado tiene dominio (HU-279), ese dominio sirve su locale sin prefijo y el `hreflang` apunta entre dominios |
| AC-8 | Compatibilidad | Con un solo locale no se emiten `hreflang` ni selector; la redirección 301 de HU-113 sigue funcionando por locale |
| AC-9 | Caché | La clave de caché (CDN/ISR) incluye el locale; no se sirve una versión de un idioma en otro |

## HU-463 — Contenido traducible con fallback · E28 *(ex HU-114a)*

> Como comerciante, quiero traducir productos, categorías, páginas, blog, menús y legales, para que cada versión de mi tienda esté en su idioma.

**Talla:** L · **Módulo:** migraciones `*_translations` (productos, variantes —nombre de opción—, categorías, colecciones, páginas, entradas de blog) con `(tenant_id, entity_id, locale, campos, slug, seo_title, seo_description)` y slug único por `(tenant, locale)`; campos `translatable` en el schema de bloques (mapa por locale en `jsonb`); capa de lectura por locale con fallback; correos y legales por idioma. **Estado:** ✅ en código (v275): migración `e17/80_content_translations.sql` (`product_translations`, `category_translations`, `blog_post_translations`, `page_translations` con slug único por tienda+idioma y RLS; `translations` JSONB en `page_sections`/`section_items`; `orders.locale`). Capa `queries/translations.ts`: fusión campo a campo con cascada **locale → idioma base → contenido por defecto** (un vacío nunca tapa), marca `_translated` para no anunciar en `hreflang` lo no traducido, lote por entidad, **cero consultas en el idioma por defecto**, resolución por **slug traducido**, `saveTranslation` (normaliza slug, borra si queda vacía). Bloques: `localizeSection` aplica solo campos de texto del schema (`translatable`; URLs/imágenes nunca) a la sección y sus ítems. Storefront: PDP (slug base o traducido), listado, relacionados, blog (detalle y lista) y **todas las secciones** (`SectionRenderer`) leen el locale de la petición (`x-locale`, que el middleware limpia para que solo él lo fije en HU-462). *Pendiente:* AC-6 correos por idioma va con HU-465 (ya existe `orders.locale`); variantes, colecciones dinámicas y categorías en facetas, con HU-462/464.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Traducción guardada | Un producto con traducción `en` muestra nombre, descripción, slug y SEO en inglés en `/en-us/…` |
| AC-2 | Fallback | Sin traducción `es-MX`, se usa `es`; sin `es`, el idioma por defecto; nunca un campo vacío |
| AC-3 | Sin traducción no se anuncia | Una página que cae por completo al idioma por defecto no se incluye en `hreflang` ni en el sitemap de ese locale |
| AC-4 | Slugs por idioma | `/en-us/product/t-shirt` y `/es-co/producto/camiseta` resuelven al mismo producto; cambiar un slug sugiere la redirección (HU-113) en ese locale |
| AC-5 | Bloques del Constructor | Un campo marcado como traducible admite un valor por idioma; un valor plano existente sigue funcionando como idioma por defecto (sin migrar datos) |
| AC-6 | Correos | Confirmación, envío, recordatorios de cartera y bienvenida salen en el locale del pedido o del cliente |
| AC-7 | Aislamiento | RLS por tenant en todas las tablas de traducción |

## HU-464 — Editor de traducciones en el admin · E28 *(ex HU-114c)*

> Como editor, quiero traducir el contenido idioma por idioma y ver qué falta, para gestionar los idiomas sin tocar datos crudos.

**Talla:** M · **Módulo:** admin (alternar idioma en los formularios de producto, categoría, página, blog y bloques; vista lado a lado con el idioma por defecto; tablero de completitud por idioma y tipo de contenido; importar/exportar CSV de traducciones; "traducir con IA" como borrador, HU-118). **Estado:** ✅ en código (v278) salvo AC-4: admin **Contenido → Traducciones** (sección `contenido`): selector de idioma (idiomas publicados sin el por defecto; si hay uno solo, lleva a Idiomas y mercados), **tarjetas de completitud por tipo** (productos, categorías, blog, páginas y **bloques del Constructor**, incluidos sus ítems), lista con estado Traducido/Parcial/Sin traducir, búsqueda y filtro de pendientes, **editor lado a lado** (original de solo lectura + traducción; slug traducido), **exportar/importar CSV** por idioma y tipo o todo (columnas por nombre, BOM, protección contra fórmulas, fusión parcial en bloques, filas inválidas reportadas) y **auditoría** (`translation.save/import/export`). Capa `translation-workspace.ts` con estado/cobertura puros. *Decisiones:* el editor es un espacio central (enlaces desde cada formulario quedan para después); la completitud solo cuenta campos con texto original y no cuenta el slug. *Pendiente:* AC-4 "traducir con IA" como borrador espera HU-118 (no hay proveedor de IA de texto en la plataforma).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Editar por idioma | En el formulario de un producto se cambia a `en` y se editan sus campos sin afectar el idioma por defecto |
| AC-2 | Completitud | Un tablero muestra el % traducido por idioma y lista lo pendiente con acceso directo |
| AC-3 | CSV | Exportar los textos de un idioma, traducirlos fuera e importarlos actualiza solo ese idioma |
| AC-4 | IA como borrador | "Traducir con IA" llena campos marcados como borrador; no se publican hasta que el editor los confirme |
| AC-5 | Permisos | Solo los roles con permiso de contenido editan traducciones; queda registro en la auditoría |

## HU-465 — Interfaz del storefront, checkout y correos en todos los locales · E28

> Como comprador, quiero que la tienda, el carrito, el checkout, mi cuenta y los correos estén en mi idioma, para comprar con confianza.

**Talla:** L · **Módulo:** extracción de textos de `apps/web` (componentes de tienda, checkout, cuenta, estados de pedido, errores, validaciones de formulario, pagar saldo) al catálogo `web.*`/`email.*`; traducciones `es`, sobrescrituras `es-CO`/`es-MX`/`es-ES` y `en`. **Estado:** 🟡 en código (v277): infraestructura (`I18nProvider` en el root layout con el locale de la petición, `useT`/`useFormat`/`useLocale` en cliente, `getT` en servidor) y **≈160 textos** extraídos al catálogo `web.*`/`email.*` con `en` al 100 % y `es-ES` (cesta, añadir, tramitar pedido, móvil): navegación, pie, carrito (cajón y página), **checkout completo** (pasos, dirección, envío, pago, resumen, cupones, gift card, errores), ficha de producto, catálogo (filtros, orden, paginación, tarjetas) y **correo de confirmación** en el idioma del pedido (`orders.locale`, validado contra los idiomas publicados). Precios con el formato del idioma (la moneda sigue siendo la del dato). PayZen abre su página en `es_ES`/`en_US`. **v279:** también **Mi cuenta** (inicio, menú lateral, pedidos y detalle con estados y línea de tiempo), **consulta de pedido como invitado**, **pagar saldo** (modalidades de cartera) y **blog** (lista y artículo) — con fechas y montos en el formato del idioma y la dirección del pedido en el formato de su país. **v286 (cierre):** **correos por idioma**. Las **plantillas editables** (pago, estados del pedido, cuenta) tienen texto de sistema en `es` y `en` y un override por idioma (`email_templates.locale` = idioma base; `es-CO`/`es-MX` comparten); se envían en el idioma del pedido (`orders.locale`) con `<html lang>`. El editor de **Plantillas de correo** muestra un selector de idioma cuando la tienda publica más de uno, con vista previa y prueba en ese idioma (datos de ejemplo genéricos y monto en la moneda de la tienda). Los **correos de sistema** (despacho con guía, pago confirmado manualmente, entregado/cancelado, reposición de stock, invitación VIP, boletín y bienvenida) salen del catálogo `email.system.*`: los de pedido en su idioma, reposición y VIP en el idioma por defecto de la tienda, boletín y bienvenida en el de la visita. Ejemplos genéricos (fuera el emoji de café del boletín, "Notas destacadas", slug "novedades"). *Fuera de alcance:* los textos de los medios propios de Tu Compra (Nequi/Daviplata/PSE, solo Colombia). MercadoPago/Wompi/Bold no aceptan idioma por API.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Recorrido completo | Navegar, agregar al carrito, pagar y ver el pedido en `en-US` no muestra textos en español de la interfaz |
| AC-2 | Variantes regionales | `es-ES` usa su vocabulario (cesta, móvil, código postal) y `es-MX`/`es-CO` el suyo |
| AC-3 | Validaciones | Los errores de formulario y del servidor salen en el locale activo |
| AC-4 | Formatos | Fechas, números y precios con los formateadores de HU-460 en todo el storefront |
| AC-5 | Pasarelas | Las pasarelas que lo soportan reciben el idioma (p. ej. `kr-language` de PayZen, `locale` de MercadoPago) |

## HU-466 — Admin y consola multi-idioma · E28

> Como comerciante u operador, quiero usar el panel en mi idioma, para trabajar cómodo aunque mi tienda venda en otro.

**Talla:** XL (progresiva) · **Módulo:** preferencia de idioma por usuario (perfil, luego cookie, luego `Accept-Language`, luego `es-CO`), selector en el menú de cuenta, extracción de textos del admin por módulos (navegación y configuración primero; luego catálogo, pedidos, operaciones, cartera) y de la consola (`es` + `en`). **Estado:** 🟡 F1 en código (v280): proveedor de idioma único en `@merkiai/ui` (`I18nProvider`/`useT`/`useFormat`/`useLocale`, compartido por web, admin y consola); **admin**: idioma por usuario (`profiles.ui_locale`, migración `e17/81_profile_ui_locale.sql`) → cookie → `Accept-Language` → es-CO, selector en el pie del menú (se aplica a todos los perfiles del correo, sin cambiar URLs), `<html lang>`, **menú lateral completo, roles, barra superior y aviso de mora** traducidos; **consola**: idioma es/en por operador (cookie), selector en la barra superior, menú y cierre de sesión traducidos. Módulos no extraídos siguen en español sin errores (AC-4). **F2 (v281):** módulo **Configuración** completo (general, dominio, idiomas y mercados, envíos, pagos, correos, plantillas de correo, legal, temas): 160+ textos. *Decisión:* para la cola larga del panel se usan **frases con clave = texto en español** (estilo gettext: `<T>…</T>` en JSX, `useTx()`/`getAdminTx()` para atributos y servidor) con diccionario `packages/i18n/src/phrases/admin.en.ts`; las pantallas de alto tráfico siguen con claves semánticas. `i18n:check` reporta la cobertura del diccionario (162/162). **F3 (v282):** **Catálogo** (productos, categorías, variantes, bundles, reseñas) y **Ventas** (pedidos, reportes, clientes, cupones, promociones, gift cards, ventas VIP) + **placeholders, títulos, `aria-label` y mensajes de error/éxito** de esos módulos y de Configuración (`useTx()`/`getAdminTx()` insertados por componente). **Placeholders y ejemplos revisados para ser genéricos** (fuera café/VPS: categoría "Novedades", nicho "moda", cupón "CÓDIGO", dirección "Calle y número", nombre del archivo de exportación, inicial del título en el blog). Diccionario: 418/418 frases. **F4 (v283):** **Operaciones** (tablero, inventario/kardex/transferencias, compras, producción, modificadores, listas de precio, cotizaciones), **Cartera** completa, **Dashboard**, **Plan y facturación**, **Onboarding**, Redirecciones, Usuarios, Ubicaciones, Auditoría, Correos, Archivos, Plantillas, Newsletter, Blog del admin, Traducciones, selección de tienda y acceso denegado — textos, placeholders y mensajes (ejemplos genéricos: "Nombre y apellido"). Diccionario: 770/770 frases. **F5 (v284):** componentes compartidos del admin (**Constructor**, editores de secciones y bloques, biblioteca de medios, colecciones, navegación, contenido, login) y **consola completa** (tenants, planes, presets, suscripciones, Merkiai Pagos, infraestructura, dominios, cobros, envíos) — textos, placeholders y mensajes; ejemplos revisados y genéricos (presets "moda", "cliente-acme"). Diccionario: **1097/1097 frases** (AC-5 cumplido). **F6 (v285):** **mensajes del servidor** en el idioma del usuario: `localizeMessages()` (i18n) traduce `error`/`message`/`warning`/`errors` de las respuestas; en el admin, las rutas `/api/admin/**` usan un `NextResponse` propio (`lib/api-response.ts`) que traduce el cuerpo, y las server actions del admin y de la consola devuelven sus resultados traducidos (`localizeForPanel`). El diccionario admite **patrones con huecos** (`"Documento {0} creado."`) para mensajes armados en runtime, incluidos los errores que vienen de `@merkiai/database`. Textos con variables del cliente pasados a `tx('… {name} …', { name })` con **plurales ICU** donde aplica (suscriptores, temas); ternarios (`Guardando…`/`Guardar`) y fragmentos mixtos de JSX traducidos. Diccionario: **1422/1422 frases** + ~470 mensajes de servidor. *Fuera de alcance:* errores técnicos de proveedores y logs internos (`[tenancy] …`, `Resend error …`) siguen en su idioma original; los placeholders de ejemplo en Markdown (blog, newsletter, legal) quedan en español.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Preferencia personal | Cada usuario elige su idioma; se recuerda entre sesiones y no afecta a otros usuarios ni a la tienda |
| AC-2 | Independiente de la tienda | Un admin en `en-US` gestiona una tienda cuyo idioma por defecto es `es-CO`; el contenido se sigue mostrando en el idioma que se edita |
| AC-3 | Sin URL por idioma | Las rutas del admin y la consola no cambian con el idioma |
| AC-4 | Migración progresiva | Los módulos aún no extraídos siguen en español sin errores; `i18n:check` reporta la cobertura por módulo |
| AC-5 | Consola | Navegación, tenants, planes, suscripciones y Merkiai Pagos disponibles en `es` y `en` |

## HU-467 — Multimoneda por mercado · E28

> Como comerciante, quiero vender en la moneda de cada mercado, para que el cliente vea y pague precios locales.

**Talla:** XL · **Módulo:** moneda por mercado con lista de precios por moneda (HU-407) o conversión con tasa fija configurable y redondeo; la moneda del pedido se fija al crearlo; validación de que la pasarela activa del mercado soporta la moneda; impuestos por país (tasa e inclusión en precio); cupones, gift cards y crédito en la moneda del pedido; reportes por moneda sin mezclar totales; cartera ya guarda `currency`. **Estado:** 🟡 **F1 (v287) — modelo, motor y configuración:** migración `e17/82_multicurrency.sql` (mercado: `fx_rate`, `price_rounding`, `tax_rate`, `tax_included`; `price_lists.currency`; `orders.currency`/`tax_amount`/`fx_rate`/`market_key`; `coupons.currency`, `gift_cards.currency`). Motor puro `market-pricing.ts`: precio local (lista del mercado → conversión con tasa fija y redondeo `auto`/múltiplos/`x99`/`x90`), impuesto incluido o agregado con los decimales de la moneda, monedas por pasarela (Wompi/Bold/Tu Compra/Merkiai Pagos: COP; MercadoPago y PayZen: varias según contrato). Feature de plan **`multi_currency`** (requiere `markets`). **Idiomas y mercados**: moneda editable con la feature, tasa y redondeo para mercados en otra moneda, impuesto del país (incluido o no); al guardar se valida que haya tasa o lista y que **la pasarela activa acepte la moneda** (AC-3). *Siguiente (F2):* resolver el mercado de la visita y mostrar precios locales en catálogo, ficha, carrito y checkout; checkout server-side en la moneda del mercado con IVA; moneda en pasarelas, correos y reportes; cupones de monto fijo y gift cards por moneda (AC-6).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Precio local | En el mercado México el catálogo muestra MXN según su lista de precios (o la conversión configurada con redondeo) |
| AC-2 | Moneda fija del pedido | Un pedido creado en MXN conserva su moneda en el pago, el reembolso, los correos y los reportes |
| AC-3 | Pasarela compatible | No se puede activar un mercado si ninguna pasarela de la tienda acepta su moneda; el checkout solo ofrece las compatibles |
| AC-4 | Impuestos por país | IVA 19 % (CO), 16 % (MX), 21 % (ES) según la configuración del mercado, incluido o no en el precio |
| AC-5 | Reportes | Los totales se agrupan por moneda; nunca se suman COP con MXN |
| AC-6 | Valor almacenado | Cupones de monto fijo, gift cards y crédito solo se aplican en su moneda |

## HU-468 — Localización regional: direcciones, documentos y teléfonos · E28

> Como comprador de otro país, quiero un formulario de dirección y datos que corresponda a mi país, para completar la compra sin campos que no me aplican.

**Talla:** M · **Módulo:** catálogo por país (campos y orden de la dirección, divisiones administrativas —se reutiliza `colombia-locations`; se agregan estados de México, provincias de España, estados de EE. UU.—, validación de código postal, tipos de documento: CC/NIT, RFC/CURP, NIF/NIE, SSN no; prefijo telefónico E.164); `formatAddress`/`formatPhone`; envíos (Skydropx) reciben la dirección normalizada. **Estado:** ✅ en código (v274): catálogo `@merkiai/i18n/regions` (CO con DIVIPOLA, 32 estados de MX, 52 provincias de ES, estados de EE. UU.; CP por país; teléfono a **E.164** y presentación nacional/internacional; documentos con dígito de control: **NIT (DIAN)**, CC/CE, RFC, CURP, **NIF/DNI y NIE** con letra; `formatAddress`/`formatAddressInline` en el orden de cada país; `validateAddress` compartido cliente/servidor). Migración `e17/79_regional_address.sql` (`customer_addresses.country/neighborhood/phone_e164`, `customers.document_type`). **Checkout y Mis direcciones**: selector de país solo si la tienda vende a más de uno (países de sus mercados), campos regionales fuera de CO, barrera server-side en `/api/checkout` y en la libreta de direcciones; el snapshot del pedido guarda `country`/`neighborhood`/`phone_e164`. Impresión con el formato del país en el detalle del pedido (admin) y en el correo de confirmación. Cartera → Clientes y aliados ofrece los **tipos de documento del país de la tienda** y valida el número. *Límites:* la transportadora integrada (Skydropx) cotiza solo en CO — fuera de CO rige la tarifa estándar; el checkout aún no pide documento (llega con facturación/HU-465).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Formulario por país | Al elegir México se piden estado, municipio y CP; en Colombia, departamento y municipio |
| AC-2 | Validación | El CP se valida con el patrón del país; el teléfono se guarda en E.164 |
| AC-3 | Documento | El tipo de documento ofrecido depende del país (CC/NIT, RFC, NIF/NIE) |
| AC-4 | Impresión | Direcciones en correos, guías y estados de cuenta con el formato del país |
| AC-5 | Compatibilidad | Las direcciones colombianas existentes se leen sin migrar |

---

## Definición de terminado (E28)

- Sin idiomas adicionales configurados, **ninguna diferencia visible** respecto a hoy (pruebas de regresión del storefront y del admin).
- Pruebas unitarias de resolución en cascada, fallback de contenido, formateadores y generación de `hreflang`/sitemap.
- E2E por locale del recorrido de compra (al cerrar HU-465).
- `i18n:check` en CI; cobertura publicada.
- Documentar en `PROGRESS.md` y actualizar `ENV-VARS-MATRIZ.md` si aparece alguna variable (no se esperan: la config es por tienda).
