# 07 · Registro de riesgos de seguridad

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Registro inicial a partir de la revisión de hardening v269 |

## Metodología

- **Probabilidad** (P) y **Impacto** (I) de 1 a 5. **Riesgo = P × I**: 1–6 bajo · 8–12 medio ·
  15–25 alto.
- **Tratamiento:** mitigar, transferir, evitar o aceptar. Aceptar un riesgo **alto** requiere la
  firma de la dirección.
- Revisión **trimestral** y tras cada incidente o cambio importante.

## Registro

| ID | Riesgo | P | I | Inicial | Controles actuales | Tratamiento / acción pendiente | Residual | Dueño |
|---|---|---|---|---|---|---|---|---|
| R-01 | Fuga de datos entre tiendas por error de aislamiento | 2 | 5 | 10 | RLS por `tenant_id`, JWT de tenant, pruebas de aislamiento, RLS de storage (e17/77) | Mitigar: pruebas E2E de aislamiento antes del release | Bajo | Líder técnico |
| R-02 | Robo de cuenta de operador o admin (phishing) | 3 | 5 | 15 | Registro deshabilitado, roles, auditoría | Mitigar: **MFA obligatorio** en Stack Auth y nubes | Medio | Resp. Seguridad |
| R-03 | Exposición de un secreto (repo, log, navegador) | 2 | 5 | 10 | Vault KMS, Gitleaks, `env:check`, sin `NEXT_PUBLIC_*` secretos | Mitigar: rotación cada 90 días agendada | Bajo | Líder técnico |
| R-04 | XSS en tienda o panel | 2 | 4 | 8 | Escape de salida, CSP con nonce + `strict-dynamic`, CodeQL | Monitorear | Bajo | Líder técnico |
| R-05 | Fraude o manipulación de pagos y webhooks | 2 | 5 | 10 | Firmas verificadas, re-consulta a la API, idempotencia, guarda anti-subpago | Mitigar: exigir firma de MercadoPago cuando la tienda la configure | Bajo | Líder técnico |
| R-06 | Abuso de endpoints públicos (fuerza bruta de cupones o gift cards, pago de saldo) | 3 | 3 | 9 | Rate limit distribuido (Redis/RPC) con bloqueo | Aceptar | Bajo | Líder técnico |
| R-07 | Dependencia vulnerable | 3 | 4 | 12 | Dependabot, `pnpm audit`, overrides de parches | Mitigar: plazos de la política 03 §5 | Bajo | Líder técnico |
| R-08 | Pérdida o corrupción de datos | 2 | 5 | 10 | Migraciones aditivas, libros append-only | Mitigar: **activar PITR** + prueba de restauración semestral | Medio → Bajo | Líder técnico |
| R-09 | Caída regional de Supabase/Vercel | 2 | 4 | 8 | Proveedores con SLA y alta disponibilidad | **Aceptar** en esta etapa (sin multi-región) | Medio | Dirección |
| R-10 | Persona clave única (bus factor) | 4 | 4 | 16 | Documentación (runbooks, ADR, matriz) | Mitigar: segundo responsable con acceso de respaldo | Medio | Dirección |
| R-11 | Incumplimiento de la Ley 1581 (datos personales) | 2 | 4 | 8 | Datos mínimos, aislamiento, sin datos de tarjeta | Mitigar: política de tratamiento publicada en cada tienda y aviso de privacidad de la plataforma | Bajo | Dirección |
| R-12 | Proveedor comprometido | 2 | 4 | 8 | Proveedores con SOC 2/ISO, llaves con alcance mínimo | Mitigar: revisión anual (política 06) | Bajo | Resp. Seguridad |
| R-13 | Scripts inline permitidos por compatibilidad (navegadores sin CSP3) | 1 | 3 | 3 | Nonce + `strict-dynamic` en navegadores modernos | Aceptar | Bajo | Líder técnico |
