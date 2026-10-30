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
| [`docs/backlog/10-detalle-constructor-v2.md`](docs/backlog/10-detalle-constructor-v2.md) | **Constructor v2** (E2/E3): autoría unificada + **layout adaptable (Filas/Columnas)** + **colecciones/contenido dirigido por datos** + plantillas por tipo + bloques dinámicos/globales + biblioteca de medios. Habilita educación (E20) y portal (E23). | Ola 1 ✅ (HU-350/351/352) · Ola 2 operativa (HU-355 ✅, HU-353/354 🟡) · HU-359 🟡 · Ola 3 🔲 |
| [`docs/backlog/JIRA-MIGRATION.md`](docs/backlog/JIRA-MIGRATION.md) | Plan de migración a Jira (HU→issue, épica→epic, ola→fixVersion, estado→status) | — |

## Estado actual (E17 multi-tenant · en curso)

- ✅ **MVP (E1–E15)** completo.
- 🟡 **E17 aprovisionamiento de tenants** operable end-to-end (HU-172/173/208/209/215) — validado con `prueba1`.
- 🟡 **Storefront tenant-scoped** (HU-156/157/207): catálogo, contenido, config, tema, nav, marca y home por tenant + redirect de host sin tenant. Migración `e17/08_rls_themes` pendiente de aplicar en prod.
- 🟡 **Seguridad** (HU-216): auditoría anti service-role + enforcement por lint en el storefront. Ver `docs/HU-216-service-role-audit.md`.
- ✅ **Integraciones por instancia — ADR-004** (HU-275…278): pagos, correo y envíos en `integration_instances` (registry data-driven, resolvers instance-first con fallback legacy, admin lista+wizard consistente). Ver `docs/adr/ADR-004`.
- ✅ **Envíos: métodos unificados + cargo adicional + webhook Skydropx** (HU-278/280): tarifa fija como método activable junto a transportadoras; cargo adicional excluyente (fijo/%); webhook con HMAC-SHA512/Bearer + idempotencia; host del API por entorno; cotización robusta.
- ✅ **Multi-dominio por tenant** (HU-279): tabla `tenant_custom_domains`, resolución por tabla (dominios `active`) con fallback legacy, redirect canónico `www`/subdominio→dominio propio, API interna multi-dominio (add/verify/activate/primary/remove + hosting link/unlink + sync de la columna legacy) y UI admin de lista de dominios (agregar/verificar/activar/hacer principal/quitar con instrucciones DNS).
- ✅ **Admin tenant-scoped con RLS** (HU-158): `getAdminDb` acuña JWT (authenticated + is_admin + tenant) → políticas `*_admin_all` acotan por tenant (sin service-role). Auditoría cerrada: los `createServerClient` restantes son legítimos (storage confinado al borde, profiles cross-tenant, internal control-plane gated por `withInternalAuth`); el único hueco (insert de `media_assets`) migrado a RLS.
- 🔲 **Pendiente mayor:** **billing** (HU-192/193/194, pausado — negociación PayZen; cobro manual mientras tanto) · **aislamiento por plan** (HU-200) · preparación a servicios (HU-195…199) · E16 IA (HU-135…145) · E18 multi-ubicación (HU-176…183).
- 🔲 **Ops pendiente:** retirar columnas legacy (`payment_config`, `skydropx_*` en `shipping_config`) tras verificar instancias en prod · revisar email de confirmación de pago (capturar log `[webhook/wompi] Error email confirmación:`).

> **Changelog / progreso de implementación:** `PROGRESS.md` (entradas por versión, más recientes arriba).
