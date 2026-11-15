# 04 · Respuesta a incidentes de seguridad

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Qué es un incidente

Cualquier evento que comprometa o pueda comprometer la confidencialidad, integridad o disponibilidad:
acceso no autorizado, fuga de datos, secreto expuesto, fraude en pagos, caída prolongada,
vulnerabilidad explotada, equipo perdido con acceso.

## 2. Canales de reporte

- Interno: canal de guardia del equipo + Responsable de Seguridad.
- Externo: `seguridad@merkiai.com` (ver `SECURITY.md`).
- Automático: alertas de Sentry, picos de 401/429 en `/api/internal/*`, alertas de pasarelas.

## 3. Severidad

| Nivel | Ejemplos | Respuesta inicial |
|---|---|---|
| **SEV-1** | Fuga de datos entre tenants, secreto de producción expuesto, fraude en cobros, caída total | Inmediata (≤ 1 h), 24/7 |
| **SEV-2** | Vulnerabilidad explotable sin evidencia de abuso, caída parcial, una tienda afectada | ≤ 4 h hábiles |
| **SEV-3** | Hallazgo de bajo impacto, intento bloqueado | ≤ 2 días hábiles |

## 4. Fases

1. **Detección y registro:** abrir el registro del incidente (hora, quién reporta, qué se observó).
2. **Contención:** según el caso:
   - rotar secretos (`INTERNAL_API_SECRET`, llaves de pasarela, IAM del vault);
   - suspender el tenant desde la consola;
   - poner la tienda en modo mantenimiento;
   - hacer rollback del deploy en Vercel;
   - vaciar `PAYZEN_*` para detener los cobros (fail-closed).
3. **Erradicación:** corregir la causa (PR de emergencia, política 03 §1.5).
4. **Recuperación:** restaurar el servicio y, si aplica, los datos desde el respaldo (política 05).
   Vigilar que no reaparezca.
5. **Notificación:**
   - **Tiendas afectadas:** sin demora injustificada; meta 72 h desde la confirmación.
   - **Superintendencia de Industria y Comercio (SIC):** cuando haya violación de datos personales,
     según la Ley 1581 y su reglamentación. Lo evalúa la dirección con asesoría jurídica.
   - **Pasarelas de pago:** si el incidente las involucra.
6. **Lecciones aprendidas:** postmortem sin culpables dentro de los 10 días hábiles, con acciones,
   responsables y fechas. Se actualiza el registro de riesgos.

## 5. Evidencia

Conservar los registros (logs de Vercel/Supabase/Sentry, `audit_log`, capturas) **sin alterarlos**,
por al menos 1 año.

## 6. Ejercicio anual

Simulacro de mesa (p. ej., "se filtró `INTERNAL_API_SECRET`") con acta y mejoras.
