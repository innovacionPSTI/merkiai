# Detalle · Constructor v2 — Autoría unificada + layout adaptable + contenido dirigido por datos · E2/E3

> **Objetivo.** Evolucionar el Constructor de "editor de secciones de una página ya creada" a un **hub único de autoría** donde se **crea, estructura, estila, enlaza, previsualiza y publica** en un flujo secuencial — y donde las páginas pasan de una **pila vertical de secciones** a un **layout adaptable (Filas/Columnas)** y a **contenido dirigido por datos (colecciones)**. Sirve a **todos** los verticales (tienda, servicios/educación E20–E21 y portal E23), por eso vive en el núcleo CMS (E2/E3) y no en una épica de nicho.
>
> **Principios (heredados y obligatorios):**
> - **No reescribir el motor:** se construye **sobre** el frame schema-driven existente (`pages → page_sections → section_items`, contrato de bloque + validación, borrador en caliente HU-128, preview por token, tokens de tema HU-247, estilo por sección HU-253, DnD HU-251).
> - **Cero regresión / guarded:** toda página existente debe renderizar **idéntica**; las capacidades nuevas son *opt-in*. La tienda viva (vps-coffee) no cambia.
> - **Portabilidad:** todo lo nuevo (layout, overrides de estilo, colecciones, plantillas por tipo) **viaja en los paquetes** de Página/Plantilla/Preset/Sitio (HU-129/255/256/123).
> - **Responsive + a11y + tokens:** sin canvas libre; grilla estructurada por presets, estilos por tokens, orden de origen cuidado.
>
> **Decisiones de diseño fijadas (acordadas con el producto):**
> 1. **Granularidad de grilla:** **presets de proporción** (½+½, ⅓+⅔, 8+4, ¼×4…), no spans 12-col libres.
> 2. **Anidación:** **1 nivel** (bloques dentro de columnas; sin columnas dentro de columnas).
> 3. **Responsive:** **auto-apilar en móvil** + ajuste simple (ocultar/reordenar por breakpoint); sin proporciones distintas por breakpoint.

---

## Estado consolidado (v178)

| HU | Título | Estado | Resumen |
|----|--------|--------|---------|
| **HU-350** | Autoría unificada (hub) | ✅ AC-1…AC-5 | Crear/duplicar en el hub, lista filtrable de páginas, flag `pageBuilder` graduado a entitlement. |
| **HU-351** | Layout Filas/Columnas | ✅ AC-1…AC-7 | `row_id`/`row_layout`/`col_index` (`e17/54`), render a CSS Grid en ambos paths, picker + responsive fino (ocultar/reordenar por breakpoint). |
| **HU-352** | Estilo por página | ✅ AC-1…AC-4 | `pages.style` (`e17/55`): acento + ancho + espaciado por tokens, en `[slug]` y home; portable. |
| **HU-353** | Colecciones (pieza madre) | ✅ AC-1…AC-6 | Tablas + RLS (`e17/56`), capa de datos + validación por esquema, API scoped, gestor admin `/colecciones`, gating por plan, **portabilidad** (`collection-package` + `exportSite.collections`). |
| **HU-354** | Plantillas por tipo | ✅ AC-1…AC-5 | Ruta pública `/[slug]/[item]`: plantilla construida en el Constructor (`template_page_key` + placeholders `{{campo}}`, `e17/58`) con fallback a la automática; SEO/OG + preview; portable. |
| **HU-355** | Listado dinámico | ✅ AC-1…AC-4 | Bloque `collection_list` (`e17/57`): colección + orden + filtro + límite + presentación; enlaza a los registros. |
| **HU-356** | Partials globales | ✅ AC-1…AC-3 | Bloque `partial_ref` (`e17/59`): página reutilizable inyectada por referencia; anti-recursión; preview + portabilidad por ser página. |
| **HU-357** | Biblioteca de medios | ✅ AC-1…AC-3 | `MediaPicker` reutilizable en campos de imagen (elegir de la biblioteca sin re-subir); gestión en /media; RLS existente. Sin migración. |
| **HU-358** | Bloques guardados | ✅ AC-1…AC-3 | Tabla `saved_blocks` (`e17/60`): guardar una sección (con ítems) como reutilizable e insertarla como copia; viaja en el paquete de sitio. |
| **HU-359** | Entitlements + tiering | 🟡 transversal | Catálogo completo (8 features + 4 limits) + gating de las features vivas (`page_builder`/`layout_avanzado`/`estilo_por_pagina`/`colecciones`); el resto aterriza con cada HU futura. |

**Migraciones de la ola:** `e17/54` (filas/columnas) · `e17/55` (estilo por página) · `e17/56` (colecciones) · `e17/57` (section_type `collection_list`) · `e17/58` (plantilla por tipo) · `e17/59` (section_type `partial_ref`) · `e17/60` (saved_blocks).

**Circuito Ola 2 operativo de punta a punta:** definir tipo (colección) → cargar registros (admin) → página pública por registro (`/[colección]/[slug]`) → listarlos en cualquier página (bloque `collection_list`). **Habilita** el catálogo de cursos (E20) y el portal (E23).

**Épica Constructor v2 — MOTOR COMPLETO** (Ola 1 ✅ · Ola 2 ✅ · Ola 3 ✅). Transversal abierto: **HU-359** (afinado de tiering).

**Ola 4 propuesta (UX + autoría unificada v2):** HU-364…HU-375 — pulir la experiencia (matar diálogos nativos, patrón "Pagos", reorg por niveles), **dejar un solo Constructor** (retirar `/contenido`/"Páginas"), **mover al Constructor lo editorial** de *Configuración → General* y *Legal*, y la **estructura macro por plan** (header/footer editables, blueprint de sitio). Detalle abajo (sección "Ola 4") + ruta en "Orden de implementación". Es **UX e integración** sobre el motor ya construido.

---

## HU-350 — Autoría unificada: crear y construir en un solo hub (Fase 0) · E3/E13

> Como comerciante, quiero crear una página y construirla en el mismo lugar, para no saltar entre "Páginas" (crear) y "Constructor" (editar) y entender el flujo de principio a fin.

**Estimación:** M (5 puntos) · **Módulo:** reorganización de IA del admin (fusiona `/contenido` "Páginas" + `/constructor`), entrada "Nueva página" que abre el lienzo, graduar el Constructor fuera del flag `pageBuilder` · **Estado:** 🟡 Parcial (v167 → v173) — **hecho:** **crear página** ("+ Nueva página") y **duplicar página** desde el propio Constructor (crear cascarón → abre el lienzo, nace en **borrador**; duplicar vía export→import) (AC-1/AC-3/AC-4); **(v173) lista de páginas filtrable dentro del hub (AC-2):** el selector de página pasó de un `<select>` plano a un **panel con búsqueda + filtro por tipo + filtro por estado** (publicada/borrador), con indicador de estado y etiqueta de tipo por página; elegir una abre su lienzo. **(v174) AC-5 ✅:** el flag `pageBuilder` quedó **graduado a entitlement `page_builder`** (HU-359) — la ruta `/constructor` y el ítem de menú se habilitan por flag legacy **o** por el entitlement del plan (fail-open). **HU-350 cubre AC-1…AC-5 ✅.** *Reorganiza piezas existentes, no reescribe el motor.* **Base de toda la ola.**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Crear en el hub | "Nueva página" (label/slug/tipo/meta) se hace **dentro del Constructor** y abre directamente el lienzo construible |
| AC-2 | Lista unificada | "Páginas" pasa a ser la lista de páginas **dentro del hub** (filtrable por tipo/estado); editar abre el lienzo |
| AC-3 | Flujo secuencial | Un solo recorrido visible: crear → elegir plantilla de arranque → construir → estilar → añadir al menú → previsualizar → publicar (reusa HU-128/251/128 v2) |
| AC-4 | Duplicar página | Clonar una página completa desde la lista (reusa export/import HU-255 internamente), en borrador |
| AC-5 | Cero regresión | Páginas y permisos actuales siguen funcionando; el flag se retira sin pérdida de funcionalidad — ✅ v174: el flag `pageBuilder` se graduó a entitlement `page_builder` (flag legacy **o** entitlement; fail-open) en la ruta y el menú |
| AC-6 | Gating | Respeta rol (`contenido`) y plan; sin cambios en RLS |

---

## HU-351 — Capa de layout: Filas y Columnas por presets · E3

> Como comerciante, quiero elegir cómo se organizan los bloques de una página (en columnas, no solo apilados), para construir páginas ricas sin depender de un diseño fijo.

**Estimación:** L (8 puntos) · **Módulo:** metadato de ubicación en `page_sections` (`row_id`, `row_layout` = preset, `col_index`) + agrupación en el renderer a **CSS Grid** (ambos caminos: home-blocks y SectionRenderer/CMS) + *picker* visual de proporciones en el Constructor + safelist de clases de grid · **Estado:** 🟡 Parcial (v168) — **hecho (v168):** migración `e17/54` (columnas `row_id`/`row_layout`/`col_index`, aditivas nullable) + tipos; **helper puro `groupSectionsIntoRows`** + `parseLayout`/`cellSpanClass` (clases `lg:col-span-*` en map literal, sin safelist) con tests (9); **render de filas en el path CMS `/[slug]`** (sin `row_id` = fila full-width idéntica → **cero regresión**; con `row_id` = **CSS Grid de 12** que **apila en móvil**). **(v169) picker en el Constructor:** botón **"⬓ Unir ↑"** combina un bloque con el de arriba en una fila, badge "Fila · N col", **selector de proporciones** (½+½, 8+4, ⅓×3…) en la primera celda y **"Separar"** para volver a ancho completo; persiste `row_id`/`row_layout`/`col_index` por el CMS API (el validador ignora esas claves). **Portabilidad (AC-7):** los campos de fila viajan en el paquete de página (`PACKAGE_SECTION_COLS`) → export/import y **duplicar página** preservan el layout. **(v170) path home cableado:** la misma agrupación en el home cuando la tienda tiene secciones propias (el fallback de plantilla queda lineal). **(v172) responsive fino:** helper puro `cellResponsiveClasses(settings)` (opt-in desde `settings`, **sin migración**) → `hideMobile` (`hidden lg:block`), `hideDesktop` (`block lg:hidden`), `mobileOrder` 0..11 (`order-N lg:order-none`); clases literales (sin safelist); cableado en ambos paths (`[slug]` y home, celdas y full-width) + **controles "Móvil/Escritorio"** por bloque en el Constructor (tests +6). Depende de HU-350. **Ops:** aplicar `e17/54` + deploy web/admin. **AC-1…AC-7 ✅ (incluye el ajuste responsive fino).**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Modelo sin entidad pesada | Un bloque gana `row_id` + preset de fila (`[12]`, `[6,6]`, `[4,8]`, `[4,4,4]`, `[3,3,3,3]`…) + `col_index`; **sin columnas dentro de columnas** (1 nivel) |
| AC-2 | Render por grid | El renderer **agrupa** los bloques de una misma fila en una CSS Grid con las proporciones del preset, en los **dos** caminos de render |
| AC-3 | Presets finitos | Set acotado de presets (safelistable en Tailwind); selector **visual** de proporciones en el panel (no spans numéricos) |
| AC-4 | Responsive auto | En móvil las columnas **se apilan** automáticamente; por bloque se puede **ocultar/reordenar** por breakpoint (ajuste simple), previsualizable con el device toggle (HU-251) |
| AC-5 | Cero regresión | Un bloque sin `row_id` = fila de una sola columna a todo el ancho → render idéntico al actual; vps-coffee intacto |
| AC-6 | Builder UX | Crear/eliminar filas, elegir preset, arrastrar bloques a celdas (controles en la fila del panel, no overlay — restricción iframe de HU-251) |
| AC-7 | Portabilidad | Fila + preset + ubicación **viajan** en los paquetes de Página/Plantilla/Preset (HU-129/255/256) |

---

## HU-352 — Estilo por página: overrides sobre el tema global · E3

> Como comerciante, quiero poder ajustar el estilo de una página concreta (acento, ancho de contenedor, escala de espaciado) sin cambiar el tema global, para diferenciar landings/portadas.

**Estimación:** S (3 puntos) · **Módulo:** overrides por página (acento/ancho/espaciado por **tokens**) que caen en cascada sobre el tema activo (HU-247) + fila/sección (HU-253); editor "Estilo de la página" · **Estado:** ✅ Completa — AC-1…AC-4 ✅ (acento + ancho de contenedor + escala de espaciado, en `[slug]` y home). Separa el eje "estilo" del eje "estructura" (HU-351) y "contenido".

| # | Escenario | Resultado esperado | Estado |
|---|-----------|-------------------|--------|
| AC-1 | Cascada | Estilo efectivo = tema global (HU-247) → override de página → estilo de fila/sección (HU-253); todo por **tokens**, sin colores fijos | ✅ acento re-tinta `--brand-primary`/`--brand-dark`; contenedor/espaciado vía `--page-max`/`--page-space` |
| AC-2 | Alcance acotado | Override limitado a acento, ancho de contenedor y escala de espaciado (no un tema paralelo completo) | ✅ `accent` (hex) + `container` (sm/md/lg/xl/full) + `space` (compact/normal/relaxed), por tokens |
| AC-3 | Default sin efecto | Sin override, la página hereda el tema → cero regresión | ✅ `pageStyleVars(null)` = `{}`; los render usan `var(--x, default)` |
| AC-4 | Portabilidad | El override viaja en el paquete de Página/Preset | ✅ `style` en `PACKAGE_PAGE_FIELDS` (export/import) |

**Implementado (migración e17/55 + commits HU-352):** `pages.style jsonb` (opt-in, aditiva) · `apps/web/src/lib/page-style.ts` (`pageStyleVars`/`hasPageStyle`/`parsePageStyle` + tokens `CONTAINER_TOKENS`/`SPACE_TOKENS`) · `[slug]` **y home** aplican el estilo (home vía wrapper `display:contents` + `getWebHomeData.homeStyle`) · filas consumen `var(--page-max,80rem)`/`var(--page-space,1.5rem)` · controles de acento + ancho + espaciado por página en el Constructor · `CreatePageInput.style` + `types.ts` · 9 tests (page-style) + 3 (home). **Cerrada.**

---

## HU-353 — Colecciones / tipos de contenido dinámicos (pieza madre) · E2

> Como editor, quiero definir tipos de contenido reutilizables (noticia, evento, curso, persona, documento) con sus campos y gestionar sus registros, para no construir a mano cada página de contenido repetido.

**Estimación:** XL (13 puntos) · **Módulo:** `collections` (definición de tipo + esquema de campos, por tenant) + `collection_items` (registros) + RLS + gestor de registros en el admin + API scoped · **Estado:** 🟡 Fase 1 — fundación (v175) — **hecho:** migración `e17/56` (`collections` + `collection_items`, RLS lectura pública acotada por tenant [colecciones habilitadas; registros solo `published`] + `*_admin_all`); tipos en `types.ts`; **capa de datos** `queries/collections.ts` con **validación por esquema PURA** (`normalizeFields`, `validateItemData` con required/coerción number·boolean/date/select/saneo de claves desconocidas, `deriveItemTitle`, `slugifyCollection`) + CRUD de colecciones y registros (borrador/publicado, slug único por colección); 11 tipos de campo (incl. `date`/`relation`/`file`); 9 tests puros. *Pieza madre; depende de HU-350.* **Fase 2 (v176):** **API scoped** `/api/admin/cms/collections` y `/collection-items` (CRUD, `data` validado por esquema → 422; acotado por tenant vía RLS) con **gating** (feature `colecciones` → 402, limits `max_colecciones`/`max_registros_coleccion` → 403; fail-open sin control-plane); **gestor en el admin** `/colecciones` (editor del esquema de campos + CRUD de registros con formulario generado desde el esquema, borrador/publicado) → **AC-1/AC-2 ✅**, **AC-4 ✅**; entrada de menú gated y ruta `notFound` si el plan no incluye `colecciones` (flag de dev `NEXT_PUBLIC_FEATURE_COLLECTIONS` como escape). **Fase 3 (v180) · AC-5 ✅:** `collection-package.ts` (`buildCollectionPackage`/`parseCollectionPackage`/`exportCollection`/`importCollectionPackage`, puro + tolerante) serializa la **definición** (y registros de ejemplo opcionales); la definición **viaja en el paquete de sitio** (`exportSite` ahora incluye `collections`; registros solo con `includeCollectionRecords`). **HU-353 ✅ AC-1…AC-6** (AC-6 base común: el mismo motor sirve a portal E23 y educación E20). **Consumo en storefront:** HU-354 (plantillas por tipo) + HU-355 (listado dinámico), ambos ✅/render.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definición de tipo | El editor crea una colección con **campos tipados** (texto, texto largo, fecha, imagen, select, relación, archivo), reutilizando el contrato de campos del Constructor |
| AC-2 | Registros | CRUD de registros de la colección con validación por esquema; borrador/publicado; slug único por colección y tenant |
| AC-3 | Multi-tenant | Definición y registros scoped por `tenant_id` + RLS; lectura pública solo de publicados |
| AC-4 | Gating por plan | Nº de colecciones/registros sujeto a entitlements (HU-173) |
| AC-5 | Portabilidad | La **definición** de colección viaja en los paquetes (los registros, opcionalmente, como contenido de ejemplo del preset) |
| AC-6 | Base común | Sirve a portal (noticias/eventos/dependencias) **y** a educación (cursos/diplomados, E20) con el mismo motor |

---

## HU-354 — Plantillas de página por tipo (dynamic templates) · E2/E3

> Como editor, quiero construir una sola plantilla por tipo de contenido y que cada registro se renderice con ella, para publicar miles de páginas (noticias, cursos) sin armarlas una por una.

**Estimación:** L (8 puntos) · **Módulo:** plantilla por colección (layout + bloques con *placeholders* que leen campos del registro) + ruta dinámica `/[collection]/[slug]` que resuelve el registro y aplica la plantilla · **Estado:** ✅ (v181, AC-1…AC-5) — **AC-1 (v181):** `collections.template_page_key` (`e17/58`) apunta a una **página del Constructor** como plantilla; sus bloques usan *placeholders* `{{campo}}` que se sustituyen con los valores del registro (`recordTokens`/`substituteTokens`/`applyTokensDeep`, puros + tests); la ruta pública la renderiza con `SectionRenderer` + grilla Filas/Columnas (cliente-máquina tenant-scoped, para no exigir que la plantilla esté publicada), con **fallback** a la plantilla automática; control en el gestor admin + la plantilla **viaja en el paquete** (`template_page_key` en `PACKAGE_COLLECTION_FIELDS`). **Render automático (v177):** ruta dinámica **`/[slug]/[item]`** (reusa el segmento `[slug]` del CMS + anida `[item]`; las rutas literales blog/shop/bundles tienen prioridad) que resuelve colección (habilitada) + registro (publicado; en preview también borradores vía machine-db) y lo renderiza con una **plantilla genérica dirigida por el esquema** (título, imagen hero, fecha, cuerpo richtext, enlaces/relaciones, booleanos…); **SEO/OG por registro** en `generateMetadata` (AC-2/AC-3); **preview por token + borrador** reusados (AC-4); ruta/tipo nuevo → **cero regresión** (AC-5). **Pendiente:** **AC-1** plantilla construida en el lienzo (Filas/Columnas + bloques con campos enlazados) como override de la plantilla automática. Depende de HU-351 + HU-353.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Plantilla única | Una plantilla de "artículo/curso" construida en el lienzo (Filas/Columnas + bloques) con **campos enlazados** al registro |
| AC-2 | Render automático | `/[collection]/[slug]` renderiza cualquier registro publicado con su plantilla; SEO/OG por registro |
| AC-3 | Enlace de campos | Los bloques exponen qué campo del registro muestran (título, imagen, cuerpo, fecha…) sin código |
| AC-4 | Preview/borrador | Reusa preview por token y borrador (HU-128) a nivel de plantilla y de registro |
| AC-5 | Cero regresión | No afecta a páginas estáticas existentes; es una ruta/tipo nuevo |

---

## HU-355 — Bloque de listado/agregador dinámico · E3

> Como editor, quiero insertar un bloque que liste registros de una colección (con filtros, orden y paginación) en cualquier página, para armar portadas, índices y secciones de "últimas noticias / próximos eventos / cursos".

**Estimación:** M (5 puntos) · **Módulo:** nuevo `section_type` de **listado dinámico** que consulta una colección (fuente configurable: toda / filtro por campo / manual) con orden/límite/paginación; render server-side scoped · **Estado:** ✅ (v178) — nuevo bloque **`collection_list`** (`e17/57` amplía el CHECK de `section_type`): schema con **colección + orden** (recientes/antiguos/título/manual) **+ filtro por campo/valor + límite + presentación** (rejilla/lista); aparece en «Agregar bloque» (AC-2) y cae en una celda de la grilla (HU-351); resolver puro `resolveCollectionList` (RLS del storefront filtra publicados+tenant) con tests; componente server `CollectionList` (cards por **tokens** de tema, enlaza a `/[colección]/[slug]` de HU-354) cableado en `SectionRenderer` y en el registry del home; config **viaja en el paquete** (está en `settings`, AC-3); **generaliza `product_carousel`** a cualquier colección (AC-4 · `product_carousel` se mantiene como caso de productos). Depende de HU-353 ✅.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Fuente configurable | Elegir colección + filtros por campo (p. ej. categoría/fecha) + orden + límite + paginación, desde el editor del bloque |
| AC-2 | Insertable en cualquier página | Aparece en "Agregar bloque" (HU-268) y cae en una celda de la grilla (HU-351) |
| AC-3 | Estilo por tokens | Tarjetas estiladas por tokens de tema → se "viste" por plantilla; viaja en el paquete de página/preset |
| AC-4 | Generalización | `product_carousel` (HU-286 v2) se modela como un caso de este bloque (colección = productos) sin perder su comportamiento |

---

## HU-356 — Bloques globales / partials reutilizables · E3

> Como editor, quiero editar una vez elementos compartidos (franja superior, CTA, pie, aviso) y que se reflejen en todo el sitio, imprescindible para portales con muchas páginas.

**Estimación:** M (5 puntos) · **Módulo:** bloque "global" (definición única referenciada desde varias páginas) + resolución en el renderer + edición centralizada · **Estado:** ✅ (v182) — un **partial = página CMS** (editable una sola vez, AC-1); nuevo bloque **`partial_ref`** (`e17/59` amplía el CHECK) con `partial_key` lo inserta por referencia en N páginas y el renderer inyecta sus secciones con `SectionRenderer` (AC-2), con **guarda anti-recursión** (ignora `partial_ref` anidados); al ser una página, respeta **borrador/preview (HU-128) y viaja en el paquete de sitio (HU-123)** (AC-3). Helper `getSectionsWithItems(pageKey)` + registro en SectionRenderer y home-blocks.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definir una vez | Un partial (p. ej. "franja de admisiones") se edita en un solo lugar |
| AC-2 | Reutilizar | Se inserta por referencia en N páginas; un cambio se refleja en todas |
| AC-3 | Preview/portabilidad | Respeta borrador/preview (HU-128) y viaja en el paquete de sitio (HU-123) |

---

## HU-357 — Biblioteca de medios · E2/E13

> Como editor, quiero una biblioteca para reutilizar imágenes/archivos entre páginas, para no re-subir el mismo recurso una y otra vez.

**Estimación:** M (5 puntos) · **Módulo:** índice de medios por tenant (sobre el Storage ya usado) + selector reutilizable en el widget `image`/`file` (HU-264) + metadatos (alt, nombre) · **Estado:** ✅ (v184) — **AC-1:** nuevo `MediaPicker` (modal que lista `media_assets` del tenant vía `/api/admin/media`, con búsqueda por nombre/alt) integrado en `ImageUpload` → **cualquier campo de imagen** permite "elegir de la biblioteca" (reutilizar sin re-subir); **AC-2** ya cubierto por la página **/media** (listar/buscar/eliminar + `alt` editable: `updateMediaAssetAlt`); **AC-3** multi-tenant + RLS sobre `media_assets` (preexistente). Sin tablas ni migración nuevas.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Reutilización | Elegir un recurso ya subido desde cualquier campo de imagen/archivo |
| AC-2 | Gestión | Listar/buscar/eliminar medios del tenant; `alt` editable (a11y/SEO) |
| AC-3 | Multi-tenant | Scoped por `tenant_id` + RLS; buckets como hoy |

---

## HU-358 — Biblioteca de bloques guardados · E3

> Como comerciante, quiero guardar una sección ya configurada como reutilizable y volver a insertarla, para acelerar la creación de páginas similares.

**Estimación:** S (3 puntos) · **Módulo:** guardar un bloque/sección (con su contenido y estilo) como plantilla de bloque del tenant + reinserción desde "Agregar bloque" · **Estado:** ✅ (v183) — tabla `saved_blocks` (`e17/60`, RLS admin-only) + capa de datos (`buildSavedBlockPayload` puro, `createSavedBlockFromSection` captura columnas+settings+**ítems**, `insertSavedBlock` crea copia editable) + API `/api/admin/cms/saved-blocks` + Constructor ("**Guardar**" por sección (AC-1) y selector "**Bloque guardado → Insertar…**" (AC-2)); **viaja en el paquete de sitio** (`exportSite.saved_blocks`, AC-3). Extiende "guardar como preset" (HU-256) al nivel de bloque.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Guardar | "Guardar bloque" captura tipo + contenido + estilo (settings) como reutilizable del tenant |
| AC-2 | Reinsertar | Aparece en el catálogo "Agregar bloque" (HU-268) y se inserta como copia editable |
| AC-3 | Portabilidad | Viaja en el paquete de sitio/preset |

---

## HU-359 — Entitlements del Constructor + tiering por plan · E17 (toca E2/E3)

> Como operador de plataforma, quiero habilitar cada funcionalidad del Constructor según el plan del tenant, para empaquetar capacidades (layout avanzado, colecciones, portal) en distintos planes comerciales sin tocar código.

**Estimación:** M (5 puntos) · **Módulo:** alta de **features + limits** del Constructor v2 en el catálogo de entitlements (`@merkiai/tenancy/entitlements`, HU-173) + **gating en 3 capas** (UI `tenantHasFeature` / API `requireFeature`·`requireWithinLimit` / datos solo RLS para aislamiento, HU-239) + asignación por plan desde la consola (editor de planes HU-239 v2). **No construye sistema nuevo: puebla el existente.** · **Estado:** 🟡 Parcial (v174) — **hecho:** **AC-1 catálogo** (8 features `page_builder`/`layout_avanzado`/`estilo_por_pagina`/`colecciones`/`plantillas_por_tipo`/`listado_dinamico`/`partials_globales`/`biblioteca_medios`/`bloques_guardados` + 4 limits `max_paginas`/`max_colecciones`/`max_registros_coleccion`/`max_medios_mb`; defaults **layout+estilo ON**, resto OFF → cero regresión); **AC-3** automática (el editor de planes de la consola lee el catálogo); **AC-2/AC-4** para las features vivas: el flag `pageBuilder` **graduado a entitlement** `page_builder` (flag legacy **o** entitlement → ruta `/constructor` + ítem de menú; HU-350 AC-5), y `layout_avanzado`/`estilo_por_pagina` **ocultan sus controles** en el Constructor cuando el plan no los incluye, **sin romper el render** del contenido ya creado (se conserva "Separar" para no atrapar bloques); **AC-5 límite** `max_paginas` aplicado en el alta de páginas (Constructor y Contenido, fail-open). **Pendiente:** gating de las features de olas futuras (colecciones/medios/etc.) **junto a cada HU**, y límites `max_colecciones`/`max_registros`/`max_medios` cuando existan esos recursos.

> **Graduación del flag:** el Constructor hoy vive tras el flag técnico `pageBuilder`. Con HU-350/HU-359 ese flag **se gradúa a entitlement** de plan (deja de ser interruptor de desarrollo).

**Features (on/off) y limits propuestos:**

| Entitlement | Tipo | Cubre (HU) |
|---|---|---|
| `page_builder` | feature | Acceso al Constructor como hub (gradúa el flag `pageBuilder`) · HU-350 |
| `layout_avanzado` | feature | Filas/Columnas por presets · HU-351 |
| `estilo_por_pagina` | feature | Overrides de estilo por página · HU-352 |
| `colecciones` | feature | Tipos de contenido dinámicos · HU-353 |
| `plantillas_por_tipo` | feature | Render dinámico `/[colección]/[slug]` · HU-354 |
| `listado_dinamico` | feature | Bloque de listado/agregador · HU-355 |
| `partials_globales` | feature | Bloques globales reutilizables · HU-356 |
| `biblioteca_medios` | feature | Media library · HU-357 |
| `bloques_guardados` | feature | Biblioteca de bloques guardados · HU-358 |
| `max_paginas` | limit | Nº de páginas por tenant |
| `max_colecciones` | limit | Nº de colecciones |
| `max_registros_coleccion` | limit | Registros por colección |
| `max_medios_mb` | limit | Almacenamiento de biblioteca de medios |

**Tiering de referencia (ajustable desde la consola):**

| Plan | Features del Constructor | Notas |
|---|---|---|
| Básico (tienda/servicios) | `page_builder`, `estilo_por_pagina` | Pila vertical + estilo; sin layout avanzado ni colecciones |
| Pro | + `layout_avanzado`, `partials_globales`, `biblioteca_medios`, `bloques_guardados` | Layout rico + facilidad; límites moderados |
| Educación | + `colecciones`, `plantillas_por_tipo`, `listado_dinamico` | Catálogo de cursos (con E20) |
| Portal / Enterprise | Todas | Límites altos + portal (E23) + aislamiento dedicado (HU-200) |

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Catálogo | Las features/limits de arriba quedan dadas de alta en el catálogo de entitlements (HU-173) |
| AC-2 | Gating 3 capas | Cada capacidad se oculta en UI, se rechaza en API (403) y respeta límites; la RLS solo aísla por tenant |
| AC-3 | Asignable por plan | El operador enciende/apaga features y fija límites por plan desde la consola (HU-239 v2) |
| AC-4 | Degradación segura | Si un plan pierde una feature, la UI la oculta y la API la bloquea, pero **el render del contenido ya creado no se rompe** (es metadato opt-in) |
| AC-5 | Límites en alta | Al crear páginas/colecciones/registros/medios se valida el límite del plan (`requireWithinLimit`), importando/omitiendo según remanente como en los importadores existentes |

---

# Ola 4 — Autoría unificada v2: UX del Constructor + fusión de la configuración editorial · E3/E13

> **Objetivo.** Dejar **un solo Constructor** (retirar la sección "Páginas"/`/contenido`), con la UI **organizada por niveles** (sitio → página → bloque), **sin diálogos nativos del navegador**, lo más **fluido** posible, y con el **alcance habilitado por plan**. Además, **mover al Constructor la edición editorial** que hoy vive en *Configuración → General* y *Configuración → Legal*, dejando en Configuración solo lo técnico (dominios, pagos, envíos, correos, usuarios). Todo es **UX + integración sobre el motor existente** (pages/page_sections/section_items/nav_items/store_config/entitlements); no reescribe el motor.
>
> **Principio rector (patrón "Pagos", HU-271/272):** wizard por pasos + selección por **tarjetas** + **chips de estado** + acciones por fila + "uno activo a la vez". Se reutiliza `WizardModal`/`ResourceList` del design system.

## HU-364 — Modales de marca en el Constructor (eliminar `prompt/alert/confirm`) · E13

> Como comerciante, quiero que crear/duplicar/guardar/eliminar use ventanas de la propia app (no las del navegador), para una experiencia consistente y con validación en vivo.

**Estimación:** S (3 puntos) · **Módulo:** reemplazar `window.prompt/confirm/alert` del Constructor por `WizardModal`/modales de confirmación (HU-271). · **Estado:** ✅ (v186) — nuevos `ConfirmDialog` y `PromptModal` en `@merkiai/ui` (patrón "Pagos"); **Nueva página** = `WizardModal` de 2 pasos (tipo en tarjetas → nombre/URL con **validación de unicidad en vivo**); Duplicar/Guardar bloque/Importar = `PromptModal`; eliminar bloque/ítem/colección/registro y aplicar plantilla = `ConfirmDialog`. **Cero `prompt/confirm/alert`** en Constructor y `/colecciones` (AC-1…AC-4). admin 262 verde, tsc limpio.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Nueva página | Wizard: paso 1 **tipo** (tarjetas) → paso 2 **nombre/URL**, con slug auto y **validación de unicidad en vivo** (no dos prompts encadenados) |
| AC-2 | Duplicar / Guardar bloque | Modal de marca con nombre + confirmación; nada de `prompt()` |
| AC-3 | Acciones destructivas | Eliminar página/bloque/colección usa modal de confirmación de la app (no `confirm()`) |
| AC-4 | Cero diálogos nativos | No queda ningún `window.prompt/confirm/alert` en el Constructor ni en `/colecciones` |

## HU-365 — Reorganización de la UI del Constructor por niveles · E13

> Como comerciante, quiero que las acciones estén agrupadas por lo que afectan (sitio / página / bloque) y no en una barra plana, para encontrarlas con pocos clics.

**Estimación:** M (5 puntos) · **Módulo:** reorg de la barra + `AddBlockCatalog` por categorías + drawer "Ajustes de página". · **Estado:** 🟡 Parcial (v189) — **AC-2 ✅** (Exportar página/preset, Backup, Importar en un menú **"··· Avanzado"**); **AC-3 ✅** (drawer **"Ajustes de página"** que agrupa acento + ancho + espaciado, sacándolos de la barra; tipo/SEO/nav llegarán con HU-368); **AC-4 ✅** (catálogo "Agregar bloque" con **pestañas por categoría** —Contenido/Comercio/**Dinámico**/**Globales**/Interacción— + **búsqueda**; categorías virtuales Dinámico=`collection_list`, Globales=`partial_ref`, sin tocar el schema). **Pendiente:** **AC-1** barra de sitio (reubicar Vista previa/Publicar arriba-derecha) y **AC-5** acciones por bloque en "···" — cosméticos.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Barra de sitio | Arriba: selector de página · **+ Nueva** · Duplicar · (derecha) **Vista previa / Publicar** |
| AC-2 | Avanzado en "···" | Exportar página, Exportar como preset, Backup del sitio, Importar pasan a un menú de overflow (acciones poco frecuentes) |
| AC-3 | Ajustes de página (drawer) | Tipo, Ancho, Espaciado, Acento, SEO, Footer, vincular a nav se agrupan como propiedades de **esta página** (no inline en la barra) |
| AC-4 | Catálogo por categorías | "Agregar bloque" en pestañas usando `category` del schema: **Contenido · Comercio · Dinámico (colecciones) · Globales (partials/guardados)** |
| AC-5 | Acciones por bloque | Dejar 2–3 visibles (Editar, Visible) y el resto en "···" por bloque (como filas de Pagos) |

## HU-366 — Outline / árbol del sitio (navegable y reordenable) · E13

> Como comerciante, quiero ver la estructura completa (sitio → navegación → páginas → secciones) en un árbol para orientarme y reordenar.

**Estimación:** M (5 puntos) · **Módulo:** panel izquierdo tipo outline sobre pages/nav_items/page_sections. · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Árbol | Panel: **Sitio → Navegación → Páginas → Secciones**; refleja el orden real |
| AC-2 | Navegar | Clic en una página/sección la abre/enfoca en el lienzo |
| AC-3 | Reordenar | Arrastrar reordena secciones (y, cuando aplique, el orden de páginas/nav) |

## HU-367 — Gestión de Navegación dentro del Constructor · E13

> Como comerciante, quiero editar el menú (con jerarquías padre/hijo) desde el Constructor, para no saltar a otra sección.

**Estimación:** M (5 puntos) · **Módulo:** traer el editor de `nav_items` (de `/contenido`) al hub. · **Estado:** ✅ (v190) — nuevo `NavEditor` en el Constructor (drawer **"Navegación"**): CRUD de `nav_items` vía `/api/admin/nav`, **jerarquía padre/hijo (1 nivel)**, **vincular a página** (href = /slug), toggle visible, sin diálogos nativos (ConfirmDialog). AC-1/AC-2 ✅; AC-3 (niveles por plan) llega con HU-369.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CRUD de nav | Crear/editar/ordenar/eliminar ítems de menú desde el Constructor |
| AC-2 | Jerarquía | Padre/hijo (1 nivel hoy); vincular ítem a una página (sincroniza href con slug) |
| AC-3 | Niveles por plan | El nº de niveles permitidos puede limitarse por plan (ver HU-369/entitlements) |

## HU-368 — Metadatos de página en el Constructor + retirar "Páginas" (`/contenido`) · E13

> Como plataforma, quiero una sola superficie de autoría: el Constructor absorbe lo que hoy hace "Páginas" y esa sección se retira.

**Estimación:** M (5 puntos) · **Módulo:** editor de metadatos (tipo/SEO/footer/nav) en el hub + retiro de `/contenido`. · **Estado:** ✅ (v191) — **AC-1 ✅** metadatos (nombre, slug, tipo, meta título/descr., mostrar en footer) editables en el drawer "Ajustes de página" del Constructor (`savePageMeta` → `/api/admin/cms/pages`); **AC-2 ✅** retiro **condicional por plan**: con el Constructor disponible (flag o entitlement `page_builder`) se **oculta "Páginas"** del menú y `/contenido` **redirige** a `/constructor`; **sin** él, "Páginas" se conserva como editor de respaldo → **cero regresión** (AC-3). Navegación ya cubierta por HU-367.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Metadatos | Etiqueta, slug, tipo, SEO (meta título/descr.), mostrar en footer, vincular a nav — editables en el Constructor |
| AC-2 | Retiro | Se elimina el ítem de menú "Páginas" y la ruta `/contenido` **redirige** al Constructor (301 interno); el permiso `contenido` pasa a gobernar el Constructor |
| AC-3 | Cero pérdida | Todo lo editable en `/contenido` queda cubierto por el Constructor antes de retirarlo (nav incluido) |

## HU-369 — "Modo contenido" por plan (estructura congelada) + candados suaves · E17 (toca E13)

> Como operador, quiero que el plan básico solo elija una plantilla y edite **contenidos y parámetros** (sin tocar la estructura), y que las capacidades superiores se muestren como candados que invitan a mejorar de plan.

**Estimación:** M (5 puntos) · **Módulo:** modo "solo contenido" (bloquea agregar/reordenar/eliminar bloques y layout) + candados visibles con upsell; extiende HU-359. · **Estado:** ✅ (v194) — **AC-1 ✅** "modo contenido" (= sin `layout_avanzado`): se **ocultan** agregar/duplicar/eliminar/reordenar (DnD + flechas) bloques, nueva/duplicar página, aplicar plantilla, guardar/insertar bloque; **sí** se editan textos/imágenes/toggles. **AC-2 ✅** candado suave con **CTA de upgrade** en lugar del "Agregar bloque" ("🔒 Modo contenido · mejora a Pro"); gating server-side por entitlement (las features quedan OFF). **AC-3 ✅** alta en el catálogo (HU-359) de `content_mode`, `editable_chrome`, `site_blueprints` (features) y `max_niveles_nav` (limit).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Estructura congelada | Sin `layout_avanzado`: no se puede agregar/reordenar/eliminar bloques ni cambiar filas; **sí** editar textos/imágenes/toggles |
| AC-2 | Candados suaves | Las features bloqueadas se muestran con chip "Pro/Educación" y CTA de upgrade (no se ocultan), server-side siempre autoritativo |
| AC-3 | Entitlements nuevos | Alta en el catálogo (HU-359) de `content_mode` (feature), `site_blueprints` (feature), `editable_chrome` (feature) y `max_nav_depth`/`max_niveles_nav` (limit) |

## HU-370 — Páginas legales como páginas del Constructor; retirar *Configuración → Legal* · E13

> Como comerciante, quiero editar Términos y Política de privacidad como páginas normales del Constructor, con una sola fuente de verdad.

**Estimación:** S (3 puntos) · **Módulo:** legales como `pages` editables en el Constructor; migrar `store_config.terms_content/privacy_content` y retirar esa edición de *Configuración → Legal*. · **Estado:** ✅ (v192) — el storefront ya prefería el contenido de las páginas `terms`/`privacy` sobre `store_config` (fallback). **AC-1 ✅** fuente única: se editan como páginas en el Constructor. **AC-2 ✅** migración `e17/61` (copia `store_config.terms_content/privacy_content` al cuerpo del bloque de texto de esas páginas **solo cuando está vacío**, scoped por tenant, idempotente; no borra el legacy). **AC-3 ✅** retiro **condicional por plan**: con el Constructor disponible se **oculta "Configuración → Legal"** y `/configuracion/legal` **redirige** a `/constructor`; sin él, se conserva (cero regresión).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Fuente única | Términos y Privacidad se editan como páginas del Constructor (ya existen como `pages`); se deja de usar `store_config.terms_content/privacy_content` |
| AC-2 | Migración | El contenido legal actual de `store_config` se migra a las páginas correspondientes (una vez, idempotente) |
| AC-3 | Retiro | *Configuración → Legal* se retira (o queda solo como enlace a las páginas); el storefront lee las páginas |

## HU-371 — Reparto Configuración ↔ Constructor (mover lo editorial/marca) · E13

> Como plataforma, quiero que lo **editorial/de marca** (nombre, logo, favicon, redes, textos y toggles de footer/nav) se edite en el Constructor ("Ajustes de sitio"), y que *Configuración* quede solo para lo **técnico**.

**Estimación:** M (5 puntos) · **Módulo:** panel "Ajustes de sitio" en el Constructor sobre el subconjunto editorial de `store_config`; *Configuración → General* se adelgaza. · **Estado:** 🟡 Parcial (v193) — **AC-1 ✅** drawer **"Ajustes de sitio"** en el Constructor: nombre, descripción, logo, favicon, **redes** (url + toggle), toggles de **footer** y **navbar**, persistiendo en `/api/admin/config`. **Pendiente AC-2/AC-3:** adelgazar *Configuración → General* (ocultar/retirar esos campos editoriales cuando el Constructor está disponible, para no duplicar) — pendiente de refactor del formulario General.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Ajustes de sitio | Nombre, logo, favicon, redes, toggles de footer (`footer_show_*`) y de nav (`nav_show_*`) se editan en el Constructor |
| AC-2 | Configuración técnica | *Configuración* conserva solo **dominios, pagos, envíos, correos, usuarios, plantillas de correo, legal→enlace** |
| AC-3 | Sin duplicar | Cada ajuste tiene **un único lugar** de edición; nada queda editable en dos sitios |

## HU-372 — Header y Footer como regiones editables (chrome por regiones/partials) · E3

> Como comerciante, quiero construir el encabezado y el pie con bloques (como el resto), para controlar la estructura macro del sitio.

**Estimación:** L (8 puntos) · **Módulo:** regiones globales "header"/"footer" como páginas-partial del sitio, consumidas por el chrome del storefront (reusa HU-356). · **Estado:** 🔲 Pendiente — gated por `editable_chrome`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Regiones | Header y Footer existen como **regiones** editables en el Constructor (páginas-partial reservadas) |
| AC-2 | Render | El storefront usa esas regiones como su chrome (con fallback al header/footer actual si no existen → cero regresión) |
| AC-3 | Gating | Disponible por plan (`editable_chrome`); sin la feature, el chrome sigue siendo el de configuración |

## HU-373 — "Blueprint de sitio": estructuras de sitio seleccionables por plan · E3/E17

> Como comerciante, quiero elegir una **estructura de sitio** completa (varias páginas + navegación + regiones) y no solo el home, según mi plan.

**Estimación:** L (8 puntos) · **Módulo:** *site blueprint* = preset que crea **N páginas + nav + regiones**; catálogo seleccionable, gated por plan (nº de páginas/estructuras). Extiende presets (HU-233/256) y `exportSite`/`importSite`. · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Aplicar blueprint | Elegir una estructura crea de una vez sus páginas + nav + regiones (en borrador) |
| AC-2 | Por plan | Básico: una estructura por defecto; planes superiores: catálogo de estructuras y más páginas (`max_paginas`, `site_blueprints`) |
| AC-3 | Importación con límite | Al aplicar, respeta `max_paginas` (importa/omite según remanente, como los importadores existentes) |

## HU-374 — El tipo de página siembra su estructura de arranque · E13

> Como comerciante, quiero que al crear una página de un tipo (p. ej. "Servicios") nazca con los bloques típicos de ese tipo.

**Estimación:** S (3 puntos) · **Módulo:** mapa `page_type → layout de arranque` que siembra bloques al crear (reusa el motor de "aplicar plantilla"). · **Estado:** ✅ (v195) — **AC-1 ✅** `PAGE_TYPE_SEED` (landing→hero/cards/cta · servicios→hero/cards/cta · acerca→hero/text · faq→hero/faq · contenido→text) siembra los bloques al crear la página desde el wizard; **AC-2 ✅** opt-out ("Crear con estructura de arranque", checkbox marcado por defecto; desmarcarlo crea la página en blanco). `custom` y lo no listado nacen en blanco.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Siembra por tipo | Crear una página de un tipo con estructura definida crea sus bloques por defecto |
| AC-2 | Opt-out | "Página en blanco" sigue disponible; cero regresión para quien no lo use |

## HU-375 — Autosave + estados de publicación + confirmaciones de marca · E13

> Como comerciante, quiero guardado automático y ver claramente si estoy en borrador o publicado, para trabajar sin ansiedad.

**Estimación:** S (3 puntos) · **Módulo:** autosave de ediciones + indicador de estado + un único botón "Publicar". · **Estado:** ✅ (v187) — indicador **"Autoguardado"** (cada edición ya persiste en el acto vía el CMS API) · **chip Borrador/Publicada** por página + botón único **Publicar / Pasar a borrador** (`pages.enabled`, con confirmación de marca al despublicar). Reusa el banner de preview existente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Autosave | Los cambios se guardan solos (con indicador "Guardado"), sin perder trabajo |
| AC-2 | Estado | Indicador claro Borrador/Publicado por página (reusa el banner de preview existente) |
| AC-3 | Publicar | Un solo botón "Publicar" aplica el borrador; confirmaciones con modal de marca |

---

## Entitlements nuevos de la Ola 4 (extienden HU-359)

| Entitlement | Tipo | Cubre |
|---|---|---|
| `content_mode` | feature | Modo "solo contenido" (estructura congelada) · HU-369 |
| `editable_chrome` | feature | Header/Footer editables como regiones · HU-372 |
| `site_blueprints` | feature | Elegir entre estructuras de sitio · HU-373 |
| `max_niveles_nav` | limit | Niveles permitidos en la navegación · HU-367/369 |

**Tiering de referencia:** Básico = `content_mode` (estructura fija, edita contenidos; 1 blueprint; nav 1 nivel; `max_paginas` bajo). Pro = `layout_avanzado`+`estilo_por_pagina`+`editable_chrome`+más páginas. Educación/Portal = `site_blueprints` + `colecciones`/`plantillas_por_tipo` + límites altos.

---

## Orden de implementación (olas) y dependencias

1. **Ola 1 (fundación de autoría):** **HU-350** ✅ (shell unificado) → **HU-351** ✅ (Filas/Columnas) → **HU-352** ✅ (estilo por página). *Reorganiza + añade la capa de layout; cero regresión.* **→ Ola 1 completa.**
2. **Ola 2 (contenido dirigido por datos):** **HU-353** ✅ (colecciones, pieza madre) → **HU-354** ✅ (plantillas por tipo) → **HU-355** ✅ (listado dinámico). **→ Ola 2 completa.**
3. **Ola 3 (facilidad transversal, en paralelo tras Ola 1):** **HU-356** ✅ (partials) · **HU-357** ✅ (biblioteca de medios) · **HU-358** ✅ (bloques guardados). **→ completa.**
- **Transversal (con cada HU):** **HU-359** 🟡 (entitlements + tiering por plan) — catálogo completo; el gating se puebla a medida que cada feature se construye.
4. **Habilita:** el **vertical educación** (E20: cursos como colección + plantilla por tipo) y el **Portal Institucional** (E23: HU-341 multiportal, HU-342 buscador/agregadores se apoyan en HU-353/355).
5. **Ola 4 (autoría unificada v2 · UX + fusión de configuración) — PROPUESTA:** pulido de experiencia, un solo Constructor y migración de lo editorial. Se recomienda **en 5 pasos**, de mayor impacto/menor costo a mayor alcance:
   - **Paso 1 · Quick-wins de UX (sin BD):** **HU-364** (matar diálogos nativos + wizard de Nueva página) → **HU-375** (autosave/estados) → **HU-365** (reorg por niveles + catálogo por categorías). *Alto impacto visible, bajo riesgo.*
   - **Paso 2 · Fusión del hub:** **HU-367** (navegación en el Constructor) → **HU-368** (metadatos + retirar `/contenido`) → **HU-366** (outline del sitio).
   - **Paso 3 · Config editorial → Constructor:** **HU-370** (Legal como páginas, retirar *Configuración → Legal*) → **HU-371** (mover lo editorial de *General* a "Ajustes de sitio").
   - **Paso 4 · Gating por plan:** **HU-369** (modo contenido + candados suaves) + alta de los **entitlements nuevos** (`content_mode`, `editable_chrome`, `site_blueprints`, `max_niveles_nav`).
   - **Paso 5 · Estructura macro:** **HU-372** (header/footer editables) → **HU-373** (blueprint de sitio) → **HU-374** (tipo de página siembra estructura). *Lo más grande; cierra la visión "estructura de sitio por plan".*

> **Nota de dependencia inversa:** HU-341/342 (E23) y el catálogo de cursos (E20) **dependen** de HU-353/354/355. Conviene abordar Constructor v2 **antes** de esos tramos.
> **Nota Ola 4:** es **UX e integración** sobre el motor ya construido (no reescribe nada); HU-368 depende de HU-367; HU-372/373 dependen de HU-356 (partials) y HU-373 de HU-233/256 (presets). El Paso 1 puede empezar de inmediato.
