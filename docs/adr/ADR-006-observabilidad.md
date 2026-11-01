# ADR-006 · Observabilidad (errores, APM, logs, métricas, trazas)

> **Estado:** Aceptado (nov-2026). **Contexto:** E14 (despliegue/monitoreo) + operación multi-tenant. **Relacionado:** HU-170 (Sentry), HU-300 (anti-abuso + alertas), HU-146 (auditoría de negocio), HU-155 (Core Web Vitals, roadmap), ADR-005 (infraestructura).
> **Propósito:** fijar qué hay hoy para observar el sistema, qué falta para una cobertura completa (tipo "CloudWatch + SigNoz"), y el plan por capas — sin acoplar el producto a un proveedor ni salir del modelo serverless.

## 1. Estado actual

- **Errores + APM/rendimiento → Sentry.** `@sentry/nextjs` + `lib/sentry.ts` + `error-reporter.ts` (`reportError`), conectado en HU-170 e instrumentado en los flujos sensibles (checkout, cupón, crédito, reconcile). Cubre captura de excepciones, trazas de transacción/performance, releases y alertas por error.
- **Logs y métricas de infraestructura → built-in de los proveedores gestionados.** Logs de las funciones de la plataforma serverless + dashboards de la base de datos gestionada. Son **efímeros y por-proveedor**, no agregados ni buscables de forma unificada.
- **Alertas de aplicación.** El rate-limit distribuido (HU-300) emite alerta de abuso (`reportError` scope `abuse.*`) al bloquear; no hay alarmas de infraestructura.
- **Auditoría de negocio (no es observabilidad de infra) → `audit_log`** (HU-146): registra operaciones sensibles con actor y detalle.
- **RUM / Core Web Vitals (HU-155): roadmap**, aún no.

## 2. Mapeo contra "CloudWatch + SigNoz"

| Capacidad | Objetivo (CloudWatch+SigNoz) | Hoy |
|---|---|---|
| Errores de aplicación | ✓ | ✅ **Sentry** |
| APM / trazas de transacción | ✓ | ✅ Sentry |
| Trazas distribuidas (OpenTelemetry) | ✓ | ⚠️ parcial (Sentry, sin pipeline OTel) |
| Logs centralizados y buscables | ✓ | ❌ (solo logs de función del proveedor) |
| Métricas de infra / custom | ✓ | ❌ (solo dashboards del proveedor) |
| Dashboards unificados | ✓ | ⚠️ dispersos (Sentry + consola del proveedor) |
| Alarmas de infraestructura / SLOs | ✓ | ⚠️ solo alertas de app (Sentry + HU-300) |

**Resumen:** hoy está cubierto el **slice de errores/APM (Sentry)** + lo built-in de la plataforma y la BD gestionada; **no** es aún un equivalente completo a CloudWatch+SigNoz.

## 3. Decisión y plan por capas (opt-in, serverless-friendly)

Mantener **Sentry** para errores/APM y, cuando el volumen/operación lo exija, añadir por capas, **sin montar Kubernetes** y usando destinos **gestionados**:

1. **Logs estructurados** (p. ej. `pino`) con **log drain** a un destino buscable (Axiom / Grafana Loki / SigNoz / Datadog) — cubre el hueco de "CloudWatch Logs".
2. **OpenTelemetry** en las funciones exportando **trazas + métricas** a **SigNoz** (Cloud o self-host gestionado) o Grafana Cloud — cubre trazas distribuidas + métricas unificadas.
3. **Alertas / SLOs** sobre esas métricas (latencia p95, tasa de error, saturación, colas) — cubre "CloudWatch Alarms".
4. **Multi-tenant:** etiquetar spans/logs/eventos con `tenant_id` (y `plan`) para filtrar por tienda — imprescindible para soporte en una plataforma multi-tienda.

**Matiz serverless:** en este modelo normalmente **no** se usa CloudWatch (es de AWS), sino **log drain + backend OTel** (SigNoz/Grafana/Datadog). CloudWatch solo entraría si algún componente corre en AWS (p. ej. un servicio en contenedor del **tier dedicado** o de los **jobs de fondo** anotados en ADR-005 §4).

## 4. No-objetivos (por ahora)

- No se instrumenta OTel ni se monta un backend de métricas/logs hasta que haya volumen real o un cliente que lo exija (evitar costo y complejidad prematuros).
- La **auditoría de negocio** (HU-146) seguirá separada de la observabilidad técnica; no se mezclan.

## 5. Consecuencias

- Buen cubrimiento de **errores/rendimiento** desde el día uno (Sentry), con bajo costo operativo.
- Hueco conocido en **logs agregados + métricas/trazas unificadas + alarmas de infra**; se cierra por capas cuando se justifique, sin reescritura (el código ya centraliza el reporte en `reportError`).
- El diseño se mantiene **agnóstico de proveedor** (interfaces estándar), coherente con ADR-005.
