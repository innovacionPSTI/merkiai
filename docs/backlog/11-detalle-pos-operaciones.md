# Detalle · POS y Operaciones (núcleo de inventario, producción y punto de venta)

> **Épicas:** **E24 · Operaciones e inventario** (HU-400…410) y **E25 · Punto de venta (POS)** (HU-420…427). Todo 🔲 (roadmap).
> **Secciones 0–9:** planteamiento y arquitectura (marco conceptual). **Secciones 10–11:** catálogo formal de HU con criterios de aceptación.
> **Reconciliación con E18:** la fundación del inventario (`stock_item` + UoM + libro de movimientos, E24 · HU-400/401) **precede** a la multiubicación (E18), que se reexpresa como **proyección del ledger** (ver `07-detalle-e18-y-pci.md`, encabezado de E18).
> **Naturaleza:** capa de **operaciones opt-in por plan** sobre el núcleo actual
> (multi-tenant + RLS + entitlements + presets/blueprints + Constructor + motor
> CMS + catálogo/variantes + pedidos + pagos/envíos/correo por `integration_instances`).
> **No** introduce un ERP ni un vertical obligatorio: añade **primitivas genéricas**
> (ítem de inventario, unidad de medida, libro de movimientos, receta/BOM, orden
> de producción, compra, caja) de las que cualquier caso de uso es una *instancia
> de datos*, nunca código especial.

---

## 0. Principios rectores (no negociables)

1. **Nada hardcodeado por vertical ni por cliente.** El comportamiento se decide
   por **datos de configuración + entitlements**, no por ramas de código con
   nombres de negocio. Un "restaurante", una "cafetería-manufactura" o una
   "tienda de ropa" son combinaciones de *features activas + presets*, no tipos
   del dominio.
2. **Un solo modelo, revelado por plan.** Un catálogo, un **libro de movimientos**,
   una orden. El vertical se logra con entitlements + preset + un puñado de
   *toggles* (política de consumo del BOM, modificadores, mesas), nunca con
   tablas paralelas por nicho.
3. **El movimiento es la verdad del stock.** La factura, el pedido o la orden de
   producción son **referencias opcionales** sobre un movimiento, no su causa
   obligatoria. Esto resuelve el caso "salidas que no pasan por factura".
4. **Frontera anti-ERP.** La plataforma es fuente de verdad del **stock y el costo
   operativo**. Lo **fiscal** (factura) y lo **contable** (asiento) viven en
   sistemas externos y se resuelven por **integración** (el patrón
   `integration_instances` + registro de proveedores ya existente), nunca como
   módulos financieros propios.
5. **Opt-in y cero regresión.** Cada módulo es una feature gateada; sin ella, el
   comportamiento actual (solo-tienda) queda idéntico.

---

## 1. La escalera de capacidades (empaque por plan)

El producto no se vende por "vertical", se vende por **peldaños de capacidad**
que se activan con bundles de entitlements. Un mismo tenant puede ocupar varios
peldaños a la vez sobre el mismo catálogo e inventario.

| Peldaño | Alcance | Features (abstractas) |
|---|---|---|
| **0 · Presencia** | Sitio/landing sin transacción | `page_builder`, `blueprint` acotado, páginas limitadas |
| **1 · Vitrina** | Catálogo sin checkout (consulta/cotización) | catálogo + `quotes` |
| **2 · Comercio electrónico** | Venta en línea | checkout, pagos, envíos, pedidos, inventario simple, cupones/promos |
| **3 · Operación / Punto de venta** | Venta presencial | `pos`, `cash_management`, `price_lists`, `barcodes`, `multi_location`, `procurement` |
| **3R · Servicio en sala** | Consumo en local | `pos_dinein` (comandas/KDS, mesas, propinas, división), `modifiers` |
| **3M · Transformación** | Producción con materia prima | `bom_production`, `costing` (mermas/rendimiento) |
| **4 · Institucional / Servicios** | Portal + cobros recurrentes | E20/E21/E23 (ya definidas) |

> El peldaño es **acumulativo y combinable**: "servicio en sala + transformación"
> es un local que elabora y empaca lo que también vende en mostrador y en línea,
> con el mismo inventario.

---

## 2. Primitivas genéricas (los módulos nuevos)

### 2.1 Ítem de inventario + unidad de medida (UoM)

- **`stock_item`** unificado: sujeto de todo el inventario, con **unidad de medida**
  y **clase** (p. ej. `materia_prima`, `insumo`, `terminado`, `servicio`). No todo
  ítem es vendible.
- **Cantidades decimales + UoM + conversiones** (una unidad base por ítem + factores
  de conversión). Es un **cambio fundacional**: el stock actual asume entero por
  variante; sin decimales/UoM se arrastra deuda estructural.
- La **variante de producto vendible** pasa a ser **una clase** de `stock_item`
  (`terminado`), de modo que catálogo e inventario comparten sujeto sin casos
  especiales.

### 2.2 Libro de movimientos (ledger)

- **`stock_movement`**: una fila por entrada/salida, **tipificada** (compra,
  consumo de producción, salida de producción, venta, merma, ajuste, traslado,
  muestra/obsequio, devolución), con cantidad, UoM, **ubicación**, motivo y
  **referencia opcional** (pedido, orden de producción, compra, cliente, factura
  externa).
- Es **la espina dorsal**: reemplaza el "descuento implícito al vender" por un
  registro de primera clase, auditable y reversible. El stock disponible es una
  **proyección** del ledger (materializada para lecturas rápidas).
- **Idempotencia y atomicidad** por operación (hereda el patrón de los RPC de
  stock actuales): reintentos no duplican movimientos.

### 2.3 Receta / Lista de materiales (BOM) con **política de consumo**

La unificación clave entre "elaboración al momento" y "producción a inventario":

- **`bom`**: ítem de salida ← componentes (cualquier `stock_item`, incl. empaques
  e insumos) con cantidades por UoM; soporta **múltiples niveles**.
- **Política de consumo** (`consumption_policy`), un único toggle:
  - `al_vender` → el producto **no stockea**; al venderse se descuentan sus
    componentes (elaboración bajo demanda).
  - `al_producir` → una **orden de producción** descuenta componentes y **crea
    stock** del terminado; la venta descuenta el terminado (producción a inventario).
- Los **combos/bundles existentes** son el caso `al_vender` de un BOM de un nivel:
  reutilizar ese motor, no reescribirlo.
- **Mermas/rendimiento y costeo** solo aplican a `al_producir`, así que no cargan
  al caso de elaboración simple.

### 2.4 Modificadores / opciones

- **`modifier_group`** sobre un producto: opciones que ajustan precio y **pueden
  consumir inventario** (una opción puede descontar su propio componente).
- Primitiva transversal: sirve a servicio en sala (adiciones), a comercio
  electrónico (personalización) y a retail (ninguno). No es "de restaurante".

### 2.5 Compras / aprovisionamiento

- **`supplier`**, **`purchase_order`**, **`purchase_receipt`**: recepción que
  **incrementa stock** y **alimenta el costo** (ver 2.6). Habilita "cantidades
  mínimas → sugerir compra".
- Deliberadamente **sin cuentas por pagar contables**: a lo sumo un **saldo
  operativo por proveedor** (informativo), lo demás es integración.

### 2.6 Costeo

- **Costo por ítem** por **promedio ponderado** (o FIFO, configurable) derivado de
  las recepciones; **roll-up por BOM** → costo del terminado y por presentación.
- Pensado como **motor puro** (funciones testeables) sobre el ledger; el costo es
  un atributo del movimiento, no un módulo contable.

### 2.7 Listas de precio

- **`price_list`** por **canal / ubicación / segmento de cliente**; el precio
  efectivo se resuelve por contexto (en línea, mostrador, mayorista…). Generaliza
  el precio único + precio de campaña ya existentes.

### 2.8 Cotizaciones y "apartado" (reserva con pago parcial)

- **Cotización** = pedido en estado borrador convertible a orden (reusa el modelo
  de orden).
- **Apartado / reserva** = pagos parciales que **reservan stock** sin completar la
  venta (reusa el motor de pagos y el ledger con un movimiento de reserva).

### 2.9 Caja (gestión operativa, no tesorería)

- **`cash_session`** (apertura/cierre) por **ubicación + operador**, con
  **medios de pago locales** ("tenders": efectivo, mixto, etc., distintos de las
  pasarelas en línea) y **gasto de caja menor** como anotación operativa.
- **No** es contabilidad ni conciliación bancaria: esos quedan **fuera** (§7).

---

## 3. Punto de venta (POS) — **offline-first con sincronización**

Decisión arquitectónica adoptada: el POS debe **seguir vendiendo sin conexión** y
**sincronizar** cuando la recupere. Esto condiciona el diseño de todo el módulo.

### 3.1 Modelo de sincronización

- **Fuente de verdad local durante la venta.** El POS opera sobre una **réplica
  local** del catálogo, precios, modificadores y clientes (lectura), y **escribe
  eventos locales** (ventas, aperturas/cierres, movimientos) a una **cola
  persistente** en el dispositivo.
- **Sincronización por eventos idempotentes.** Cada operación lleva un
  **identificador único generado en el cliente** (idempotency key); el servidor
  **deduplica** y aplica en orden. Reconecta → drena la cola → confirma.
- **Numeración sin colisión offline.** Los consecutivos visibles se asignan con
  **rangos/prefijos por dispositivo o sesión de caja** para no chocar al
  sincronizar; el identificador canónico es el del cliente, no el consecutivo.
- **Resolución de conflictos declarativa.** El stock es el punto sensible: en
  offline se permite vender contra la **réplica local** y la **verdad se concilia
  al sincronizar** (el servidor aplica los movimientos en orden de llegada y marca
  **sobreventa** cuando el disponible real quedó por debajo, para gestión por
  excepción). El inventario es **eventual-consistente entre sedes**, fuertemente
  consistente **por operación** en el servidor.
- **Límites de lo offline.** Cobros con pasarela en línea, verificación de factura
  externa y disponibilidad entre-sedes **requieren conexión**; sin ella, la venta
  se registra con el **tender local** (efectivo/por cobrar) y se posterga la parte
  en línea. Esto se comunica en la UI, no se oculta.

### 3.2 Superficie POS (toda sobre el catálogo/ledger existentes)

- Venta rápida, búsqueda rápida, lectura de **código de barras/SKU**.
- **Tenders** y venta con medios mixtos; **devoluciones en punto** (reusa el motor
  de devoluciones existente).
- **Atribución a operador/vendedor** por venta (base para comisión/reporte).
- **Servicio en sala** (feature aparte): **mesas**, **comandas** (impresa y en
  pantalla/KDS), **adiciones/modificadores**, **división de cuenta**, **propinas**,
  **resumen de consumo** por mesa.

### 3.3 Periféricos (capa de dispositivo, abstracta)

- **Impresión de recibo/comanda, cajón monedero, escáner, pantalla de cocina** se
  modelan tras una **interfaz de dispositivo** (contrato), con implementaciones
  intercambiables (agente de impresión local / API web del navegador). **Ninguna
  marca** en el dominio: el POS pide "imprimir comanda", el adaptador decide cómo.

---

## 4. Multiubicación (maduración de la épica ya definida)

La épica de **inventario multi-ubicación y fulfillment** (ubicaciones, stock por
`(ítem, ubicación)`, traslados, ruteo de despacho, retiro en punto, migración del
stock único) es **prerequisito del POS**. Ajustes de maduración:

- La **ubicación es dimensión del ledger**: todo movimiento ocurre en una sede.
- **Caja y venta POS** se atan a una sede (resuelve "pedidos por sede").
- **La producción ocurre en una ubicación** (consume y crea stock allí).
- **Listas de precio por ubicación** se apoyan en la misma dimensión.
- **Traslados** = dos movimientos (salida origen / entrada destino), atómicos.
- La **migración stock único → por ubicación** se ejecuta **antes** de que el POS
  dependa de stock por sede, con ubicación por defecto + backfill y cutover por
  fases (retrocompatibilidad verificada), para no romper el comercio en línea.

---

## 5. Ajustes recomendados de arquitectura / servicios

- **Dominio "Operaciones" con contratos y eventos.** Aislar inventario/producción/
  POS como **bounded context** con **eventos de dominio** (`StockMoved`,
  `ProductionCompleted`, `SaleRegistered`, `PurchaseReceived`) y **outbox**
  transaccional. Esto es consistente con la preparación "bounded contexts + outbox"
  ya anotada en el roadmap de arquitectura y es lo que permite que reportes,
  alertas, costeo e integraciones **consuman eventos** en vez de acoplarse a las
  escrituras.
- **Proyecciones/lecturas separadas de la escritura.** El ledger es el libro de
  escritura; el **disponible por `(ítem, ubicación)`**, el **costo vigente** y los
  **agregados de venta** son **proyecciones materializadas** (tablas de lectura)
  actualizadas por los eventos. Evita recalcular sobre el ledger en cada consulta.
- **Idempotencia de extremo a extremo.** La clave de idempotencia del cliente POS
  viaja hasta el movimiento del ledger: un mismo evento sincronizado dos veces no
  duplica stock ni venta.
- **Motores puros, efectos en el borde.** Costeo, explosión de BOM, resolución de
  precio efectivo y conciliación de conflictos de sync como **funciones puras**
  testeables; la persistencia y la cola, en el borde.
- **Integraciones sobre el patrón existente.** Facturación electrónica y
  exportación contable entran como **nuevas categorías de `integration_instances`
  + proveedores en el registro**, con el mismo contrato de "verificar credenciales /
  ejecutar / webhook". **Dirección por defecto:** la plataforma **empuja** ventas
  elegibles a facturación y **exporta** movimientos/costos al contable; no lee ni
  reconstruye el libro externo.
- **Gating transversal.** Cada primitiva es una feature del catálogo de
  entitlements; cada preset/blueprint de arranque enciende el subconjunto que
  corresponde al plan, sin tocar código.
- **Seguridad y auditoría.** Toda operación sensible (apertura/cierre de caja,
  ajuste de inventario, anulación, devolución) se instrumenta en el **registro de
  auditoría** existente; el POS respeta **RLS por tenant** y el scoping por
  ubicación.

---

## 6. Reportes, tableros y alertas (todos sobre el ledger + proyecciones)

### 6.1 Reportes (consulta/export)

- **Existencias** por clase e ítem y por **ubicación** (materia prima, insumos,
  terminados).
- **Compras** (ingresos, cantidades, costo por proveedor).
- **Producción** (consumos, obtenidos, **merma/rendimiento**).
- **Ventas y salidas** por canal (en línea / mostrador / sala) y por operador.
- **Costo** por ítem y por presentación; **margen** por producto/venta.
- **Kardex / trazabilidad** por ítem: histórico de movimientos con su motivo.
- **Caja**: arqueo por sesión (esperado vs. contado), por tender, por operador.
- **Ítems bajo mínimo** y **sugerencia de compra**.

> Todos **exportables** y con el mismo filtrado por ubicación/periodo; se apoyan en
> las proyecciones, no en recálculo sobre el ledger.

### 6.2 Tableros (dashboards)

- **Operación del día:** ventas por canal, tickets, ticket promedio, ventas por
  operador, estado de cajas abiertas.
- **Inventario:** disponible por ubicación, rotación, ítems bajo mínimo, valor del
  inventario a costo.
- **Producción:** órdenes del periodo, rendimiento promedio, merma acumulada,
  costo unitario por presentación.
- **Multi-sede:** comparativo entre ubicaciones (ventas, stock, traslados
  pendientes).
- Cada tablero es una **vista configurable** (encaja con el tipo *dashboard* del
  Constructor y con el catálogo de bloques dinámicos), no una pantalla fija por
  vertical.

### 6.3 Alertas (sobre eventos de dominio)

- **Stock bajo mínimo** por `(ítem, ubicación)` (generaliza el umbral existente).
- **Quiebre / sobreventa** detectada al sincronizar una venta offline.
- **Merma fuera de rango** respecto al rendimiento esperado del BOM.
- **Descuadre de caja** en el cierre (diferencia esperado vs. contado sobre umbral).
- **Traslado pendiente de recepción** / compra por recibir.
- **Falla de sincronización** de un dispositivo POS (cola sin drenar > umbral).
- **Fallo de integración** (factura/contable no confirmada) para gestión por
  excepción.
- Entregadas por los **canales existentes** (correo/panel; WhatsApp cuando el plan
  lo incluya), con el mismo patrón idempotente de notificaciones.

---

## 7. Fuera de alcance (resuelto por integración, no por módulo)

- **Contabilidad general**, cuentas bancarias, **conciliación bancaria**, cuentas
  por pagar/cobrar contables, nómina.
- **Facturación electrónica** como motor propio: se **integra** con el sistema que
  el tenant ya use.
- "Créditos/fiado" y "gastos" permanecen en su **versión operativa mínima** (saldo
  informativo de cliente ligado al crédito en tienda ya existente; gasto de caja
  menor), **no** como módulos financieros.

---

## 8. Riesgos y decisiones a cerrar

- **Fundacional UoM + decimales + `stock_item` unificado**: entra temprano o se
  arrastra deuda. Decisión de modelo más delicada del conjunto.
- **Offline-first**: adoptado; su costo real está en **cola persistente,
  idempotencia, numeración sin colisión y conciliación de conflictos**, no en la
  UI. Definir el **grado de consistencia** aceptable del stock entre sedes.
- **Periféricos**: la interfaz de dispositivo debe quedar **abstracta**; evitar
  acoplar el dominio a una tecnología de impresión concreta.
- **Migración multiubicación**: cutover por fases con retrocompatibilidad probada.
- **Alcance anti-ERP**: mantener la frontera del §7 de forma disciplinada; cada vez
  que un requisito empuje hacia "lo contable", resolver por integración.

---

## 9. Secuencia sugerida (dimensionamiento, no compromiso)

1. **Fundaciones:** `stock_item` + UoM/decimales + **ledger de movimientos** +
   proyección de disponible (migra el descuento implícito actual al ledger, sin
   regresión).
2. **Multiubicación** (épica ya definida) + su migración.
3. **Compras/proveedores** (+ sugerencia de compra) → habilita **costeo**.
4. **BOM con política de consumo** (reusa combos/bundles) + **modificadores** +
   **costeo/mermas**.
5. **POS peldaño 3** (caja, venta rápida, tenders, devoluciones, vendedores,
   listas de precio, códigos de barras) **offline-first**.
6. **Servicio en sala** (comandas/KDS, mesas, propinas, división) y **cotizaciones/
   apartado**.
7. **Conectores** de facturación electrónica y exportación contable (sobre
   `integration_instances`).
8. **Reportes, tableros y alertas** se construyen de forma incremental **sobre los
   eventos** de cada paso anterior.

---

## 10. Catálogo de HU · E24 — Operaciones e inventario

> **Épica.** Fundación de inventario, compras, producción y costeo como capa
> **opt-in por plan**. **Precede** a E18 (multiubicación), que se apoya en su
> ledger. Todo **🔲 (roadmap)**. Las claves de feature (`inventory_ledger`,
> `procurement`, `bom_production`, `costing`, `price_lists`, `modifiers`,
> `quotes`) son **nombres abstractos de capacidad**; su alta en el catálogo de
> entitlements (HU-239/359) se define al priorizar.

### HU-400 — Ítem de inventario unificado (`stock_item`) + clases + unidad de medida · E24

> Como plataforma, quiero un sujeto de inventario único con unidad de medida y clase, para contar cualquier existencia (materia prima, insumo, terminado) sin casos especiales.

**Estimación:** L (8 puntos) · **Módulo:** `stock_item` + UoM + conversiones; la variante vendible pasa a ser una clase de `stock_item` · **Estado:** 🟢 Datos + capa (v204) — migración `e17/63` (`uoms` con dimensión + `to_base_factor`, `stock_items` con clase/UoM/sellable, enlace opcional `product_variants.stock_item_id`, RLS admin-only, seed de unidades base por tenant); helpers **puros** `uom.ts` (`toBase`/`fromBase`/`convertUom` por dimensión, `normalizeQty`, `isItemClass`, `normalizeStockItemInput`) + CRUD `stock-items.ts`; tipos en `types.ts`. Tests: **database 532 (+11)**, tsc limpio admin/web. **Pendiente:** UI de gestión en el admin + seed de UoM para tenants nuevos (onboarding/preset, HU-410).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Ítem | `stock_item` con **clase** (materia prima / insumo / terminado / servicio) y **unidad de medida base**; no todo ítem es vendible |
| AC-2 | Cantidades | Soporta **cantidades decimales** + conversiones de UoM (factor a la unidad base) |
| AC-3 | Enlace con catálogo | La **variante de producto** se vincula a un `stock_item` de clase *terminado* (el catálogo no se reescribe) |
| AC-4 | Multi-tenant | `tenant_id` + RLS heredados; scoping por ubicación preparado para E18 |

### HU-401 — Libro de movimientos (`stock_movement`) + proyección de disponible · E24

> Como plataforma, quiero un libro de movimientos tipificado como única verdad del stock, para registrar toda entrada/salida con su motivo y referencia, con o sin factura.

**Estimación:** XL (13 puntos) · **Módulo:** `stock_movement` (append-only) + proyección `disponible por (ítem, ubicación)` + RPCs idempotentes · **Estado:** 🟢 Datos + capa (v205) — migración `e17/64`: tabla **`stock_movements`** (append-only, tipada: purchase/production_consume/production_output/sale/waste/adjustment/transfer/sample/return + `direction`, `qty`+`uom`+`qty_base` con signo, `location_id` E18-ready, `ref_type/ref_id`, **idempotencia por `op_key`** con índice único parcial), **vista de proyección `stock_item_available`** (suma por ítem/ubicación), RLS admin-only. Helpers **puros** `stock-movements.ts` (`buildMovementRow` resuelve dirección+signo, `defaultDirection`, `isMovementType`) + capa `recordMovement` (idempotente), `listMovements` (kardex), `getAvailable`/`getAvailableMap`. **Aditiva y paralela:** NO cambia el descuento actual (HU-098). Tests: **database 540 (+8)**, tsc limpio admin/web. **Pendiente (AC-4, con E18·HU-178):** migrar el descuento implícito del checkout al libro (cutover coordinado) + UI kardex.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Movimiento | Fila tipificada (compra, consumo de producción, salida de producción, venta, merma, ajuste, traslado, obsequio, devolución) con cantidad, UoM, ubicación, motivo y **referencia opcional** (pedido, producción, compra, cliente, factura externa) |
| AC-2 | Disponible | El stock disponible es una **proyección materializada** del ledger, no un contador editado a mano |
| AC-3 | Idempotencia/atomicidad | Clave de idempotencia por operación; reintentos no duplican; sin stock negativo cuando no hay backorder |
| AC-4 | Migración del descuento actual | El descuento "implícito" de HU-098 se reexpresa como movimiento con referencia al pedido, **sin cambiar el comportamiento** (coordinado con E18 · HU-178) |
| AC-5 | Salida sin factura | Permite registrar salidas (muestra, entrega, ajuste) **sin** pedido ni factura asociados |

### HU-402 — Compras / aprovisionamiento (proveedores, órdenes y recepción) · E24

> Como operador, quiero registrar compras y recibir mercancía, para aumentar existencias y alimentar el costo, y saber qué debo reponer.

**Estimación:** L (8 puntos) · **Módulo:** `supplier`, `purchase_order`, `purchase_receipt` → entrada al ledger + costo · **Estado:** 🟢 Datos + capa (v206) — migración `e17/65`: `suppliers`, `purchases` (cabecera, estado draft/received/cancelled), `purchase_items` (líneas con `qty`/UoM/`unit_cost`), `location_id` E18-ready, RLS admin-only, + `stock_movements.unit_cost` (costo por unidad base, para costeo). Capa `procurement.ts`: CRUD proveedores/compras + **`receivePurchase`** (anexa un movimiento 'purchase' por línea con costo por unidad base, **idempotente** por `op_key=purchase:<id>:<item>`, marca la compra recibida) + helpers puros `purchaseLineTotal`/`purchaseTotal`/`costPerBase`. Tests: **database 543 (+3)**, tsc limpio. **Pendiente:** UI admin de compras/proveedores + sugerencia de reposición (enlaza HU-409).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Proveedor | CRUD de proveedores (datos de contacto; **sin** cuentas por pagar contables) |
| AC-2 | Compra | Orden de compra → recepción que **anexa movimientos de entrada** al ledger con costo unitario |
| AC-3 | Sugerencia | Ítems bajo mínimo sugieren reposición (enlaza HU-409) |

### HU-403 — Costeo (promedio ponderado / FIFO + roll-up por receta) · E24

> Como negocio, quiero conocer el costo de cada ítem y de cada producto elaborado, para fijar precios y medir margen.

**Estimación:** L (8 puntos) · **Módulo:** motor puro de costeo sobre el ledger + recepciones; roll-up por BOM · **Estado:** 🟢 Costo directo (v207) — motor **puro** `costing.ts`: `weightedAverageCost` (promedio ponderado por unidad base sobre las **entradas con costo** del libro — compra/producción; ignora salidas y movimientos sin costo) + `inventoryValue` (disponible × costo). Capa `getItemCost`/`getItemCostMap` lee `stock_movements` (con `unit_cost`). Sin migración (usa `e17/65`). Tests: **database 547 (+4)**, tsc limpio. **Pendiente:** FIFO configurable + **roll-up por BOM** (costo del terminado) → se habilita con **HU-404** (receta/BOM).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Costo del ítem | Promedio ponderado (o FIFO configurable) derivado de las recepciones |
| AC-2 | Roll-up | El costo del terminado se calcula por **explosión del BOM** (componentes + insumos) |
| AC-3 | Puro/testeable | Funciones puras; el costo es atributo del movimiento, **no** un asiento contable |

### HU-404 — Receta / BOM con política de consumo (generaliza bundles) · E24

> Como negocio, quiero definir de qué se compone un producto y cuándo se descuentan sus insumos, para cubrir tanto la elaboración al momento como la producción a inventario.

**Estimación:** L (8 puntos) · **Módulo:** `bom` (salida ← componentes, multinivel) + `consumption_policy` · **Estado:** 🟢 Datos + capa (v208) — migración `e17/66`: `boms` (ítem de salida + **`consumption_policy`** `al_vender`/`al_producir` + `yield_qty`) y `bom_components` (cualquier `stock_item` + qty/UoM), RLS admin-only. Helpers **puros** `bom.ts`: `explodeComponents` (escala por `outputQty/yield`), `bomUnitCost` (roll-up directo de un nivel → **costo del terminado**, con flag `complete`), `isConsumptionPolicy`; capa `getBomByOutput`/`listBoms`/`createBom`/`deleteBom`. Cierra el **roll-up de costeo** de HU-403 (un nivel). Tests: **database 552 (+5)**, tsc limpio. **Pendiente:** multinivel (resolver recursivo), aplicación en venta/producción (HU-405) y **refactor de bundles** para reusar el motor (hoy HU-168 sigue siendo la instancia implementada de `al_vender`).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Receta | Ítem de salida ← componentes (cualquier `stock_item`, incl. empaques) con cantidades por UoM; soporta **múltiples niveles** |
| AC-2 | Política de consumo | `al_vender` (el producto no stockea; vender descuenta componentes — caso de HU-168) **o** `al_producir` (ver HU-405) |
| AC-3 | Reutilización | El motor de expansión de bundles (HU-168) se **generaliza**, no se duplica |

### HU-405 — Órdenes de producción (consumo/salida + merma/rendimiento) · E24

> Como operador, quiero registrar la transformación de insumos en producto terminado, controlando lo consumido, lo obtenido y la merma.

**Estimación:** L (8 puntos) · **Módulo:** `production_order` sobre BOM `al_producir` + ledger + costeo · **Estado:** 🔲 Pendiente — feature `bom_production`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Orden | Consume componentes (movimientos de salida) y **crea stock** del terminado (movimiento de entrada), en una ubicación |
| AC-2 | Merma/rendimiento | Registra la diferencia esperado vs. obtenido; alimenta costo y alertas (HU-409) |
| AC-3 | Costo | El costo del lote producido se reparte entre las unidades obtenidas (HU-403) |

### HU-406 — Modificadores / opciones de producto · E24

> Como negocio, quiero ofrecer opciones que ajusten precio y, si aplica, consuman inventario, para personalizar productos sin crear variantes nuevas.

**Estimación:** M (5 puntos) · **Módulo:** `modifier_group` sobre producto; consumo opcional de `stock_item` · **Estado:** 🔲 Pendiente — feature `modifiers`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Grupo de opciones | Opciones con ajuste de precio (+/−), selección simple/múltiple, obligatorias/opcionales |
| AC-2 | Consumo | Una opción **puede** descontar su propio componente del inventario (movimiento) |
| AC-3 | Transversal | Sirve a venta en línea y a POS/servicio en sala; sin modificadores el producto no cambia |

### HU-407 — Listas de precio por canal / ubicación / segmento · E24

> Como negocio, quiero precios distintos según el canal, la sede o el tipo de cliente, para vender al precio correcto en cada contexto.

**Estimación:** M (5 puntos) · **Módulo:** `price_list` + resolución de precio efectivo por contexto · **Estado:** 🔲 Pendiente — feature `price_lists`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Lista | Precio por `(ítem/variante, lista)`; listas por canal (en línea/mostrador), ubicación o segmento |
| AC-2 | Resolución | El precio efectivo se resuelve por contexto, encima del precio único + precio de campaña existentes |
| AC-3 | Compatibilidad | Sin listas definidas, rige el precio actual (cero regresión) |

### HU-408 — Cotizaciones y apartado/reserva · E24

> Como operador, quiero cotizar y permitir apartar con pagos parciales, para cerrar ventas que no se pagan de una vez.

**Estimación:** M (5 puntos) · **Módulo:** pedido en borrador (cotización) + reserva de stock con abonos · **Estado:** 🔲 Pendiente — feature `quotes`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cotización | Pedido en estado borrador convertible a orden (reusa el modelo de orden) |
| AC-2 | Apartado | Abonos parciales (reusa el motor de pagos) que **reservan stock** (movimiento de reserva en el ledger) |
| AC-3 | Caducidad | Reserva con vencimiento configurable que libera el stock si no se completa |

### HU-409 — Reportes, tableros y alertas de operaciones · E24

> Como operador, quiero ver existencias, compras, producción, costo y movimientos, y recibir alertas, para decidir con datos.

**Estimación:** L (8 puntos) · **Módulo:** reportes/tableros sobre proyecciones del ledger + motor de alertas por eventos; **absorbe** HU-106/116/183 como casos base · **Estado:** 🔲 Pendiente

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Reportes | Existencias por clase/ubicación, compras, producción (merma/rendimiento), ventas por canal, **kardex por ítem**, costo y margen; todos exportables |
| AC-2 | Tableros | Operación del día, inventario (valor a costo, bajo mínimo), producción, comparativo multi-sede; como **vistas configurables** (encaja con el tipo *dashboard* del Constructor) |
| AC-3 | Alertas | Bajo mínimo por `(ítem, ubicación)` (generaliza HU-106), merma fuera de rango, descuadre de caja, traslado/compra por recibir, **fallo de sincronización POS** y fallo de integración — por los canales existentes |

### HU-410 — Preset + plan "Operaciones" (entitlements) · E24

> Como operador de plataforma, quiero un preset/plan que encienda el vertical de operaciones, para aprovisionar este tipo de tienda sin trabajo manual.

**Estimación:** S (3 puntos) · **Módulo:** preset de nicho (HU-233/235) + entitlements (HU-239/359) que encienden E24 · **Estado:** 🔲 Pendiente

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Preset | Unidades de medida, clases de ítem y recetas de ejemplo de arranque (datos, no código) |
| AC-2 | Plan | Las features de E24 se activan por plan; sin ellas, el comportamiento solo-tienda queda idéntico |

---

## 11. Catálogo de HU · E25 — Punto de venta (POS) offline-first

> **Épica.** Superficie de venta presencial **offline-first con sincronización**,
> sobre el catálogo, el ledger (E24) y la multiubicación (E18). Todo **🔲 (roadmap)**.
> Features abstractas: `pos`, `cash_management`, `pos_dinein`, `barcodes`.

### HU-420 — Caja: apertura/cierre + medios de pago locales · E25

> Como cajero, quiero abrir y cerrar caja y registrar los medios de pago, para controlar el efectivo y cuadrar al cierre.

**Estimación:** L (8 puntos) · **Módulo:** `cash_session` por ubicación+operador + "tenders" + gasto de caja menor · **Estado:** 🔲 Pendiente — feature `cash_management`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Sesión | Apertura con base; cierre con conteo; **arqueo** esperado vs. contado por tender y operador |
| AC-2 | Tenders | Medios de pago locales (efectivo, mixto…) distintos de las pasarelas en línea |
| AC-3 | Caja menor | Gasto operativo como anotación de la sesión (**no** contabilidad ni conciliación bancaria) |

### HU-421 — Sincronización offline-first · E25

> Como negocio, quiero seguir vendiendo sin conexión y sincronizar al reconectar, para no detener la operación por fallas de red.

**Estimación:** XL (13 puntos) · **Módulo:** réplica local + cola persistente + eventos idempotentes + numeración sin colisión + conciliación · **Estado:** 🔲 Pendiente — **columna vertebral del POS**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Operación local | Vende sobre réplica local (catálogo/precios/modificadores/clientes) y **encola** eventos (ventas, aperturas/cierres, movimientos) de forma persistente |
| AC-2 | Idempotencia | Cada operación lleva una **clave única de cliente**; el servidor deduplica y aplica en orden; reintentos no duplican |
| AC-3 | Numeración | Consecutivos con **rangos/prefijos por dispositivo o sesión** para no colisionar al sincronizar; el identificador canónico es el del cliente |
| AC-4 | Conflictos | El stock se concilia al sincronizar; **sobreventa** marcada para gestión por excepción; consistencia eventual entre sedes, fuerte por operación en el servidor |
| AC-5 | Límites | Cobro con pasarela en línea, factura externa y disponibilidad entre-sedes **requieren conexión**; sin ella se registra con tender local y se posterga, **comunicándolo** en la UI |

### HU-422 — Venta rápida en punto de venta · E25

> Como cajero/vendedor, quiero cobrar rápido, buscando o escaneando productos, para atender ágil en mostrador.

**Estimación:** L (8 puntos) · **Módulo:** superficie POS sobre catálogo/ledger; `salesperson` + atribución · **Estado:** 🔲 Pendiente — features `pos`, `barcodes`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Venta | Búsqueda rápida + lectura de **código de barras/SKU**; cobro con tenders (incl. mixto) → **orden unificada** + movimientos en el ledger |
| AC-2 | Vendedor | Atribución de la venta a un operador/vendedor (base de comisión/reporte) |
| AC-3 | Unificación | La venta presencial convive con la venta en línea en el mismo modelo de orden e inventario |

### HU-423 — Devoluciones en punto de venta · E25

> Como cajero, quiero procesar devoluciones en el punto, para resolver cambios y reembolsos presenciales.

**Estimación:** M (5 puntos) · **Módulo:** extiende el flujo de devolución existente (HU-107a) al POS · **Estado:** 🔲 Pendiente — feature `pos`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Devolución | Reingreso al inventario como **movimiento de devolución** (ledger); reusa el motor de HU-107a |
| AC-2 | Reembolso | Efectivo del cajón, u otro tender, o **saldo a favor** (reusa store credit, HU-148) |

### HU-424 — Servicio en sala (comandas/KDS, mesas, propinas, división) · E25

> Como restaurante/cafetería, quiero tomar pedidos por mesa, enviar comandas a cocina y dividir cuentas, para operar el servicio en local.

**Estimación:** XL (13 puntos) · **Módulo:** mesas, comanda (impresa/pantalla), modificadores (HU-406), división, propina, resumen de consumo · **Estado:** 🔲 Pendiente — feature `pos_dinein`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Mesas y comanda | Cuenta por mesa; comanda a cocina (impresa y/o en pantalla/KDS) con adiciones/modificadores |
| AC-2 | División y propina | División de cuenta y propina configurables; resumen de consumo por mesa |
| AC-3 | Inventario | Al cerrar el consumo se descuentan los componentes de la receta `al_vender` (HU-404) |

### HU-425 — Capa de periféricos (interfaz de dispositivo abstracta) · E25

> Como plataforma, quiero una interfaz de dispositivo intercambiable, para imprimir, abrir cajón o mostrar comandas sin acoplar el dominio a un hardware concreto.

**Estimación:** L (8 puntos) · **Módulo:** contrato de dispositivo (impresión recibo/comanda, cajón, escáner, KDS) con adaptadores intercambiables · **Estado:** 🔲 Pendiente — feature `pos`

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Contrato | El dominio pide acciones abstractas ("imprimir comanda", "abrir cajón"); el adaptador decide cómo |
| AC-2 | Intercambiable | Implementaciones por agente local / API del navegador, **sin marcas** en el dominio |
| AC-3 | Degradación | Sin periférico disponible, la venta continúa (impresión diferida/omitida), avisando en la UI |

### HU-426 — Tableros y alertas del POS · E25

> Como administrador, quiero ver la operación de venta en vivo y recibir alertas operativas, para supervisar varios puntos/sedes.

**Estimación:** M (5 puntos) · **Módulo:** tableros POS sobre eventos (reusa HU-409) · **Estado:** 🔲 Pendiente

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Tablero | Ventas por canal/operador, ticket promedio, cajas abiertas, comparativo entre sedes |
| AC-2 | Alertas | Caja sin cerrar, **descuadre** en cierre, **cola de sincronización** sin drenar sobre umbral |

### HU-427 — Preset + plan "Punto de venta / servicio en sala" (entitlements) · E25

> Como operador de plataforma, quiero un preset/plan que encienda el POS (y, si aplica, el servicio en sala), para aprovisionar estos negocios sin trabajo manual.

**Estimación:** S (3 puntos) · **Módulo:** preset (HU-233/235) + entitlements (HU-239/359) para E25 · **Estado:** 🔲 Pendiente

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Preset | Arranque de POS (medios de pago locales, ubicación por defecto) y, opcional, servicio en sala (mesas) |
| AC-2 | Plan | `pos`/`pos_dinein`/`cash_management` se activan por plan; sin ellas, nada del POS aparece |

---

*Detalle formal de las épicas **E24** (HU-400…410) y **E25** (HU-420…427). No crea
código ni migraciones: fija alcance, abstracción, criterios de aceptación y la
reconciliación con E18. Las claves de feature son **nombres abstractos de
capacidad**; su alta en el catálogo de entitlements se define al priorizar. Sin
marcas ni clientes: cualquier caso de uso es una **instancia de datos** sobre estas
primitivas.*
