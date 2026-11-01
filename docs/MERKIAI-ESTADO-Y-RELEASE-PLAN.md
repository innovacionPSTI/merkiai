# Merkiai — Estado del Producto y Plan de Liberación (Detallado)

> Documento de referencia del producto. Describe **qué es Merkiai hoy**, **qué está
> implementado**, **qué está definido en el roadmap**, y un **plan de liberación por
> fases**. Las capacidades se describen como **módulos genéricos opt-in por plan**;
> no hay lógica atada a un cliente o vertical particular.

> **Propiedad y comercialización.** Merkiai es un producto de **Néstor Cardona**.
> Su comercialización se realiza **exclusivamente a través de los canales de
> ParqueSoft TI**. La marca del producto es **Merkiai**, acompañada de la referencia
> **«Powered by ParqueSoft TI»**, presente en la consola de plataforma, el panel de
> administración y la futura página comercial de Merkiai.

---

## 1. Qué es Merkiai

Merkiai es una **plataforma SaaS multi-tienda (multi-tenant) white-label** para que
cualquier negocio tenga presencia y venda en línea, gestione su contenido y
administre su operación desde un panel único. Un mismo despliegue sirve a muchas
tiendas (tenants) con **aislamiento de datos por frontera dura (RLS)**, identidad
visual configurable por instancia, e **integraciones intercambiables** de pagos,
envíos y correo seleccionables sin código.

La característica diferenciadora es que **el producto se revela por plan**: desde una
página de presencia hasta una tienda en línea completa, un punto de venta o un
portal institucional, el cliente **arma su plan activando los módulos que necesita**,
sobre un mismo núcleo, sin bifurcaciones por vertical.

---

## 2. Arquitectura (resumen)

- **Monorepo** con tres aplicaciones: el **sitio público/tienda**, el **panel de
  administración** y la **consola de plataforma** (operador SaaS), más paquetes
  compartidos de **base de datos**, **multi-tenant/entitlements** y **UI**.
- **Multi-tenant con RLS** como frontera de aislamiento: cada petición resuelve su
  tenant por dominio/subdominio y toda lectura/escritura queda acotada a él.
- **Motor de contenido (CMS) unificado**: todo el contenido gestionable vive en un
  modelo único de páginas → secciones → ítems, dirigido por esquema, sobre el que
  se construye el **Constructor** visual.
- **Integraciones por patrón de "instancias + registro de proveedores"**: pagos,
  envíos y correo son **proveedores intercambiables** con el mismo contrato
  (configurar, verificar, ejecutar, recibir webhook); añadir un proveedor no toca
  el núcleo.
- **Entitlements (derechos por plan)**: catálogo dinámico de capacidades y límites;
  cada módulo se activa/gatea por plan y se aprovisiona por **presets** y
  **blueprints de sitio**.
- **Capa de IA**: prevista como transversal e intercambiable (roadmap).

### 2.1 Infraestructura y despliegue

El modelo por defecto es **serverless + CDN**: la aplicación se publica como contenido
estático/prerenderizado servido por **CDN** más **funciones serverless** para lo
dinámico (render en servidor, APIs, webhooks); **no** se administran servidores,
imágenes de contenedor ni clústeres. La base de datos es **Postgres gestionado**,
separada de la app, con **niveles de aislamiento por plan** (compartido, esquema
dedicado o BD dedicada) resueltos por enrutamiento (`db_ref` + *connection factory*).

**Contenedores (Docker) y Kubernetes** no son el camino por defecto: la app es
portable y contenerizable, y esa vía se reserva para el **tier de infraestructura
dedicada** (despliegue aislado/on-premise/residencia de datos) o para **servicios de
fondo con estado** (colas, cron, sincronización del POS offline-first). Los
proveedores concretos no se comprometen en el código (interfaces estándar), y se
confirman al desplegar. El detalle de esta decisión está en **ADR-005 ·
Arquitectura de infraestructura y despliegue**.

---

## 3. Qué está implementado (estado actual)

> Síntesis por áreas. El detalle por historia de usuario vive en `docs/backlog/` y el
> registro de implementación en `PROGRESS.md`.

### 3.1 Núcleo de plataforma y multi-tienda
- Aislamiento por tenant con **RLS** (catálogo y contenido), resolución
  **host → tenant** por dominio/subdominio, caché por request.
- **Consola de plataforma** (operador SaaS) con registro de tenants, **planes** y
  **presets**; **editor de planes** con catálogo de entitlements dinámico.
- **Entitlements**: catálogo canónico de capacidades y límites, con *enforcement*
  transversal y comportamiento *fail-open* seguro.
- **Presets de nicho** + **blueprints de sitio** (estructura de páginas + navegación
  + regiones) + **aprovisionamiento/onboarding** reanudable.
- **Dominios**: configuración de dominio/subdominio y **multi-dominio** por tienda.

### 3.2 Tienda y catálogo
- Grilla con **filtros dinámicos**, página de producto con **galería/zoom**, **CTA
  pegajoso** en móvil, **"avísame cuando vuelva"**, **estimador de envío**,
  **recomendaciones** y **compartir**.
- **Variantes** genéricas, **categorías jerárquicas con SEO**, **atributos/visuales**
  (p. ej. selectores de color), **imagen por variante**, **precio comparativo/oferta**.
- **Reseñas** con voto de utilidad, **lista de deseos** persistente por cuenta,
  **bundles/kits** (con descuento de stock por componente).

### 3.3 Carrito, checkout y pagos
- Carrito con **cupón**, **envío gratis por umbral**, sincronización con la cuenta.
- **Checkout** por pasos con **pasarela intercambiable** (patrón de instancias +
  registro de proveedores): **webhooks firmados**, **anti-forja / anti-subpago /
  idempotencia**, confirmación por **estado real**, **validación manual** del admin
  y **reconciliación**.
- **Devoluciones (flujo RMA)** y **gift cards / saldo a favor** con canje atómico.
- **Endurecimiento de instrumentos de valor**: el **precio y el total son autoridad
  exclusiva del servidor**; anti-manipulación de promociones/segmentos, canje
  atómico con compensación, anti-enumeración y auditoría.

### 3.4 Envíos y correo
- **Envíos** con proveedor intercambiable (cotización, guías, webhook, puntos de
  recogida) y tarifa fija.
- **Correo** con proveedor intercambiable, plantillas y **newsletter**; envíos con
  **idempotencia y reintentos**.

### 3.5 Inventario y stock (base)
- **Descuento/reposición de stock** según estado de pago, **atómico e idempotente**;
  **backorder** por producto; topes de cantidad en el frontend.
- **"Avísame cuando vuelva"** (reposición) y **alertas de stock bajo** por umbral.

### 3.6 Marketing, fidelización y ventas exclusivas
- **Motor de promociones** y cupones, aplicados en el servidor.
- **Club VIP / acceso anticipado por tiempo limitado**: campañas con ventana y
  alcance, *gating* de acceso en la tienda, urgencia (cuenta regresiva/cupo),
  **precio de campaña**, avisos y **reportes**.

### 3.7 Constructor de sitios (Constructor v2 — completo)
- **Autoría unificada** (crear y construir en un solo hub), **layout por
  Filas/Columnas** responsive, **estilo por página**.
- **Colecciones / contenido dirigido por datos**, **plantillas por tipo** con páginas
  de registro dinámicas, **listado dinámico**, **partials globales**, **biblioteca
  de medios**, **bloques guardados**.
- **Experiencia v2**: diálogos de marca (sin pop-ups nativos), **estados de
  publicación + autoguardado**, catálogo de bloques por categorías, **navegación y
  metadatos dentro del Constructor**, **modo contenido** gateado por plan,
  **encabezado/pie como regiones editables** y **blueprints de sitio**; la
  configuración editorial y legal se edita dentro del Constructor.

### 3.8 Panel de administración
- CRUD de catálogo, pedidos y contenido; **roles**; **temas** (claro/oscuro +
  plantilla); **reportes de ventas exportables**; **auditoría**; **redirects 301**;
  **respaldos**; **import/export CSV** (productos, categorías, cupones, clientes,
  blog) y **acciones masivas**; **asistente de onboarding** reanudable.

### 3.9 Seguridad, SEO y operación
- **RLS** por tenant, **rate-limit distribuido**, CSP y firmas, **registro de
  auditoría** (append-only), **monitoreo de errores/APM**.
- **SEO**: metadata, sitemap, robots, render incremental, OpenGraph, datos
  estructurados, **redirects 301**.

### 3.10 Calidad
- Suite automatizada **≈1.180 pruebas verdes** (base de datos 521 · tienda 387 ·
  panel 262 · consola 80 · multi-tenant 30), *type-check* limpio en las tres
  aplicaciones. Migraciones de datos versionadas (62 del plano de tienda + 10 del
  plano de plataforma).

---

## 4. Qué está definido (roadmap, no implementado)

| Área | Alcance | Estado |
|---|---|---|
| **Facturación por suscripción (SaaS) + aislamiento por plan** | Cobro recurrente del operador a sus tenants (proveedor de billing intercambiable), suspensión por impago, niveles de aislamiento (compartido/esquema/BD dedicada) | 🔲 roadmap |
| **Inteligencia artificial (transversal)** | Proveedor intercambiable + generación de contenido, asistente de compra, búsqueda semántica/visual, personalización, detección de fraude | 🔲 roadmap |
| **Inventario multi-ubicación (E18)** | Ubicaciones, stock por `(ítem, ubicación)` como **proyección del libro de movimientos**, ruteo de despacho, traslados, retiro en punto; **migración única** del stock | 🔲 roadmap (reconciliada con E24) |
| **Operaciones e inventario (E24)** | `stock_item` + unidad de medida, **libro de movimientos**, compras/proveedores, **receta/BOM con política de consumo**, producción/mermas, **costeo**, modificadores, listas de precio, cotizaciones/apartado, reportes/tableros/alertas | 🔲 planteamiento formalizado |
| **Punto de venta (E25)** | **POS offline-first con sincronización**: caja, venta rápida, código de barras, devoluciones en punto, **servicio en sala** (mesas/comandas/propinas/división), periféricos abstractos | 🔲 planteamiento formalizado |
| **Vertical servicios/educación (E20–E22)** | Cobros recurrentes (matrículas/membresías), formularios/trámites/certificados, marketing & analítica | 🔲 roadmap |
| **Portal institucional (E23)** | CMS de portal a gran escala (tipos de contenido, multiportal, intranet, accesibilidad, multi-idioma) | 🔲 horizonte |
| **Endurecimiento PCI / 2FA / respaldos programados** | Cumplimiento y resiliencia avanzada | 🔲 roadmap |

> Lo **fiscal y contable** (facturación electrónica, bancos, conciliación, cuentas
> por pagar/cobrar) queda **fuera** como módulo propio y se resuelve **solo por
> integración** con los sistemas que el negocio ya use.

---

## 5. Escalera de capacidades por plan

El producto se empaca en **peldaños acumulables y combinables** sobre el mismo núcleo:

| Peldaño | Para | Estado de base |
|---|---|---|
| **0 · Presencia** | Sitio/landing sin transacción | ✅ disponible |
| **1 · Vitrina** | Catálogo sin checkout (consulta/cotización) | ✅ disponible |
| **2 · Comercio electrónico** | Venta en línea completa | ✅ disponible |
| **3 · Operación / Punto de venta** | Venta presencial, retail | 🔲 E24 + E25 |
| **3R · Servicio en sala** | Restaurante/cafetería | 🔲 E25 |
| **3M · Transformación/manufactura** | Producción con materia prima | 🔲 E24 |
| **4 · Institucional / Servicios** | Portal + cobros recurrentes | 🔲 E20–E23 |

---

## 6. Plan de liberación por fases

> Las fases ordenan la **secuencia de valor y dependencias técnicas**. Las ventanas
> de tiempo (T1…T5) son **indicativas** y dependen de la capacidad del equipo y de
> la priorización comercial; no son fechas comprometidas.

### Fase 0 — Disponible hoy *(liberado)*
**Objetivo:** operar el núcleo e-commerce multi-tienda con Constructor y panel.
**Incluye:** peldaños 0–2 (presencia, vitrina, comercio electrónico), Constructor v2
completo, pagos/envíos/correo intercambiables, inventario base, marketing/VIP,
panel de administración, SEO, seguridad base.
**Criterio de liberación (cumplido):** suites verdes, aislamiento por RLS validado
en catálogo/contenido, endurecimiento de instrumentos de valor cerrado.

### Fase 1 — SaaS comercial productivo *(T1)*
**Objetivo:** poder **vender la plataforma** a múltiples clientes con cobro propio.
**Entregables:** cierre de la plataforma multi-tienda (activación de RLS de sesión
en producción, **facturación por suscripción**, suspensión por impago), **niveles de
aislamiento por plan**, gestión comercial de planes/entitlements, dominios.
**Dependencias:** núcleo multi-tenant (hecho).
**Criterio de liberación:** alta/baja de tenants con plan y cobro; aislamiento A≠B
probado; suspensión por impago operativa.
**Riesgos:** activación de RLS de sesión en producción (cutover controlado).

### Fase 2 — Fundación de operaciones e inventario *(T2–T3)*
**Objetivo:** convertir Merkiai de "tienda con stock" a "operaciones con libro de
inventario", base de POS y manufactura.
**Entregables:** **E24** núcleo — `stock_item` + unidad de medida + **libro de
movimientos** (con la **migración única** del stock actual, E18 · HU-178);
**multi-ubicación** (E18) como proyección del ledger; **compras/proveedores**;
**receta/BOM con política de consumo** (reusa bundles) + **modificadores**;
**costeo**.
**Dependencias:** Fase 1 recomendada (no obligatoria para pilotos).
**Criterio de liberación:** migración de inventario sin regresión (flujo de una sola
ubicación idéntico); disponible por `(ítem, ubicación)` como proyección; costeo por
promedio ponderado verificado.
**Riesgos:** migración fundacional del inventario (cutover por fases, reversible).

### Fase 3 — Punto de venta offline-first *(T3–T4)*
**Objetivo:** venta presencial que no se detiene sin conexión.
**Entregables:** **E25** — caja (apertura/cierre, arqueo), **sincronización
offline-first** (cola persistente, idempotencia, numeración sin colisión,
conciliación de conflictos), **venta rápida** (código de barras, atribución a
vendedor), **devoluciones en punto**, **capa de periféricos** abstracta,
tableros/alertas del POS.
**Dependencias:** Fase 2 (ledger + multi-ubicación).
**Criterio de liberación:** operación continua sin conexión con sincronización
correcta e idempotente; arqueo de caja cuadra; peldaño 3 comercializable.
**Riesgos:** complejidad de sincronización y periféricos (interfaz de dispositivo
abstracta).

### Fase 3b — Servicio en sala y manufactura *(T4)*
**Objetivo:** cubrir restaurante/cafetería y transformación.
**Entregables:** **E25** servicio en sala (mesas, comandas/pantalla de cocina,
propinas, división); **E24** órdenes de producción, mermas/rendimiento y costeo de
producción.
**Dependencias:** Fases 2 y 3.
**Criterio de liberación:** descuento de recetas al vender y producción a inventario
con costo; comandas y división operativas.

### Fase 4 — Vertical servicios/educación e institucional *(T5+)*
**Objetivo:** cobros recurrentes, trámites/certificados y portales.
**Entregables:** **E20–E22** (cobros recurrentes, formularios/trámites/certificados,
marketing & analítica) y, en horizonte, **E23** (portal institucional).
**Dependencias:** Constructor (hecho), entitlements (hecho).

### Transversales (se intercalan en todas las fases)
- **Inteligencia artificial (E16)** como capa opt-in.
- **Conectores de facturación electrónica y exportación contable** (solo integración).
- **Endurecimiento PCI, 2FA y respaldos programados** conforme avanza la exposición.

---

## 7. Resumen de disponibilidad

- **Listo para producción hoy:** plataforma SaaS multi-tienda, tienda en línea
  completa, Constructor de sitios, panel de administración, pagos/envíos/correo
  intercambiables, marketing/fidelización, SEO y seguridad base.
- **Siguiente valor comercial:** cierre del SaaS (cobro por suscripción) → fundación
  de operaciones/inventario → punto de venta offline-first → servicio en sala y
  manufactura → vertical servicios/institucional.
- **Principio sostenido:** todo opt-in por plan, sin lógica atada a cliente o
  vertical; lo fiscal/contable por integración; **cero regresión** en cada paso.

---

*Referencias: mapa de épicas en `docs/backlog/01-objetivos-y-mapa.md`; detalle de
operaciones/POS en `docs/backlog/11-detalle-pos-operaciones.md`; multi-ubicación en
`docs/backlog/07-detalle-e18-y-pci.md`; Constructor en
`docs/backlog/10-detalle-constructor-v2.md`; registro de implementación en
`PROGRESS.md`.*
