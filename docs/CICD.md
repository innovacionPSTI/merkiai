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

- **`.github/workflows/ci.yml`** — en push/PR a `test`/`develop`/`main`: **guard de variables
  de entorno** (`scripts/check-env-docs.mjs`, HU-364: falla si el código usa una variable no
  documentada en `.env.example`), `type-check`, `lint`, `test` (unitarias/integración, vía Turbo).
  Gate rápido, sin red externa.
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

Las ramas `develop` y `test` ya existen en local. Lo que falta, en orden:

1. **Publicar las ramas** (dispara el primer deploy de preview en Vercel una vez conectado):

   ```bash
   git push -u origin test develop
   ```

   > `git push origin main` publica a **producción**. Hazlo solo cuando quieras release.

2. **Supabase** — crear las bases de **pruebas** y **staging** separadas de producción
   (ver §7 si están en otra cuenta). No hace falta aplicarles el schema a mano: el
   workflow lo hace con `scripts/e2e-provision.sh`. Solo necesitas la **cadena de
   conexión** (`postgres://…`) de cada una.

3. **Vercel** — conectar el repo, fijar `main` como Production branch, habilitar
   previews para `develop`/`test`, y cargar las variables de runtime **por Environment**
   (Production = prod; Preview = test/staging). Nunca apuntes Preview a la base de prod.

4. **GitHub → Settings → Secrets and variables → Actions** — cargar los secretos/
   variables de §5 **en el Environment `test`** (no a nivel de repo, ver §8).

5. **Protección de ramas** (§4) + **protección del Environment `test`** (§8).

6. **Disparar**: abre un PR de `feature/*` → `test` y confirma que CI y luego E2E
   corren en verde. El provisioning crea plan/tenant/perfil/usuario de prueba solo.

> **El tenant de prueba, sus entitlements y el perfil admin ya NO se crean a mano:**
> el workflow los aprovisiona con `scripts/e2e-provision.sh`. Lo único que puede quedar
> manual es el **usuario de Stack Auth** si decides no cargar `HEXCLAVE_SECRET_SERVER_KEY`
> (crearlo una vez). Para montar un entorno local completo:
> `DATABASE_URL=… PLATFORM_DATABASE_URL=… E2E_ADMIN_EMAIL=… E2E_ADMIN_PASSWORD=… pnpm e2e:provision`.

---

## 7. Entornos en cuentas/correos distintos (Vercel y Supabase)

**Sí, es posible y además es lo recomendable.** Producción y pruebas pueden (idealmente
deben) vivir en **proyectos, organizaciones o incluso cuentas/correos diferentes**. El
pipeline no asume una sola cuenta: solo consume **cadenas de conexión** (Supabase) y
**URLs desplegadas** (Vercel) vía secretos/variables. Mientras cada secreto apunte al
entorno correcto, da igual en qué cuenta esté.

Patrones válidos, de más simple a más aislado:

| Patrón | Supabase | Vercel | Aislamiento |
|--------|----------|--------|-------------|
| A — Un proyecto, varios entornos | 1 proyecto + *branches* (prod/staging/test) | 1 proyecto, vars por Environment | Básico |
| B — Proyectos separados | proyectos distintos (misma org) | 1–2 proyectos | Medio |
| **C — Cuentas/orgs separadas (recomendado)** | **org/cuenta de prod ≠ org/cuenta de test** | **team de prod ≠ team de test** | **Alto** |

Recomendaciones para el patrón C (cuentas/correos distintos):

- **Producción en su propia cuenta/org**, con acceso restringido a quien administra
  releases. Pruebas/staging en otra cuenta (o sub-cuenta) con credenciales propias.
- La **separación la define el valor de cada secreto**, no el código: `TEST_DATABASE_URL`
  y `PLATFORM_DATABASE_URL` apuntan a la(s) base(s) de **la cuenta de pruebas**; las vars
  de runtime de producción viven en el Vercel de **la cuenta de prod**. No se cruzan.
- Usa una **identidad de servicio/máquina** (no un correo personal) como dueña de las
  integraciones de CI, para que el pipeline no dependa de la cuenta de una persona.
- Si prod y plataforma comparten base hoy (single-DB), en pruebas puedes repetir el
  mismo valor en `PLATFORM_DATABASE_URL` = `TEST_DATABASE_URL`; cuando separes la
  plataforma a su propio proyecto/cuenta, solo cambias ese secreto, sin tocar código.

> Regla de oro: **ninguna credencial de pruebas debe poder tocar producción**, y
> viceversa. Cuentas separadas lo garantizan por construcción (no hay forma de que una
> clave de test alcance la base de prod si están en organizaciones distintas).

---

## 8. Higiene de seguridad (evitar brechas)

- **Nada de secretos en el repo.** Todo va en GitHub Secrets / Vercel env vars. Los
  archivos `.env.example` y las semillas **no** llevan valores reales (verificado:
  el provisioning solo recibe credenciales por variables de entorno).
- **Secretos en el *Environment* `test`, no a nivel de repo.** Así solo los jobs que
  declaran `environment: test` (como `e2e.yml`) pueden leerlos, y puedes exigir
  **required reviewers** antes de que un workflow los use (Settings → Environments →
  `test` → *Required reviewers* / *Deployment branches* = solo `test`).
- **Mínimo privilegio en las claves.** Usa claves de Supabase/Stack **del entorno de
  pruebas**, nunca las de producción. La `HEXCLAVE_SECRET_SERVER_KEY` es potente (crea
  usuarios): que sea la del proyecto de **test**. Si no quieres cargarla, omítela y crea
  el usuario de prueba a mano una vez (§5).
- **PRs desde forks no reciben secretos** por defecto (comportamiento de Actions): bien,
  no los relajes. Mantén el trigger de E2E en push a `test` y PR interno hacia `develop`.
- **Rotación.** Si una clave se expone, rótala en Supabase/Stack/Vercel y actualiza el
  secreto; como están por entorno, rotar test no afecta prod.
- **`main` protegida** con PR + aprobación + checks obligatorios (§4): ninguna ruta
  llega a producción sin pasar por review y por el pipeline.
- **Logs.** Los scripts no imprimen credenciales (solo nombres de archivo y el email del
  admin de prueba). No añadas `echo` de `DATABASE_URL`/claves en overrides locales.
