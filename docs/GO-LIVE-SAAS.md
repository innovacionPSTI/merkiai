# Runbook de release — Merkiai SaaS (Ola 1)

> Checklist para **separar producción y salir con los primeros clientes**. Orden: **0 → 9**.
> **[OPS]** = paneles/credenciales tuyas · **[APP]** = ya está en código.
> Referencias: variables → `docs/ENV-VARS-MATRIZ.md` · ramas y CI → `docs/CICD.md` · cobro/pagos → ADR-009 · vault → ADR-007 · olas → `docs/PLAN-OLAS-PRODUCCION.md`.
>
> Versión v260 (nov-2026). Reemplaza el checklist de go-live de sep-2026 (alta multi-tenant ya validada en vivo; ver §9).

---

## 0. Antes de empezar (gates)

- [ ] **Llaves de PayZen** de la tienda de Merkiai (test y producción). Sin ellas no se valida §6.
- [ ] **CI/CD + E2E** cerrado en verde (`test` → `develop`) — se deja para justo antes del release (decisión del dueño).
- [ ] `pnpm env:check` en verde (ninguna variable usada sin documentar).
- [ ] Rama `main` protegida (PR + aprobación + checks), ver `CICD.md` §4.

## 1. Cuentas y proyectos de PRODUCCIÓN **[OPS]**

Con el correo de **producción** (cuentas separadas de dev/test, `CICD.md` §7):

- [ ] **Supabase · TIENDA** (web + admin) y **Supabase · PLATAFORMA** (console). Pueden ser el mismo proyecto al inicio; separarlos después solo cambia variables.
- [ ] **Stack Auth (Hexclave) · 3 proyectos**: web (compradores), admin (comerciantes) y console (operador).
- [ ] **Vercel · 3 proyectos** (web, admin, console) conectados al repo, *Production Branch* = `main`.
- [ ] **DNS**: wildcard `*.merkiai.com` → web; `admin.merkiai.com` → admin; `console.merkiai.com` → console.
- [ ] **AWS KMS (vault)**: `cd infra/kms-vault && AWS_PROFILE=merkiai-prod npx cdk deploy -c env=prod` → crear la access key del usuario IAM `merkiai-prod-vault` (ver `infra/kms-vault/README.md`). Esas llaves van SOLO al console.
- [ ] **Resend**: dominio verificado para los correos de facturación (`facturacion@merkiai.com`).
- [ ] **PayZen (tienda de Merkiai)**: llaves de **producción** a la mano; las de test quedan para dev/test.

## 2. Migraciones **[OPS]** — todas idempotentes, se pueden repetir

```bash
# TIENDA (web/admin): baseline + upgrade + e17/* en orden. En prod SIEMPRE --no-seeds.
DATABASE_URL="postgres://…tienda-prod…" bash scripts/db-apply.sh --no-seeds

# PLATAFORMA (console): platform/01 … 14 en orden.
PLATFORM_DATABASE_URL="postgres://…plataforma-prod…" bash scripts/db-apply-platform.sh
```

- [ ] Tienda: llega hasta `e17/74_payzen_payment_method.sql`.
- [ ] Plataforma: llega hasta `14_fee_invoices.sql` (incluye `10` infra por tenant, `11` vault, `12` billing, `13` Merkiai Pagos, `14` cobro de comisiones).
- [ ] Verificación rápida en plataforma: `select count(*) from plans;` (> 0) y que existan `subscriptions`, `merkiai_payment_accounts`, `fee_invoices`.

## 3. Variables de entorno **[OPS]**

Cargar la columna **prod** de `docs/ENV-VARS-MATRIZ.md` en cada proyecto de Vercel. Puntos que más se olvidan:

- [ ] **`CONSOLE_URL`** en web y admin. `CONTROL_PLANE_URL` ya no se lee: si quedó cargada, bórrala.
- [ ] **`INTERNAL_API_SECRET`** idéntico en las 3 apps de prod, distinto de dev/test (≥ 24 caracteres aleatorios).
- [ ] **`PREVIEW_SIGNING_SECRET`** idéntico en web y admin.
- [ ] **Console**: `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`/`MERKIAI_VAULT_KEY_ALIAS=alias/merkiai-prod-tenant-secrets` (sin esto, en prod el vault falla cerrado).
- [ ] **Console**: `PAYZEN_SHOP_ID`, `PAYZEN_PASSWORD` (`prodpassword_…`), `PAYZEN_PUBLIC_KEY`, `RESEND_API_KEY`, `BILLING_EMAIL_FROM`, **`CRON_SECRET`**.
- [ ] **Web**: `TENANT_RESOLUTION_STRICT=true`; **sin** `DEFAULT_TENANT_ID` ni `DRAFT_SECRET`.
- [ ] **Redeploy** de las 3 apps después de cargar variables (las `NEXT_PUBLIC_*` se fijan en el build).

## 4. Stack Auth en producción **[OPS]**

- [ ] **Trusted Domains**: web = `*.merkiai.com` + dominios propios; admin = `admin.merkiai.com`; console = `console.merkiai.com`.
- [ ] Proyecto **admin**: creación de Teams server-side habilitada (la consola crea el Team del tenant).
- [ ] Registro público deshabilitado en admin y console.
- [ ] *(Puede ir después)* OAuth de Google con keys propias + redirect URIs por subdominio + account-linking por email verificado.
- [x] Cookies host-scoped (default correcto; no forzar dominio de cookie compartido).

## 5. Configuración de la consola (primer ingreso del operador) **[OPS]**

- [ ] **Planes**: precios reales (`price_cents` en centavos de COP) y entitlements.
- [ ] **Merkiai Pagos → Comisión por plan**: % + fijo por plan (parámetro de negocio; ver calculadora de costos).
- [ ] **Presets** de nicho cargados (opcional para el primer cliente).

## 6. PayZen **[OPS]** (requiere las llaves)

- [ ] Back Office PayZen de Merkiai → **URL de notificación (IPN)** = `https://console.merkiai.com/api/billing/payzen/ipn` (modo test y modo producción).
- [ ] Con llaves de **test** en dev: pagar un plan desde *Plan y facturación* con una tarjeta de prueba de PayZen → la suscripción pasa a **Al día**, llega el correo de activación y en la consola aparece en **Suscripciones** con cobro automático = Sí.
- [ ] Rechazo de prueba → **Pago pendiente** + aviso en el panel; tras 3 rechazos o 7 días → **suspendida**; pagar → **reactivada**.
- [ ] Tienda con **PayZen propio** (Configuración → Pagos → PayZen → *Verificar*) → compra de prueba → pedido aprobado.
- [ ] Tienda con **Merkiai Pagos** (alta en consola + elegirlo en el admin) → compra de prueba → pedido aprobado y la comisión aparece en la consola.
- [ ] Cambiar a llaves de **producción** solo en el console de prod.

## 7. Cron diario **[APP+OPS]**

- [x] `apps/console/vercel.json`: 11:00 UTC → `GET /api/internal/billing/sweep` (mora + cobro de comisiones del mes cerrado).
- [ ] `CRON_SECRET` cargado en console (§3). Prueba manual:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://console.merkiai.com/api/internal/billing/sweep` → `{"suspended":[…],"fees":{…}}`.

## 8. Smoke test de release (prod) **[APP+OPS]**

- [ ] Crear un tenant real desde la consola → el dueño recibe la invitación y entra al admin como `super_admin`.
- [ ] El subdominio sirve su tienda; un subdominio inexistente → 404.
- [ ] Aislamiento: un producto creado en el tenant no aparece en otra tienda.
- [ ] El dueño paga su plan (§6) → la tienda queda **activa**.
- [ ] Logs sin 401/500 en `/api/internal/*` ni en `/api/billing/payzen/ipn`.

## 9. Rollback y post-activación

- **Rollback de app**: en Vercel, *Promote* del deploy anterior (las migraciones son aditivas; no hace falta revertirlas).
- **Cobro**: si algo falla con PayZen, vaciar `PAYZEN_*` en el console desactiva el pago de planes y el cobro de comisiones (fail-closed). Ojo: las tiendas que ya estaban en mora siguen su plazo de gracia; para pausar suspensiones, sube temporalmente `BILLING_DUNNING_GRACE_DAYS`.
- **Resolución de tenant**: `TENANT_RESOLUTION_STRICT=false` vuelve al modo interino mientras se corrige.
- [ ] Rotación de secretos agendada (90 días): `SUPABASE_JWT_SECRET`, `INTERNAL_API_SECRET`, `CRON_SECRET`, llaves IAM del vault.
- [ ] Monitoreo (Sentry) activo en las 3 apps.

---

### Historial
- **sep-2026**: alta multi-tenant validada en vivo (aprovisionamiento, config por tenant, login del dueño, storefront por subdominio, aislamiento RLS).
- **nov-2026 (v260)**: cobro de planes, pasarelas de venta PayZen (propia y Merkiai Pagos), comisiones, vault KMS y separación de prod incorporados a este runbook.

### Pendientes de código conocidos (no bloquean el release)
- `api/checkout` y `finalize-daviplata` en service-role → `getMachineDb` (HU-227 resto).
- RLS de `storage.objects` por prefijo de path (hoy aislamiento por path en la app).
