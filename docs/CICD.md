# CI/CD y flujo de ramas — Merkiai

Automatización de integración y despliegue con **tres entornos** mapeados a tres
ramas. GitHub Actions corre las validaciones (CI + E2E) y **Vercel** despliega por
rama. Las pruebas E2E se definen en `apps/e2e` (guía: `docs/E2E-PRUEBAS.md`).

---

## 1. Ramas y entornos

| Rama | Entorno | Propósito | Despliega a |
|------|---------|-----------|-------------|
| `test` | **Test** | Validar features integradas con **E2E** antes de staging | Vercel Preview (proyecto/entorno *test*) + Supabase branch *test* |
| `develop` | **Staging** | Integración continua, QA manual, demo | Vercel Preview (staging) + Supabase branch *staging* |
| `main` | **Producción** | Release estable | Vercel **Production** + Supabase producción |

**Flujo de promoción:**

```
feature/* ──PR──▶ test ──PR──▶ develop ──PR──▶ main
   (CI)         (CI+E2E)      (CI+E2E)        (CI, protegida)
```

- Trabajas en `feature/*` y abres PR hacia `test`. CI (lint/type-check/unit) debe pasar.
- Al mergear en `test`, se despliega el entorno de pruebas y corre **E2E**.
- PR de `test`→`develop`: vuelve a correr CI+E2E; al mergear, deploy a **staging**.
- PR de `develop`→`main`: CI (y E2E si se desea); al mergear, deploy a **producción**.

---

## 2. Workflows (GitHub Actions)

- **`.github/workflows/ci.yml`** — en push/PR a `test`/`develop`/`main`: `type-check`,
  `lint`, `test` (unitarias/integración, vía Turbo). Gate rápido, sin red externa.
- **`.github/workflows/e2e.yml`** — en push a `test` y PR hacia `develop` (o manual):
  aplica el schema a la DB de pruebas (`scripts/db-apply.sh`), instala Playwright y
  corre la suite **contra el entorno desplegado** (no reconstruye el stack en el
  runner, porque depende de Stack Auth y del control-plane). Sube el `playwright-report`.

> `scripts/db-apply.sh` aplica, en orden e idempotente: baseline (`01_schema.sql`) →
> `upgrade.sql` → `migrations/e17/*.sql` → seeds base. Reutilizable en local.

---

## 3. Despliegue (Vercel, por rama)

Configura el proyecto en Vercel (dashboard → Settings → Git):

- **Production Branch = `main`** → cada push a `main` publica a producción.
- **Preview Deployments** habilitados para `develop` y `test` (y PRs).
- Variables de entorno **por Environment** (Production / Preview): define los valores
  de `develop`/`test` en *Preview* y los de producción en *Production*. Si necesitas
  separar `develop` y `test`, usa dos proyectos Vercel o *Environment Variables* con
  *Git Branch* específico.

Con esto el **deploy es automático por rama** y GitHub Actions actúa como **gate de
calidad** (checks obligatorios antes de mergear). No se añade un workflow de deploy
propio para no duplicar los despliegues de Vercel.

---

## 4. Protección de ramas (GitHub → Settings → Branches)

Reglas recomendadas para `develop` y `main`:

- **Require a pull request before merging** (sin push directo).
- **Require status checks to pass**: marca como obligatorios `CI / Lint · Type-check · Unit`
  y, para `develop`, `E2E / Playwright (entorno de pruebas)`.
- **Require branches to be up to date** antes de mergear.
- `main`: además **Require approvals** (1+) y restringe quién puede mergear.

---

## 5. Secretos y variables

En GitHub → Settings → Secrets and variables → Actions (y en el *Environment* `test`):

**Variables** (`vars.*`, no sensibles):
`E2E_WEB_URL`, `E2E_ADMIN_URL`, `E2E_CONSOLE_URL`, `E2E_TENANT_ID`, `E2E_TENANT_HOST`.

**Secretos** (`secrets.*`):
`TEST_DATABASE_URL` (Postgres de pruebas), `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`
(usuario admin de prueba en Stack Auth), `E2E_INTERNAL_SECRET` (= `INTERNAL_API_SECRET`
del admin, para el seed del tenant).

En **Vercel** (por Environment): las variables de runtime de cada app
(`SUPABASE_URL`/claves, Stack Auth, `INTERNAL_API_SECRET`, URLs de control-plane, etc.).
Nunca apuntes el entorno de pruebas a la base de producción.

---

## 6. Puesta en marcha (checklist)

1. Crear ramas `develop` y `test` desde `main`.
2. En Vercel: fijar `main` como Production branch y habilitar previews para `develop`/`test`;
   cargar variables por Environment. Crear la(s) Supabase branch(es) de staging/test y
   aplicarles el schema (`DATABASE_URL=... pnpm db:apply`).
3. Crear el **tenant de prueba** + entitlements + usuario admin (ver `docs/E2E-PRUEBAS.md` §3).
4. Cargar los secretos/variables de GitHub (§5) y activar la protección de ramas (§4).
5. Abrir un PR de prueba hacia `test` y confirmar que CI (y luego E2E) corren en verde.
