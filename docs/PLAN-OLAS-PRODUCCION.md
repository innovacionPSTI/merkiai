# Plan de implementación por olas — Salida a producción y escalamiento

> Ruta desde "infra dedicada lista (código)" hasta **producción con primeros clientes** y luego
> **escalamiento por celdas**. Cada incremento entra por la ruta **CI/CD** (feature → `test` →
> `develop` → `main`) + pruebas. Las olas de **infra (E26)** son **a demanda**: no se construyen
> todas por adelantado, se disparan por un criterio. Los **epics de producto** (E19/E20/E21/E22/
> E23/E24/E25) entran en paralelo por prioridad comercial, independientes de estas olas.

---

## Ola 0 — Cimiento de infra dedicada (✅ código; falta verificación)

ADR-007 + HU-361/362 implementadas: `tenant_infra_config`, vault (AWS KMS por CDK), `resolve-tenant`
devuelve destino dedicado, web lo consume, carga de secretos desde la consola. **Pendiente:**
verificación end-to-end con un tenant dedicado real (crear celda/config + cargar secretos + probar).

---

## Ola 1 — Salida a producción (MVP SaaS vendible) · **crítica**

Objetivo: poder **cobrar y operar** los primeros clientes sobre la **celda compartida por defecto**
(no se necesita E26 todavía).

1. **HU-364 — Congelar el set de variables de entorno** + rename `CONTROL_PLANE_URL → CONSOLE_URL`
   + retirar las muertas. (Gate antes de cerrar el pipeline: las vars del CI deben ser las finales.)
2. **Cerrar CI/CD + E2E** de 3 ramas en verde de punta a punta (provisioning automático + specs).
3. **Billing PayZen/Lyra (E17 · HU-192/193/194):** `BillingProvider` intercambiable + **suscripción
   de planes** + **validación de pago** (webhooks idempotentes) + **correos** (activación, recibo,
   aviso de impago) + **ciclo de cuenta** `active / past_due / suspended` con **suspensión por impago**
   y reactivación al pagar.
4. **Release a producción** + **onboarding de los primeros clientes** en la celda compartida.

**Criterio de salida:** E2E verde · billing operativo · suspensión/reactivación por impago probada ·
runbook de release.

---

## Ola 2 — Dominios propios y storage a escala · *disparo: clientes con dominio / crece la media*

La mayoría de tiendas usará **dominio propio** → esta ola desbloquea ese caso y el storage agnóstico.

- **HU-431 — Cloudflare for SaaS** (custom hostnames + TLS a escala; desacopla dominio del cómputo;
  retira los `HOSTING_*` de Vercel).
- **HU-432 — StoragePort + R2/S3** + medición de uso por tenant (R2: egreso gratis).
- *(Anticipable)* **CDN/ISR de HU-434** (parte de borde): barato y de alto impacto en costo; conviene
  activarlo ya aunque el Redis espere a la Ola 4.

**Disparo:** primer cliente con dominio propio · costo de egreso/almacenamiento empieza a pesar.

---

## Ola 3 — Celdas y capacidad · *disparo: la celda compartida se acerca a su límite*

- **HU-430 — Registro de celdas + colocación** (`tenant_infra_config` → `infra_cells`; `tenant→celda`;
  dedicado = celda de 1). Aquí se completa el **retiro de las Supabase-vars de web/admin** (se
  resuelven por celda desde `infra_cells`+vault) → cierra lo pendiente de HU-364.
- **HU-436 — Orquestador de aprovisionamiento de celda** (Supabase Mgmt/Neon + storage + Cloudflare +
  vault + migraciones, idempotente con rollback).
- **HU-437 — Observabilidad y capacidad por celda** (métricas → umbral de nueva celda).

**Disparo:** métricas de la celda compartida (conexiones/storage/filas) cerca del `capacity_limit`.

---

## Ola 4 — Agnosticismo de datos, cacheo y cómputo · *disparo: costo/tráfico o requisito Neon*

- **HU-433 — Adaptador Neon/Postgres** (driver + GUC) + `DbTarget.kind` (cuando un caso/cliente lo pida).
- **HU-434 — Cacheo por capas (completo):** Redis (Upstash → ElastiCache) para rate-limit distribuido,
  caché de `resolve-tenant`/entitlements y `cacheHandler` de ISR multi-instancia (tenant-aware).
- **HU-435 — Cómputo portable** (contenedor App Runner/Fargate/Cloud Run detrás de Cloudflare) cuando
  la factura de Vercel supere contenedor + operación.

**Disparo:** factura de Vercel/tráfico · múltiples instancias · necesidad de Neon.

---

## Transversal — Epics de producto (en paralelo, por prioridad comercial)

E19 (marketing/VIP) · E20/E21 (servicios, formularios/trámites) · E22 (analytics) · E24/E25
(operaciones/POS) · E23 (portal institucional). Cada uno es **independiente** de las olas de infra y
entra por la misma ruta CI/CD + pruebas según el plan comercial.

---

## Resumen de la secuencia

```
Ola 0 (verificar dedicado)
  └─ Ola 1  HU-364 + CI/CD E2E + Billing PayZen + RELEASE → primeros clientes   [crítica]
        └─ Ola 2  Cloudflare for SaaS + Storage R2/S3  [disparo: dominios/media]
              └─ Ola 3  Celdas + orquestación + capacidad  [disparo: celda llena]
                    └─ Ola 4  Neon + cacheo/Redis + cómputo en contenedor  [disparo: costo/tráfico]
Producto (E19…E25): en paralelo, por prioridad comercial, vía CI/CD.
```
