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

## HU-350 — Autoría unificada: crear y construir en un solo hub (Fase 0) · E3/E13

> Como comerciante, quiero crear una página y construirla en el mismo lugar, para no saltar entre "Páginas" (crear) y "Constructor" (editar) y entender el flujo de principio a fin.

**Estimación:** M (5 puntos) · **Módulo:** reorganización de IA del admin (fusiona `/contenido` "Páginas" + `/constructor`), entrada "Nueva página" que abre el lienzo, graduar el Constructor fuera del flag `pageBuilder` · **Estado:** 🟡 Parcial (v167) — **hecho:** **crear página** ("+ Nueva página") y **duplicar página** desde el propio Constructor (crear cascarón → abre el lienzo en la página nueva, nace en **borrador**; duplicar vía export→import); lista de páginas en estado local del hub (AC-1/AC-3/AC-4). **Pendiente:** fusionar la vista de lista completa de `/contenido` dentro del hub (AC-2) y **graduar el flag `pageBuilder` a entitlement `page_builder`** (HU-359, AC-5). *Reorganiza piezas existentes, no reescribe el motor.* **Base de toda la ola.**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Crear en el hub | "Nueva página" (label/slug/tipo/meta) se hace **dentro del Constructor** y abre directamente el lienzo construible |
| AC-2 | Lista unificada | "Páginas" pasa a ser la lista de páginas **dentro del hub** (filtrable por tipo/estado); editar abre el lienzo |
| AC-3 | Flujo secuencial | Un solo recorrido visible: crear → elegir plantilla de arranque → construir → estilar → añadir al menú → previsualizar → publicar (reusa HU-128/251/128 v2) |
| AC-4 | Duplicar página | Clonar una página completa desde la lista (reusa export/import HU-255 internamente), en borrador |
| AC-5 | Cero regresión | Páginas y permisos actuales siguen funcionando; el flag se retira sin pérdida de funcionalidad |
| AC-6 | Gating | Respeta rol (`contenido`) y plan; sin cambios en RLS |

---

## HU-351 — Capa de layout: Filas y Columnas por presets · E3

> Como comerciante, quiero elegir cómo se organizan los bloques de una página (en columnas, no solo apilados), para construir páginas ricas sin depender de un diseño fijo.

**Estimación:** L (8 puntos) · **Módulo:** metadato de ubicación en `page_sections` (`row_id`, `row_layout` = preset, `col_index`) + agrupación en el renderer a **CSS Grid** (ambos caminos: home-blocks y SectionRenderer/CMS) + *picker* visual de proporciones en el Constructor + safelist de clases de grid · **Estado:** 🟡 Parcial (v168) — **hecho (v168):** migración `e17/54` (columnas `row_id`/`row_layout`/`col_index`, aditivas nullable) + tipos; **helper puro `groupSectionsIntoRows`** + `parseLayout`/`cellSpanClass` (clases `lg:col-span-*` en map literal, sin safelist) con tests (9); **render de filas en el path CMS `/[slug]`** (sin `row_id` = fila full-width idéntica → **cero regresión**; con `row_id` = **CSS Grid de 12** que **apila en móvil**). **(v169) picker en el Constructor:** botón **"⬓ Unir ↑"** combina un bloque con el de arriba en una fila, badge "Fila · N col", **selector de proporciones** (½+½, 8+4, ⅓×3…) en la primera celda y **"Separar"** para volver a ancho completo; persiste `row_id`/`row_layout`/`col_index` por el CMS API (el validador ignora esas claves). **Portabilidad (AC-7):** los campos de fila viajan en el paquete de página (`PACKAGE_SECTION_COLS`) → export/import y **duplicar página** preservan el layout. **(v170) path home cableado:** la misma agrupación en el home cuando la tienda tiene secciones propias (el fallback de plantilla queda lineal). **Pendiente (menor):** ajustes responsive por breakpoint (ocultar/reordenar por dispositivo). Depende de HU-350. **Ops:** aplicar `e17/54` + deploy web/admin. **AC-1…AC-7 cubiertos salvo el ajuste responsive fino.**

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

**Estimación:** S (3 puntos) · **Módulo:** overrides por página (acento/ancho/espaciado por **tokens**) que caen en cascada sobre el tema activo (HU-247) + fila/sección (HU-253); editor "Estilo de la página" · **Estado:** 🔲 Pendiente — separa el eje "estilo" del eje "estructura" (HU-351) y "contenido".

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cascada | Estilo efectivo = tema global (HU-247) → override de página → estilo de fila/sección (HU-253); todo por **tokens**, sin colores fijos |
| AC-2 | Alcance acotado | Override limitado a acento, ancho de contenedor y escala de espaciado (no un tema paralelo completo) |
| AC-3 | Default sin efecto | Sin override, la página hereda el tema → cero regresión |
| AC-4 | Portabilidad | El override viaja en el paquete de Página/Preset |

---

## HU-353 — Colecciones / tipos de contenido dinámicos (pieza madre) · E2

> Como editor, quiero definir tipos de contenido reutilizables (noticia, evento, curso, persona, documento) con sus campos y gestionar sus registros, para no construir a mano cada página de contenido repetido.

**Estimación:** XL (13 puntos) · **Módulo:** `collections` (definición de tipo + esquema de campos, por tenant) + `collection_items` (registros) + RLS + gestor de registros en el admin + API scoped · **Estado:** 🔲 Pendiente — *pieza madre* del contenido dirigido por datos; depende de HU-350.

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

**Estimación:** L (8 puntos) · **Módulo:** plantilla por colección (layout + bloques con *placeholders* que leen campos del registro) + ruta dinámica `/[collection]/[slug]` que resuelve el registro y aplica la plantilla · **Estado:** 🔲 Pendiente — depende de HU-351 (layout) + HU-353 (colecciones).

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

**Estimación:** M (5 puntos) · **Módulo:** nuevo `section_type` de **listado dinámico** que consulta una colección (fuente configurable: toda / filtro por campo / manual) con orden/límite/paginación; render server-side scoped · **Estado:** 🔲 Pendiente — **generaliza `product_carousel` (HU-286 v2)** a cualquier colección; depende de HU-353.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Fuente configurable | Elegir colección + filtros por campo (p. ej. categoría/fecha) + orden + límite + paginación, desde el editor del bloque |
| AC-2 | Insertable en cualquier página | Aparece en "Agregar bloque" (HU-268) y cae en una celda de la grilla (HU-351) |
| AC-3 | Estilo por tokens | Tarjetas estiladas por tokens de tema → se "viste" por plantilla; viaja en el paquete de página/preset |
| AC-4 | Generalización | `product_carousel` (HU-286 v2) se modela como un caso de este bloque (colección = productos) sin perder su comportamiento |

---

## HU-356 — Bloques globales / partials reutilizables · E3

> Como editor, quiero editar una vez elementos compartidos (franja superior, CTA, pie, aviso) y que se reflejen en todo el sitio, imprescindible para portales con muchas páginas.

**Estimación:** M (5 puntos) · **Módulo:** bloque "global" (definición única referenciada desde varias páginas) + resolución en el renderer + edición centralizada · **Estado:** 🔲 Pendiente.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definir una vez | Un partial (p. ej. "franja de admisiones") se edita en un solo lugar |
| AC-2 | Reutilizar | Se inserta por referencia en N páginas; un cambio se refleja en todas |
| AC-3 | Preview/portabilidad | Respeta borrador/preview (HU-128) y viaja en el paquete de sitio (HU-123) |

---

## HU-357 — Biblioteca de medios · E2/E13

> Como editor, quiero una biblioteca para reutilizar imágenes/archivos entre páginas, para no re-subir el mismo recurso una y otra vez.

**Estimación:** M (5 puntos) · **Módulo:** índice de medios por tenant (sobre el Storage ya usado) + selector reutilizable en el widget `image`/`file` (HU-264) + metadatos (alt, nombre) · **Estado:** 🔲 Pendiente (estaba como roadmap de E2).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Reutilización | Elegir un recurso ya subido desde cualquier campo de imagen/archivo |
| AC-2 | Gestión | Listar/buscar/eliminar medios del tenant; `alt` editable (a11y/SEO) |
| AC-3 | Multi-tenant | Scoped por `tenant_id` + RLS; buckets como hoy |

---

## HU-358 — Biblioteca de bloques guardados · E3

> Como comerciante, quiero guardar una sección ya configurada como reutilizable y volver a insertarla, para acelerar la creación de páginas similares.

**Estimación:** S (3 puntos) · **Módulo:** guardar un bloque/sección (con su contenido y estilo) como plantilla de bloque del tenant + reinserción desde "Agregar bloque" · **Estado:** 🔲 Pendiente — extiende la idea de "guardar como preset" (HU-256) al nivel de bloque.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Guardar | "Guardar bloque" captura tipo + contenido + estilo (settings) como reutilizable del tenant |
| AC-2 | Reinsertar | Aparece en el catálogo "Agregar bloque" (HU-268) y se inserta como copia editable |
| AC-3 | Portabilidad | Viaja en el paquete de sitio/preset |

---

## HU-359 — Entitlements del Constructor + tiering por plan · E17 (toca E2/E3)

> Como operador de plataforma, quiero habilitar cada funcionalidad del Constructor según el plan del tenant, para empaquetar capacidades (layout avanzado, colecciones, portal) en distintos planes comerciales sin tocar código.

**Estimación:** M (5 puntos) · **Módulo:** alta de **features + limits** del Constructor v2 en el catálogo de entitlements (`@merkiai/tenancy/entitlements`, HU-173) + **gating en 3 capas** (UI `tenantHasFeature` / API `requireFeature`·`requireWithinLimit` / datos solo RLS para aislamiento, HU-239) + asignación por plan desde la consola (editor de planes HU-239 v2). **No construye sistema nuevo: puebla el existente.** · **Estado:** 🔲 Pendiente — transversal a HU-350…358; se implementa junto a cada feature.

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

## Orden de implementación (olas) y dependencias

1. **Ola 1 (fundación de autoría):** **HU-350** (shell unificado) → **HU-351** (Filas/Columnas) → **HU-352** (estilo por página). *Reorganiza + añade la capa de layout; cero regresión.*
2. **Ola 2 (contenido dirigido por datos):** **HU-353** (colecciones, pieza madre) → **HU-354** (plantillas por tipo) → **HU-355** (listado dinámico).
3. **Ola 3 (facilidad transversal, en paralelo tras Ola 1):** **HU-356** (partials) · **HU-357** (biblioteca de medios) · **HU-358** (bloques guardados).
- **Transversal (con cada HU):** **HU-359** (entitlements + tiering por plan) — se puebla a medida que cada feature se construye; no es una fase aparte.
4. **Habilita:** el **vertical educación** (E20: cursos como colección + plantilla por tipo) y el **Portal Institucional** (E23: HU-341 multiportal, HU-342 buscador/agregadores se apoyan en HU-353/355).

> **Nota de dependencia inversa:** HU-341/342 (E23) y el catálogo de cursos (E20) **dependen** de HU-353/354/355. Conviene abordar Constructor v2 **antes** de esos tramos.
