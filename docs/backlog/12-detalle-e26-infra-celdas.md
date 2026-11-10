# Detalle · E26 — Infraestructura multi-celda, agnosticismo de proveedor y dominios a escala

> **Épica:** **E26 · Infraestructura multi-celda** (HU-430…437). Todo 🔲 (roadmap).
> **Diseño:** **ADR-008** (celdas + agnosticismo + dominios a escala + cómputo/cacheo) y **ADR-007** (vault). **Construye sobre:** E17 (HU-200 aislamiento, HU-360–364 infra/vault, HU-201 identidad).
>
> **Contexto.** El cómputo (admin+web) es multi-tenant por host y se comparte; lo que se
> aprovisiona por **celda** es datos + storage. Una celda aloja `N` tenants con RLS;
> **dedicado = celda de 1**. Agnóstico en 4 ejes: cómputo, datos (Supabase/Neon), storage
> (Supabase/R2/S3), identidad (Stack). Dominios de clientes a escala con Cloudflare for SaaS.
> Secretos de cada celda en **kms-vault** (ADR-007).

---

## HU-430 — Registro de celdas + colocación por capacidad · E26

> Como operador, quiero un registro de **celdas** (cómputo+datos+storage) con su capacidad y
> conteo, y que el alta de un tenant lo **coloque** en una celda con cupo, para empaquetar
> muchos tenants por celda y abrir una nueva cuando se llene.

**Módulo:** generaliza `tenant_infra_config` (1:1 por tenant) → **`infra_cells`** (muchos
tenants → una celda); `tenants.db_ref` → celda; gestor de colocación + conteo; consola.
**Depende de:** HU-361/362 (config+vault). · **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Modelo | `infra_cells` (proveedor, endpoint, capacidad, conteo, estado, región, refs a secretos) + `tenants.db_ref → celda` |
| AC-2 | Colocación | Al alta, se asigna una celda `active` con `tenant_count < capacity_limit` (región/plan compatibles); si no hay, se exige/provisiona una nueva |
| AC-3 | Dedicado = celda de 1 | Un cliente grande se coloca en una celda con `capacity_limit = 1`; unifica el caso dedicado |
| AC-4 | Factory sin cambios | El connection factory resuelve por `db_ref` (= celda); consumidores intactos, fail-closed |

## HU-431 — HostingPort + Cloudflare for SaaS (dominios/TLS a escala) · E26

> Como plataforma, quiero registrar y certificar los **dominios propios** de los clientes a
> escala sin topar el límite de dominios por proyecto de cómputo, para que la mayoría de
> tiendas use su dominio.

**Módulo:** `HostingPort` (alta/verificación/baja de hostname) + adaptador **Cloudflare for
SaaS** (custom hostnames + TLS); reemplaza/extiende `HOSTING_*`; token en vault. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Alta de dominio | La consola da de alta el dominio del tenant como custom hostname en Cloudflare; TLS automático |
| AC-2 | Desacople | El dominio enruta al origen compartido; cambiar el cómputo no re-registra dominios |
| AC-3 | Subdominios | El wildcard `*.merkiai.com` sigue para trial/landing (sin consumir hostnames) |
| AC-4 | Secreto | El token de Cloudflare se custodia en kms-vault (no en env plano) |

## HU-432 — StoragePort + S3/R2 + medición de uso · E26

> Como plataforma, quiero un almacenamiento de objetos **agnóstico** (Supabase Storage / R2 /
> S3) por celda, y **medir el uso por tenant**, para desacoplar storage de la BD y tarifar por plan.

**Módulo:** `StoragePort` (put/get/url/usage) + adaptador **R2/S3** (egreso gratis en R2);
medición de uso por celda/tenant; tope por plan. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Interfaz | Subida/lectura/URL firmada vía `StoragePort`; adaptador R2/S3 y Supabase Storage |
| AC-2 | Medición | Uso de storage por tenant/celda visible; base para cobro de excedentes |
| AC-3 | Tope por plan | Enforcement de cuota de storage según entitlement del plan |

## HU-433 — Adaptador de datos Neon / Postgres (driver + GUC) · E26

> Como plataforma, quiero soportar **Neon/Postgres** además de Supabase como destino de celda,
> para elegir el proveedor de datos por costo/caso sin reescribir la app.

**Módulo:** `DbTarget.kind` (`supabase` | `postgres`); adaptador Postgres directo con **RLS por
GUC `app.tenant_id`** + rol dedicado (ADR-001); migraciones aplicables a ambos destinos. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | `kind` | El target distingue Supabase (PostgREST+JWT-RLS) de Postgres (driver+GUC) |
| AC-2 | Scoping Neon | En Postgres, cada request fija `app.tenant_id` y la RLS acota; nunca cruza tenant |
| AC-3 | Migraciones multi-destino | El schema se versiona y aplica consistente en Supabase y Neon (HU-200 AC-5) |
| AC-4 | Fail-closed | Sin rol/GUC resoluble, lanza; no degrada a acceso sin scoping |

## HU-434 — Cacheo por capas (CDN/ISR + Redis) tenant-aware · E26

> Como plataforma, quiero una estrategia de cacheo por capas para bajar costo y latencia, con
> aislamiento por tenant, para sostener tráfico alto sin disparar la factura.

**Módulo:** CDN/borde (Cloudflare) + **ISR** + R2 para el storefront; **Redis** (Upstash →
ElastiCache) para estado distribuido (rate-limit HU-300, caché `resolve-tenant`/entitlements,
`cacheHandler` ISR multi-instancia). Ver ADR-008 §5B. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Borde | Páginas/ISR/imágenes cacheadas en Cloudflare+R2; origen atiende poco |
| AC-2 | Estado distribuido | Redis compartido para rate-limit y caché de resolución/entitlements entre instancias |
| AC-3 | Tenant-aware | Toda clave de caché incluye `tenant_id`/host (CDN cache key + prefijo Redis); sin fuga entre tenants |
| AC-4 | Invalidación | Al cambiar `db_ref` (promoción) se invalidan caché de `resolve-tenant` y del factory (enlaza HU-363 AC-7) |

## HU-435 — Cómputo portable a escala (contenedor detrás de Cloudflare) · E26

> Como plataforma, quiero poder mover el **origen** de Vercel a contenedores cuando el costo lo
> justifique, sin cambiar la app, para optimizar el gasto a gran escala.

**Módulo:** empaquetado en **Docker** + despliegue en **App Runner/Fargate** (coherencia AWS)
o **Cloud Run**; Cloudflare delante; co-localizar cómputo+BD; dedicado = cómputo propio solo
enterprise. **Estado:** 🔲 — Vercel sigue para dev/test y prod temprana.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Portabilidad | La app corre idéntica en contenedor (sin acoplar a Vercel) |
| AC-2 | Regla de corte | Se migra el origen cuando la factura de Vercel supera contenedor+operación |
| AC-3 | Co-localización | Cómputo y BD en la misma nube/región para minimizar egreso |
| AC-4 | ISR compartido | Al multi-instancia, `cacheHandler` de ISR respaldado por Redis (HU-434) |

## HU-436 — Orquestador de aprovisionamiento de celda · E26

> Como operador, quiero aprovisionar una **celda nueva** de forma orquestada (crear BD, storage,
> dominios base, secretos y migraciones), para abrir capacidad sin pasos manuales frágiles.

**Módulo:** extiende HU-363 a celdas: compone Supabase **Management API** / Neon + bucket
R2/S3 + Cloudflare + **kms-vault** + `db-apply`; idempotente, con rollback. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Alta orquestada | "Nueva celda" crea destino de datos + storage + registra en `infra_cells` + guarda secretos en vault |
| AC-2 | Migraciones | Aplica el schema a la celda nueva (idempotente) antes de marcarla `active` |
| AC-3 | Idempotente + rollback | Si un paso falla, revierte; re-ejecutar no duplica |
| AC-4 | Verificación | Chequeo lectura/escritura acotada antes de habilitar colocación |

## HU-437 — Observabilidad y capacidad por celda · E26

> Como operador, quiero ver el **uso y la capacidad** de cada celda (conexiones, storage, filas,
> tráfico), para saber cuándo abrir una celda nueva o drenar una, y para tarifar.

**Módulo:** métricas por celda (concreta HU-200 AC-7); umbral de apertura/drenaje; costo por
celda base del modelo de precios. **Estado:** 🔲

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Métricas | Uso por celda (conexiones/storage/filas) y por tenant visible en la consola |
| AC-2 | Umbrales | Alertas al acercarse a `capacity_limit` → disparar HU-436 (nueva celda) |
| AC-3 | Estados | Celda `active/filling/full/draining`; la colocación respeta el estado |
| AC-4 | Costos | Costo por celda alimenta el modelo de precios/márgenes (go-to-market) |
