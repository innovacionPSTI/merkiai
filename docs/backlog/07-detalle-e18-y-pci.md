## Detalle · E18 — Inventario multi-ubicación y fulfillment (HU-176…183)  *(roadmap)*

> **Épica nueva.** Introduce el concepto de **ubicaciones** (tipo Shopify Locations): el stock pasa de `por variante` a `por (variante, ubicación)`, con fulfillment por lugar, transferencias y retiro por punto. Es un **cambio de modelo fundacional** que toca inventario (E9), envíos (E7), catálogo (E4) y admin (E13), y hereda el aislamiento de E17. Incluye una HU dedicada a **migrar lo ya implementado** sin ruptura. Todo **🔲 (roadmap)**.

### HU-176 — Modelo de ubicaciones (`locations`) · E18

> Como negocio, quiero definir ubicaciones (bodegas, tiendas físicas, puntos de retiro) con dirección y capacidades, para gestionar inventario y fulfillment por lugar.

**Estimación:** M (5 puntos)
**Módulo:** tabla `locations` (con `store_id`), toggles, admin
**Estado:** 🔲 Pendiente (roadmap) — **cimiento de E18**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | CRUD | Ubicación con dirección y toggles (¿surte envíos?, ¿permite retiro?) |
| AC-2 | Multi-tenant | `store_id` por ubicación (aislamiento heredado de E17) |
| AC-3 | Default | Una ubicación por defecto obligatoria (para compatibilidad y backfill) |

---

### HU-177 — Inventario por ubicación (`inventory_levels`) + RPCs por ubicación · E18

> Como plataforma, quiero llevar el stock por `(variante, ubicación)` con operaciones atómicas por ubicación, para reflejar existencias reales por lugar.

**Estimación:** L (8 puntos)
**Módulo:** tabla `inventory_levels`, RPCs `decrement/restore` con `p_location_id`
**Estado:** 🔲 Pendiente (roadmap) — **enabler del modelo**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Modelo | `inventory_levels(variant_id, location_id, stock)` único por par |
| AC-2 | RPCs por ubicación | `decrement/restore_variant_stock` reciben `location_id`; respetan `allow_backorder`; atómicos e idempotentes |
| AC-3 | Disponibilidad agregada | Vista de stock total por variante (suma de ubicaciones) para consumidores que no distinguen ubicación |
| AC-4 | Concurrencia | Mismo control de carrera que el modelo actual |

---

### HU-178 — Migración del modelo de stock único → multi-ubicación · E18

> Como equipo, quiero migrar el modelo actual (stock único por variante) al multi-ubicación **sin pérdida ni ruptura**, para adoptar el nuevo enfoque de forma segura.

**Estimación:** L (8 puntos)
**Módulo:** migración de datos + refactor de los consumidores existentes
**Estado:** 🔲 Pendiente (roadmap) — **contempla los cambios de lo ya implementado**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Backfill | Se crea la ubicación por defecto y el `product_variants.stock` actual se copia a `inventory_levels` de esa ubicación |
| AC-2 | Compatibilidad | `product_variants.stock` se conserva como **agregado derivado** (o se deprecia) con lectura agregada durante la transición |
| AC-3 | Refactor de consumidores | Se adaptan: `stock.ts` (`applyStockForOrder`/`restoreStockForOrder` → por ubicación de fulfillment), RPCs (HU-098), topes del front `getStockForVariants`/PDP (HU-100), back-in-stock (HU-105), alertas (HU-106), validación 409 del checkout y el campo de stock en `ProductForm` (admin) |
| AC-4 | Cutover por fases | Con retrocompatibilidad; se prueba que el flujo actual (una sola ubicación) queda idéntico |
| AC-5 | Seguro | No rompe órdenes ni stock existentes; reversible |

---

### HU-179 — Ruteo de fulfillment (origen del despacho) · E18

> Como operador, quiero que cada pedido se surta desde una ubicación (por disponibilidad, cercanía o manual), para definir el origen del envío o el punto de retiro.

**Estimación:** L (8 puntos)
**Módulo:** asignación de ubicación de fulfillment por orden, integración con envíos (E7)
**Estado:** 🔲 Pendiente (roadmap) — depende de HU-177

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Asignación | Regla por disponibilidad + cercanía a la dirección, o selección manual |
| AC-2 | Descuento | El stock se descuenta en la ubicación asignada (HU-177) |
| AC-3 | Envíos | El origen del despacho alimenta la cotización/guía (E7/Skydropx) |
| AC-4 | Sin cobertura | Pedido sin ubicación con stock suficiente → estado claro para el operador |

---

### HU-180 — Transferencias de stock entre ubicaciones · E18

> Como operador, quiero mover stock entre ubicaciones con trazabilidad, para reabastecer y balancear existencias.

**Estimación:** M (5 puntos)
**Módulo:** movimientos de inventario (transfer), auditoría
**Estado:** 🔲 Pendiente (roadmap) — depende de HU-177

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Transferencia | Origen → destino con cantidades; ajusta ambos `inventory_levels` atómicamente |
| AC-2 | Trazabilidad | Historial de movimientos auditable (HU-146) |
| AC-3 | Estados | Pendiente / en tránsito / recibida (si aplica) |

---

### HU-181 — Click & collect con stock por ubicación · E18 (integra HU-110)

> Como comprador, quiero elegir retiro en una tienda que tenga el producto en stock, para recogerlo donde sí hay disponibilidad.

**Estimación:** M (5 puntos)
**Módulo:** PDP/checkout muestran disponibilidad por ubicación de retiro
**Estado:** 🔲 Pendiente (roadmap) — extiende HU-110 con HU-177

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección | El paso de retiro (HU-110) muestra solo ubicaciones con `permite_retiro` y stock del ítem |
| AC-2 | Reserva | Al elegir, se reserva/descuenta en esa ubicación |
| AC-3 | Consistencia | Retiro = ubicación de fulfillment (HU-179) |

---

### HU-182 — Gestión de ubicaciones e inventario en el admin · E18

> Como operador, quiero administrar ubicaciones y ajustar el stock por ubicación desde el panel, para operar el inventario multi-lugar.

**Estimación:** M (5 puntos)
**Módulo:** admin (CRUD ubicaciones, edición de niveles por ubicación)
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Ubicaciones | CRUD (HU-176) desde el panel |
| AC-2 | Niveles | Edición de stock por `(variante, ubicación)`; vista de niveles en el producto |
| AC-3 | Permisos | Por rol; en multi-tenant, acotado a la tienda (E17) |

---

### HU-183 — Reportes de inventario y alertas de stock bajo por ubicación · E18

> Como operador, quiero ver el inventario y recibir alertas de stock bajo por ubicación, para reponer donde falta.

**Estimación:** M (5 puntos)
**Módulo:** reportes por ubicación (extiende HU-106/116)
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Inventario por ubicación | Vista con filtros; export (compatible con HU-116/130) |
| AC-2 | Alertas | Stock bajo por `(variante, ubicación)` — extiende el umbral de HU-106 |
| AC-3 | Permisos | Solo roles autorizados |

---

## Detalle · Hardening PCI DSS (HU-184…187) · E14

> Refuerza el cumplimiento de **PCI DSS**. Contexto: la plataforma usa **flujo redirect/hosted** (el cliente digita la tarjeta en la pasarela), por lo que **no almacena, procesa ni transmite datos de tarjeta (CHD)** → alcance mínimo **SAQ A**. Este bloque cierra los controles operativos que faltan para sostener ese alcance. Se apoya en **HU-117 (MFA admin)** y **HU-146 (auditoría)**, que son parte del cumplimiento. Todo **🔲 (roadmap)**.

### HU-184 — Gestión y rotación de llaves de pasarela · E14 (toca E6)

> Como responsable de seguridad, quiero cifrar, rotar y limitar el acceso a las llaves de las pasarelas de pago, para reducir el riesgo de fuga (PCI DSS req. 3 y 8).

**Estimación:** L (8 puntos)
**Módulo:** cifrado/secrets manager para los secretos de `payment_config`, rotación, mínimo privilegio
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cifrado en reposo | Secretos de pasarela cifrados / gestionados por un secrets manager; acceso solo server-side (`service_role`) |
| AC-2 | Rotación | Procedimiento de rotación de llaves sin downtime; cada rotación queda auditada (HU-146) |
| AC-3 | Mínimo privilegio | Solo roles autorizados leen/editan credenciales (compatible con HU-134) |
| AC-4 | No exposición | Nunca se devuelven en claro al cliente (ya enmascaradas; mantener) |

---

### HU-185 — Política de logging seguro (sin datos sensibles) · E14

> Como responsable, quiero que los logs no contengan datos sensibles (PAN aunque venga enmascarado, secretos, payloads completos de pago), para cumplir PCI DSS req. 3 y 10.

**Estimación:** M (5 puntos)
**Módulo:** capa de logging con redacción; revisión de `console.*` en webhooks
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Redacción | Campos sensibles (PAN, secretos, tokens) redactados u omitidos en logs |
| AC-2 | Webhooks | No se loguea el payload completo de pago por defecto |
| AC-3 | Retención/acceso | Logs con retención y acceso controlados (compatible con HU-146/170) |

---

### HU-186 — Conformidad PCI DSS: alcance SAQ A + evidencia · E14 (toca E6)

> Como responsable, quiero documentar y mantener el alcance SAQ A y la evidencia de conformidad, para la atestación con el adquirente.

**Estimación:** M (5 puntos)
**Módulo:** documentación de alcance, checklist SAQ A, recopilación de AOC de proveedores
**Estado:** 🔲 Pendiente (roadmap)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Alcance documentado | La app no almacena/procesa/transmite CHD; flujo redirect a pasarelas PCI-compliant |
| AC-2 | Checklist SAQ A | TLS, control de accesos, MFA admin (HU-117), auditoría (HU-146) y gestión de llaves (HU-184) cubiertos |
| AC-3 | Evidencia | AOC/atestaciones PCI de Wompi/MercadoPago/Bold recopiladas |
| AC-4 | Guardarraíl | Alerta si se introduce un flujo que rompa SAQ A (widget embebido → SAQ A-EP) |

---

### HU-187 — Integridad de scripts de la página de pago (PCI DSS 4.0 · 6.4.3 / 11.6.1) · E14

> Como responsable, quiero controlar y detectar cambios en los scripts de las páginas que intervienen en el pago, para cumplir PCI DSS 4.0 si se usa cualquier JS de pasarela en el propio checkout.

**Estimación:** M (5 puntos)
**Módulo:** inventario de scripts + integridad (CSP/SRI), detección de manipulación
**Estado:** 🔲 Pendiente (roadmap) — aplica si se pasa de redirect a widget embebido (SAQ A-EP)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Inventario | Lista autorizada de scripts en páginas de pago; CSP restrictiva + SRI donde aplique |
| AC-2 | Detección | Se detectan cambios/manipulación en la página de pago |
| AC-3 | Aplicabilidad | En modo redirect puro se documenta como no-aplicable; se activa al embeber JS de pasarela |

---

### HU-188 — Tu Compra: modalidad INTEGRADOR (API REST · token JWT · multi-método) · E6

> Como plataforma, quiero integrar Tu Compra en su **modalidad integrador** (`confirmacionTransaccionMedioPago`, transaccional por medio de pago, con `Referencia`=order_number), para cobrar y correlacionar los pedidos. Reemplaza tanto el modelo antiguo (form-POST+MD5) como el intento con `crearBotonPago` (botón reutilizable, sin referencia). **Configurable** para cualquier comercio (medios habilitados e IDs de método parametrizables), no atado a la config de una pasarela concreta.

**Estimación:** XL (13+ puntos) → **dividida en 188a–188d + 188e (enabler)**
**Módulo:** `TuCompraGateway` (integrador), `payment_config` (config de medios + llave de firma), `orders` (seguimiento), factory, admin (URLs + config de medios), checkout (flujo por medio), webhook (URL de Confirmación + firma), reconcile
**Estado:** 🔲 En progreso (v20). Alcance confirmado: **PSE, Nequi, Daviplata, Referenciado**. **Tarjeta queda FUERA** (cifrado RSA rompe PCI SAQ A) y se **quitó** de la interfaz de administración. **HU-088 queda reemplazada por esta HU.** **Hecho:** gateway integrador (`/autenticar`, `/confirmacionTransaccionMedioPago`, `listarBancos`, `/consultarEstadoTransaccion`, `finalizaPagoDaviplata`, `verifyConfirmationSignature`, `mapStatus`), config de medios (`tucompra_methods`) + llave de firma (`tucompra_encryption_key`) + seguimiento persistido (`orders.tucompra_codigo_seguimiento/numero_transaccion`), flujo por medio en el checkout, webhook con verificación de **firmaTuCompra** + re-consulta autoritativa, reconcile web+admin, tests. **Pendiente:** validación end-to-end en sandbox de los 4 medios. Doc: `desarrolladores.tucompra.net/manuales/rest` + `Tu-Compra-Integracion-Referencia.md` (raíz del workspace).

**Sub-HU:**

- **HU-188a · PSE** — `MetodoPago` con `campo1`=código banco, **`campo2`=nombre banco**, `campo3`=tipo persona, `campo4`=URL retorno; `listarBancos` puebla el selector; respuesta `urlBanco` → **redirección al banco**. (IDs demo 41 / prod 3.)
- **HU-188b · Nequi** — push: `CodigoRespuesta 2` PENDIENTE → pantalla "aprueba en tu app Nequi" + **polling** de `consultarEstadoTransaccion` (vigencia 15 min). Sin redirección.
- **HU-188c · Daviplata** — OTP: `CodigoRespuesta 2` → el cliente ingresa el OTP → `finalizaPagoDaviplata {codigoSeguimiento, terminal, tokenSeguridad, codigoOTP}` → confirma.
- **HU-188d · Referenciado** — `MetodoPago` solo `id`; respuesta `urlBanco` = **PDF/comprobante** con código de barras; pedido pendiente hasta el pago en efectivo.
- **HU-188e · Enabler** — persistir `CodigoSeguimiento`/`numeroTransaccion` (migración 28), llave de firma `tucompra_encryption_key`, verificación de `firmaTuCompra` en el webhook y re-consulta autoritativa por API.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Credenciales reales | `payment_config` guarda **usuario**, **clave**, **terminal** (Id Sistema), **URL base** (demo/prod) y **llave de encriptación** (MD5, firma); expuestos en el admin. La llave RSA (tarjeta) no se usa. |
| AC-2 | Autenticación | `POST /autenticar` con `{usuario, clave, terminal}` → `tokenSeguridad` (JWT) en cada servicio; manejo de `codigoRespuesta` |
| AC-3 | Flujo por medio | Cada medio tiene su flujo: **PSE** redirige a `urlBanco`; **Nequi** push+polling; **Daviplata** OTP+`finalizaPagoDaviplata`; **Referenciado** PDF/comprobante. Todos con `Referencia`=order_number. **NO** `crearBotonPago` |
| AC-4 | Multi-método configurable | Medios habilitados (**PSE/Nequi/Daviplata/Referenciado**) e **IDs de `MetodoPago`** parametrizables por entorno (Tabla de Valores). **Tarjeta excluida** por PCI SAQ A. |
| AC-5 | URLs configurables | **URL de Confirmación** (server-to-server, webhook autoritativo por `Referencia`) y **URL de Retorno** (navegador → confirmación) visibles/copiables en el admin |
| AC-6 | Seguridad y pruebas | Deriva del `active_provider` (HU-092); **verificación de `firmaTuCompra`** (MD5) + estado autoritativo por API (nunca el cliente); `CodigoSeguimiento` persistido para consultar estado y finalizar Daviplata; tests de gateway/reconcile |

---

### HU-189 — Rediseño UX de configuración de pagos (entorno Demo/Producción + selector visual de métodos) · E6 (toca E13)

> Como administrador, quiero configurar las pasarelas de forma clara —ver de un vistazo cuál está **activa** y si es **Demo** o **Producción**, y habilitar/ordenar los métodos de Tu Compra sin editar JSON—, para operar sin errores.

**Estimación:** M (5 puntos)
**Módulo:** admin `PaymentConfigForm` (entorno, badges, selector de métodos con drag-and-drop)
**Estado:** 🔲 Pendiente (v19)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Entorno por pasarela | Indicador **Demo/Producción**: toggle donde la API lo permite (Bold `sandbox`, Tu Compra URL base), badge **auto-detectado** donde lo implica la credencial (Wompi `pub_test/pub_prod`, MercadoPago `TEST/APP_USR`) |
| AC-2 | Estado activo claro | La pasarela **activa** y su entorno se ven de un vistazo (badge "Activa · Demo/Producción") |
| AC-3 | Tu Compra sin JSON | Reemplaza el textarea por una **lista de métodos** (**PSE/Nequi/Daviplata/Referenciado** — Tarjeta excluida por PCI) con switch de habilitado + **drag-and-drop para ordenar** |
| AC-4 | IDs por entorno | El toggle Demo/Prod aplica los IDs correctos por método desde una tabla interna (PSE 41/3, Nequi 72, Daviplata 71, Referenciado 45); editable en modo avanzado |
| AC-5 | Reflejo en checkout | El orden/habilitados se reflejan en el selector de medio del checkout |
| AC-6 | UX | Estético, intuitivo y accesible por teclado |

---

### HU-190 — Endurecimiento de confirmaciones de pago (anti-forja + anti-subpago) · E6

> Como plataforma, quiero que ninguna confirmación de pago pueda ser forjada ni por un monto menor al del pedido, para que solo se marquen como pagados los pedidos realmente pagados por su valor total. Aplica a **todas las pasarelas** (Wompi, MercadoPago, Bold, Tu Compra).

**Estimación:** M (5 puntos)
**Módulo:** `lib/wompi`, `BoldGateway`, `TuCompraGateway`, webhooks (wompi/mercadopago/bold/tucompra), `lib/payment-guards`, reconcile (web+db), `GET /api/checkout/status`
**Estado:** ✅ Implementado (v20)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | El estado nunca viene del cliente | Solo se acepta un pago aprobado si (a) la firma del webhook es válida o (b) se re-consulta el estado a la API autenticada del proveedor. Un pedido inexistente no actualiza nada |
| AC-2 | Wompi fail-closed | `verifyWompiWebhook` **rechaza** si falta el events-secret o el checksum (antes hacía bypass) y compara con `timingSafeEqual` |
| AC-3 | Bold fail-closed | `verifyWebhook` rechaza en **producción** con llave secreta vacía; `timingSafeEqual`; llave vacía solo en sandbox |
| AC-4 | Tu Compra / MercadoPago | Tu Compra: firma `firmaTuCompra` (timing-safe) + re-consulta autoritativa. MercadoPago: re-consulta el pago con nuestro token (ignora el estado del body) |
| AC-5 | Anti-subpago | Al aprobar, se verifica que el monto pagado cubre `order.total` (`amountCoversOrder`); si es menor → el pedido queda `pending` y se registra en el log |
| AC-6 | Superficie mínima | `GET /api/checkout/status` con rate-limit por IP; los endpoints de reconcile/finalize también; sin exponer datos del cliente |
| AC-7 | Ventana de replay (Wompi) | Se rechaza (401) un webhook de Wompi con `x-timestamp` fuera de ±5 min (`isWompiTimestampFresh`) |
| AC-8 | Firma MercadoPago | Verificación de `x-signature` (`verifyMercadoPagoSignature`, HMAC del manifest `id;request-id;ts`) cuando hay `mercadopago_webhook_secret`; defensa en profundidad sobre la re-consulta |
| AC-9 | Idempotencia por evento | Tabla `processed_webhook_events` (PK provider+event_id); un reintento del mismo evento se ignora (200 idempotent). Aplica a las 4 pasarelas (`markWebhookEventProcessed`) |

**Pendiente (hardening futuro):** purga programada de `processed_webhook_events`; `x-signature`/replay para Bold si su API lo expone.

---

### HU-191 — Consolidar `shipping_profiles` en `customer_addresses` (deuda de modelo de datos) · E12 (toca E2/E6)

> Como plataforma, quiero un **único origen de verdad** para las direcciones de envío del comprador, para eliminar la redundancia entre `shipping_profiles` (perfil único por email, sin FK) y `customer_addresses` (múltiples direcciones por `customer_id`, con `is_default`), simplificando el modelo y evitando datos divergentes.

**Contexto:** Hoy coexisten dos tablas que guardan lo mismo (nombre, teléfono, dirección, ciudad, departamento, código postal). `shipping_profiles` es anterior y se llena desde `/api/shipping-profile` + `ShippingProfileForm` (Mi Cuenta), indexada por email y **sin relación con `customers`**. `customer_addresses` es el modelo correcto (FK a `customers`, varias direcciones, `is_default`, `label`) y ya alimenta el checkout. Mantener ambas genera incoherencia (un usuario puede tener perfil y direcciones distintos) y una tabla huérfana respecto al grafo de `customers`.

**Estimación:** M (5 puntos)
**Módulo:** `migrations/upgrade.sql` (+ `01_schema.sql`), `queries/shipping-profile.ts` (deprecar), `queries/customer-addresses.ts`, `api/shipping-profile/` → `api/account/addresses/`, `components/account/ShippingProfileForm.tsx`, checkout (pre-llenado)
**Estado:** 🔲 Pendiente (deuda técnica detectada en la revisión del modelo v20)
**Depende de:** que el usuario esté autenticado (Stack Auth) para tener `customer_id`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Fuente única | Las direcciones de envío viven **solo** en `customer_addresses`. La UI de "perfil de envío" pasa a gestionar la dirección **por defecto** (`is_default = true`) de ese cliente |
| AC-2 | Migración de datos | Migración idempotente que copia cada `shipping_profiles` a `customer_addresses` del `customer` con el mismo email (match por `customers.email`), marcándola `is_default` si el cliente no tiene otra; filas sin cliente asociado se omiten y se registran |
| AC-3 | Deprecación de la tabla | Tras migrar, `shipping_profiles` queda **deprecada**: se elimina la tabla y su índice (o se conserva un periodo con comentario "DEPRECATED" antes del `DROP`), y se retiran `getShippingProfile`/`upsertShippingProfile` |
| AC-4 | API unificada | `/api/shipping-profile` se elimina o se redirige a `/api/account/addresses`; la cuenta usa el CRUD de direcciones existente (crear/editar/borrar/def.) |
| AC-5 | Cuenta (Mi Cuenta) | `ShippingProfileForm` se reemplaza por (o se integra en) la gestión de direcciones; editar "mi dirección" = editar/crear la dirección por defecto |
| AC-6 | Checkout coherente | El pre-llenado del checkout toma la dirección `is_default` del cliente (una sola lógica; hoy ya usa `customer_addresses`) |
| AC-7 | Unicidad de default | Se garantiza a lo sumo **una** `is_default = true` por `customer_id` (constraint parcial `UNIQUE (customer_id) WHERE is_default` o control en la app) |
| AC-8 | Coherencia de modelo | Ninguna tabla queda huérfana del grafo de `customers`; RLS solo-`service_role` se mantiene; tests de migración + queries en verde |

> Nota: es un refactor de datos con feature vivo (`/api/shipping-profile`). Ejecutar en 2 fases si se despliega en caliente: (1) migrar datos + doble escritura, (2) `DROP` de `shipping_profiles` cuando ya nadie la lea.

---

