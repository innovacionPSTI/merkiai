# ADR-005 · Arquitectura de infraestructura y despliegue

> **Estado:** Aceptado (nov-2026). **Contexto:** E14 (despliegue) + E17 (multi-tenant / aislamiento por plan). **Relacionado:** HU-200 (niveles de aislamiento de datos), HU-360–363 (infraestructura dedicada por tenant), E24/E25 (operaciones y POS offline-first).
> **Propósito:** fijar el modelo de despliegue por defecto, cuándo se usan contenedores/orquestación, los proveedores de referencia por capa y los componentes que no encajan en funciones serverless puras — para no acoplar el producto a supuestos de infraestructura y poder ofrecer niveles de aislamiento sin reescritura.

## 1. Decisión (resumen)

1. **Despliegue por defecto: serverless + CDN.** La aplicación (Next.js) se publica como **contenido estático/prerenderizado servido por CDN** + **funciones serverless** para lo dinámico (SSR, APIs, webhooks). **No** se administran servidores, imágenes Docker ni clústeres por parte del equipo.
2. **Base de datos: Postgres gestionado, separado de la app.** Con **niveles de aislamiento por plan** (compartido / esquema dedicado / BD-proyecto dedicado) resueltos por `tenants.db_ref` + *connection factory* (ADR-001, HU-200).
3. **Contenedores (Docker) y orquestación (Kubernetes): opción del tier dedicado, no el default.** La app es **portable y contenerizable**; Docker/K8s entran **solo** cuando un cliente exige despliegue aislado, on-premise o residencia de datos estricta (HU-360–363), o para **servicios de fondo** con estado/larga ejecución.
4. **Proveedores no se comprometen en el código.** El código es agnóstico (Next.js estándar + Postgres estándar + almacenamiento S3-compatible + proveedor de auth intercambiable); la elección concreta de proveedor se confirma al desplegar y puede cambiar sin reescritura.

## 2. Modelo por defecto — serverless/CDN

| Pieza | Cómo se sirve |
|---|---|
| Páginas estáticas / prerenderizadas (incl. render incremental) | **CDN** (borde), cacheado y global |
| Render dinámico, rutas de API, webhooks de pago/envío | **Funciones serverless** (se encienden por petición, escalan a cero) |
| Base de datos | **Postgres gestionado** externo (no vive en la app) |
| Archivos/medios | **Almacenamiento de objetos** S3-compatible + CDN |
| Autenticación | **Proveedor de auth** (JWT con claim de tenant; ADR-001) |

**Ventajas:** escala automático, pago por uso, cero mantenimiento de servidores, apropiado para **muchos tenants pequeños**. **Contras:** arranques en frío ocasionales, límites para procesos largos/con estado, y cierta dependencia del proveedor (mitigada por usar interfaces estándar).

## 3. Cuándo entran contenedores / Kubernetes

Docker/K8s **no** son parte del camino por defecto. Se consideran en dos situaciones:

- **Tier de infraestructura dedicada (HU-360–363).** Despliegue aislado por cliente, on-premise o residencia de datos: la app se empaqueta en **Docker** y corre en un **servicio de contenedores gestionado** (p. ej. Cloud Run / ECS-Fargate / Azure Container Apps) o en **Kubernetes** (EKS/GKE/AKS), con su Postgres dedicado. Es un **entitlement de plan enterprise**, auditado desde el control plane.
- **Servicios de fondo con estado.** Ver §4.

En ambos casos se mantiene la misma frontera de aislamiento (RLS como defensa en profundidad incluso con BD dedicada) y el mismo *connection factory*; cambiar de nivel es una operación de datos + `db_ref`, **no** una reescritura de la app.

## 4. Componentes que no encajan en serverless puro (a prever)

Dos piezas del roadmap conviene resolver con un runtime con más estado/tiempo que una función serverless pura:

- **Trabajos en segundo plano:** colas, reintentos idempotentes, cron de conciliación y avisos (ya presentes en pagos/correo; crecen con operaciones).
- **Sincronización del POS offline-first (E25):** ingestión de colas de eventos de dispositivos, deduplicación y conciliación de conflictos de stock.

**Recomendación:** empezar con las capacidades de cron/colas de la plataforma serverless; si estas piezas crecen, introducir un **pequeño servicio en contenedor** (p. ej. Cloud Run) junto a la app serverless — **sin** saltar a un clúster Kubernetes completo. Es un ajuste incremental, no un cambio de modelo.

## 5. Proveedores de referencia por capa (no comprometidos)

| Capa | Opción por defecto | Alternativas / tier dedicado |
|---|---|---|
| App + funciones + CDN | Plataforma serverless nativa de Next.js | Otras plataformas de borde/serverless; para dedicado: contenedores gestionados o Kubernetes |
| Base de datos (Postgres) | Postgres gestionado (proyecto único, pooled + RLS) | Postgres gestionado con **BD-por-tenant a escala**; Postgres gestionado en nube pública para dedicado |
| Almacenamiento de objetos | Almacenamiento S3-compatible del mismo proveedor | Cualquier S3-compatible |
| Autenticación | Proveedor de auth con JWT por tenant | — |
| Fondo / colas | Cron + colas de la plataforma serverless | Servicio en contenedor para cargas con estado |

> Los nombres de producto concretos y sus límites/precios se confirman al comprometer la infraestructura; el diseño no depende de un proveedor específico.

## 6. Consecuencias

- **Operación mínima** por defecto y costo proporcional al uso; bueno para arrancar la comercialización SaaS con muchos tenants.
- **Portabilidad preservada:** al no acoplar el código a un proveedor ni a Kubernetes, el salto a infraestructura dedicada o a otro proveedor es una decisión de despliegue, no de producto.
- **Claridad comercial:** el aislamiento (compartido → esquema → BD dedicada → despliegue dedicado) se vende como **niveles de plan**, alineado con ADR-001 y HU-200/360–363.
- **Deuda consciente:** los trabajos de fondo y la sincronización del POS pueden requerir, más adelante, un componente en contenedor; queda anotado para no descubrirlo tarde.

## 7. Alternativas descartadas (como default)

- **Kubernetes desde el inicio:** máximo control y portabilidad, pero **costo operativo alto** injustificado para el arranque; se reserva al tier dedicado.
- **VPS/servidores administrados a mano:** contradice el bajo costo operativo y el escalado automático; solo se consideraría si un cliente lo exige por política propia, como extensión sobre la misma costura de enrutamiento.

## 8. Niveles de aislamiento × peldaños y gobernanza de roles

> **Propiedad y operación.** La plataforma es operada por **Merkiai** (producto de
> Néstor Cardona); las decisiones de infraestructura y aislamiento son de Merkiai.
> **ParqueSoft TI** figura únicamente como **canal comercial** y como marca
> **«Powered by ParqueSoft TI»** (consola, admin y futura página comercial); no es
> el operador de la plataforma.

### 8.1 El aislamiento es ortogonal a los peldaños

Los **peldaños de capacidad** (presencia → vitrina → e-commerce → punto de venta →
institucional) definen **qué funciones** tiene el tenant. El **nivel de aislamiento
de datos** (`shared` → `schema` → `dedicated`, HU-200) define **dónde viven** sus
datos. Son **ejes independientes**: un tenant elige su peldaño y, por separado, su
nivel de aislamiento. No se "sube" de aislamiento por vender más funciones.

### 8.2 Recomendación por nivel

| Nivel | Cuándo | Para qué perfil |
|---|---|---|
| **`shared`** (BD compartida + RLS) | Default | La mayoría: presencia, vitrina, e-commerce e incluso **POS pequeño/mediano**. Barato, escala solo; la RLS garantiza el aislamiento lógico |
| **`schema` dedicado** | Por **volumen/rendimiento** o separación lógica más fuerte | Tenants **grandes** (mucho catálogo/pedidos/tráfico) sin costo de BD propia |
| **`dedicated`** (BD/proyecto propio → despliegue dedicado, HU-360–363) | Por **exigencia de cumplimiento/residencia de datos**, no por volumen | Tier **institucional/enterprise**: cuando el cliente exige datos en su propia infraestructura o región |

**Criterio:** la gran mayoría vive en `shared`; se recomienda `schema` **por tamaño**
y `dedicated` **solo cuando el cliente lo exige** (normativa/residencia),
típicamente a partir del tier institucional/enterprise. Es **por-tenant**: un tenant
puntual puede promoverse a dedicado como *add-on*, sin cambiar de plan.

### 8.3 Dónde está modelado

- **Planes:** `plans.data_isolation` (CHECK `shared`/`schema`/`dedicated`) + selector
  en el editor de planes de la consola → el nivel es un **atributo del plan**.
- **Tenant:** hereda `tenants.data_isolation` + `tenants.db_ref` (costura de
  enrutamiento); el *connection factory* resuelve el cliente de datos por tenant.
- **Pendiente (HU-200 + HU-360–363):** la **materialización** (aprovisionar el
  esquema/BD dedicada, migración multi-destino, promoción auditada). El campo y el
  enrutamiento existen; el provisioning automático es roadmap.

### 8.4 Roles y gobernanza

Dos planos de roles **separados**:

- **Roles del tenant (panel de administración):** `super_admin`, `admin`,
  `vendedor`, `gestor_tienda`, `miembro`. Son del **comerciante** y operan *su*
  tienda; **no gestionan infraestructura**.
- **Rol de plataforma (consola):** `platform:operate` — el **operador de Merkiai**.
  Gestiona planes, tenants, `data_isolation`, `db_ref` y (futuro) la promoción a
  dedicado. El aprovisionamiento de infra vive **solo** aquí.

**¿Nuevos roles?** **No para el MVP:** el comerciante no gestiona su infraestructura
y `platform:operate` ya cubre la operación. **Al materializar el tier dedicado**
(HU-360–363) se recomienda, por **mínimo privilegio**, **escindir** `platform:operate`
en: (a) **operación comercial** (planes, tenants, soporte, cobro manual) y
(b) **`platform:infra`** (promoción a BD/despliegue dedicado y **custodia de secretos
de infra**, HU-362), lo más sensible. Opcional: un rol de **soporte de solo-lectura**
en la consola. Para el **tenant**, esto nunca requiere un rol nuevo.

## 9. Almacén de coordinación y caché (¿Redis?)

**Decisión: hoy NO se usa Redis; Postgres es el almacén de coordinación.** Todo lo
que típicamente motivaría un Redis está resuelto con la base de datos gestionada y
cachés livianas:

- **Rate-limit "distribuido"** (HU-300): tabla `rate_limit_counters` + RPC
  `rate_limit_hit` (`FOR UPDATE`, efectivo entre instancias) con **fallback en
  memoria**. Sin Redis.
- **Idempotencia** (canje de valor, movimientos de inventario, webhooks): claves de
  idempotencia en tablas Postgres (`store_value_redemptions`, `op_key` del libro de
  movimientos…).
- **Caché de lectura:** `React.cache` por request + TTL corto en memoria por
  instancia (p. ej. resolución host→tenant, 60 s) + CDN/edge para estático.
- **Sesiones/auth:** JWT (Stack Auth), sin estado de sesión en servidor.

**Cuándo convendría introducir Redis (no ahora):**

- El **volumen de rate-limit/contadores** empiece a cargar Postgres (cada *hit* es
  una escritura con lock): un `INCR`+TTL en Redis es más barato y rápido.
- Se necesite un **caché caliente compartido entre instancias** (host→tenant,
  entitlements, config) a escala, en vez del caché por-instancia actual.
- Lleguen los **trabajos de fondo / colas** (retries, cron, **sincronización del
  POS offline-first** E25): una cola durable (BullMQ sobre Redis, o una cola
  gestionada).

**Forma recomendada cuando llegue:** por coherencia con el modelo serverless
(§1–§3), usar un **Redis/KV gestionado y serverless** (Upstash, Vercel KV o
equivalente), **no** un Redis autogestionado. Un Redis en servidor propio solo
tendría sentido dentro del tier de infraestructura dedicada o junto a un servicio
en contenedor de fondo (§4).
