# docs/backlog/ — Backlog dividido

El backlog de Merkiai (antes un único `PRODUCT_BACKLOG.md` de ~5000 líneas) se dividió aquí por secciones para **abrir solo la parte relevante** (menos tokens) y para dejarlo **listo para migrar a Jira**.

## Cómo navegar

- Índice y estado actual: [`../../PRODUCT_BACKLOG.md`](../../PRODUCT_BACKLOG.md) (raíz).
- Para una HU concreta: `grep -rn "HU-207" docs/backlog/`.
- Detalle de la épica en curso (E17): `05-detalle-e17-plataforma.md` + HUs recientes en `08-cobertura-olas-dod-pruebas.md`.

## Archivos

1. `01-objetivos-y-mapa.md` — objetivos + mapa de épicas E1–E18.
2. `02-historias-usuario.md` — historias de usuario (base + refinada).
3. `03-detalle-mvp-hecho.md` — detalle del MVP ya implementado (histórico).
4. `04-detalle-e16-ia-y-expansion.md` — E16 (IA) + expansión de roadmap.
5. `05-detalle-e17-plataforma.md` — E17 multi-tenant / control plane / billing / aislamiento / identidad.
6. `06-detalle-seguridad-y-servicios.md` — seguridad transversal + extracción a servicios.
7. `07-detalle-e18-y-pci.md` — E18 (multi-ubicación) + PCI DSS.
8. `08-cobertura-olas-dod-pruebas.md` — cobertura + roadmap por olas + DoD + pruebas (y HUs recientes HU-207/209/215/216).
9. `09-detalle-e20-e23-vertical-servicios.md` — vertical servicios/educación + portal institucional.
10. `10-detalle-constructor-v2.md` — Constructor v2 (autoría unificada, colecciones, blueprints).
11. `11-detalle-pos-operaciones.md` — **E24 · Operaciones e inventario** (HU-400…410) y **E25 · Punto de venta** (HU-420…427): planteamiento + catálogo formal de HU (inventario/ledger `stock_item`+UoM, BOM con política de consumo, producción/costeo, compras, listas de precio, modificadores, POS offline-first, reportes/tableros/alertas). Capa opt-in por plan; anti-ERP (lo fiscal/contable solo por integración). **Precede y reconcilia E18** (multiubicación = proyección del ledger).

`JIRA-MIGRATION.md` — plan turnkey para migrar todo a un proyecto Jira cuando salga la versión operativa.

## Regla de edición

- Al **actualizar el estado de una HU**, edita el archivo donde vive (busca con grep) — no reconstruyas el archivo entero.
- El **changelog de implementación** va en `PROGRESS.md` (raíz), no aquí.
