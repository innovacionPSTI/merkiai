# Plan de migración del backlog a Jira

> **Cuándo:** al sacar la versión que tendrá clientes y estará operativa. Hasta entonces, la fuente de verdad es `docs/backlog/` + `PROGRESS.md`.
> **Objetivo:** documentación de todas las HU (implementadas y pendientes) + gestión del proyecto (release plan, tablero) en Jira, con lookups por JQL en vez de leer archivos grandes.

## Mapeo propuesto

| En el repo | En Jira |
|---|---|
| Épica (E1…E18) | **Epic** (una por E). Nombre = título de la épica. |
| HU-XXX | **Issue** tipo *Story*. `summary` = título de la HU. `description` = detalle + criterios de aceptación (tabla AC-x). Link a su Epic. |
| Estado ✅ / 🟡 / 🔲 | **Status** del workflow: Done / In Progress / To Do (o labels `done`/`wip`/`todo`). |
| Ola / fase de entrega (§ roadmap) | **fixVersion** (p. ej. `Ola 0`, `Ola 1`, …) o *Sprint*. |
| Story points (HU refinada) | campo **Story Points**. |
| Dependencias ("bloqueada por HU-YYY") | **issue link** *is blocked by*. |
| Subtareas / pendientes dentro de una HU | **Sub-task**. |
| Decisiones (ADR, notas de seguridad) | página de **Confluence** enlazada, o comentario en el issue. |

## Convenciones sugeridas

- **Project key:** `MERK`.
- **Labels transversales:** `e17`, `multi-tenant`, `security`, `billing`, `rls`.
- **Componentes:** `web`, `admin`, `console`, `database`, `tenancy`.
- HUs recientes a crear sí o sí (en curso): HU-207, HU-209, HU-215, HU-216, HU-158, HU-214, HU-173.

## Cómo ejecutarla (con el conector de Atlassian conectado)

1. Crear el proyecto `MERK` (o usar uno existente) + las versiones (olas) y componentes.
2. Por cada archivo `docs/backlog/0X-*.md`: crear el Epic y, por cada `HU-XXX`, un issue con su detalle y estado. (Se puede automatizar leyendo cada archivo y llamando `createJiraIssue` por HU.)
3. Enlazar dependencias (`is blocked by`) según las notas del backlog.
4. Cargar el roadmap por olas (`08-cobertura-olas-dod-pruebas.md` §11.1) como fixVersions/orden del tablero.
5. Dejar en el repo un puntero (`PRODUCT_BACKLOG.md` → "gestión en Jira: MERK") y archivar `docs/backlog/` como histórico.

## Nota de tokens

Tras migrar, los lookups del backlog se hacen por **JQL / getJiraIssue** (targeted) en vez de leer archivos. El grueso de tokens seguirá siendo el **código**; Jira solo optimiza la parte de planeación/documentación.
