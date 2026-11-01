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
