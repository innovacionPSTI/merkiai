# 08 · Clasificación y manejo de datos

| Versión | Fecha | Aprobó | Cambio |
|---|---|---|---|
| 1.0 (borrador) | nov-2026 | _pendiente_ | Versión inicial |

## 1. Niveles

| Nivel | Ejemplos | Manejo |
|---|---|---|
| **Restringido** | Secretos (JWT secret, service-role, llaves de pasarela, IAM del vault), tokens de pago | Solo en el vault o variables cifradas del proveedor; nunca en repo, logs, UI ni correo; acceso nominal y mínimo |
| **Confidencial** | Datos personales de compradores (nombre, correo, teléfono, dirección), pedidos, cartera, datos de facturación de las tiendas | RLS por tenant; cifrado en tránsito (TLS/HSTS) y en reposo (proveedor); exportes solo por roles autorizados y auditados |
| **Interno** | Código, documentación técnica, métricas | Repositorio privado; compartir solo con personal y contratistas con NDA |
| **Público** | Catálogo, contenidos y páginas de las tiendas, sitio de Merkiai | Sin restricción |

## 2. Reglas de manejo

- **Datos de tarjeta:** prohibido almacenarlos o hacerlos pasar por Merkiai. Siempre formulario o
  redirección de la pasarela (tokenización).
- **Logs y errores:** sin secretos ni datos personales completos (Sentry con depuración de datos).
- **Correos:** solo el mínimo necesario; datos del usuario escapados.
- **Ambientes de prueba:** datos sintéticos; prohibido copiar producción sin anonimizar.
- **Exportes** (CSV de pedidos, clientes, cartera): solo roles autorizados del tenant, registrados
  en `audit_log`.

## 3. Retención y eliminación

| Dato | Retención |
|---|---|
| Pedidos, pagos, cartera, facturación | Mientras la tienda esté activa + el plazo legal contable (10 años en Colombia, Código de Comercio art. 60). Lo aplica y conserva la tienda como responsable |
| Datos de compradores | Mientras exista la relación o la tienda los requiera; se suprimen a solicitud del titular (Ley 1581), salvo obligación legal |
| `audit_log` y logs de seguridad | ≥ 1 año |
| Tienda cancelada | Exportación disponible por 30 días; luego eliminación o anonimización, salvo obligación legal |

## 4. Roles frente a la Ley 1581

La **tienda** es la *responsable* del tratamiento de los datos de sus compradores; **Merkiai** actúa
como *encargada* y trata los datos solo según las instrucciones de la tienda y estos términos. Para
los datos de las propias tiendas (cuentas, facturación), Merkiai es la responsable.
