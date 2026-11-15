# 05 · Continuidad, respaldos y recuperación

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Objetivos

| Servicio | RTO (tiempo para recuperar) | RPO (datos que se pueden perder) |
|---|---|---|
| Storefront (`web`) y checkout | 4 h | 15 min |
| Panel (`admin`) | 8 h | 15 min |
| Consola y cobro de planes | 24 h | 1 h |

## 2. Respaldos

| Activo | Mecanismo | Retención |
|---|---|---|
| BD de tienda y BD de plataforma (Supabase prod) | **PITR** (point-in-time recovery) habilitado + respaldos diarios del proveedor | ≥ 7 días PITR; ≥ 30 días diarios |
| Archivos (Supabase Storage / R2) | Versionado o réplica del bucket (R2: lifecycle + copia) | ≥ 30 días |
| Código y migraciones | GitHub (repositorio + clones) | Indefinida |
| Llaves del vault (AWS KMS) | Llave KMS con borrado programado de 30 días (no inmediato) | — |
| Configuración de ambientes | `docs/ENV-VARS-MATRIZ.md` + variables en Vercel (los valores secretos, en el gestor de contraseñas) | — |

Los respaldos de producción **no** se restauran en ambientes de prueba sin anonimizar.

## 3. Pruebas de restauración

**Semestral:** restaurar un punto en el tiempo de la BD de tienda en un proyecto aislado. Verificar
el conteo de tenants, pedidos y saldos de cartera, y medir el tiempo real contra el RTO. Registrar
el acta (fecha, punto restaurado, duración, problemas).

## 4. Diseño para la disponibilidad

- Despliegues inmutables con rollback inmediato (Vercel *Promote* del deploy anterior).
- Migraciones aditivas: el rollback de la app no requiere revertir la base.
- Degradación controlada: rate limit con respaldo, correo con reintentos e idempotencia, cron
  re-ejecutable.

## 5. Escenarios y respuesta

| Escenario | Respuesta |
|---|---|
| Deploy defectuoso | Rollback en Vercel (minutos) |
| Borrado o corrupción de datos | PITR al minuto anterior en un proyecto nuevo; luego cambio de variables o copia selectiva |
| Caída de región del proveedor (Supabase/Vercel) | Página de estado + comunicación a tiendas; esperar la recuperación del proveedor (riesgo aceptado en esta etapa, ver registro R-09) |
| Pérdida de la llave KMS o del IAM del vault | Cancelar el borrado programado / recrear el IAM (`infra/kms-vault`) |
| Caída de PayZen | Las ventas siguen con las otras pasarelas configuradas; el cobro de planes se reintenta (dunning) |
