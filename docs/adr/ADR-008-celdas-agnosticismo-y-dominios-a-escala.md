# ADR-008 · Celdas de infraestructura, agnosticismo de proveedor y dominios a escala

> **Estado:** Propuesto (nov-2026). **Contexto:** evolución de ADR-005 (infraestructura/despliegue), ADR-007 (config de infra por-tenant + vault) y ADR-001 (auth/RLS). **Relacionado:** HU-200 (niveles de aislamiento + connection factory), HU-360–363 (infra dedicada), HU-201 (IdentityProvider), HU-174/279 (dominios), HU-361/362 (config+vault, implementadas).
> **Propósito:** fijar el modelo de **escalamiento horizontal por celdas** y el **agnosticismo de proveedor** en cuatro ejes (cómputo, datos, storage, identidad), más la estrategia de **dominios propios a escala**, para soportar muchos tenants con costo trasladable al cliente y poder dedicar infraestructura a los clientes grandes — sin reescribir la app.

---

## 1. Decisión (resumen)

1. **La celda es la unidad de escalamiento horizontal.** Una **celda** aloja hasta `N` tenants con RLS como frontera. El cómputo (admin+web) es multi-tenant por host y **se comparte**; lo que se aprovisiona por celda es **datos + storage**. **Dedicado = celda de tamaño 1** (un cliente grande con su propia capacidad). Desaparece el caso "dedicado" como rama especial: todo es celda.
2. **Cuatro ejes agnósticos de proveedor, cada uno tras su abstracción:**
   - **Cómputo:** Vercel (dev/test) · contenedor/alternativa en producción, detrás de Cloudflare.
   - **Datos:** Supabase **o Neon** (Postgres), tras el connection factory por `db_ref`.
   - **Storage:** Supabase Storage **o S3-compatible** (Cloudflare R2 / AWS S3), tras un `StoragePort`.
   - **Identidad:** **Stack Auth** (Teams = tenant), tras `IdentityProvider` (HU-201); Cognito u otro quedan como adaptador futuro.
3. **Dominios propios a escala con Cloudflare for SaaS.** La terminación de **TLS de los dominios de clientes** se delega a Cloudflare (custom hostnames), **desacoplando el dominio del cómputo**. Esto elimina el tope de dominios por proyecto de Vercel y permite mover producción fuera de Vercel.
4. **Registro de celdas + colocación en el control plane.** La consola conoce las celdas, su capacidad y su conteo, coloca cada tenant nuevo en una celda con cupo y aprovisiona una celda nueva cuando se llenan. Los secretos de cada celda viven en **kms-vault** (ADR-007).
5. **Costos de pago, trasladables al cliente.** El free tier queda para **trials y landing pages** (wildcard de subdominio), no como estrategia de producción.

---

## 2. Contexto y motivación

- La **mayoría de tiendas usará dominio propio**; el wildcard `*.merkiai.com` se usa en trials/landings. El cuello de botella del hosting no es el número de tenants sino la **gestión de dominios + TLS**.
- El **cómputo ya escala solo**: `admin`+`web` son stateless y multi-tenant por host (un deployment sirve a muchas tiendas). Lo que no escala "gratis" es la **capa de datos**.
- La capacidad de una celda la marca el **eslabón más débil**: datos (conexiones/filas), **storage** (medios) y, globalmente, la cuota de identidad.
- **Neon** y **S3** son cercanos (ya existe la base CDK/KMS). El roadmap ya anticipa agnosticismo (ADR-005, Neon en HU-200, `HOSTING_*` genérico, RLS+GUC en HU-171/ADR-001).

---

## 3. Modelo de celdas

```
infra_cells (BD de plataforma)
  id              text PK            -- = db_ref de los tenants de la celda
  name            text
  compute_ref     text              -- proyecto/host de cómputo (si aplica)
  data_provider   text  check (in 'supabase','neon','postgres')
  data_url        text              -- endpoint Postgres/Supabase (NO secreto)
  storage_provider text check (in 'supabase','r2','s3')
  storage_bucket  text
  region          text
  capacity_limit  int               -- nº máximo de tenants (0 = ilimitado/dedicado grande)
  tenant_count    int  default 0
  status          text  check (in 'active','filling','draining','full','disabled')
  -- Referencias a secretos (en kms-vault), NO los valores:
  secret_ref_*    text ...          -- claves de datos, storage y jwt de la celda
  created_at / updated_at

tenants.db_ref  → infra_cells.id    -- muchos tenants por celda (RLS)
```

- **Generaliza `tenant_infra_config`** (hoy 1:1 por tenant → el caso dedicado) a **config por celda** (muchos tenants → una celda). El dedicado es una celda con `capacity_limit = 1`.
- El **connection factory** ya resuelve por `db_ref`; solo cambia que `db_ref` apunta a una **celda** y que el `DbTarget` gana un **`kind`** (`supabase` | `postgres`).

---

## 4. Agnosticismo por eje

| Eje | Abstracción | Supabase | Neon / Postgres | Notas |
|-----|-------------|----------|-----------------|-------|
| **Datos** | connection factory + `DbTarget.kind` | PostgREST + anon key + **RLS por claim JWT** | driver Postgres + **RLS con GUC `app.tenant_id`** + rol dedicado | No son drop-in: Neon exige un **segundo adaptador** de acceso a datos (ADR-001 ya prevé GUC) |
| **Storage** | `StoragePort` (put/get/url/usage) | Supabase Storage | **S3-compatible** (R2 / S3) | Con Neon, storage va aparte; medir **uso por celda/tenant** y topar por plan |
| **Cómputo** | despliegue portable (ADR-005) | Vercel (dev/test) | contenedor (Fly/Render/Cloud Run) / Workers | Detrás de Cloudflare; la app no cambia |
| **Identidad** | `IdentityProvider` (HU-201) | **Stack Auth (Teams)** | — | Eje **independiente** de la celda; Cognito = adaptador futuro |
| **Dominios/TLS** | `HOSTING_*` genérico + Cloudflare for SaaS | — | — | Custom hostnames + TLS de miles de dominios de clientes |

---

## 5. Dominios propios a escala (Cloudflare for SaaS)

- Los dominios de los clientes se registran como **custom hostnames** en Cloudflare, que **termina TLS** y enruta al origen (el cómputo compartido). Esto **desacopla** el dominio de dónde corre la app y evita el límite de dominios por proyecto de Vercel.
- El wildcard `*.merkiai.com` sigue para subdominios de trial/landing.
- El provisioning de un dominio (alta del custom hostname + verificación) se hace desde la consola por API (extiende el `HOSTING_*` actual a un `HostingPort` con adaptador Cloudflare).

---

## 6. Identidad — por qué Stack y no Cognito (ahora)

- El modelo de tenant = **Teams**, que Stack trae de primera clase; Cognito lo exigiría reconstruir con grupos/`custom:tenant_id` (user pool por tenant **no** escala: ~1.000–10.000 pools/cuenta).
- La identidad es **eje independiente** de la celda: migrar datos/storage a AWS no obliga a mover auth.
- `IdentityProvider` (HU-201) deja la puerta abierta a **un adaptador Cognito** (single pool + `tenant_id` en claims) si el negocio lo pide, sin reescritura.

---

## 7. Coordinación / colocación (control plane)

- **Alta de tenant:** la consola elige una celda `active` con `tenant_count < capacity_limit` (y región/plan compatibles); si ninguna, aprovisiona una **celda nueva** (crea proyecto de datos vía API — Supabase Management / Neon —, bucket de storage, registra dominios/Cloudflare, guarda secretos en kms-vault) y coloca ahí. Incrementa el conteo.
- **Promoción a dedicado:** mover un tenant a una celda de `capacity_limit = 1` = migrar sus filas (HU-200 AC-4) + cambiar `db_ref` + recorte de dominio si cambia el cómputo (ADR-007/HU-363 AC-6) + invalidar cachés.
- **Observabilidad/capacidad (HU-200 AC-7):** uso por celda (conexiones, storage, filas) para saber cuándo abrir una celda nueva o drenar una.

---

## 8. Alternativas consideradas

- **Schema-por-tenant (HU-200 AC-2):** descartado. En Supabase pelea con el diseño nativo (RLS sobre un schema, PostgREST limitado) y topa en nº de schemas. La celda RLS ya da aislamiento barato; el dedicado cubre el extremo alto.
- **Pool de cuentas *free* (Vercel/Supabase) para no pagar:** descartado para producción (ToS de Hobby no-comercial; límite de proyectos por org free; reguero de llaves). Free tier solo para trial/landing/dev.
- **Cognito con user pool por tenant:** descartado (límite de pools, sin Teams nativo). Si se adopta Cognito, sería single pool + claims, vía adaptador.
- **Un proyecto Vercel por tenant:** innecesario (el storefront es multi-tenant por host); solo se separa cómputo para el dedicado grande.

---

## 9. Consecuencias

- **Positivas:** escala horizontal por celdas con costo trasladable; proveedores intercambiables por eje; dominios a escala resueltos por Cloudflare; dedicado unificado como "celda de 1"; reutiliza lo ya construido (vault/KMS, factory por `db_ref`, `HOSTING_*`, `IdentityProvider`).
- **A construir (nuevas HU):** (a) `infra_cells` + colocación y conteo; (b) **adaptador de datos Neon/Postgres** (driver + GUC + rol) y `DbTarget.kind`; (c) `StoragePort` + adaptador R2/S3 + medición de uso; (d) `HostingPort` + adaptador **Cloudflare for SaaS**; (e) orquestador de aprovisionamiento de celda (extiende HU-363); (f) cómputo de producción fuera de Vercel (contenedor) cuando aplique.
- **A vigilar:** Supabase↔Neon no son drop-in (doble adaptador de datos); la migración entre celdas (promoción) necesita ventana + verificación; la cuota global de identidad (Stack) escala con usuarios, no con celdas — se gestiona subiendo el plan de Stack.

---

## 10. Secuencia sugerida

1. ADR + **modelo de costos por plan** (recurso→precio). *(no-código)*
2. `infra_cells` + colocación (generaliza `tenant_infra_config`). Mantiene Supabase.
3. `HostingPort` + **Cloudflare for SaaS** (dominios/TLS) — habilita salir de Vercel.
4. `StoragePort` + **R2/S3** + medición de storage.
5. **Adaptador Neon/Postgres** (datos) cuando el primer cliente/caso lo pida.
6. Cómputo de producción en contenedor (si se mueve fuera de Vercel).
