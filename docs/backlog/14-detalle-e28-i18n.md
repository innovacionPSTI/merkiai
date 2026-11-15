# Detalle · E28 — Internacionalización y mercados (idiomas, regiones, moneda)

> **Épica:** **E28 · Internacionalización y mercados** (HU-460…468). **Diseño:** **ADR-011**. **Estado:** 🟡 en curso — HU-460 ✅ (v272).
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

**Talla:** M · **Módulo:** migración `markets` (`tenant_id`, nombre, países, moneda, lista de precios opcional, locales habilitados, locale por defecto, dominio opcional, activo) + `store_config.default_locale`; admin **Configuración → Idiomas y mercados**; entitlements `max_idiomas` (límite) y `markets` (feature) en el catálogo; RLS por tenant. **Estado:** 🔲

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

**Talla:** L · **Módulo:** middleware (resolución de locale tras el tenant: prefijo → dominio del mercado → por defecto; cabecera `x-locale`; cookie `merkiai_locale`), rutas `app/[locale]/…` con *rewrite* para el locale sin prefijo, `generateMetadata` con `alternates.languages`, sitemap con `xhtml:link`, `<html lang>`, selector de idioma, aviso de sugerencia. **Estado:** 🔲

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

**Talla:** L · **Módulo:** migraciones `*_translations` (productos, variantes —nombre de opción—, categorías, colecciones, páginas, entradas de blog) con `(tenant_id, entity_id, locale, campos, slug, seo_title, seo_description)` y slug único por `(tenant, locale)`; campos `translatable` en el schema de bloques (mapa por locale en `jsonb`); capa de lectura por locale con fallback; correos y legales por idioma. **Estado:** 🔲

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

**Talla:** M · **Módulo:** admin (alternar idioma en los formularios de producto, categoría, página, blog y bloques; vista lado a lado con el idioma por defecto; tablero de completitud por idioma y tipo de contenido; importar/exportar CSV de traducciones; "traducir con IA" como borrador, HU-118). **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Editar por idioma | En el formulario de un producto se cambia a `en` y se editan sus campos sin afectar el idioma por defecto |
| AC-2 | Completitud | Un tablero muestra el % traducido por idioma y lista lo pendiente con acceso directo |
| AC-3 | CSV | Exportar los textos de un idioma, traducirlos fuera e importarlos actualiza solo ese idioma |
| AC-4 | IA como borrador | "Traducir con IA" llena campos marcados como borrador; no se publican hasta que el editor los confirme |
| AC-5 | Permisos | Solo los roles con permiso de contenido editan traducciones; queda registro en la auditoría |

## HU-465 — Interfaz del storefront, checkout y correos en todos los locales · E28

> Como comprador, quiero que la tienda, el carrito, el checkout, mi cuenta y los correos estén en mi idioma, para comprar con confianza.

**Talla:** L · **Módulo:** extracción de textos de `apps/web` (componentes de tienda, checkout, cuenta, estados de pedido, errores, validaciones de formulario, pagar saldo) al catálogo `web.*`/`email.*`; traducciones `es`, sobrescrituras `es-CO`/`es-MX`/`es-ES` y `en`. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Recorrido completo | Navegar, agregar al carrito, pagar y ver el pedido en `en-US` no muestra textos en español de la interfaz |
| AC-2 | Variantes regionales | `es-ES` usa su vocabulario (cesta, móvil, código postal) y `es-MX`/`es-CO` el suyo |
| AC-3 | Validaciones | Los errores de formulario y del servidor salen en el locale activo |
| AC-4 | Formatos | Fechas, números y precios con los formateadores de HU-460 en todo el storefront |
| AC-5 | Pasarelas | Las pasarelas que lo soportan reciben el idioma (p. ej. `kr-language` de PayZen, `locale` de MercadoPago) |

## HU-466 — Admin y consola multi-idioma · E28

> Como comerciante u operador, quiero usar el panel en mi idioma, para trabajar cómodo aunque mi tienda venda en otro.

**Talla:** XL (progresiva) · **Módulo:** preferencia de idioma por usuario (perfil, luego cookie, luego `Accept-Language`, luego `es-CO`), selector en el menú de cuenta, extracción de textos del admin por módulos (navegación y configuración primero; luego catálogo, pedidos, operaciones, cartera) y de la consola (`es` + `en`). **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Preferencia personal | Cada usuario elige su idioma; se recuerda entre sesiones y no afecta a otros usuarios ni a la tienda |
| AC-2 | Independiente de la tienda | Un admin en `en-US` gestiona una tienda cuyo idioma por defecto es `es-CO`; el contenido se sigue mostrando en el idioma que se edita |
| AC-3 | Sin URL por idioma | Las rutas del admin y la consola no cambian con el idioma |
| AC-4 | Migración progresiva | Los módulos aún no extraídos siguen en español sin errores; `i18n:check` reporta la cobertura por módulo |
| AC-5 | Consola | Navegación, tenants, planes, suscripciones y Merkiai Pagos disponibles en `es` y `en` |

## HU-467 — Multimoneda por mercado · E28

> Como comerciante, quiero vender en la moneda de cada mercado, para que el cliente vea y pague precios locales.

**Talla:** XL · **Módulo:** moneda por mercado con lista de precios por moneda (HU-407) o conversión con tasa fija configurable y redondeo; la moneda del pedido se fija al crearlo; validación de que la pasarela activa del mercado soporta la moneda; impuestos por país (tasa e inclusión en precio); cupones, gift cards y crédito en la moneda del pedido; reportes por moneda sin mezclar totales; cartera ya guarda `currency`. **Estado:** 🔲

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

**Talla:** M · **Módulo:** catálogo por país (campos y orden de la dirección, divisiones administrativas —se reutiliza `colombia-locations`; se agregan estados de México, provincias de España, estados de EE. UU.—, validación de código postal, tipos de documento: CC/NIT, RFC/CURP, NIF/NIE, SSN no; prefijo telefónico E.164); `formatAddress`/`formatPhone`; envíos (Skydropx) reciben la dirección normalizada. **Estado:** 🔲

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
