# ADR-010 · Cartera operativa: ventas a crédito, encargos con anticipo, apartados y consignación

> **Estado:** Aceptado en diseño (nov-2026). **Épica:** E27 · Cartera operativa (HU-450…457), detalle en `docs/backlog/13-detalle-e27-cartera.md`.
> **Relacionado:** E24 Operaciones (libro de movimientos, producción, listas de precio, cotizaciones/apartado HU-408), E18 Multiubicación (ubicaciones HU-176, transferencias con estados HU-180), E25 POS (caja, tenders, offline), crédito en tienda (HU-148), pasarelas por tenant (ADR-004) y PayZen/Merkiai Pagos (ADR-009).
> **Propósito:** permitir que la operación registre **lo que se debe y lo que se ha pagado** cuando la entrega y el cobro no ocurren al mismo tiempo, con **una sola primitiva genérica** válida para cualquier producto, servicio o caso, coherente con el inventario por ubicación y con el POS futuro.

---

## 1. Contexto

Escenarios reales de los comerciantes:

- **Consignación:** se deja mercancía a otro canal (aliado) que la vende y paga de a poco; lo que no vende lo devuelve.
- **Encargos:** se encargan uno o varios productos o servicios, se abona un anticipo (por pedido o por ítem) y el saldo se completa tras la elaboración y la entrega.
- **Venta a crédito / fiado** y **cuenta corriente** de clientes recurrentes.
- **Apartado:** reservar mercancía con abonos hasta completar el pago (pendiente de HU-408 AC-2).

Hoy el pedido funde tres cosas (qué se entrega, qué se cobra y el compromiso entre ambas). En estos casos ocurren en momentos distintos.

## 2. Decisión

### 2.1 Tres flujos separados, mismo patrón que el inventario

| Flujo | Registro | Verdad |
|---|---|---|
| Bienes/servicios | `stock_movements` (existente) | El movimiento; el disponible es proyección |
| **Compromiso** | **Documento de cartera** (nuevo) | Cargos con líneas genéricas |
| **Dinero** | **Movimientos de cartera** (nuevo) | El movimiento; el **saldo es proyección** |

El libro de cartera replica el principio del libro de inventario: **filas tipificadas, idempotentes (llave por operación) y reversibles**; nunca se edita un saldo. Tipos: `charge` (cargo), `payment` (abono), `credit_note` (devolución/descuento), `adjustment`, `write_off` (castigo), `credit_applied` (uso de saldo a favor).

### 2.2 Piezas

- **Contraparte:** generaliza `customers` con rol (`customer`, `consignee`; futuro `supplier` para cuentas por pagar operativas, simétricas). Cupo de crédito y condiciones por defecto (plazo, anticipo mínimo) opcionales.
- **Cuenta corriente por contraparte:** suma de sus documentos abiertos; un abono puede repartirse entre varios.
- **Documento de cartera:** líneas genéricas (variante/producto, `stock_item` de clase servicio o **línea libre** con descripción y precio), plan de pago, referencias opcionales (cotización, pedido, orden de producción, transferencia) y **dos estados independientes**:
  - *pago:* `open → partial → paid` (+ `overdue`, `written_off`, `void`)
  - *entrega:* `pending → partial → delivered`
- **Aplicación de abonos:** por defecto al documento/línea más antiguo; el operador puede imputar a una línea concreta ("anticipo por cada producto").

### 2.3 Modalidades = presets de datos (no módulos)

Cada documento declara una **modalidad** con parámetros. Las modalidades son configuración, no código:

| Modalidad | Entrega | Nace la deuda | Inventario | Parámetros configurables |
|---|---|---|---|---|
| `credit_sale` (crédito/fiado) | Inmediata | Al entregar | Sale de mi stock (venta) | Plazo, cuotas, cupo |
| `special_order` (encargo) | Diferida (tras elaborar) | Al aceptar; el anticipo abona | No sale hasta entregar; orden de producción opcional | Anticipo mínimo (% o valor, por documento o línea); **política de entrega** (ver 2.5) |
| `layaway` (apartado) | Al completar el pago | Al apartar | **Reserva** en el ledger, con caducidad | Días de reserva, abono mínimo |
| `consignment` (consignación) | Inmediata, al aliado | **Al entregar** (decisión del dueño), con derecho a devolver lo no vendido | **Sigue visible** en la ubicación del aliado hasta reportar venta o devolver | Lista de precios del canal, plazo de liquidación |

### 2.4 Consignación sobre multiubicación (sin tablas de stock nuevas)

Decisión del dueño: **la deuda nace al entregar**, con **derecho a devolver** lo no vendido. **Las ventas las reporta el comerciante** en su admin.

1. El aliado tiene una **ubicación** de tipo `consignment` ligada a su contraparte (se amplía el tipo de `locations`).
2. **Entrega** = **transferencia** a esa ubicación (HU-180, con estados) **+ cargo** en cartera por el valor entregado, al precio de la **lista de precios del canal** (HU-407; así se expresa el descuento o la comisión del aliado).
3. **Reporte de venta** (lo registra el comerciante): movimiento de venta **desde la ubicación del aliado**. No genera cargo nuevo (ya se cargó al entregar); cierra el derecho de devolución de esas unidades.
4. **Devolución** de lo no vendido: transferencia de regreso **+ nota crédito** que reduce la deuda.
5. Saldo del aliado = entregado − devuelto − abonado. Su inventario "en consignación" = stock de su ubicación.

(El parámetro "deuda al reportar la venta" queda soportado por el modelo para el futuro, pero **no** es el comportamiento por defecto.)

### 2.5 Encargos: política de entrega configurable

Configurable por tienda (valor por defecto) y por documento:

- `require_full_payment`: no se entrega hasta saldo cero.
- `allow_balance_on_delivery`: se puede entregar con saldo; el resto queda como **crédito** (sujeto al cupo de la contraparte si está definido).

### 2.6 Plan de pago: ambos esquemas

- **Libre con fecha límite:** abonos de cualquier valor hasta un vencimiento.
- **Cuotas:** calendario de cuotas con fechas y valores (iguales o personalizados). La mora se mide por cuota.

Ambos pueden exigir un **anticipo mínimo** al crear el documento.

### 2.7 Facturación: evento configurable (frontera anti-ERP)

La plataforma **no factura**: emite un **evento de facturación** hacia la integración fiscal (proveedor externo por `integration_instances`). El momento en que se dispara es **configurable por tienda y por modalidad**:

`on_document` (al crear) · `on_payment` (en cada abono, p. ej. anticipos) · `on_delivery` (al entregar) · `on_settlement` (al saldar) · `none` (manual).

Por defecto sugerido: `on_delivery` (o `on_settlement` en consignación), **sujeto a validación con el contador del comerciante**; la plataforma no asume criterio fiscal.

### 2.8 Coherencia con lo existente y lo futuro

- **Saldo a favor = crédito en tienda** (HU-148): excedentes y anticipos de encargos cancelados se convierten en crédito, no en un concepto nuevo.
- **Cobro del saldo en línea:** enlace de pago con la pasarela activa del tenant (ADR-004; PayZen BYO o Merkiai Pagos, ADR-009). La confirmación entra como `payment` (idempotente por transacción).
- **POS (E25):** tender **"a crédito"** crea el documento; la caja **recibe abonos** a cualquier documento abierto (el efectivo entra a la sesión de caja); verificación de **cupo**; offline con la misma cola idempotente.
- **Producción (E24):** el encargo puede generar una orden de producción; la entrega descuenta el terminado.
- **Apartado:** cierra HU-408 AC-2 con un movimiento `reserve`/`release` en el ledger.

### 2.9 Enmienda al principio anti-ERP

`11-detalle-pos-operaciones.md` §7 dejaba fuera las cuentas por cobrar y limitaba el fiado a una versión mínima. Se **enmienda**:

- **Dentro (cartera operativa):** saldos, abonos, vencimientos, cuotas, cupo, estado de cuenta, edades, recordatorios.
- **Fuera (integración/exportación):** plan de cuentas, asientos, causación contable, intereses moratorios legales, facturación electrónica, conciliación bancaria.

## 3. Consecuencias

- **Positivas:** una primitiva cubre crédito, encargos, apartados y consignación para cualquier producto o servicio; reutiliza ledger, ubicaciones, transferencias, listas de precio, producción, crédito en tienda, pasarelas y (a futuro) caja; reportes de cartera sin contabilidad.
- **Costos:** dos dimensiones de estado (pago/entrega) y un ledger más que mantener consistentes; el reporte de ventas en consignación depende de la disciplina del comerciante (portal del aliado queda como evolución opcional).
- **Riesgos:** criterio fiscal de anticipos y consignación varía → por eso el evento de facturación es configurable y se documenta la recomendación de validar con contador.
- **Gating:** features de plan `receivables` (cartera) y `consignment` (requiere `multi_location`); `quotes`/`bom_production` se reutilizan. Sin las features, cero cambio.

## 4. Fases (HU-450…457)

1. **HU-450** Núcleo: contraparte + documento + ledger de cartera + abonos manuales + estado de cuenta.
2. **HU-451** Plan de pago: libre con vencimiento y cuotas; anticipo mínimo; mora por cuota.
3. **HU-452** Encargos: líneas libres/servicio, anticipo por línea, estado de entrega, política de entrega configurable, vínculo a producción.
4. **HU-453** Apartado (cierra HU-408 AC-2): reserva/caducidad en el ledger.
5. **HU-454** Consignación: ubicación del aliado, entrega con cargo, reporte de venta, devolución con nota crédito, inventario en consignación.
6. **HU-455** Cobro: enlace de pago del saldo, saldo a favor → crédito en tienda, recordatorios de vencimiento.
7. **HU-456** Evento de facturación configurable + exportación para contabilidad + reportes (edades, recaudo, anticipos sin entregar).
8. **HU-457** POS: tender a crédito, abonos en caja, cupo, offline (depende de E25).
