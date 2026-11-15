# 03 · Gestión de cambios y desarrollo seguro

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Flujo de cambios

1. Todo cambio entra por **pull request** a `test` → `develop` → `main` (`docs/CICD.md`).
2. `main` está **protegida**: PR obligatorio, al menos **1 aprobación** distinta del autor, checks
   **CI** y **Security** en verde, sin push directo ni force-push.
3. Las zonas sensibles (migraciones, tenancy, middlewares, webhooks, APIs internas, infra, CI)
   requieren revisión del responsable (`.github/CODEOWNERS`).
4. Cada release a producción sigue el runbook `docs/GO-LIVE-SAAS.md` y queda trazado en git (tag o
   merge a `main`) y en el historial de deploys de Vercel.
5. **Cambios de emergencia:** se permiten con aprobación posterior en máximo 2 días hábiles y su
   registro en el historial de incidentes.

## 2. Migraciones de base de datos

- Aditivas e idempotentes (re-ejecutables), con instrucciones de rollback comentadas.
- Toda tabla de tienda lleva `tenant_id` y RLS habilitado desde su creación.
- Se aplican primero en dev/test; en producción siempre con `--no-seeds`.

## 3. Desarrollo seguro (NIST SSDF)

| Práctica SSDF | Cómo se cumple |
|---|---|
| PO.1 Requisitos de seguridad | Criterios de aceptación de seguridad en cada HU que toque datos, dinero o permisos |
| PS.1 Proteger el código | Repositorio privado, MFA, CODEOWNERS, ramas protegidas, Gitleaks |
| PS.2 Integridad de releases | Builds reproducibles en Vercel desde git; lockfile congelado |
| PS.3 Archivar releases | SBOM SPDX por ejecución del workflow Security |
| PW.4 Componentes de terceros | Dependabot semanal, `pnpm audit` (alta/crítica bloquea), overrides solo para parches |
| PW.5 Codificación segura | Reglas de §4; revisión en PR |
| PW.7/PW.8 Revisión y pruebas | Tipado estricto, pruebas automatizadas (incluye pruebas de seguridad), CodeQL `security-extended` |
| RV.1/RV.2 Vulnerabilidades | `SECURITY.md` (divulgación), triage con los plazos de §5 |

## 4. Reglas de codificación segura

- **Salida:** JSX por defecto; `dangerouslySetInnerHTML` solo con contenido escapado (`escapeHtml`,
  `markdownToHtml`) o JSON con `safeJsonForScript`. En correos, escapar todo dato del usuario.
- **Entrada:** validar en el servidor (tipos, longitudes, listas blancas); en filtros PostgREST no
  interpolar texto libre en `.or()`.
- **Autorización:** cada ruta verifica sesión + rol/feature + `tenant_id` del contexto (nunca del
  cliente).
- **Dinero:** idempotencia por evento, firmas verificadas en tiempo constante, re-consulta a la
  pasarela cuando la firma no es confiable, y `logAudit`.
- **Redirecciones:** solo rutas relativas (`safeReturnPath`).
- **Archivos:** verificar tipo real (magic bytes) y tamaño; claves con prefijo de tenant.
- **Secretos:** nunca en código, logs, URLs ni respuestas al navegador.
- **CSP:** no agregar `'unsafe-eval'` ni orígenes de scripts sin justificación en el PR.

## 5. Plazos de corrección de vulnerabilidades

| Severidad (CVSS) | Plazo máximo en producción |
|---|---|
| Crítica (9.0–10) | 72 horas |
| Alta (7.0–8.9) | 14 días |
| Media (4.0–6.9) | 45 días |
| Baja | Siguiente ciclo planificado |

Una excepción requiere riesgo aceptado por la dirección en el registro de riesgos (07).
