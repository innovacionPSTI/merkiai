# ADR-011 · Internacionalización y mercados (idiomas, regiones, moneda)

> **Estado:** Propuesto (nov-2026). **Épica:** E28 · Internacionalización y mercados (HU-460…468), detalle en `docs/backlog/14-detalle-e28-i18n.md`. **Absorbe** HU-114a/b/c (E2).
> **Relacionado:** listas de precio (HU-407), multi-dominio (HU-279), Constructor y bloques (E2/HU-218+), correos (HU-162), pasarelas por tenant (ADR-004/009), entitlements (ADR-002), CSP/middleware (hardening v270), IA (HU-118), SEO (E15).
> **Decisión del dueño (nov-2026):** **sin mercado prioritario**: la base debe servir por igual a `es-CO`, `es-MX`, `es-ES` y `en`; ningún mercado se cablea como caso especial.

---

## 1. Contexto

Merkiai nació en español de Colombia: textos de interfaz escritos en el código, formatos `es-CO` dispersos (unos 88 puntos con `toLocaleString`/`Intl` sueltos), moneda COP implícita y un solo idioma de contenido por tienda. Se quiere:

- **Storefront** con versiones por idioma y región bajo una URL propia (`/es-es/`, `/es-co/`, `/es-mx/`, `/en-us/`) y `hreflang` correcto (`es-ES`, `es-CO`, `es-MX`, `en-US`).
- **Admin y consola** usables en inglés y en las variantes de español.

Tres hallazgos orientan la decisión:

1. **Idioma ≠ mercado.** `es-CO`, `es-MX` y `es-ES` casi no difieren en lengua (unas decenas de términos), pero sí en **moneda, impuestos, pasarelas, formatos de dirección y documento**. `en-US` cambia ambas cosas.
2. **Hay tres tipos de texto con dueños distintos:** (a) interfaz de la plataforma (de Merkiai), (b) contenido de la tienda (del comerciante), (c) formatos derivados del locale (de nadie: se calculan).
3. **Solo el storefront necesita SEO.** Admin y consola no deben llevar el idioma en la URL.

## 2. Decisión

### 2.1 Conceptos

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Locale** | Etiqueta BCP 47 `idioma-REGIÓN` (`es-CO`, `es-MX`, `es-ES`, `en-US`) | Catálogo de la plataforma (lista cerrada, ampliable) |
| **Idioma de contenido** | Idioma base del texto (`es`, `en`) | Traducciones del contenido |
| **Mercado** | País(es) + moneda + lista de precios + locales habilitados + pasarelas e impuestos | Config por tienda (`markets`) |

Un **mercado** tiene uno o varios locales (p. ej. *Estados Unidos* = `en-US` + `es-US`). Cada tienda tiene un **mercado por defecto** y su **locale por defecto**. Mientras no exista multimoneda (HU-467), todos los mercados de una tienda comparten la moneda base: el locale cambia idioma y formatos, no el precio.

### 2.2 Textos de interfaz (capa a)

- Paquete compartido **`packages/i18n`** con **next-intl** (App Router, Server Components, mensajes ICU con plurales y género).
- Catálogos por idioma base + **sobrescrituras regionales**: `es.json` (neutro) ← `es-CO.json` / `es-MX.json` / `es-ES.json` solo con las diferencias; `en.json` ← `en-US.json`. Resolución: `es-MX` → `es` → clave (nunca texto vacío).
- Espacios de nombres por app (`web.*`, `admin.*`, `console.*`, `email.*`, `common.*`) para cargar solo lo necesario.
- **Guard de CI** (`pnpm i18n:check`), igual a `env:check`: claves usadas sin traducción en el idioma base fallan; las faltantes en otros idiomas generan un reporte de cobertura, no un error.
- Extracción **progresiva**: el texto en español escrito en el código sigue funcionando mientras se migra pantalla por pantalla.
- **Cola larga del panel y la consola (HU-466):** frases con **clave = texto original en español** (estilo gettext) — `<T>Guardar cambios</T>` en JSX y `useTx()`/`getAdminTx()` para atributos y servidor — con un diccionario por idioma (`phrases/admin.en.ts`). Evita inventar cientos de claves para etiquetas internas; el guard mide su cobertura. Los mensajes de API y server actions se traducen en la respuesta (`localizeMessages`), con entradas de patrón (`"Documento {0} creado."`) para textos armados en runtime. Tienda, checkout, correos y navegación mantienen claves semánticas.

### 2.3 Contenido de la tienda (capa b)

- **Tablas de traducción por entidad** para el contenido con URL o búsqueda: `product_translations`, `category_translations`, `page_translations`, `blog_post_translations`, `collection_translations` con `(entity_id, locale, campos…, slug)`, `tenant_id` y RLS. Slug **único por `(tenant, locale)`**.
- **Bloques del Constructor y menús:** el `jsonb` de `settings`/ítems admite un mapa por locale solo en los campos marcados `translatable` en el schema de bloques (`{ "title": { "es": "…", "en": "…" } }`). Un valor plano se interpreta como el idioma por defecto, así que no hace falta migrar datos.
- **Fallback:** locale pedido → idioma base del locale (`es-MX` → `es`) → locale por defecto de la tienda. Nunca se muestra un campo vacío. Si la página cae al idioma por defecto, se marca para que el `hreflang` no la anuncie como traducida (evita contenido duplicado).
- Plantillas de correo y páginas legales: traducibles por tienda, con base de la plataforma por idioma.

### 2.4 Formatos (capa c)

- Formateadores únicos en `packages/i18n/format`: `formatMoney(amount, currency, locale)`, `formatDate`, `formatNumber`, `formatPhone`, `formatAddress`. Se reemplazan los 88 usos sueltos.
- La moneda viene del **dato** (pedido, lista de precios, documento de cartera ya tiene `currency`), nunca del locale: un pedido en COP visto en `en-US` se muestra `COP 120,000`.
- Direcciones y documento por **país** (HU-468): Colombia (departamento/municipio, NIT/CC), México (estado/municipio, CP, RFC), España (provincia, CP, NIF), EE. UU. (estado, ZIP).

### 2.5 Enrutamiento del storefront

- **Subcarpeta en minúsculas**: `/es-co/…`, `/es-mx/…`, `/es-es/…`, `/en-us/…`. El atributo `hreflang` usa la forma canónica `es-CO` (ambas son válidas para Google; se elige la convención BCP 47).
- **El locale por defecto de la tienda va sin prefijo**, así las URLs actuales se mantienen y no se pierde SEO. Pedir `/<locale-por-defecto>/…` responde con 301 a la URL sin prefijo.
- **Alternativa por dominio:** un mercado puede ligarse a un dominio de la tienda (HU-279), por ejemplo `tienda.mx` → `es-MX`. El `hreflang` funciona entre dominios.
- **SEO:** en cada página, `<link rel="alternate" hreflang>` **recíproco** para todas las versiones con contenido propio, más `x-default` (la versión por defecto); `<html lang>` con el locale; canónica autorreferenciada por versión; sitemap con `xhtml:link` alternos.
- **Detección:** `Accept-Language` y país (cabecera del CDN) **solo sugieren** con un aviso ("¿Ver en English?"). **No hay redirección automática**: así Googlebot rastrea todas las versiones y el usuario no queda atrapado. La elección queda en una cookie `merkiai_locale`.
- **Middleware:** la resolución de locale se integra en el middleware actual, después de resolver el tenant y antes de la CSP. El locale pasa por la cabecera `x-locale`; las rutas viven en `app/[locale]/…` con *rewrite* para el locale sin prefijo.

### 2.6 Admin y consola

- Idioma de interfaz **por usuario**: perfil, luego cookie, luego `Accept-Language`, luego `es-CO`. **Sin prefijo en la URL.**
- El idioma de interfaz del admin es **independiente** de los idiomas de la tienda: un comerciante puede administrar en español una tienda que vende en inglés.
- El admin incluye el **editor de traducciones** con porcentaje de completitud por idioma y entidad, más "traducir con IA" (HU-118) como borrador que se revisa siempre antes de publicar.
- **Consola:** `es` + `en` (uso interno), la prioridad más baja.

### 2.7 Planes

- Entitlements: `max_idiomas` (límite) y `markets` (feature: más de un mercado). El plan base incluye 1 idioma, que es el comportamiento actual.

### 2.8 Fuera de alcance inicial (decisiones explícitas)

- **Multimoneda** (HU-467) va aparte: arrastra precios por moneda, pasarela compatible con la moneda, impuestos y conciliación. Sin ella, un mercado nuevo cambia idioma y formatos, pero sigue vendiendo en la moneda base.
- **Idiomas RTL** (árabe, hebreo): el catálogo queda abierto, pero no se prueba la dirección derecha a izquierda.
- **Traducción automática en tiempo real** para el visitante: no. Las traducciones se guardan y se revisan.
- **España como mercado vendible** requiere una pasarela que opere en EUR en España (Redsys/Stripe, no integradas). Hasta entonces, `es-ES` sirve como idioma.

## 3. Consecuencias

**Positivas:** se abren mercados sin bifurcar código; el SEO es correcto por versión; formatos coherentes; el comerciante controla sus traducciones; y la base sirve para el POS y los correos.

**Costos y riesgos:**
- Extraer los textos de tres apps es un trabajo grande y continuo (mitigación: extracción progresiva + guard).
- Se agregan joins de traducción a las consultas del catálogo (mitigación: vistas o funciones por locale, índices `(tenant_id, locale, slug)`, caché por locale en HU-434).
- La caché y la CDN deben incluir el locale en la clave.
- La CSP no cambia.

**Compatibilidad:** sin configurar idiomas adicionales, la tienda se comporta exactamente como hoy (`es-CO`, sin prefijo, sin `hreflang`).

## 4. Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Columnas `name_en`, `name_es`… | No escala con los locales, migraciones por idioma |
| Solo `jsonb` por idioma en todas las tablas | Slugs únicos y búsqueda por idioma quedan sin índice natural; RLS igual, pero las consultas son más difíciles |
| Prefijo obligatorio en todos los locales | Rompe las URLs actuales y su SEO |
| Locale por subdominio (`en.tienda.com`) | Choca con el subdominio de tenant (`<tienda>.merkiai.com`) |
| Redirigir automáticamente por `Accept-Language` | Mala práctica de SEO (Googlebot rastrea desde EE. UU.) y frustra al usuario |
| Un servicio externo de traducción (Crowdin/Lokalise) como fuente de verdad | Útil para los textos de la plataforma (se puede sincronizar con los JSON), no para el contenido del comerciante |
