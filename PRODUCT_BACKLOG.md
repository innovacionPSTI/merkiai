# Product Backlog — Merkiai (índice)

> **El backlog se dividió en `docs/backlog/`** (antes era un solo archivo de ~5000 líneas) para reducir lecturas y dejarlo listo para migrar a Jira cuando salga la versión operativa. Este archivo es solo el **índice**; el detalle vive en los archivos de abajo. Busca por `HU-XXX` dentro del archivo correspondiente.

## Mapa de archivos

| Archivo | Contenido | HUs |
|---|---|---|
| [`docs/backlog/01-objetivos-y-mapa.md`](docs/backlog/01-objetivos-y-mapa.md) | Objetivos del proyecto · Product backlog · **mapa de épicas (E1–E18)** | — |
| [`docs/backlog/02-historias-usuario.md`](docs/backlog/02-historias-usuario.md) | Historias de usuario (base + refinada con edge cases y story points) | HU-001…~090 |
| [`docs/backlog/03-detalle-mvp-hecho.md`](docs/backlog/03-detalle-mvp-hecho.md) | Detalle del **MVP ya implementado** (E2/E14/E8/E15/E6/E9 + proveedores) | histórico ✅ |
| [`docs/backlog/04-detalle-e16-ia-y-expansion.md`](docs/backlog/04-detalle-e16-ia-y-expansion.md) | E16 (IA) + expansión de roadmap | HU-101…155 |
| [`docs/backlog/05-detalle-e17-plataforma.md`](docs/backlog/05-detalle-e17-plataforma.md) | **E17 multi-tenant / control plane / billing / aislamiento / identidad** | HU-156…175, 192…201 |
| [`docs/backlog/06-detalle-seguridad-y-servicios.md`](docs/backlog/06-detalle-seguridad-y-servicios.md) | Seguridad transversal (HU-202…206) + extracción a servicios (HU-195…199) | HU-195…206 |
| [`docs/backlog/07-detalle-e18-y-pci.md`](docs/backlog/07-detalle-e18-y-pci.md) | E18 (inventario multi-ubicación) + hardening PCI DSS | HU-176…191 |
| [`docs/backlog/08-cobertura-olas-dod-pruebas.md`](docs/backlog/08-cobertura-olas-dod-pruebas.md) | **Cobertura · roadmap por olas · DoD · pruebas** + HUs recientes (HU-207/209/215/216) | E17 en curso |
| [`docs/backlog/JIRA-MIGRATION.md`](docs/backlog/JIRA-MIGRATION.md) | Plan de migración a Jira (HU→issue, épica→epic, ola→fixVersion, estado→status) | — |

## Estado actual (E17 multi-tenant · en curso)

- ✅ **MVP (E1–E15)** completo.
- 🟡 **E17 aprovisionamiento de tenants** operable end-to-end (HU-172/173/208/209/215) — validado con `prueba1`.
- 🟡 **Storefront tenant-scoped** (HU-156/157/207): catálogo, contenido, config, tema, nav, marca y home por tenant + redirect de host sin tenant. Migración `e17/08_rls_themes` pendiente de aplicar en prod.
- 🟡 **Seguridad** (HU-216): auditoría anti service-role + enforcement por lint en el storefront. Ver `docs/HU-216-service-role-audit.md`.
- 🔲 **Pendiente mayor:** admin tenant-scoped con cliente RLS (HU-158, epic por etapas) · config-por-tenant en webhooks/reconcile (HU-216) · billing (HU-192/193/194) · dominios propios (HU-174) · rediseños (HU-210…213).

> **Changelog / progreso de implementación:** `PROGRESS.md` (entradas por versión, más recientes arriba).
