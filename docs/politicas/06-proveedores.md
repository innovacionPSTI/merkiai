# 06 · Gestión de proveedores (subprocesadores)

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Reglas

- Antes de contratar un proveedor que trate datos de Merkiai o de las tiendas: revisar su
  certificación (SOC 2 Tipo II o ISO 27001), su acuerdo de tratamiento de datos (DPA) y la ubicación
  de los datos.
- Mantener este inventario actualizado y revisarlo **anualmente** (descargar los reportes vigentes
  y guardarlos como evidencia).
- Las tiendas se informan de los subprocesadores en los términos del servicio; los cambios
  relevantes se avisan con antelación.

## 2. Inventario

| Proveedor | Uso | Datos | Criticidad | Evidencia a pedir |
|---|---|---|---|---|
| Supabase | Base de datos, auth de BD, storage | Todos los datos de tiendas y compradores | Crítica | SOC 2 Tipo II, DPA |
| Vercel | Hosting de las 3 apps, cron | Tráfico y logs | Crítica | SOC 2 Tipo II, ISO 27001, DPA |
| AWS (KMS) | Vault de secretos | Llaves de cifrado | Crítica | SOC 2, ISO 27001 |
| Stack Auth (Hexclave) | Autenticación de compradores, admins y operadores | Identidad (correo, nombre) | Crítica | Reporte de seguridad / SOC 2, DPA |
| Resend | Correo transaccional | Correo, nombre, contenido del pedido | Alta | SOC 2, DPA |
| PayZen (Lyra) | Cobro de planes y Merkiai Pagos | Tokens de pago (sin datos de tarjeta en Merkiai) | Crítica | PCI DSS AoC |
| Wompi, MercadoPago, Bold, Tu Compra | Pasarelas propias de las tiendas | Datos del pago (los gestiona la pasarela) | Alta | PCI DSS AoC |
| Cloudflare | DNS, dominios propios (for SaaS), R2 | Tráfico, archivos | Alta | SOC 2, ISO 27001 |
| Sentry | Errores y rendimiento | Trazas técnicas (sin datos sensibles) | Media | SOC 2, DPA |
| Skydropx | Envíos | Dirección y contacto del comprador | Media | DPA / cláusulas contractuales |
| Upstash (si se activa) | Rate limit | IP y contadores | Baja | SOC 2 |
| GitHub | Código y CI | Código fuente | Alta | SOC 2 |

## 3. Salida de un proveedor

Exportar los datos, revocar las llaves, confirmar por escrito el borrado y actualizar el inventario
y la matriz de variables.
