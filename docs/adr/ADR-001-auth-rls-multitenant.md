# ADR-001 — Autenticación y aislamiento de datos multi-tenant

- **Estado:** Aceptada · **PoC validado contra Supabase real (2026-08-24)** · **Fecha:** 2026-08 · **HU:** HU-171 (spike, cerrada) → HU-156
- **Decisores:** Arquitectura Merkiai · **Relacionado:** `PRODUCT_BACKLOG.md → Detalle E17 · Arquitectura de referencia`

## Contexto

Merkiai evoluciona de single-tenant (una tienda por instalación) a **plataforma multi-tenant + SaaS**: muchas tiendas (tenants) desde un mismo despliegue, resueltas por host. La prioridad no negociable es **cero fugas de datos entre organizaciones**. Hay que decidir (1) el modelo de identidad y (2) la estrategia de aislamiento de datos, sin acoplar E17 a supuestos sin validar.

Restricciones vigentes: se mantiene **Supabase/PostgreSQL** con RLS; el stack de identidad actual es **Stack Auth (Hexclave)**; el data-layer actual accede server-side con `service-role` (que **omite RLS**).

## Decisión

### 1. Identidad — Stack Auth Teams = tenants
- **1 Team = 1 negocio-cliente (tenant).** Un usuario puede pertenecer a varios Teams; el tenant activo es **contexto**, no identidad.
- Cada Team se **espeja** a una fila `tenants` (vía webhook de Stack Auth); `serverMetadata` porta `tenant_id`/plan.
- **RBAC:** *Team Permissions* para roles por tienda (`store:admin`, `store:editor`, …); *Project Permissions* para el operador de plataforma (`platform:operate`).
- **No** se adopta FusionAuth (sólo tendría sentido con identidad self-hosted o branding de login por tenant).

### 2. Aislamiento — RLS como frontera dura, por **claim `tenant_id` en JWT** (estrategia primaria)
- Patrón oficial Hexclave↔Supabase: una server action firma un **JWT de Supabase** (`SUPABASE_JWT_SECRET`) con el claim `tenant_id` (= Team activo, verificado); el cliente Supabase lo pasa por el callback `accessToken`.
- Las políticas RLS filtran por `auth.jwt() ->> 'tenant_id'`.
- El plano de tienda usa el rol **`authenticated`/`anon` (sujeto a RLS)**, **nunca `service-role`**. Aunque una query olvide el filtro, la RLS impide la fuga.
- **`service-role` sólo en el control plane** (operaciones cross-tenant auditadas).
- **Fallback (rutas server-only: webhooks, cron, ISR host-resueltos):** GUC por request (`SET LOCAL app.current_tenant` dentro de la transacción, sobre el pooler) + rol dedicado; las policies aceptan `auth.jwt()` **o** `current_setting`.

### 3. Configuración por tenant
- Los singletons (`store_config`, `payment_config`, `shipping_config`, `admin_config`, `themes`) pasan de `CHECK id = 1` a **una fila por `tenant_id`**.

### 4. Routing de datos (costura desde el inicio)
- Columna `tenants.db_ref` + **connection factory** en `@merkiai/tenancy`; default = BD compartida (pooled + RLS). Habilita niveles compartido / schema / BD dedicada por plan (HU-200) sin reescritura.

## Alternativas consideradas

| Alternativa | Decisión | Motivo |
|---|---|---|
| FusionAuth (identidad separada por tenant) | Descartada | Stack Auth Teams cubre el caso; FusionAuth añade operación sin beneficio actual |
| RLS por **GUC** como estrategia primaria | Reemplazada por JWT-claim | El patrón soportado por Hexclave↔Supabase es JWT; GUC queda como fallback server-only |
| Seguir usando `service-role` + filtro en la app | Descartada | El service-role omite RLS → un `.eq` olvidado = fuga; sin barrera real |
| Schema-per-tenant / BD-per-tenant como base | Descartada como default | Fricción de migraciones/PostgREST; se ofrece como nivel de plan (HU-200), no como base |

## Consecuencias

**Positivas:** aislamiento garantizado por RLS (barrera real, no convención); patrón oficial soportado; desacople del proveedor de identidad respecto del tenant; costura de routing lista para ofrecer aislamiento por plan.

**Negativas / costo:** hay que **mover el data-layer de `service-role` a un rol sujeto a RLS** en el plano de tienda (refactor acotado pero transversal); el JWT porta el tenant activo → cambiar de tenant re-emite el token; se añade una BD de plataforma (proyecto Supabase propio) para el control plane.

## Hallazgo (ago-2026): el proyecto Supabase usa JWT Signing Keys asimétricas

Verificado en el dashboard (Settings → API → **JWT Keys**): el proyecto está en el modelo nuevo de **signing keys asimétricas** (pestañas *JWT Signing Keys* / *Legacy JWT Secret* / *Create Standby Key*). Esto define dos caminos:

- **A · Legacy HS256 (para el PoC y arranque):** usar el **Legacy JWT Secret** (pestaña homónima) como `SUPABASE_JWT_SECRET`; `mintTenantJwt` (HS256) funciona sin cambios. Contra: Supabase empuja a migrar; el legacy podría deprecarse.
- **B · Third-Party Auth (recomendado a producción):** configurar **Stack Auth como issuer** en Supabase (validación por **JWKS** asimétrico) y **poner `tenant_id` como claim en el token de Stack Auth** (Team activo). Se pasa el token de Stack directo (sin minteo ni secreto compartido); la RLS sigue leyendo `auth.jwt() ->> 'tenant_id'`. Alineado con las signing keys asimétricas.

**Decisión:** validar la mecánica de RLS ahora con **A (Legacy Secret)**; adoptar **B (Third-Party Auth)** como objetivo de producción (evaluar en HU-156). La política RLS (`auth.jwt()->>'tenant_id'`) es **idéntica** en ambos caminos, así que el resto del diseño no cambia.

## Riesgos a cerrar en el PoC (HU-171)

1. **Firma del JWT — CONFIRMADO:** el proyecto usa **signing keys asimétricas**, pero el **Legacy JWT secret sigue vigente para *verificar*** ("still used · used only to verify JWTs"). Por tanto el camino **A (firmar HS256 con el legacy secret) es viable hoy** para el PoC y arranque; **B (Third-Party Auth con Stack Auth / JWKS)** queda como objetivo de producción. Los tokens minteados incluyen `aud: authenticated` por compatibilidad. La política RLS (`auth.jwt()->>'tenant_id'`) es idéntica en A y B.
2. **Pooler:** validar `SET LOCAL app.current_tenant` **dentro de la transacción** en modo *transaction pooling* (fallback GUC).
3. **Impacto del refactor:** medir el alcance de cambiar `createServerClient` (service-role) → cliente tenant-scoped en el plano de tienda.
4. **Aislamiento:** prueba end-to-end de que una query sin filtro **no** devuelve datos de otro tenant.

## Validación (Definition of Done del spike) — COMPLETADA

- [x] PoC de emisión de JWT con claim `tenant_id` (HS256 con Legacy JWT secret; `aud: authenticated`).
- [x] Política RLS de ejemplo (`tenant_id = auth.jwt()->>'tenant_id'`) sobre `poc_notes`.
- [x] Test de **aislamiento cross-tenant** verde (12/12 en `@merkiai/tenancy`).
- [x] **Validado E2E contra Supabase real (2026-08-24):** tenant A ve solo sus filas, B solo la suya, sin token → `[]`, insert cruzado → `42501` (RLS). Aísla en **lectura y escritura**.
- [x] Riesgo 1 confirmado: proyecto en signing keys asimétricas; **Legacy secret sigue verificando** → camino A viable hoy; B (Third-Party Auth) para producción.
- [ ] *(Producción, en HU-156):* evaluar Third-Party Auth con Stack Auth (JWKS) para no depender del legacy secret; validar `SET LOCAL` sobre el pooler para el fallback GUC.

## Referencias

- `PRODUCT_BACKLOG.md` → Detalle E17 (Arquitectura de referencia), HU-156/171/172/200.
- `STACK_AUTH_SETUP.md` → Configuración para multi-tenant + Supabase RLS.
- Doc oficial Hexclave: Teams, RBAC, integración Supabase RLS (validado ago-2026).
