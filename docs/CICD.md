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
  **aprovisiona el entorno** (`scripts/e2e-provision.sh`), instala Playwright y
  corre la suite **contra el entorno desplegado** (no reconstruye el stack en el
  runner, porque depende de Stack Auth y del control-plane). Sube el `playwright-report`.

> **Provisioning automático (`scripts/e2e-provision.sh`), idempotente, en 3 capas:**
> 1. **Plataforma** (`PLATFORM_DATABASE_URL`): aplica `supabase/platform/*.sql` y
>    siembra el plan **`e2e`** (todas las features on + límites altos) y el **tenant
>    de prueba** (`platform/seeds/e2e.sql`).
> 2. **Tienda** (`DATABASE_URL`): corre `scripts/db-apply.sh` (baseline → `upgrade.sql`
>    → `e17/*.sql` → seeds base) y siembra el **perfil admin** `super_admin`
>    (`seeds/e2e-admin.sql`).
> 3. **Stack Auth**: crea el **usuario admin de prueba** por API de servidor
>    (`apps/e2e/scripts/ensure-stack-user.mjs`; el registro está deshabilitado en el
>    panel). Best-effort: sin las claves `HEXCLAVE_*` avisa y sigue (créalo a mano una vez).
>
> El **catálogo y las operaciones de ejemplo** los siembra la suite al arrancar
> (`global-setup`, `E2E_SEED=1`) reusando el endpoint interno de preset. Todo es
> reejecutable sin duplicar. En local: `DATABASE_URL=… E2E_ADMIN_EMAIL=… pnpm e2e:provision`.

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
`E2E_WEB_URL`, `E2E_ADMIN_URL`, `E2E_CONSOLE_URL`, `E2E_TENANT_ID`, `E2E_TENANT_HOST`,
`NEXT_PUBLIC_STACK_API_URL`, `HEXCLAVE_PROJECT_ID`, `HEXCLAVE_PUBLISHABLE_CLIENT_KEY`.

**Secretos** (`secrets.*`):
`TEST_DATABASE_URL` (Postgres de tienda de pruebas), `PLATFORM_DATABASE_URL` (Postgres
de **plataforma** de pruebas; si es single-DB compartida, repite `TEST_DATABASE_URL`),
`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` (usuario admin de prueba en Stack Auth),
`E2E_INTERNAL_SECRET` (= `INTERNAL_API_SECRET` del admin, para el seed del tenant),
`HEXCLAVE_SECRET_SERVER_KEY` (clave de servidor de Stack Auth, para crear el usuario
de prueba automáticamente).

> Si NO configuras las claves `HEXCLAVE_*`, el provisioning salta la creación del
> usuario de Stack Auth y basta con crearlo **una sola vez** a mano en el entorno de
> pruebas (con `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`); el resto sigue siendo automático.

En **Vercel** (por Environment): las variables de runtime de cada app
(`SUPABASE_URL`/claves, Stack Auth, `INTERNAL_API_SECRET`, URLs de control-plane, etc.).
Nunca apuntes el entorno de pruebas a la base de producción.

---

## 6. Puesta en marcha (checklist)

1. Crear ramas `develop` y `test` desde `main`.
2. En Vercel: fijar `main` como Production branch y habilitar previews para `develop`/`test`;
   cargar variables por Environment. Crear la(s) Supabase branch(es) de staging/test
   (tienda y, si aplica, plataforma).
3. Cargar los secretos/variables de GitHub (§5) y activar la protección de ramas (§4).
4. Abrir un PR de prueba hacia `test` y confirmar que CI (y luego E2E) corren en verde.

> **El tenant de prueba, sus entitlements y el perfil admin ya NO se crean a mano:**
> el workflow los aprovisiona con `scripts/e2e-provision.sh`. Lo único que puede quedar
> manual es el **usuario de Stack Auth** si decides no cargar `HEXCLAVE_SECRET_SERVER_KEY`
> (crearlo una vez). Para montar un entorno local completo:
> `DATABASE_URL=… PLATFORM_DATABASE_URL=… E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… pnpm e2e:provision`.
