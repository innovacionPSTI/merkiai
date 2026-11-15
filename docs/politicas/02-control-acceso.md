# 02 · Política de control de acceso

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Alcance

Accesos de **personal interno** (consola, nubes, repositorio) y de **usuarios de las tiendas**
(panel admin y storefront).

## 2. Reglas generales

- Cuentas **nominales** (una por persona). Prohibidas las cuentas compartidas, salvo cuentas de
  servicio documentadas con dueño.
- **MFA obligatorio** para: operadores de la consola, administradores de tienda con rol
  `super_admin`/`admin`, y cuentas de GitHub, Vercel, Supabase, AWS, Stack Auth, Resend, PayZen y
  Cloudflare.
- Acceso otorgado por **solicitud aprobada** (ticket o registro) indicando rol y motivo.

## 3. Accesos internos (plataforma)

| Sistema | Quién | Nivel |
|---|---|---|
| Consola (`platform:operate`) | Operadores designados | Operación de tenants, planes y cobro |
| Supabase producción | Líder técnico + 1 respaldo | Owner; el resto, sin acceso a prod |
| AWS (vault KMS) | Líder técnico | Admin de la cuenta; la app usa un IAM con 4 acciones sobre 1 llave |
| Vercel producción | Líder técnico + desarrolladores autorizados | Deploy vía rama `main` protegida |
| GitHub | Equipo | Escritura en ramas de trabajo; `main` solo por PR aprobado |

- **Acceso a datos de producción:** solo para incidentes o soporte solicitado por la tienda. Queda
  registro (ticket) y se prefiere la consola o el panel antes que la consulta directa a la base.
- **Service-role / llaves maestras:** solo en el borde server-side documentado (islas de
  aprovisionamiento); nunca en el navegador ni en flujos de usuario.

## 4. Accesos de las tiendas (panel admin)

- Roles del panel: `super_admin`, `admin`, gestor, vendedor (y los que defina el plan). Los permisos
  se aplican en el servidor; ocultar un botón en la interfaz no basta.
- Credenciales de integraciones (pagos, envíos, correo): **solo `super_admin`/`admin`**.
- El dueño de la tienda es responsable de dar y retirar los accesos de su equipo.

## 5. Altas, cambios y bajas

- **Alta:** al ingresar, con el mínimo rol necesario.
- **Cambio de rol:** revocar lo anterior en el mismo acto.
- **Baja:** en el último día de trabajo (o de inmediato si es una salida no amistosa): retirar
  cuentas, rotar los secretos que la persona conocía y revisar llaves personales (SSH/API).

## 6. Revisión de accesos

**Trimestral**, a cargo del Responsable de Seguridad: listar usuarios de consola, Supabase, AWS,
Vercel, GitHub y Stack Auth; confirmar con cada dueño; retirar lo que sobre. Guardar el acta
(fecha, revisor, hallazgos, acciones) como evidencia.

## 7. Contraseñas y secretos

- Gestor de contraseñas corporativo; contraseñas únicas de 14 o más caracteres.
- Secretos de aplicación de 24 o más caracteres aleatorios, **rotación cada 90 días** (ver runbook):
  `SUPABASE_JWT_SECRET`, `INTERNAL_API_SECRET`, `CRON_SECRET`, llaves IAM del vault. Rotación
  inmediata ante sospecha de exposición.
