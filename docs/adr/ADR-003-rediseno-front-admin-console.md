# ADR-003 — Rediseño de front de Admin y Console (sistema de UI unificado, theme-driven)

> **Estado:** Propuesto · **Fecha:** 2026-10 · **Ámbito:** `apps/admin`, `apps/console`, `packages/ui`
> **Relación:** extiende HU-121 (plantillas de diseño / Tema), HU-210 (design system de panel `--mk-*`), HU-217/218/219/220 (Constructor), HU-233…239 (Presets/Onboarding). **No** toca el storefront público (`apps/web`) salvo por los tokens compartidos del Tema.

## 1. Contexto y objetivo

El panel de administración (`apps/admin`) y la consola de plataforma (`apps/console`) crecieron por funcionalidad, no por diseño. Hoy conviven **dos lenguajes visuales distintos** y varias inconsistencias que afectan la usabilidad y la percepción de producto. El objetivo es definir **un sistema de UI único, coherente y manejado por el Tema** (colores por token, no hardcodeados), con **iconografía armónica** y **patrones de presentación de información consistentes** inspirados en referencias SaaS modernas (estilo VoxAlly: cabeceras con acento, tarjetas de recurso con métricas, tablas con KPIs y acciones por fila, wizards por tarjetas).

Este ADR es la **propuesta documentada**: diagnóstico, principios, sistema de tokens, iconografía, inventario de componentes, mapeo pantalla por pantalla y las **HU nuevas de front (HU-240…248)**. No implementa nada; fija la ruta para que el rediseño sea incremental y sin reprocesos.

## 2. Diagnóstico actual (lo que hay)

| Aspecto | Admin (`apps/admin`) | Console (`apps/console`) | Problema |
|---|---|---|---|
| Tokens de color | `--brand-*` (RGB channels), **indigo** `#4F46E5`, sobreescritos por el Tema activo en `layout.tsx` | `--mk-*` (panel) + `@/lib/styles`, **verde** `#2E5A3B` **hardcodeado** | Dos paletas distintas; el console no respeta el Tema |
| Estilado | Tailwind + clases de marca | **Estilos inline** (`CSSProperties`) + algo de `@merkiai/ui` | Dos técnicas; difícil de mantener/armonizar |
| Iconos | **Emojis** en el sidebar (`📊 ☕ 📦 🎟️…`) | SVG inline ad-hoc (`<Icon d=…/>`) | Sin armonía; no escalan, no heredan color, se ven "de juguete" |
| Cabecera de página | Bloque con clases de marca | `PageHeader` de `@merkiai/ui` | Distinta jerarquía y espaciado |
| Tablas | Tailwind a mano por pantalla | `th/td/scroll` inline | Sin paginación/acciones por fila consistentes |
| Primitivas compartidas | — | `@merkiai/ui`: `PanelShell/Sidebar/PageHeader/PanelCard/StatusBadge/StatCards` | El kit existe pero solo lo usa console, y en verde |

**Conclusión:** ya existe una base (`@merkiai/ui`), pero está incompleta, mono-app (console) y con color fijo. El rediseño la **completa, la hace theme-driven y la adopta en ambas apps**.

## 3. Principios de rediseño

1. **Theme-first:** ningún color hardcodeado en pantallas. Todo sale de **tokens semánticos** que el Tema alimenta (ligado a HU-121). Cambiar el Tema reskinea admin y console sin tocar código.
2. **Un solo kit, dos apps:** los componentes viven en `@merkiai/ui` y los consumen admin y console por igual. El storefront comparte solo los tokens de marca.
3. **Jerarquía por repetición:** las mismas ideas se ven igual en todas partes — cabecera con acento, tarjeta de recurso, KPIs, tabla con kebab, chips de estado/atributo, wizard por tarjetas.
4. **Iconografía armónica:** una sola familia de iconos (SVG de trazo, 1 grosor, tamaños 16/20/24), que heredan `currentColor`. Cero emojis en navegación/acciones.
5. **Densidad cómoda:** aire generoso, radios suaves, sombras sutiles; estados claros (hover/active/selected/disabled) y foco visible (a11y).
6. **Accesibilidad de serie:** contraste AA, foco por teclado, labels y `aria-*`, verificación de contraste del Tema (como la tarjeta "Verificación de contraste" de la referencia).

## 4. Sistema de tokens (theme-driven)

Unificar `--mk-*` y `--brand-*` en **un set de tokens semánticos** (no de marca cruda), en formato canal RGB para soportar opacidad, inyectados en `:root`/`.app-shell` por el layout desde el **Tema activo** (tabla `themes`, por-tenant en admin; tema de operador en console). Light/Dark como variante del mismo set.

```
/* Superficie / estructura */
--ui-bg            /* fondo app            */
--ui-surface       /* tarjetas, sidebar    */
--ui-surface-2     /* hover/sutil          */
--ui-border        /* bordes/divisores     */
--ui-text          /* texto principal      */
--ui-muted         /* texto secundario     */
/* Marca / acento (del Tema) */
--ui-primary       /* acción primaria      */
--ui-primary-weak  /* fondos seleccionados, chips */
--ui-primary-contrast
--ui-accent        /* acento secundario    */
/* Semánticos de estado */
--ui-success  --ui-warning  --ui-danger  --ui-info
/* Forma */
--ui-radius  --ui-radius-lg  --ui-shadow  --ui-shadow-lg
```

Mapeo del Tema (HU-121 / tabla `themes`) → tokens: `color_primary→--ui-primary`, `color_dark→--ui-primary (dark)`, acento→`--ui-accent`, neutrales derivados. La **pantalla de Personalización/Tema** (ver referencia img 9: colores de marca, colores de producto, Claro/Oscuro, verificación de contraste, vista previa en vivo) es la UI que edita estos tokens → es **HU-247**, que se apoya en HU-121.

**Regla dura:** `apps/console/src/lib/styles.ts` (verde hardcodeado) y los emojis del admin **se eliminan** a favor de tokens + iconos. Es el corazón de "más armonía".

## 5. Sistema de iconos (armonía)

- **Una familia** de iconos SVG de trazo (p. ej. estilo Lucide/Feather), grosor 1.5–2, `fill:none; stroke:currentColor`. Se puede adoptar `lucide-react` (ya lista para React) o un set propio de paths en `@merkiai/ui`.
- Tamaños estándar: **16** (inline/acciones), **20** (nav/botones), **24** (encabezados/tiles).
- **Tiles de icono**: recuadro redondeado con fondo `--ui-primary-weak` e icono en `--ui-primary` (como los cards de producto de la referencia).
- Uso semántico fijo (un icono por concepto): navegación, estados, acciones (editar/duplicar/eliminar), objetos (plan, organización, producto, teléfono…).
- **Prohibido** emojis en navegación, botones y encabezados.

## 6. Inventario de componentes (`@merkiai/ui`)

Kit objetivo (✅ = ya existe, ⬆️ = existe y se rehace theme-driven, 🆕 = nuevo):

| Componente | Estado | Qué hace / variantes |
|---|---|---|
| `AppShell` + `AppSidebar` | ⬆️ | Shell con sidebar agrupado (labels de sección, grupos colapsables), selector de workspace arriba, topbar (notificaciones, idioma, avatar). Theme-driven. |
| `Icon` / `IconTile` | 🆕 | Familia única; tile con fondo `primary-weak`. |
| `PageHeaderBar` | ⬆️ | Cabecera-tarjeta con **barra de acento** izquierda, título + subtítulo + acción primaria (como img 1/5/8). |
| `Card` / `PanelCard` | ⬆️ | Contenedor base (surface, radius, shadow). |
| `StatCard` | ⬆️ | KPI: icono-tile + label en mayúsculas + número grande (fila de KPIs, img 5/9). |
| `ResourceCard` | 🆕 | Tarjeta de recurso: título + badge, fila de chips, dato destacado (precio), **grid 2×2 de métricas**, fila de acciones al pie (img 1/9). |
| `Chip` / `Badge` | ⬆️ | Dos variantes: **estado** (success/warning/danger/neutral) y **atributo** (primary-weak). |
| `DataTable` | 🆕 | Tabla con encabezados, celdas-pill, **columna de acciones kebab** (dropdown con destructiva en rojo), selección por checkbox, **paginación** ("Filas por página · 1–N de M"). |
| `RowActionsMenu` (kebab) | 🆕 | Menú de acciones por fila (img 5). |
| `SubNavRail` | 🆕 | Riel vertical de sub-secciones dentro del contenido (Organizaciones; Configuración empresarial — img 1/7/9). |
| `Tabs` | 🆕 | Tabs horizontales dentro de una vista (Usuarios/Roles/Invitaciones; Voz/SMS/WhatsApp; Marca/Tema/… — img 4/7/9). |
| `FilterBar` | 🆕 | Búsqueda + toggle segmentado (Todos/Activo/Inactivo) + dropdowns + **toggle de vista grid/lista** (img 6). |
| `FilterPanel` | 🆕 | Panel lateral de filtros como tarjeta (img 8). |
| `Wizard` / `Stepper` (modal) | 🆕 | Modal multipaso "Paso N de M", footer Cancelar/Atrás/Siguiente, primaria deshabilitada hasta validez (img 2–4). |
| `SelectableCard` | 🆕 | Tarjeta grande seleccionable con check (selección de productos/features — img 3). |
| `Field` (form) | 🆕 | Label + control + **helper text** + estado de error; required `*`. |
| `EditablePricingTable` | 🆕 | Tabla con costo/input/margen calculado (img 4) — reusable para límites/tarifas. |
| `EmptyState` | 🆕 | Vacío con icono, mensaje y CTA. |
| `ColorField` / `PalettePreview` | 🆕 | Edición de color del Tema + vista previa (img 9 → HU-247). |
| `StatusBadge` | ✅ | Ya existe; se alinea a los tokens semánticos. |

## 7. Mapeo pantalla por pantalla

### Console (`apps/console`)

| Pantalla | Hoy | Rediseño (componentes) |
|---|---|---|
| Organizaciones / Tenants (`/`) | Tabla simple verde | `PageHeaderBar` + fila de `StatCard` (Total/Activos/Fallidos/Permisos) + `DataTable` con plan en `Chip`, recarga ON en toggle, estado en `StatusBadge`, **kebab** con acciones (abrir/editar/gestionar usuarios/recargar/otorgar/reducir/eliminar) — img 5. |
| Planes de Facturación (`/planes`) | Tabla + `PlanForm` plano | Lista de `ResourceCard` (chips de productos, precio, grid de métricas, acciones) — img 1; creación con `Wizard` 3 pasos + `SelectableCard` (productos) + `EditablePricingTable` (tarifas) — img 2–4. |
| Presets (`/presets`) | Tabla | Grid de `ResourceCard` + `FilterBar` (buscar/estado/vista) — img 6; formulario con `Field` + `SelectableCard` por nicho. |
| Pool y Créditos | Sub-tab | `SubNavRail` + `StatCard`s de saldo + `DataTable` de movimientos. |
| Teléfonos | Sub-tab | `DataTable` de números con tarifas (costos de operador). |

### Admin (`apps/admin`)

| Pantalla | Hoy | Rediseño (componentes) |
|---|---|---|
| Shell/Sidebar | Emojis | `AppShell`+`AppSidebar` con `Icon` (sin emojis), grupos VOZ/CHAT/… , selector de tienda arriba. |
| Dashboard | Tailwind a mano | Fila de `StatCard` + tarjetas de resumen. |
| Productos / Categorías / Variantes | Tablas/grids a mano | `FilterBar` + grid de `ResourceCard` o `DataTable` con kebab — img 6. |
| Pedidos | Tabla | `DataTable` con estado en `StatusBadge`, filtros, paginación. |
| Clientes | Tabla | `FilterPanel` lateral + `DataTable` con checkbox/kebab/paginación — img 8. |
| Cupones / Blog / Newsletter / Media | Mixto | `FilterBar` + `DataTable`/`ResourceCard`. |
| Contenido / Constructor | Específico | Mantener la lógica; envolver en `PageHeaderBar` + `Tabs`/`PanelCard`. |
| Configuración (`/configuracion/*`, `/usuarios`, `/sistema/apariencia`) | Rail propio | `SubNavRail` "Configuración empresarial" + `Tabs` (Usuarios/Roles/Invitaciones) + `DataTable` de roles en `Chip` — img 7. |
| Onboarding (`/onboarding`, HU-236) | v1 funcional | Rehacer con `Wizard`/`Stepper` + `SelectableCard` (presets/inventario) manteniendo la lógica actual. |
| Apariencia / Tema | `/configuracion/temas` | Pantalla de Personalización del Tema: `Tabs` (Marca/Tema/Textos/Dominios/Localización), `ColorField` + `PalettePreview` + verificación de contraste + vista previa en vivo — img 9 (HU-247). |

## 8. HU nuevas de front (cluster HU-240…248)

> Cluster **"Sistema de UI unificado (front de panel)"**. Enabler: HU-240 va primero (tokens + iconos + kit base). Cada pantalla migra sin cambiar su lógica de negocio.

- **HU-240 · Fundaciones de UI: tokens theme-driven + iconografía + kit base.** *(Enabler.)* Set de tokens semánticos `--ui-*` (light/dark) alimentado por el Tema; familia única de iconos (`Icon`/`IconTile`); completar `@merkiai/ui` con los primitivos base (`AppShell`, `PageHeaderBar`, `Card`, `StatCard`, `Chip`, `Field`, `EmptyState`). Elimina `lib/styles` verde del console y emojis del admin. **L.**
- **HU-241 · DataTable + RowActionsMenu + paginación.** Tabla estándar con kebab, selección, paginación y celdas-pill. **M.**
- **HU-242 · ResourceCard + FilterBar + FilterPanel + vista grid/lista.** Tarjeta de recurso con métricas y los patrones de filtrado/vista. **M.**
- **HU-243 · Wizard/Stepper modal + SelectableCard + EditablePricingTable.** Patrón de asistente por tarjetas y tabla editable. **M.**
- **HU-244 · Rediseño Console.** Migrar Organizaciones, Planes, Presets, Pool y Créditos, Teléfonos al kit. **L.**
- **HU-245 · Rediseño Admin — shell + navegación + Dashboard.** `AppSidebar` con iconos, selector de tienda, Dashboard con `StatCard`. **L.**
- **HU-246 · Rediseño Admin — listados y Configuración.** Productos/Categorías/Pedidos/Clientes/Cupones/… + Configuración con `SubNavRail`+`Tabs`+`DataTable`. **L.**
- **HU-247 · Personalización del Tema (UI).** Pantalla de edición del Tema (marca/producto, claro/oscuro, verificación de contraste, vista previa en vivo); se apoya en HU-121. **M/L.**
- **HU-248 · Accesibilidad y pulido.** Contraste AA, foco por teclado, `aria-*`, estados vacíos/carga/error consistentes, responsive. **M.**

**Dependencias:** HU-240 precede a todo. HU-241/242/243 (componentes) preceden a HU-244/245/246 (pantallas). HU-247 depende de HU-240 + HU-121. HU-248 cierra.

## 9. Orden sugerido de implementación

1. **HU-240** (fundaciones) — desbloquea todo y ya elimina las dos mayores incoherencias (verde del console, emojis del admin).
2. **HU-241 + HU-242 + HU-243** (componentes de datos, tarjetas y wizard).
3. **HU-244** (console — superficie pequeña, buen piloto end-to-end del kit).
4. **HU-245 + HU-246** (admin — shell y pantallas).
5. **HU-247** (Tema) y **HU-248** (a11y/pulido) para cerrar.

## 10. No-objetivos

- No se rediseña el **storefront** público (`apps/web`); solo comparte tokens del Tema.
- No se cambian **reglas de negocio** ni endpoints; es migración de presentación.
- No se adoptan los **dominios** de la referencia (créditos/pool, motores de voz, etc.); solo su **presentación**.
- No se obliga a una librería de iconos específica; se fija el **criterio** (familia única de trazo) — la elección concreta (Lucide vs set propio) se decide en HU-240.
