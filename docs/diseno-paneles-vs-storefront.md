# Diseño: dos sistemas de apariencia independientes

> Referencia de arquitectura de UI. Evita conflatar el *chrome* de las herramientas
> internas con el theming de la tienda pública. Base: AD-37 AC-8, HU-210, HU-207.

## Los dos sistemas (no fusionar)

| | **Paneles (herramientas)** | **Storefront (tienda)** |
|---|---|---|
| Qué | Chrome de console + admin: sidebar, topbar, cards, badges | Apariencia de la tienda pública que ve el comprador |
| Quién lo controla | Operador de plataforma / comerciante-como-usuario del panel | Comerciante, desde el admin (Apariencia) |
| Fuente de tokens | Design system `@merkiai/ui/panel` + `admin_config` (accent/sidebar del admin) | `themes` / `theme-css` por-tenant |
| Namespace CSS | **`--mk-*`** | **`--brand-*` / `--theme-*`** |
| Dinámico | No (o marca fija del panel) | Sí — editable y **por-tenant** |
| App | `apps/console`, `apps/admin` | `apps/web` |
| HU | F-02, AD-37, HU-208/210/211/212/213 | HU-081, HU-121, HU-122a/b/c, HU-115, HU-128/129, HU-207 |

## Reglas

1. **Namespaces separados.** `packages/ui` aloja componentes de ambos mundos, pero cada uno lee **solo** su namespace de tokens. Nunca mezclar `--mk-*` con `--brand-*`.
2. **El storefront no hereda el preset de panel** (rompería el white-label: cada tienda se tematiza sola). Ni el panel hereda el theme de una tienda.
3. **Carriles paralelos.** Rediseño de paneles (HU-210/211/212/213) y theming de la tienda (HU-081/121/122) avanzan por separado.
4. **Multi-tenant (E17).** Tanto `themes` (storefront) como `admin_config` (panel del comerciante) pasan de singleton `id=1` a **fila-por-tenant** en **HU-207**. Esa es la única intersección real: ambos se editan desde el admin y ambos deben ser por-tenant — pero siguen siendo tokens/sistemas distintos.

## Sobre Tailwind

- No hace falta quitar Tailwind de nada. web/admin ya lo usan; la consola usa inline hoy.
- **HU-213** (opcional) unifica los **paneles** en Tailwind con un preset compartido de tokens `--mk-*`. No toca el storefront.
- El theming del storefront seguirá con sus variables CSS por-tenant inyectadas en `apps/web`, independientemente de si los paneles usan Tailwind o inline.
