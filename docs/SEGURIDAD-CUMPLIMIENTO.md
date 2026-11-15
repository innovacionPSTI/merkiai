# Seguridad y cumplimiento — Merkiai (SOC 2 · ISO/IEC 27001:2022 · NIST SSDF)

> **Qué es este documento:** el mapa de **controles técnicos implementados** en la plataforma y
> sus **evidencias** en el repositorio, frente a SOC 2 (Trust Services Criteria), ISO/IEC
> 27001:2022 (Anexo A) y NIST SP 800-218 (SSDF), más las **brechas** que quedan. Sirve de base
> para una auditoría, **no** es una certificación: SOC 2 e ISO 27001 exigen además controles
> organizacionales (políticas, gestión de riesgos, personal, proveedores) y la revisión de un
> auditor independiente.
>
> Versión: v270 (nov-2026) · Revisión de hardening + cierre de riesgos residuales técnicos + políticas base (`docs/politicas/`).

---

## 1. Resultado de la revisión de hardening (nov-2026)

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| H-01 | **XSS almacenado en JSON-LD** (producto/blog): `JSON.stringify` no escapa `</script>`; un nombre de producto podía inyectar script en la tienda | Alta | ✅ Corregido: `safeJsonForScript` escapa `<`, `>`, `&`, U+2028/2029 |
| H-02 | **XSS en sección "Servicios"** del CMS: el título se insertaba como HTML crudo | Alta | ✅ Corregido: se escapa y solo se convierten saltos de línea |
| H-03 | **Inyección HTML en correos** (nombre del cliente, producto, transportadora, campaña, nombre de tienda) → enlaces de phishing con la marca de la tienda | Media | ✅ Corregido: escape en todas las plantillas de `@merkiai/database` y `web`; nombre de remitente saneado (sin `<>"\r\n`) |
| H-04 | **Open redirect** tras login (`returnTo` / `after_auth_return_to` aceptaban URLs absolutas o `//dominio`) | Media | ✅ Corregido: `safeReturnPath` solo admite rutas relativas del mismo origen |
| H-05 | **CSRF** en rutas `/api/*` con sesión por cookie dependía solo de SameSite | Media | ✅ Corregido: middleware de web, admin y console rechaza mutaciones con `Origin` de otro host (403); server-to-server (sin `Origin`) no se afecta |
| H-06 | **Consola sin cabeceras de seguridad** (sin CSP, HSTS, X-Frame-Options) | Alta | ✅ Corregido: CSP estricta, `frame-ancestors 'none'`, HSTS, `Referrer-Policy: no-referrer`, COOP, Permissions-Policy |
| H-07 | **`'unsafe-eval'` en la CSP de producción** (web y admin) | Media | ✅ Corregido: solo en desarrollo; `object-src 'none'`; `poweredByHeader: false` en las tres apps |
| H-08 | **Subida de archivos confiaba en el content-type del cliente** (HTML/SVG disfrazado de imagen) | Media | ✅ Corregido: verificación por *magic bytes* (JPG/PNG/WebP/GIF) y extensión derivada del tipo real |
| H-09 | **Escalada de privilegios**: roles de staff (vendedor, gestor) podían crear/editar credenciales de pasarelas, envíos y correo por API (la UI lo ocultaba) | Alta | ✅ Corregido: solo `admin`/`super_admin` en las APIs de integraciones (403 al resto) |
| H-10 | **Secreto expuesto al navegador** (`NEXT_PUBLIC_DRAFT_SECRET`) para una ruta de borrador inexistente | Baja | ✅ Retirado (variable y enlace) |
| H-11 | Operaciones de **cartera** (abonos, anulaciones, castigos, ajustes, cupos) sin rastro de auditoría | Media | ✅ Corregido: `logAudit` con actor, rol, entidad y metadatos |
| H-12 | Enlace público de **pago de saldo** sin límite de intentos | Baja | ✅ Corregido: rate limit por IP (10/min, bloqueo 5 min) |
| H-13 | Filtros PostgREST `.or(...)` con datos externos (Skydropx) | Media | ✅ Corregido en v264 (ids en lista blanca); búsquedas de catálogo/cartera ya saneadas |
| — | **CORS**: ninguna ruta emite `Access-Control-Allow-*` → solo mismo origen (navegador bloquea lecturas cruzadas). Webhooks e internas son server-to-server | — | ✅ Verificado (sin cambios) |
| — | Markdown del blog/legal: escapa HTML y valida `href` (rechaza `javascript:`/`data:`) | — | ✅ Verificado |
| — | CSS de tema inyectado: solo valores numéricos (hex→RGB) y fuentes de una lista cerrada | — | ✅ Verificado |

**Riesgos residuales (v270):**
- ✅ ~~`script-src 'unsafe-inline'`~~ → **CSP con nonce por petición + `'strict-dynamic'`** en web, admin y consola (middleware). `'unsafe-inline'`/`https:` quedan solo como compatibilidad para navegadores sin CSP3 (los modernos los ignoran). Parche de `@stackframe/stack` (`patches/`) para que su script de tema no dependa de `eval`.
- ✅ ~~Rate limit con *fallback* en memoria~~ → **Redis (Upstash REST)** como primer nivel cuando se configura (HU-434); RPC de Postgres y memoria quedan como respaldo.
- ✅ ~~Aislamiento de archivos solo en la app~~ → **RLS en `storage.objects` por prefijo de tenant** (e17/77) y subidas con JWT de tenant (`STORAGE_RLS_ENFORCED=true`).
- Webhook de MercadoPago con firma opcional: el estado siempre se **re-consulta a la API** de MP (no se confía en el cuerpo).
- Firma MD5 de Tu Compra (impuesta por el proveedor): el estado se re-consulta por API autenticada.
- `style-src 'unsafe-inline'` (estilos de tema y librerías): impacto bajo, sin ejecución de código.

---

## 2. Controles técnicos implementados → marcos

| Control | Implementación / evidencia | SOC 2 | ISO 27001:2022 | SSDF |
|---|---|---|---|---|
| **Aislamiento multi-tenant** | RLS por `tenant_id` en todas las tablas de tienda (`e17/*`), JWT de tenant firmado en servidor (`getAdminDb`/`getMachineDb`), sin service-role en flujos de usuario (HU-158/227) | CC6.1, CC6.6 | A.8.3, A.8.22 | PW.1 |
| **Control de acceso y mínimo privilegio** | Roles del panel + matriz por plan (HU-281), integraciones solo admin (H-09), consola con permiso `platform:operate`, IAM de KMS con 4 acciones sobre 1 llave (ADR-007) | CC6.1–CC6.3 | A.5.15, A.5.18, A.8.2 | PO.5 |
| **Autenticación** | Stack Auth por app (proyectos separados), registro deshabilitado en admin/console, cookies host-scoped | CC6.1 | A.8.5 | — |
| **Gestión de secretos** | Vault con **AWS KMS** (cifrado de sobre AES-256-GCM, DEK por secreto), secretos por tenant y de pasarelas gestionadas fuera de env, guard `env:check` en CI, nada de secretos en el repo | CC6.1, CC6.7 | A.8.24, A.5.17 | PS.1 |
| **Cifrado en tránsito** | HTTPS obligatorio con HSTS `preload` en las tres apps | CC6.7 | A.8.24 | — |
| **Seguridad de aplicaciones web** | CSP por app, `frame-ancestors`, `nosniff`, Referrer/Permissions-Policy, CSRF por Origin, escape de salida, open-redirect bloqueado, uploads verificados | CC6.6, CC6.8 | A.8.26, A.8.28 | PW.5, PW.6 |
| **Integridad de pagos** | Webhooks con firma verificada en tiempo constante antes de tocar estado (Wompi, Bold, PayZen), re-consulta autoritativa (MP, Tu Compra), idempotencia por evento, guarda anti-subpago, rate limit | CC7.1, PI1.x | A.8.26 | PW.5 |
| **API interna server-to-server** | `x-internal-secret` ≥24 chars, comparación *timing-safe*, rechazo de peticiones con `Origin`, rate limit, logs de intentos fallidos; cron con `CRON_SECRET` | CC6.6 | A.8.20, A.8.21 | — |
| **Registro y auditoría** | `audit_log` append-only (operaciones sensibles del panel, exportes, cartera), libros append-only de inventario y cartera, Sentry (errores/APM) | CC4.1, CC7.2, CC7.3 | A.8.15, A.8.16 | RV.1 |
| **Integridad de datos financieros** | Libros contables operativos *append-only* e idempotentes (`stock_movements`, `receivable_movements`, `billing_events`, `payment_fees`): los saldos son proyecciones, nunca se editan | PI1.2–PI1.5 | A.8.10 (trazabilidad) | — |
| **Gestión de cambios** | Ramas `test`→`develop`→`main`, PR + aprobación + checks obligatorios (`docs/CICD.md` §4), CODEOWNERS en zonas sensibles, runbook de release (`docs/GO-LIVE-SAAS.md`) | CC8.1 | A.8.32 | PO.3, PS.2 |
| **Desarrollo seguro / pruebas** | Tipado estricto + ~1.500 pruebas automatizadas en CI; pruebas específicas de seguridad (aislamiento RLS, firmas, CSRF, escape, sniffing) | CC8.1 | A.8.25, A.8.29 | PW.7, PW.8 |
| **Vulnerabilidades y dependencias** | `security.yml`: `pnpm audit` (alta/crítica), Gitleaks, **CodeQL** `security-extended`, **SBOM** SPDX; Dependabot semanal | CC7.1 | A.8.8 | PW.4, RV.1, RV.2, PS.3 |
| **Divulgación de vulnerabilidades** | `SECURITY.md` con canal, plazos y puerto seguro | CC2.3 | A.5.24, A.6.8 | RV.1 |
| **Separación de ambientes** | prod/dev/test en cuentas separadas, llaves de pago de prueba fuera de prod, KMS por ambiente (`docs/CICD.md` §7, `ENV-VARS-MATRIZ.md`) | CC6.1, CC8.1 | A.8.31 | PO.5 |
| **Disponibilidad y continuidad** | Despliegues inmutables con *rollback* (Vercel), migraciones aditivas e idempotentes, *fail-closed* en dependencias críticas | A1.2 | A.5.30, A.8.14 | — |
| **Privacidad** | Datos de tarjeta nunca tocan la plataforma (tokens en pasarela/vault), mínimo de datos en correos y logs | P-series / C1.1 | A.5.34 | — |

---

## 3. Brechas para una auditoría (controles organizacionales y operativos)

Estas no se resuelven con código; son necesarias para SOC 2 Tipo I/II o ISO 27001:

| Brecha | Qué hace falta | Marco |
|---|---|---|
| Políticas formales | **Borradores listos en `docs/politicas/` (01–08)**: falta aprobación de la dirección, comunicación al personal y evidencia de operación | CC1–CC2 / cl. 5, A.5.1 |
| Gestión de riesgos | Registro inicial en `docs/politicas/07-registro-riesgos.md`; falta revisión trimestral con acta y la Declaración de Aplicabilidad (SoA) para ISO | CC3 / cl. 6.1, 8.2 |
| **MFA obligatorio** | Exigir MFA a operadores de consola y administradores de tienda (configuración de Stack Auth) y a las cuentas de Vercel/Supabase/AWS/GitHub | CC6.1 / A.8.5 |
| Revisiones de acceso | Revisión trimestral de usuarios con acceso a consola, nubes y repositorio, con evidencia | CC6.2 / A.5.18 |
| Respaldo y restauración | Activar PITR en Supabase de prod, prueba de restauración documentada (semestral), RPO/RTO definidos | A1.2–A1.3 / A.8.13 |
| Monitoreo y alertas | Alertas de Sentry y de los logs de `/api/internal` (401/429), guardia y escalamiento | CC7.2 / A.8.16 |
| Respuesta a incidentes | Plan, roles, plantillas de comunicación a tiendas, ejercicio anual | CC7.3–CC7.5 / A.5.24–A.5.27 |
| Proveedores | Inventario de subprocesadores (Supabase, Vercel, AWS, Stack Auth, Resend, PayZen, Cloudflare) con sus reportes SOC 2/ISO y DPA | CC9.2 / A.5.19–A.5.22 |
| Personal | Acuerdos de confidencialidad, capacitación anual en seguridad, alta/baja de personal | CC1.4 / A.6.1–A.6.5 |
| Registro de auditoría centralizado | Retención ≥1 año de `audit_log` y logs de plataforma, exportación a almacenamiento inmutable | CC7.2 / A.8.15 |
| Pentest externo | Prueba de penetración anual antes de salir con clientes de mayor tamaño | CC4.1 / A.8.29 |
| Protección de rama en GitHub | Activar las reglas de `docs/CICD.md` §4 y marcar `CI` y `Security` como checks obligatorios; reemplazar el equipo de CODEOWNERS por el real | CC8.1 / A.8.32 |

---

## 4. Cómo mantener este estado (SSDF en el día a día)

1. **Cada PR**: CI (tipos, lint, pruebas, `env:check`) + Security (audit, Gitleaks, CodeQL) en verde.
2. **Cada semana**: Dependabot abre PRs; revisar y fusionar parches; CodeQL programado.
3. **Cada release**: runbook `GO-LIVE-SAAS.md` + SBOM del build guardado como evidencia.
4. **Código nuevo** que muestre datos de usuario: escapar (`escapeHtml`) o usar JSX; nunca `dangerouslySetInnerHTML` con contenido sin sanear; JSON en `<script>` solo con `safeJsonForScript`.
5. **Rutas nuevas**: autenticación + autorización por rol/feature + `tenant_id` del contexto (nunca del cliente); mutaciones de dinero con `logAudit` e idempotencia.
