# Product Backlog — Merkiai (índice)

> **El backlog se dividió en `docs/backlog/`** (antes era un solo archivo de ~5000 líneas) para reducir lecturas y dejarlo listo para migrar a Jira cuando salga la versión operativa. Este archivo es solo el **índice**; el detalle vive en los archivos de abajo. Busca por `HU-XXX` dentro del archivo correspondiente.

## Mapa de archivos

| Archivo | Contenido | HUs |
|---|---|---|
| [`docs/backlog/01-objetivos-y-mapa.md`](docs/backlog/01-objetivos-y-mapa.md) | Objetivos del proyecto · Product backlog · **mapa de épicas (E1–E23)** | — |
| [`docs/backlog/02-historias-usuario.md`](docs/backlog/02-historias-usuario.md) | Historias de usuario (base + refinada con edge cases y story points) | HU-001…~090 |
| [`docs/backlog/03-detalle-mvp-hecho.md`](docs/backlog/03-detalle-mvp-hecho.md) | Detalle del **MVP ya implementado** (E2/E14/E8/E15/E6/E9 + proveedores) | histórico ✅ |
| [`docs/backlog/04-detalle-e16-ia-y-expansion.md`](docs/backlog/04-detalle-e16-ia-y-expansion.md) | E16 (IA) + expansión de roadmap + **ola PDP (283…287)** + **E19 Club VIP / early access (288…296)** | HU-101…155, 283…296 |
| [`docs/backlog/05-detalle-e17-plataforma.md`](docs/backlog/05-detalle-e17-plataforma.md) | **E17 multi-tenant / control plane / billing / aislamiento / identidad / infra dedicada** | HU-156…175, 192…201, 360…363 |
| [`docs/backlog/06-detalle-seguridad-y-servicios.md`](docs/backlog/06-detalle-seguridad-y-servicios.md) | Seguridad transversal (HU-202…206) + extracción a servicios (HU-195…199) | HU-195…206 |
| [`docs/backlog/07-detalle-e18-y-pci.md`](docs/backlog/07-detalle-e18-y-pci.md) | E18 (inventario multi-ubicación) + hardening PCI DSS | HU-176…191 |
| [`docs/backlog/08-cobertura-olas-dod-pruebas.md`](docs/backlog/08-cobertura-olas-dod-pruebas.md) | **Cobertura · roadmap por olas · DoD · pruebas** + HUs recientes (HU-207/209/215/216) | E17 en curso |
| [`docs/backlog/09-detalle-e20-e23-vertical-servicios.md`](docs/backlog/09-detalle-e20-e23-vertical-servicios.md) | **Vertical Servicios/Educación**: E20 (cobros recurrentes/matrículas) · E21 (formularios/trámites/certificados) · E22 (marketing & analytics) · E23 (portal institucional, horizonte) | HU-310…343 🔲 |
| [`docs/backlog/10-detalle-constructor-v2.md`](docs/backlog/10-detalle-constructor-v2.md) | **Constructor v2** (E2/E3): autoría unificada + **layout adaptable (Filas/Columnas)** + **colecciones/contenido dirigido por datos** + plantillas por tipo + bloques dinámicos/globales + biblioteca de medios. Habilita educación (E20) y portal (E23). | Ola 1 ✅ (HU-350/351/352) · Olas 1-3 ✅ · HU-359 🟡 · Ola 4 propuesta (HU-364…375 UX/unificación) |
| [`docs/backlog/11-detalle-pos-operaciones.md`](docs/backlog/11-detalle-pos-operaciones.md) | **E24 Operaciones e inventario** + **E25 Punto de venta** | HU-400…427 |
| [`docs/backlog/12-detalle-e26-infra-celdas.md`](docs/backlog/12-detalle-e26-infra-celdas.md) | **E26 Infra multi-celda** (ADR-008) | HU-430…437 |
| [`docs/backlog/13-detalle-e27-cartera.md`](docs/backlog/13-detalle-e27-cartera.md) | **E27 Cartera operativa** (ADR-010) | HU-450…457 |
| [`docs/backlog/14-detalle-e28-i18n.md`](docs/backlog/14-detalle-e28-i18n.md) | **E28 Idiomas y mercados** (ADR-011) | HU-460…468 |
| [`docs/backlog/JIRA-MIGRATION.md`](docs/backlog/JIRA-MIGRATION.md) | Plan de migración a Jira (HU→issue, épica→epic, ola→fixVersion, estado→status) | — |

## Estado actual (verificado contra el código · v291 · nov-2026)

| Épica | Estado | Qué falta |
|---|---|---|
| E1–E15 · MVP (tienda, carrito, checkout, pagos, envíos, correo, blog, admin, SEO) | ✅ | Login social (HU-111), carrito abandonado (HU-109), click & collect (HU-110/181), 2FA (HU-117), historial de versiones CMS (HU-127), a11y WCAG formal (HU-154), Core Web Vitals (HU-155), Sentry en admin/consola (HU-170b) |
| E2/E3 · Constructor v2 (Olas 1–4) | ✅ | — |
| E16 · IA | 🔲 | Cimientos (HU-135…137) y funciones (HU-118/119/138…145); requiere decidir proveedor |
| E17 · Plataforma SaaS | 🟡 | Billing PayZen en pruebas (HU-440/441), aislamiento por plan (HU-200), vault por tenant (HU-362), despliegue dedicado (HU-360/363), env final de producción (HU-364), dominios de correo (HU-175) |
| E18 · Multi-ubicación | 🟡 | Reservas por ubicación (HU-177), ruteo de despacho (HU-179), click & collect (HU-181) |
| E19 · Club VIP | ✅ MVP | Segmentación por IA (HU-295), campañas recurrentes (HU-296) |
| E20–E23 · Vertical servicios / portal | 🔲 | Todo (HU-310…343) |
| E24 · Operaciones e inventario | ✅ | — |
| E25 · Punto de venta | 🔲 | Todo (HU-420…427) |
| E26 · Infra multi-celda | 🟡 | Hosting/Storage/caché en curso (HU-431/432/434); celdas, Neon, cómputo portable (HU-430/433/435…437) |
| E27 · Cartera | ✅ | Cartera en el POS (HU-457, depende de E25) |
| E28 · Idiomas y mercados | ✅ | Traducción con IA (HU-464 AC-4, depende de E16) |
| Seguridad transversal | 🟡 | CORS de APIs públicas (HU-202), rotación de llaves (HU-184), logging seguro (HU-185), PCI SAQ A + integridad de scripts (HU-186/187) |
| Servicios / arquitectura | 🔲 | Bounded contexts, eventos/outbox, observabilidad distribuida (HU-195…199) |

Los estados de cada HU se verificaron contra el código en v291 (marca **"verificado v291"** en la línea de estado de las HU que cambiaron).

> **Changelog / progreso de implementación:** `PROGRESS.md` (entradas por versión, más recientes arriba).
