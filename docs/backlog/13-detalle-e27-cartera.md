# Detalle · E27 — Cartera operativa (crédito, encargos, apartados y consignación)

> **Épica:** **E27 · Cartera operativa** (HU-450…457). **v268:** HU-450…456 ✅ en código · HU-457 🔲 (con E25). **Diseño:** **ADR-010**.
> **Construye sobre:** E24 (libro de movimientos, producción, listas de precio HU-407, cotizaciones HU-408), E18 (ubicaciones HU-176, transferencias con estados HU-180), crédito en tienda (HU-148), pasarelas por tenant (ADR-004/009). **Habilita:** E25 POS (tender a crédito, abonos en caja).
>
> **Principio:** una sola primitiva (documento + libro de cartera, el saldo es proyección) y **modalidades como datos**: `credit_sale`, `special_order`, `layaway`, `consignment`. Opt-in por plan (`receivables`, `consignment`). Cartera **operativa**, no contable (lo fiscal/contable por integración).
>
> **Decisiones del dueño (nov-2026):** consignación con **deuda al entregar y derecho a devolver**; plan de pago **libre y por cuotas**; **las ventas de consignación las reporta el comerciante** en su admin; **evento de facturación configurable**; **política de entrega de encargos configurable**.

---

## HU-450 — Núcleo de cartera: contraparte, documento y libro de movimientos · E27

> Como comerciante, quiero registrar lo que me deben y lo que me abonan, por cliente o aliado, para saber en todo momento cuánto tengo por cobrar.

**Módulo:** contraparte (generaliza `customers` con rol `customer`/`consignee`, cupo y condiciones opcionales); `receivable_documents` (líneas genéricas: variante, servicio o línea libre; modalidad; estados de **pago** y **entrega** independientes; referencias opcionales a cotización/pedido/orden de producción/transferencia); **`receivable_movements`** (ledger tipificado e idempotente: cargo, abono, nota crédito, ajuste, castigo, saldo a favor aplicado); saldo y cuenta corriente como proyección; aplicación de abonos (antiguo primero o a una línea); estado de cuenta por contraparte (vista + PDF/correo); RLS por tenant; feature `receivables`. **Estado:** ✅ en código (v267): migración `e17/76_receivables.sql`; motor puro `receivables-engine.ts`; capa `receivables.ts`; admin **Cartera** (resumen con KPIs y edades, filtros, detalle con movimientos, **Clientes y aliados** con cupo/plazo, **estado de cuenta** imprimible/PDF con saldo acumulado, abono a la cuenta corriente). Estado de cuenta también **por correo** (v268).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Documento genérico | Se crea un documento con líneas de producto, servicio o texto libre, para cualquier contraparte |
| AC-2 | Libro y saldo | Cada cargo/abono/nota es un movimiento; el saldo se calcula, nunca se edita; un reintento no duplica |
| AC-3 | Cuenta corriente | Un abono puede repartirse entre varios documentos de la misma contraparte |
| AC-4 | Estado de cuenta | Vista y PDF/correo con documentos, abonos y saldo |
| AC-5 | Aislamiento y gating | RLS por tenant; sin la feature `receivables` no cambia nada |

## HU-451 — Plan de pago: libre con vencimiento y por cuotas · E27

> Como comerciante, quiero pactar pagos libres con fecha límite o en cuotas, para adaptarme a cada acuerdo.

**Módulo:** plan por documento: `free` (abonos libres + vencimiento) o `installments` (cuotas con fechas y valores iguales o personalizados); **anticipo mínimo** (% o valor) al crear; mora por documento o por cuota; valores por defecto por contraparte/tienda. **Estado:** ✅ en código (v267): abonos libres con fecha límite (o plazo por defecto de la contraparte), cuotas iguales mensuales/quincenales y cuotas personalizadas (motor), anticipo mínimo (%), mora por cuota en el detalle y en el estado.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Libre | Se aceptan abonos de cualquier valor; vence en la fecha pactada |
| AC-2 | Cuotas | Se genera el calendario; cada abono se imputa a la cuota más antigua; la mora se ve por cuota |
| AC-3 | Anticipo mínimo | No se confirma el documento sin el anticipo exigido (si está configurado) |

## HU-452 — Encargos con anticipo y entrega diferida · E27

> Como comerciante que elabora por encargo, quiero recibir un anticipo por pedido o por cada producto y cobrar el saldo al entregar, para financiar la elaboración sin perder el control del saldo.

**Módulo:** modalidad `special_order`; anticipo por documento o **por línea**; estado de entrega por línea (entregas parciales); **política de entrega configurable** por tienda y por documento (`require_full_payment` | `allow_balance_on_delivery`, este último pasa el saldo a crédito sujeto a cupo); generación opcional de **orden de producción** (E24) y descuento del terminado al entregar; cancelación: anticipo → saldo a favor (crédito en tienda) o reembolso. **Estado:** ✅ en código (v267): anticipo por documento o imputado a una línea, entregas parciales por línea, política de entrega por tienda y por encargo (con cupo), **crear orden de producción** desde la línea, anulación con saldo a favor o reembolso.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Anticipo por línea | Se puede abonar e imputar a un producto concreto del encargo |
| AC-2 | Entrega parcial | Cada línea registra su entrega; el documento muestra pago y entrega por separado |
| AC-3 | Política de entrega | Con `require_full_payment` no se entrega con saldo; con `allow_balance_on_delivery` sí, y el saldo queda como crédito |
| AC-4 | Producción | Desde el encargo se crea la orden de producción; al entregar se descuenta el terminado del ledger |
| AC-5 | Cancelación | El anticipo se convierte en crédito en tienda o se registra su reembolso |

## HU-453 — Apartado con reserva de inventario · E27 (cierra HU-408 AC-2)

> Como comerciante, quiero apartar productos con abonos, para asegurar la venta sin que se vendan a otro mientras el cliente completa el pago.

**Módulo:** modalidad `layaway`; movimiento de **reserva** en el ledger (baja el disponible sin vender) con **caducidad**; al saldar → venta y entrega; al caducar → liberación y abonos a saldo a favor o reembolso según configuración. **Estado:** ✅ en código (v267): movimientos `reserve`/`release` en el libro de inventario (el disponible baja sin vender), caducidad configurable (`layaway_days`), al saldar → venta y entrega automáticas, al vencer → liberación + saldo a favor (tarea diaria).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Reserva | El stock apartado no aparece disponible en tienda ni en POS |
| AC-2 | Completar | Al saldo cero se convierte en venta y se libera la reserva |
| AC-3 | Caducidad | Al vencer se libera el stock y los abonos siguen la política configurada |

## HU-454 — Consignación sobre multiubicación · E27

> Como comerciante, quiero dejar mercancía a aliados que la venden y me pagan de a poco, devolviendo lo que no venden, para ampliar canales sin perder el control del inventario ni del saldo.

**Módulo:** feature `consignment` (requiere `multi_location`); `locations.kind = 'consignment'` ligada a la contraparte aliado; **entrega** = transferencia a su ubicación **+ cargo** por lo entregado (precio de la lista del canal, HU-407); **reporte de venta** registrado por el comerciante (venta desde la ubicación del aliado, sin cargo nuevo, cierra el derecho de devolución); **devolución** = transferencia de regreso **+ nota crédito**; inventario en consignación por aliado; liquidación periódica (resumen entregado/vendido/devuelto/abonado). **Estado:** ✅ en código (v267): ubicación `consignment` ligada al aliado (se crea desde Clientes y aliados), entrega = transferencia + cargo, “Vendió” (venta desde su ubicación, sin cargo nuevo) y “Devolvió” (transferencia de regreso + nota crédito), columnas vendido/devuelto/en poder del aliado. Precio sugerido por **lista de precios** (variante enlazada + lista del canal, misma resolución que el catálogo) al elegir producto o lista (v268).

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Entrega con cargo | Entregar mueve el stock a la ubicación del aliado y genera el cargo al precio de su canal |
| AC-2 | Reporte de venta | El comerciante registra lo vendido; sale del stock del aliado sin duplicar el cargo |
| AC-3 | Devolución | Lo no vendido vuelve por transferencia y reduce la deuda con nota crédito |
| AC-4 | Visibilidad | Se ve qué mercancía tiene cada aliado y su saldo |
| AC-5 | Liquidación | Resumen por período de entregado, vendido, devuelto, abonado y saldo |

## HU-455 — Cobro: enlace de pago, saldo a favor y recordatorios · E27

> Como comerciante, quiero que mis clientes y aliados puedan pagar su saldo en línea y recibir recordatorios, para cobrar a tiempo sin perseguir a nadie.

**Módulo:** enlace de pago del saldo (o de una cuota) con la **pasarela activa del tenant** (ADR-004; PayZen BYO/Merkiai Pagos); confirmación → abono idempotente por transacción; sobrepago/anticipo cancelado → **crédito en tienda** (HU-148); **recordatorios** antes y después del vencimiento (correo, cron existente). **Estado:** ✅ en código (v268): **enlace de pago firmado** (botón “Enlace de pago” en el documento → `/pagar-saldo` en la tienda, HMAC con separación de dominio) que cobra el saldo con la **pasarela activa** (Wompi, MercadoPago, Bold, PayZen o Merkiai Pagos; Tu Compra no aplica por su flujo integrador); referencia `CXC-<doc>-<ts>` → los webhooks registran el **abono idempotente por transacción** en vez de buscar un pedido (si falla, 500 y la pasarela reintenta); saldo a favor → crédito en tienda; recordatorios por correo. **Pendiente:** prueba real con llaves de cada pasarela.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Pago en línea | El cliente paga desde el enlace; el abono entra solo y no se duplica |
| AC-2 | Saldo a favor | El excedente queda como crédito en tienda usable en la tienda y en POS |
| AC-3 | Recordatorios | Se envían avisos configurables antes y después del vencimiento |

## HU-456 — Evento de facturación configurable, exportación y reportes · E27

> Como comerciante, quiero decidir en qué momento se factura cada modalidad y tener reportes de cartera, para cumplir con mi contador sin que la plataforma asuma criterios fiscales.

**Módulo:** **evento de facturación** configurable por tienda y por modalidad (`on_document` | `on_payment` | `on_delivery` | `on_settlement` | `none`) hacia la integración fiscal (`integration_instances`); exportación CSV para contabilidad; reportes: **cartera por edades** (0-30/31-60/61-90/+90), recaudo por período, **anticipos recibidos sin entregar**, inventario en consignación. **Estado:** ✅ en código (v267): evento de facturación configurable por modalidad (bandeja `receivable_invoice_events` visible en Ajustes; la integración fiscal la consume), CSV para el contador, edades, recaudo del mes y anticipos sin entregar.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Evento configurable | Cada modalidad dispara el evento de facturación en el momento elegido (o ninguno) |
| AC-2 | Reportes | Edades, recaudo y anticipos pendientes por tienda, exportables |
| AC-3 | Frontera | No se generan asientos ni facturas en la plataforma; solo eventos/exportes |

## HU-457 — Cartera en el punto de venta · E27 (depende de E25)

> Como cajero, quiero vender a crédito y recibir abonos en caja, para atender clientes con cuenta sin salir del POS.

**Módulo:** tender **"a crédito"** que crea el documento; **abonos en caja** a cualquier documento abierto (entran a la sesión de caja); verificación de **cupo**; funcionamiento **offline** con la cola idempotente del POS. **Estado:** 🔲 depende de E25 (POS): el modelo ya admite el método `pos` y la cola idempotente; falta la superficie POS.

| # | Escenario | Resultado |
|---|-----------|-----------|
| AC-1 | Venta a crédito | El POS crea el documento y descuenta el stock |
| AC-2 | Abono en caja | El abono reduce el saldo y suma al arqueo de la caja |
| AC-3 | Cupo | Se bloquea o advierte si la venta excede el cupo |
| AC-4 | Offline | Ventas y abonos sin conexión se concilian al sincronizar sin duplicarse |
