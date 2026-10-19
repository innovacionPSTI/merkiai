## Detalle · E16 — Componentes de IA  *(roadmap)*

> Pilar declarado de la plataforma. Los módulos de IA se integran como **servicios desacoplados** (mismo patrón *swappable* que pagos/envíos/email): un proveedor de IA configurable y componentes que lo consumen. Aún **no implementado** — roadmap.

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| IA-01 | Generación asistida de descripciones y textos SEO de productos con IA | Media | 🔲 |
| IA-02 | Recomendaciones de productos (relacionados / personalizadas) | Baja | 🔲 |
| IA-03 | Asistente de catálogo y atención (chat) sobre el contenido del CMS | Baja | 🔲 |

---

## Detalle · Expansión de roadmap (v17) — HU-101…134

> Historias **propuestas** para llevar la plataforma más allá del MVP hacia un CMS e-commerce white-label completo. Todas están en estado **🔲 (no implementado)** y se mapean a las épicas existentes (no crean épicas nuevas, salvo que se decida separar i18n). Las estimaciones son orientativas (S ≤ 3 pts · M 5 pts · L 8 pts · XL 13+ pts).
>
> **Bloques:** HU-101…119 (catálogo, inventario, pagos, cuentas, SEO, IA) · HU-120…125 (configurabilidad, plantillas de diseño y operación de datos) · **HU-126…134 (personalización avanzada y operación de datos — derivadas del enfoque configurable)**.

### HU-101 — Reseñas y calificaciones de producto · E4

> Como comprador, quiero calificar (1–5 estrellas) y reseñar productos que compré, y leer las reseñas de otros, para decidir con más confianza.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`product_reviews`, `queries/reviews`), `apps/web` (PDP `Reviews` + `/api/reviews` + JSON-LD), `apps/admin` (`/resenas` + `/api/admin/reviews`)
**Estado:** ✅ **Implementada (v1 + v2 parcial).** v1: tabla `product_reviews` (migración `e17/25`, RLS: público ve `approved`, alta pública forzada a `pending`, moderación solo `is_admin`). PDP: estrellas + promedio + lista + formulario (a moderación) + `aggregateRating` en JSON-LD. Admin `/resenas`: moderación. **v2 (v123):** **(a) paginación** — `getApprovedReviewsPage` (range + count) + `getApprovedRatings` (promedio ligero, desacoplado de la lista) + `GET /api/reviews` (page) + botón "Cargar más" en la PDP (5 por página). **(b) voto "útil"** — columna `helpful_count` + **RPC** `increment_review_helpful` (migración `e17/35`, SECURITY DEFINER acotado a tenant+approved; `grant` a anon/auth) + `POST /api/reviews/helpful`; en la PDP botón con guard de doble-voto por `localStorage`. Tests: database +3. **Pendiente v3:** "compra verificada" (ligar a `orders` — requiere auth del comprador + lectura de pedidos por RLS).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente con pedido entregado del producto | Puede dejar 1 reseña con estrellas + texto; queda `pending` de moderación |
| AC-2 | Admin en el panel | Aprueba, oculta o elimina reseñas; solo las aprobadas se muestran |
| AC-3 | PDP y grid | Muestran promedio de estrellas y conteo; PDP lista reseñas aprobadas paginadas |
| AC-4 | Usuario no autenticado o sin compra | No puede reseñar (control server-side) |

---

### HU-102 — Búsqueda de productos con autocompletado · E4

> Como comprador, quiero buscar productos por texto libre y ver sugerencias mientras escribo, para encontrar rápido lo que quiero.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (`SearchBox`, `/api/search/suggest`), `packages/database` (`suggestProducts`)
**Estado:** ✅ **Implementada (v2).** Buscador con **autocompletado**: `SearchBox` con debounce (200 ms), navegación por teclado (↑/↓/Enter/Esc), dropdown con nombre + imagen + precio. `suggestProducts` (consulta ligera `ilike` name/descr, mín. 2 chars, sin variantes) + `GET /api/search/suggest` acotado por tenant (RLS). Clic en sugerencia → PDP; Enter / "Ver todos los resultados" → `/shop?q=` (SSR, reusa el grid de HU-270). **v2 (v124):** el `SearchBox` vive ahora en el **navbar global** (desktop + drawer móvil) → disponible en todas las páginas; y se añadió **índice `pg_trgm` + GIN** sobre `products.name`/`description` (migración `e17/36`) para que los `ILIKE %q%` usen índice en catálogos grandes. Tests: database +2. **Mejora futura:** `tsvector`/ranking por relevancia + búsqueda por categoría.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Escribir en el buscador | ✅ Autocompletado nombre + thumbnail + precio (debounce); busca en nombre y descripción. *Categoría → mejora* |
| AC-2 | Enviar la búsqueda | ✅ Resultados reutilizando el grid de `/shop` (`?q`, SSR) |
| AC-3 | Sin resultados | ✅ Dropdown vacío + estado vacío del grid con "Limpiar filtros" |
| AC-4 | Rendimiento | 🔶 `ilike` sobre name/descr (ok para catálogos medianos); índice `pg_trgm`/`tsvector` → mejora |

---

### HU-103 — Lista de deseos / favoritos · E4

> Como comprador, quiero guardar productos como favoritos para comprarlos después.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (`store/wishlist`, `WishlistButton`, `/wishlist`, `WishlistNavLink`)
**Estado:** ✅ **Implementada (v1 + v2).** v1 client-side: `useWishlistStore` (zustand + persist en localStorage, por origen) + `WishlistButton` en tarjetas/PDP + página `/wishlist` + contador en navbar. **v2 (v125):** **(a) persistencia por cuenta** — tabla `wishlist_items` (migración `e17/37`, RLS `wishlist_own` por `customer_id` del `stack_id` del JWT) + `queries/wishlist` (getWishlist con disponibilidad, addWishlistItems bulk idempotente, removeWishlistItem) + `/api/account/wishlist` (GET/POST merge/DELETE, patrón `ensureCustomer`+RLS como el carrito). **(b) merge al iniciar sesión** — `WishlistSyncOnLogin` (sube local → cuenta y baja+fusiona), add/remove hacen push best-effort a la cuenta. **(c) sin-stock** — `getProductsStockMap` + `GET /api/catalog/stock` → la página de favoritos marca "Agotado" y el CTA cambia a **"Avísame cuando vuelva"** (enlace a la PDP, HU-105). Tests: database +7. **Ops:** aplicar `e17/37`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario autenticado marca un favorito | 🔶 v1 guarda en localStorage (visible en `/wishlist`); persistencia por cuenta → v2 |
| AC-2 | Invitado marca un favorito | ✅ Persiste en localStorage. Fusión al iniciar sesión → v2 |
| AC-3 | Producto sin stock en la wishlist | ◻️ Indicar estado + enlace a "avísame" (HU-105) → v2 |

---

### HU-104 — Filtro por rango de precio · E4

> Como comprador, quiero filtrar el catálogo por rango de precio para ajustar la búsqueda a mi presupuesto.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web` (`ShopClient` `PriceFilter`, `shop-filters`), `packages/database` (`getProductsPage`/`getCatalogFacets`)
**Estado:** ✅ **Implementada.** Filtro min/max resuelto **en BD** sobre `min_price`/`max_price` (HU-270) por **solapamiento** de rangos (`max_price>=pmin AND min_price<=pmax`). `getCatalogFacets` devuelve `priceBounds` (más barato/caro, consultas ligeras indexadas) para placeholders; estado en la URL (`pmin`/`pmax`), integrado en "Limpiar" y el contador de filtros activos; normaliza el rango invertido. Tests: web +1, database +1.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Control de rango (min/max) | ✅ Dos inputs + Aplicar en el panel; combinable con categoría/atributos/búsqueda |
| AC-2 | Estado en la URL | ✅ `?pmin&pmax` (compartible, SSR: el filtrado ocurre en el servidor) |
| AC-3 | Rango sin coincidencias | ✅ Estado vacío consistente + "Limpiar filtros" |

---

### HU-105 — Avísame cuando vuelva (back-in-stock) · E9

> Como comprador interesado en un producto agotado, quiero dejar mi correo para que me avisen cuando vuelva a haber stock.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`stock_notifications`), PDP, hook de reposición de stock, email
**Estado:** ✅ **Implementada.** Tabla `stock_notifications` (migración `e17/33`, RLS: alta pública en su tenant siempre sin notificar, gestión/aviso solo is_admin; **índice único parcial** por (tenant, variante, correo) no-notificados = idempotencia). Capa de datos `subscribeStockNotification` / `getPendingStockSubscribers` / `markStockNotified` / `notifyBackInStock` (envía 1 correo por suscriptor y marca `notified_at`; no reenvía). **PDP:** `BackInStock` aparece cuando la variante seleccionada está **agotada sin backorder** → `POST /api/stock-notifications` (anon RLS). **Reposición:** el `PATCH` de producto detecta variantes que pasan de **≤0 a >0** (compara stock previo) y dispara el aviso con `resolveEmailConfig` (instancia-first, ADR-004); correo `sendBackInStock`. Estilos por tokens. Tests: database +7, web/admin OK. **Ops:** aplicar `e17/33`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Producto/variante agotado sin backorder | Se muestra formulario "Avísame cuando vuelva" en la PDP |
| AC-2 | Reposición de stock (RPC/edición admin) | Se envía email a los suscriptores de esa variante y se marca como notificado |
| AC-3 | Idempotencia | Cada suscriptor recibe un solo aviso por evento de reposición |

---

### HU-106 — Alertas de stock bajo para el admin · E9

> Como operador, quiero que el panel me avise cuando un producto cae por debajo de un umbral, para reponer a tiempo.

**Estimación:** S (3 puntos)
**Módulo:** admin (dashboard/badge), `store_config.low_stock_threshold`
**Estado:** ✅ Hecho (v137) — umbral **global** por tienda (`store_config.low_stock_threshold`, `e17/40`), configurable en **Configuración → Inventario**. El dashboard (admin y vendedor) usa el umbral; el listado `/productos` muestra badge "Bajo" por producto y filtro `?stock=bajo`. Excluye variantes con reposición automática (backorder). Query `getLowStockVariants(db, threshold)`.

| # | Escenario | Resultado esperado | Estado |
|---|-----------|-------------------|--------|
| AC-1 | Umbral configurable (global por tienda) | Se guarda en `store_config.low_stock_threshold` | ✅ |
| AC-2 | Stock ≤ umbral | Badge/indicador en el dashboard y en el listado de productos | ✅ |
| AC-3 | Filtro "stock bajo" | `?stock=bajo` lista solo los productos por debajo del umbral | ✅ |

---

### HU-107 — Devoluciones y reembolsos (RMA) · E6  *(dividida en 107a/107b)*

> **L dividida:** el flujo de devolución y el reembolso vía pasarela tienen complejidad y dependencias distintas.

#### HU-107a — Workflow de devolución (RMA) · E6

> Como operador, quiero gestionar solicitudes de devolución (solicitud → aprobación → estado) desde el panel, para ordenar el postventa.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`returns`), admin (pedido → devolución), inventario
**Estado:** ✅ **Implementada (v1 · nivel pedido).** Tabla `order_returns` (migración `e17/38`, RLS solo panel is_admin, FK compuesta al pedido, índice por pedido). Capa de datos `returns` (`validateReturn`, `createReturn` [estado `requested`], `getReturnsForOrder` [historial, AC-3], `listReturns`, `setReturnStatus`). **Admin:** `ReturnsManager` en el detalle del pedido — registrar devolución (motivo + nota) **solo si el pedido es elegible** (pago aprobado o entregado, AC-1), y aprobar/rechazar las solicitadas con opción **"Reponer stock"** (AC-2: reusa `restoreStockForOrder`, idempotente). Endpoints `POST /api/admin/returns` + `PATCH /api/admin/returns/[id]` (gated por acceso a Pedidos). Tests: database +7. **Pendiente v2:** devolución **por ítem** (hoy a nivel pedido) y auditoría formal (HU-146). Depende de ella **HU-107b** (reembolso vía pasarela / saldo a favor).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido `approved`/`delivered` | Se inicia devolución (total o por ítem) con motivo y estado |
| AC-2 | Stock | Opción de reponer el stock de los ítems devueltos (reusa RPC de inventario) |
| AC-3 | Trazabilidad | Historial de la devolución asociado al pedido (auditable, HU-146) |

#### HU-107b — Reembolso vía pasarela · E6

> Como operador, quiero ejecutar el reembolso (a la pasarela o como saldo a favor) al aprobar una devolución, para cerrar el ciclo de dinero.

**Estimación:** M (5 puntos)
**Módulo:** API de refund de la pasarela activa, `refunds`, admin
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-107a; opción de crédito reusa HU-148

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Devolución aprobada (HU-107a) | Se registra reembolso: vía API de la pasarela si la soporta, o manual |
| AC-2 | Alternativa saldo a favor | Puede reembolsarse como store credit (HU-148) en lugar de dinero |
| AC-3 | Consistencia | Estado del pedido y del reembolso quedan sincronizados y auditados |

---

### HU-108 — Pasarela internacional (Stripe / PayPal) · E6

> Como negocio con clientes fuera de Colombia, quiero ofrecer una pasarela global para vender internacionalmente.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database/src/providers/payment/StripeGateway.ts` (o PayPal), factory, webhook, config admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Nueva clase que implementa `PaymentGateway` | Se registra en el factory y en `active_provider` sin tocar el checkout |
| AC-2 | Configuración en `/configuracion/pagos` | Nueva pestaña con credenciales + URL de webhook (patrón existente) |
| AC-3 | Webhook con verificación de firma | Actualiza la orden y aplica stock igual que las demás pasarelas |
| AC-4 | Seguridad | La pasarela se deriva del servidor (consistente con HU-092) |

---

### HU-109 — Recuperación de carrito abandonado · E5 (toca E8)

> Como negocio, quiero recordar por email a quienes dejaron el carrito sin comprar, para recuperar ventas.

**Estimación:** L (8 puntos)
**Módulo:** captura de carrito (`abandoned_carts`), tarea programada, plantilla de email (E8)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario con email conocido deja el carrito | Se persiste el carrito con timestamp |
| AC-2 | Pasado el umbral (ej. 4 h) sin compra | Se envía email de recordatorio con enlace de recuperación |
| AC-3 | El cliente completa la compra | Se marca recuperado y no se reenvía |
| AC-4 | Configurable | Umbral y activación gestionables desde el admin |

---

### HU-110 — Retiro en tienda / click & collect · E7

> Como comprador local, quiero elegir "retiro en tienda" en vez de envío, para no pagar despacho.

**Estimación:** M (5 puntos)
**Módulo:** checkout (paso Envío), `shipping_config` (puntos de retiro), admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Método "retiro en tienda" habilitado | Aparece como opción sin costo en el paso de envío |
| AC-2 | Selección de punto de retiro | El cliente elige entre los puntos configurados; se guarda en la orden |
| AC-3 | Estados del pedido | Flujo adaptado (listo para retiro / retirado) en lugar de guía de envío |

---

### HU-111 — Login social (Google / Apple) · E12

> Como usuario, quiero iniciar sesión con Google o Apple para no crear otra contraseña.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web/src/stack.ts` + páginas de auth (Stack Auth OAuth)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Botones de proveedor en `/login` y `/register` | Inician el flujo OAuth de Stack Auth |
| AC-2 | Primer inicio con proveedor social | Se crea el cliente y se dispara el welcome email (reusa flujo actual) |
| AC-3 | Cuenta existente con el mismo email | Se vincula sin duplicar cliente |

---

### HU-112 — Repetir pedido (reorder) · E12

> Como cliente recurrente, quiero recomprar un pedido anterior en un clic.

**Estimación:** S (3 puntos)
**Módulo:** `/account/orders/[id]`, store del carrito
**Estado:** ✅ **Implementada.** Botón "Repetir pedido" (`ReorderButton`) en el detalle del pedido: `getVariantsForCart` (datos actuales de variantes, solo activas de productos activos, RLS por tenant) vía `GET /api/catalog/variants`; re-agrega al carrito los ítems **disponibles** (activos + stock o backorder) respetando los **topes de stock** (reusa `addItem`/`clampQty`), omite descontinuados/agotados con aviso y lleva a `/cart`. Tests: database +2.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Botón "Repetir pedido" en el detalle | Agrega al carrito los ítems disponibles del pedido |
| AC-2 | Ítem sin stock o descontinuado | Se omite con aviso; el resto se agrega |
| AC-3 | Cantidades | Respetan los topes de stock (HU-099/100) |

---

### HU-113 — Gestor de redirects 301 · E15

> Como administrador, quiero definir redirecciones 301 de URLs viejas a nuevas desde el panel, para no perder tráfico ni SEO al renombrar rutas o slugs.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`redirects`), `apps/web/middleware.ts`, admin
**Estado:** ✅ Hecho (v138) — tabla `redirects` (`e17/41`, RLS lectura pública de activas + gestión is_admin, único por `(tenant, from_path)`). Capa `queries/redirects` con validación pura (normaliza rutas, rechaza iguales/duplicados/bucle directo). El middleware de la web resuelve 301/302 (endpoint `/api/redirects` cacheado 60 s). Admin `/redirects` (alta + activar/desactivar + eliminar) en Configuración. AC-3: al cambiar el slug de un producto, el PATCH auto-crea el redirect `/shop/viejo → /shop/nuevo` (best-effort, no pisa reglas manuales).

| # | Escenario | Resultado esperado | Estado |
|---|-----------|-------------------|--------|
| AC-1 | Admin crea una regla `origen → destino` | Se persiste y valida (evita loops/duplicados) | ✅ |
| AC-2 | Visita a una URL con regla | El middleware responde 301 al destino | ✅ |
| AC-3 | Cambio de slug de producto/página | Se sugiere crear el redirect automáticamente | ✅ (producto) |

---

### HU-114 — Internacionalización (i18n) · E2  *(dividida en 114a/114b/114c)*

> **XL dividida.** La i18n se entrega en tres HU incrementales. Candidata a épica propia si se prioriza como eje.

#### HU-114a — i18n: modelo de traducciones + idioma por defecto · E2

> Como plataforma, quiero un modelo de datos de traducciones y la gestión de idiomas (por defecto + adicionales), para que páginas, productos y strings admitan variantes por idioma.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (modelo de traducciones), config de idiomas en admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Idiomas configurables | Se define idioma por defecto + adicionales desde el admin |
| AC-2 | Contenido traducible | Páginas, secciones, productos y strings de UI admiten variante por idioma en el modelo |
| AC-3 | Fallback | Si falta traducción, se resuelve al idioma por defecto sin romper la página |

#### HU-114b — i18n: enrutamiento por locale + hreflang + sitemap · E2

> Como visitante, quiero navegar el sitio en mi idioma con URLs por locale, para que buscadores y usuarios accedan a la versión correcta.

**Estimación:** M (5 puntos)
**Módulo:** routing i18n de Next, `hreflang`, sitemap por idioma
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-114a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Prefijo/locale por idioma | Cada idioma tiene su ruta; se resuelve el contenido traducido |
| AC-2 | SEO | `hreflang` correcto entre versiones y sitemap por idioma |
| AC-3 | Coherencia con redirects | Compatible con el gestor de redirects (HU-113) |

#### HU-114c — i18n: UI de traducción en el admin · E2

> Como editor, quiero una interfaz para traducir contenido idioma por idioma (con estado de completitud), para gestionar los idiomas sin tocar datos crudos.

**Estimación:** M (5 puntos)
**Módulo:** admin (editor multi-idioma), indicador de cobertura de traducción
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-114a; sinergia con HU-118 (traducción por IA)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor por idioma | Alterna idioma y edita cada campo traducible |
| AC-2 | Completitud | Muestra qué contenido falta por traducir por idioma |
| AC-3 | Asistencia IA | Punto de integración para "traducir con IA" (HU-118) |

---

### HU-115 — Biblioteca de medios reutilizable · E2

> Como editor, quiero una biblioteca central de imágenes para reutilizarlas en productos, páginas y blog sin volver a subirlas.

**Estimación:** L (8 puntos)
**Módulo:** admin (media library sobre Supabase Storage), selector reutilizable
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Vista de biblioteca | Lista/busca los medios subidos con metadatos (nombre, tamaño, alt) |
| AC-2 | Selector reutilizable | Productos, secciones CMS y blog eligen desde la biblioteca o suben nuevo |
| AC-3 | Gestión | Renombrar, editar `alt` y eliminar (con aviso si está en uso) |

---

### HU-116 — Reportes de ventas exportables · E13

> Como administrador, quiero métricas de ventas por rango de fecha y exportarlas, para analizar el negocio fuera del panel.

**Estimación:** M (5 puntos)
**Módulo:** admin (dashboard/reportes), export CSV/XLSX
**Estado:** ✅ **Implementada (v1 · CSV).** `getSalesReport(db,{from,to})` agrega los pedidos del rango (excluye cancelados) → **ingresos, pedidos, ticket promedio, detalle por día y top productos**; `salesReportToCsv` reusa el serializador común. **Endpoint** `GET /api/admin/reports/sales?from&to&format=json|csv` acotado por tenant (RLS) y **gated por acceso a Pedidos**. **Página** `/reportes` (en el menú **Ventas**) con selector de rango (default últimos 30 días), tarjetas de métricas, tabla de top productos y botón **Exportar CSV** (detalle diario). Tests: database +3. **Pendiente v2:** XLSX con formato + gráfico de tendencia + comparativa de períodos.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección de rango de fechas | Ventas, pedidos, ticket promedio y top productos del período |
| AC-2 | Exportar | Descarga CSV/XLSX del período seleccionado |
| AC-3 | Permisos | Solo roles con acceso a reportes lo ven |

---

### HU-117 — 2FA del panel de administración · E14

> Como responsable de seguridad, quiero segundo factor para los administradores, para reforzar el acceso al panel. *(El registro de auditoría se separó a la HU-146.)*

**Estimación:** M (5 puntos)
**Módulo:** Stack Auth (2FA), middleware admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin habilita 2FA | Se exige segundo factor en el login del panel |
| AC-2 | Rol y cobertura | El 2FA aplica a los roles con acceso al panel; recuperación segura |
| AC-3 | Sesión | La verificación se respeta en el middleware de rutas admin |

---

### HU-118 — Traducción automática de contenido con IA · E16

> Como editor, quiero generar traducciones del contenido con IA para poblar rápido los idiomas de HU-114.

**Estimación:** M (5 puntos)
**Módulo:** proveedor de IA (patrón swappable), integración con el modelo de traducciones
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-114

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Página/producto con idioma faltante | Botón "Traducir con IA" genera un borrador editable |
| AC-2 | Revisión humana | La traducción queda como borrador hasta aprobación |
| AC-3 | Proveedor configurable | Usa el proveedor de IA activo (mismo patrón que pagos/envíos) |

---

### HU-119 — Búsqueda semántica de productos · E16

> Como comprador, quiero que la búsqueda entienda intención y sinónimos (no solo coincidencia exacta), para encontrar productos aunque no use las palabras exactas.

**Estimación:** L (8 puntos)
**Módulo:** embeddings + búsqueda vectorial (pgvector), sobre `/api/search` (HU-102)
**Estado:** 🔲 Pendiente (roadmap v17) — evolución de HU-102

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Consulta con sinónimos o descripción vaga | Devuelve productos relevantes por similitud semántica |
| AC-2 | Fallback | Si el proveedor de IA no está disponible, cae a la búsqueda full-text (HU-102) |
| AC-3 | Indexación | Los embeddings se regeneran al crear/editar productos |

---

### HU-120 — Reordenar secciones de página con drag-and-drop · E13 (toca E2)

> Como editor de contenido, quiero arrastrar y soltar las secciones de una página para cambiar su orden, en vez de editar números de orden manualmente.

**Estimación:** M (5 puntos)
**Módulo:** admin (editor de páginas), `page_sections.order_index`, endpoint de reordenamiento
**Estado:** ✅ **Cubierta por HU-251** (Constructor UX): drag-and-drop nativo de secciones (handle ⠿, `draggable`/`onDrop`) que persiste `order_index` por lote, con los ▲▼ como fallback accesible por teclado; la web pública renderiza en el nuevo orden. Los ítems/menú/imágenes/categorías (drag generalizado) siguen en HU-126.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor de una página con varias secciones | El admin arrastra una sección y suelta en otra posición |
| AC-2 | Al soltar | Se persiste el nuevo `order_index` de todas las secciones afectadas (una sola llamada por lote) |
| AC-3 | La web pública | Renderiza las secciones en el nuevo orden inmediatamente |
| AC-4 | Accesibilidad | El reordenamiento también es posible por teclado (mover arriba/abajo) |

---

### HU-121 — Sistema de plantillas de diseño (layout presets) · E3 (toca E2/E13)

> Como administrador, quiero que "Apariencia" gestione **plantillas de diseño** —el theme actual como plantilla por defecto— y poder crear plantillas adicionales y activar una, para cambiar la organización visual del sitio sin tocar código.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`layouts` / extensión de `themes`), admin `/sistema/apariencia`, capa de resolución de plantilla activa
**Estado:** ✅ **Implementada (v2).** (a) **color+tipografía** vía tabla `themes` + editor `/configuracion/temas` (crear/activar, `getActiveTheme`, inyección de CSS vars en `layout.tsx`) + **verificación de contraste WCAG** + **modo claro/oscuro y color de precio** (HU-247). (b) **plantillas de layout del home** vía registro `templates` en `blocks/schema.ts` (`default`/`esencial`), renderizadas con `getTemplateHomeLayout` (HU-218.5/220). **(c) Unificación (HU-121):** el tema pasa a ser la **"Plantilla"** = paleta + tipografía + layout: nueva columna `themes.template` (migración `e17/16`); `getStoreContext` resuelve el layout efectivo como `theme.template → store_config.template (legacy) → 'default'` y lo expone en `ctx.template` (consumido por home, PDP, grid y carrito). El editor de Temas gana el selector "Disposición del inicio"; el selector del Constructor propaga su cambio al tema activo (`setActiveThemeTemplate`) para no divergir; `applyPresetToStore` escribe el layout en el tema además de en store_config. Las **variantes de disposición por superficie** son HU-122 (a/b/c, ya implementadas).
> **Nota de independencia:** este es el theming del **storefront** (tokens `--brand-*`/`--theme-*`, por-tenant, editable por el comerciante) — **independiente** del design system de paneles (HU-210, `--mk-*`). En E17 pasa a fila-por-tenant vía **HU-207**. No debe acoplarse al preset de panel (HU-213).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Estado inicial | El theme actual (colores + tipografía) queda registrado como **plantilla por defecto**, sin cambios visibles |
| AC-2 | Crear plantilla | El admin crea una plantilla nueva a partir de la actual (colores, tipografía y variantes de disposición) |
| AC-3 | Activar plantilla | Solo una activa a la vez (mismo patrón que el theme actual); la selección se persiste |
| AC-4 | Resolución | La web pública lee la plantilla activa en el servidor e inyecta sus tokens/variantes |

---

### HU-270 — Catálogo server-side: búsqueda + paginación + facetas en BD · E3 (storefront, rendimiento)

> Como comprador en una tienda con catálogo grande, quiero que `/shop` cargue rápido buscando, filtrando y paginando **en el servidor**, sin que el navegador descargue todo el catálogo.

**Estimación:** L (8 puntos) · **Track:** storefront + BD
**Estado:** ✅ **Implementada.** Migración `e17/24` (`products.min_price`/`max_price` por trigger + backfill + índice GIN sobre `attributes`). `getProductsPage(db,{search,categoryId,attrs,sort,limit,offset})→{products,total}` (orden por `min_price`; atributos por intersección de `product_id`; búsqueda `ilike` name/descr; `.range` + `count`) y `getCatalogFacets(db)` (categorías + atributos, consulta ligera). `/shop` SSR por `searchParams`; `ShopClient` presentacional que navega por URL (`attr_<Nombre>` para atributos). Fallback: si la migración no está, el orden por precio queda degradado (`min_price` NULL ordena al final) pero el resto funciona. Tests: database +4. *Nota:* la búsqueda server-side cubre name/descr (no SKU, que sí cubría el v1 client-side).

**Contexto/bloqueos detectados (por eso requiere migración):**
- `products` **no tiene precio** (vive en `product_variants`), así que ordenar por precio en BD exige **denormalizar** `products.min_price`/`max_price` (columna + trigger, o vista) con **índice** para ordenar/paginar.
- Las **facetas** (color/talla) viven en `product_variants.attributes` (**JSONB**); filtrar por ellas en BD pide **índice GIN** sobre `attributes` y, para la semántica actual (un producto califica si tiene *alguna* variante activa por cada atributo seleccionado, no necesariamente la misma), **N subconsultas `EXISTS`/intersección de `product_id`** o una **función RPC** dedicada.
- Las **facetas disponibles** (lista de categorías + valores de atributos del catálogo) deben venir de una consulta **ligera aparte** (`getCatalogFacets`), no del grid paginado.

**Diseño propuesto:** migración `min_price`/`max_price` (+ trigger o recálculo en save de variantes) + GIN sobre `attributes`; `getProductsPage(db,{search,categoryId,attrs,sort,limit,offset}) → {products,total}` (search `ilike` name/description; attrs vía intersección de `product_id` o RPC; sort por `min_price`/`featured`/`created_at`); `getCatalogFacets(db)`; `/shop` pasa a SSR por `searchParams` (el sync de URL de v1 ya deja el estado en la URL) y `ShopClient` se vuelve presentacional. Mantener fallback client-side si la migración no está aplicada.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Paginación | `/shop?page=N` trae solo esa página desde BD (`limit/offset` o keyset) + total |
| AC-2 | Búsqueda | `?q` filtra en BD (name/description) sin traer todo el catálogo |
| AC-3 | Facetas | Categorías y atributos filtran en BD; las facetas disponibles salen de consulta ligera |
| AC-4 | Orden | Orden por precio/novedad/nombre resuelto en BD (vía `min_price` denormalizado) |
| AC-5 | Paridad | Misma semántica de facetas que v1; sin regresión visual |

---

### HU-122 — Variantes de disposición por plantilla · E3  *(dividida en 122a/122b/122c)*

> **XL dividida** por superficie, para entregar valor incremental (no todo-o-nada). Todas dependen de HU-121.

#### HU-122a — Framework de variantes + navbar y home · E3 (toca E2)

> Como administrador, quiero el mecanismo de variantes de disposición y aplicarlo a navbar y home, para empezar a personalizar la estructura visual.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (registro de variantes por superficie), `packages/ui`, render por plantilla activa
**Estado:** 🔶 **Parcial (POC)** — **hecho:** framework de variantes por superficie en el registro `templates` (`Template.variants`, catálogo `SURFACE_VARIANTS`, resolver `getTemplateVariant` con fallback + validación, 5 tests) y **1 superficie cableada end-to-end**: densidad de la grilla de tienda (`product_grid`: comfortable 3-col / compact 4-col), resuelta por la plantilla activa en `/shop` (`esencial` → compacta). **Pendiente:** más superficies (navbar, PDP, carrito), selección de variante **independiente del template** (campo por tenant) y el selector dedicado en Apariencia. Depende de HU-121.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Registro de variantes | Framework que declara ≥2 variantes por superficie y las resuelve por plantilla activa |
| AC-2 | Navbar y home | Ambas superficies exponen variantes seleccionables desde Apariencia |
| AC-3 | Render y fallback | Render sin recompilar; si no hay variante, usa la de la plantilla por defecto |
| AC-4 | Extensibilidad | Agregar una variante = registrar componente + declararlo, sin tocar checkout ni queries |

#### HU-122b — Variantes de grid de tienda y PDP · E3

> Como administrador, quiero variantes de disposición para el grid de tienda y la página de producto, para adaptar la experiencia de catálogo.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (shop grid, PDP), sobre el framework de HU-122a
**Estado:** ✅ Implementada. Grid de tienda ya variaba por `product_grid` (122a). PDP: nueva superficie `product_detail` en `SURFACE_VARIANTS` con `gallery-left` (default, galería+info a 2 columnas) y `gallery-top` (apilado, ancho acotado); `ProductDetail` recibe `layoutVariant` y ramifica la grilla principal; la página PDP resuelve la variante con `getTemplateVariant(config.template, 'product_detail')`. `esencial` → `gallery-top`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Grid de tienda | ✅ `product_grid` comfortable/compact por plantilla (122a) |
| AC-2 | PDP | ✅ `product_detail` gallery-left/gallery-top por plantilla |
| AC-3 | Consistencia | ✅ Reusa `getTemplateVariant` y el fallback de HU-122a |

#### HU-122c — Variante de carrito · E3

> Como administrador, quiero variantes de disposición del carrito (drawer/página), para cerrar la personalización de las superficies clave.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (carrito/drawer), sobre el framework de HU-122a
**Estado:** ✅ Implementada. Nueva superficie `cart` con `comfortable` (default) y `compact` (tarjetas, padding, thumbnails y gaps reducidos). `cart/page.tsx` pasa a wrapper server que resuelve `getTemplateVariant(config.template, 'cart')`; la UI client se movió a `CartView` con prop `density`, preservando la lógica de envío/cupón/stock. `esencial` → `compact`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Carrito | ✅ `cart` comfortable/compact seleccionable por plantilla |
| AC-2 | Consistencia | ✅ Reusa framework/fallback de HU-122a; conserva la lógica de carrito existente |

---

### HU-123 — Import/Export extensible y versionado · E2

> Como administrador, quiero exportar e importar toda la configuración y el contenido del sitio en un paquete versionado que incluya los cambios actuales y tolere futuras adiciones, para clonar, respaldar o migrar una instancia.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`site-package.ts`), admin (`/api/admin/site-export`), esquema de paquete con versión
**Estado:** 🔶 **v1 (export/backup).** `buildSitePackage`/`exportSite` empaquetan el sitio del tenant en un JSON versionado (`kind: 'merkiai.site'`, v1): **Tema** (paquete de HU-129), **config NO sensible** (allowlist `safeStoreConfig` — nunca `resend_api_key` ni columnas internas/secretas; las credenciales de pago viven en otra tabla y no se tocan), **nav** y **todas las páginas** (paquetes de HU-255). Botón "Backup del sitio" en el Constructor → `GET /api/admin/site-export` (descarga). 4 tests (foco en el stripping de secretos). **Pendiente v2:** importador de sitio completo con **remapeo de colisiones** (`key`/`slug`/`nav_key`) + extensión a productos/categorías/variantes; hoy las piezas ya se importan por separado (Tema HU-129, páginas HU-255).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar | ✅ v1: Tema + config (segura) + nav + páginas/secciones/ítems, con versión de esquema. *(Productos/categorías/variantes → v2.)* |
| AC-2 | Importar una versión anterior | ⏳ v2 (los parsers de HU-129/255 ya son tolerantes a versiones) |
| AC-3 | Colisiones | ⏳ v2 (estrategia omitir/actualizar por `key`/`slug`/`nav_key`) |
| AC-4 | Extensibilidad | ✅ El manifiesto compone paquetes por entidad (Tema, página…); añadir uno nuevo no reescribe el resto |
| AC-5 | Seguridad | ✅ El export **nunca** incluye secretos (allowlist de config; sin credenciales de pago) |

---

### HU-124 — Carga masiva de productos por CSV · E13 (toca E4/E9)

> Como operador, quiero subir un archivo `.CSV` para crear o actualizar muchos productos y su inventario de una vez, en lugar de cargarlos uno por uno.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`lib/product-import.ts`: `parseProductsCsv` + `parseCsv` puros), admin (`POST/GET /api/admin/products/import`, `ImportProductsModal`)
**Estado:** ✅ **Implementada (MVP create).** **Parser puro y tolerante** (`parseProductsCsv`): una fila = una variante; las filas con el mismo `slug` se agrupan en un producto (la primera fija nombre/descr./categoría/imágenes/destacado y cada fila aporta una variante). Incluye un **CSV parser propio** (`parseCsv`, RFC4180 básico: comillas, comas y saltos dentro de comillas, CRLF, BOM), cabeceras con **sinónimos en español** (nombre, precio, inventario…), números en **formato latino o inglés** (miles `.`/`,`, decimal `,`/`.`), atributos `Color=Rojo;Talla=M` → `attributes` + `variant_options` (unión de claves). **Endpoint** acotado por tenant vía RLS (`getAdminDb`): resuelve **categoría por nombre→id**, respeta el **tope de productos del plan** (`resolveLimit`; importa hasta el remanente y omite el resto), **omite slugs existentes**, y revierte el producto si fallan sus variantes. Modo `preview` que valida sin escribir. **UI:** botón "Importar CSV" en `/productos` → modal que sube el archivo, **previsualiza** (a crear / omitidos / errores por fila) y confirma; **plantilla descargable** desde el `GET` del endpoint. Tests: database 10 (parser) + admin 5 (endpoint). **Pendiente v2:** upsert/actualización por `slug` (hoy solo crea; los existentes se omiten) — simétrico con HU-130 (export) para reimportar y editar en masa.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Subida de CSV + plantilla descargable | ✅ Plantilla desde `GET /api/admin/products/import`; columnas → campos (slug, name, price, category, stock, options, dimensiones…) |
| AC-2 | Previsualización y validación | ✅ `preview` muestra filas a crear / omitidas / con error antes de confirmar; cancelar no escribe |
| AC-3 | Importación | ✅ Crea producto + variantes agrupando por `slug`; reporta creados, actualizados, omitidos y errores por fila |
| AC-4 | Inventario | ✅ El `stock` de cada variante se establece desde el CSV |
| AC-5 | Idempotencia | ✅ Modo `create`: los `slug` existentes se omiten. Modo `upsert`: se actualizan (variantes por SKU/atributos; las nuevas se insertan) — reimportar no duplica |
| AC-6 | Multi-tenant / plan | ✅ RLS por tenant; solo los productos nuevos cuentan contra el tope del plan (importa hasta el remanente) |

**v2 ✅ (upsert, v93).** `mode: 'create' | 'upsert'`. En upsert, un `slug` existente actualiza el producto y empareja sus variantes por **SKU** (fallback **atributos**): las emparejadas se actualizan, las nuevas se insertan, las no presentes se conservan. UI con checkbox "Actualizar productos existentes" + conteos creados/actualizados. Cierra el ciclo de edición en masa con HU-130.

---

### HU-125 — Respaldo (backup) de productos, pedidos y clientes · E14 (toca E13)

> Como administrador, quiero generar respaldos de productos, pedidos y clientes, para proteger los datos y poder restaurarlos o auditarlos.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`objectsToCsv`), admin (`GET /api/admin/backup`, `BackupWidget` en Configuración › General)
**Estado:** ✅ **Implementada (descarga manual).** `GET /api/admin/backup?domain=products|orders|customers&format=csv|json` descarga una copia por dominio, acotada por tenant vía **RLS** (`getAdminDb`) y gated por rol (`canAccess(..,'configuracion')`). **Productos** (CSV) reusan `productsToCsv` → compatible con la carga masiva (HU-124); **pedidos** aplanan `shipping_addr` (depto/ciudad/dirección) e incluyen `items` como JSON; **clientes** exportan datos de contacto. `format=json` entrega un respaldo fiel (filas crudas). Serializador genérico nuevo `objectsToCsv` (escape RFC4180 + objetos→JSON). UI: tarjeta "Respaldos de datos" con botones CSV/JSON por dominio. Tests: database +1 (`objectsToCsv`), admin +3 (endpoint). **Pendiente:** respaldos programados + restauración (HU-133).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Generar respaldo | ✅ Descarga CSV o JSON por dominio: productos, pedidos y clientes |
| AC-2 | Alcance y permisos | ✅ Solo roles con acceso a configuración; datos acotados por **RLS por tenant** del lado servidor |
| AC-3 | Programación (opcional) | ◻️ Agendar respaldo periódico → HU-133 |
| AC-4 | Integridad | ✅ El nombre del archivo incluye la fecha (`respaldo-<dominio>-YYYY-MM-DD`); JSON es copia fiel |

---

### HU-126 — Reordenamiento drag-and-drop generalizado · E13

> Como editor/operador, quiero arrastrar para reordenar también los ítems del menú, las imágenes de un producto y las categorías, con la misma interacción que las secciones de página (HU-120).

**Estimación:** M (5 puntos)
**Módulo:** admin (nav, galería de producto, categorías), utilidad de reordenamiento reutilizable
**Estado:** ✅ **Implementada.** Utilidad de DnD reutilizable `useDragReorder` (estado arrastrado/destino + `dropProps`/`handleProps` + `arrayMove`). Reordenar por arrastre en todas las superficies de la HU: **secciones de página** y **ítems repetibles** del Constructor (con **efecto de "hueco"**: indicador punteado en el slot destino según la dirección; `order_index` por lote + fallback ▲▼); **imágenes de producto** (AC-1/AC-2: arrastrar reordena, **posición 0 = principal** con badge; handle + anillo en el destino; persiste al guardar); **categorías** (DnD ya existente); y **menú `nav_items`** — respeta la **jerarquía padre/hijo**: solo se reordena dentro del mismo nivel (mismo `parent_id`), handle funcional + indicador de inserción, persiste `order_index` por lote solo de los hermanos que cambian. **Entre niveles:** también se puede **cambiar de nivel arrastrando** (soltar junto a un ítem adopta su `parent_id`); se respeta el máximo de 1 nivel (un ítem con sub-ítems no puede anidarse) y no se puede soltar sobre sí mismo. HU **cerrada**.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Listado ordenable (nav, imágenes, categorías) | Se arrastra un ítem y se persiste el nuevo `order_index` por lote |
| AC-2 | Imagen principal de producto | Reordenar define la imagen destacada (posición 0) |
| AC-3 | Consistencia | Reusa el mismo componente/endpoint que HU-120 (una sola implementación) |
| AC-4 | Accesibilidad | Alternativa por teclado (subir/bajar) en todos los listados |

---

### HU-127 — Historial de versiones y restauración de contenido CMS · E2

> Como editor, quiero ver el historial de cambios de una página y restaurar una versión anterior, para deshacer errores con seguridad al manipular contenido y layout.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`content_revisions`), admin (editor de páginas)
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Guardar cambios de una página/secciones | Se registra una revisión con autor y timestamp |
| AC-2 | Ver historial | Lista de revisiones con diferencias legibles |
| AC-3 | Restaurar | Vuelve el contenido a una revisión previa (creando una nueva revisión, sin perder historial) |
| AC-4 | Alcance | Cubre secciones, ítems y su orden (compatible con HU-120/126) |

---

### HU-128 — Vista previa y publicación de plantillas (borrador/publicado) · E3

> Como administrador, quiero previsualizar una plantilla de diseño antes de activarla y publicarla cuando esté lista, para probar cambios de layout sin afectar la web en producción.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (modo preview con token), admin `/sistema/apariencia`, estado borrador/publicado de la plantilla
**Estado:** 🔶 **v1 (Opción A — preview, sin modelo pesado)** — el comerciante construye con secciones/ítems `enabled=false` y los **previsualiza** antes de publicar (publicar = `enabled=true`). **Token de preview POR-TENANT** (`@merkiai/database` `makePreviewToken`/`verifyPreviewToken`, HMAC con `PREVIEW_SIGNING_SECRET`, sin secreto global; reemplaza `DRAFT_SECRET`), ruta `GET/DELETE /api/preview` (valida contra el tenant del Host → cookie host-scoped → redirige al mismo host). **Home, páginas CMS (`/[slug]`) y blog** muestran secciones/ítems/posts deshabilitados en preview (banner + marca visual); el preview usa el **cliente-máquina `is_admin`** (las políticas RLS `*_admin_all` no filtran por `enabled`, a diferencia del anon que solo ve publicado). **Admin:** botón "Vista previa" en el Constructor (`getPreviewUrl` arma el enlace con host del tenant + token). **v2 ✅ (editar en caliente):** las secciones **ya publicadas** se editan sobre un **overlay `draft`** (JSONB en `page_sections` y `section_items`, migración `e17/17`) que el público **nunca** ve; solo la vista previa (is_admin) lo fusiona (`applySectionDraft`/`applyItemDraft`, puras, en `getPageWithSections` y `getWebHomeData`). Endpoint `POST /api/admin/cms/draft` con acciones `save`/`publish`/`discard` (valida el overlay contra el contrato del bloque antes de guardar); `publish` copia el overlay a las columnas en vivo y limpia el borrador. En el Constructor, editar una sección publicada guarda "borrador" + botones **Publicar cambios / Descartar** y un aviso de estado. **El editor de ítems** sigue el mismo flujo: editar un ítem visible de una sección publicada guarda en su overlay (botones Publicar/Descartar por ítem + badge "Borrador sin publicar"); un ítem nuevo en sección publicada nace oculto (no expuesto, visible en preview). Reordenar/eliminar ítems sigue siendo una acción estructural en vivo. Tests: database 5 (preview) + 6 (overlay) + web/admin verdes.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editar una plantilla no activa | Se puede abrir una vista previa del sitio con esa plantilla (URL/token de preview, no visible al público) |
| AC-2 | Publicar | La plantilla en borrador se activa de forma atómica; el público la ve al publicar |
| AC-3 | Descartar | Se pueden abandonar los cambios en borrador sin afectar la plantilla activa |
| AC-4 | Seguridad | El preview solo es accesible con sesión admin o token firmado |

---

### HU-129 — Paquetes de plantilla exportables/importables · E3 (toca E2)

> Como administrador, quiero exportar una plantilla completa (colores, tipografías, variantes de disposición y, opcionalmente, contenido de ejemplo) como un paquete e importarla en otra instancia, para reutilizar diseños entre proyectos.

**Estimación:** M (5 puntos)
**Módulo:** export/import (extiende HU-123), admin Apariencia
**Estado:** ✅ **Implementada (v1, plantilla).** Paquete JSON versionado del tema-plantilla (HU-121: paleta + tipografía + layout + claro/oscuro + color de precio) en `packages/database/template-package.ts`: `buildTemplatePackage` / `parseTemplatePackage` (puras, tolerantes: ignoran claves desconocidas, rellenan campos nuevos con defaults, rechazan versiones más nuevas, `nameOverride`) + `importTemplatePackage` (crea tema **inactivo**). Endpoints `GET /api/admin/themes/[id]/export` (descarga `.json`) y `POST /api/admin/themes/import`; en `/configuracion/temas`, botón "Exportar" por tema + "Importar plantilla" (file picker). Las **variantes de disposición por superficie** viajan dentro del layout de la plantilla (registro `templates`). 9 tests. *Nota:* el paquete que incluye también **contenido de ejemplo** y el resto de entidades se integrará con el manifiesto general de HU-123 cuando exista (este paquete ya es un ítem registrable ahí).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar plantilla | ✅ Paquete versionado con theme + layout (variantes incluidas en el layout) |
| AC-2 | Importar plantilla | ✅ Crea la plantilla como tema **inactivo** (borrador), lista para previsualizar/activar |
| AC-3 | Compatibilidad | ✅ Tolerante a versiones (defaults para campos nuevos; rechaza versiones futuras) |
| AC-4 | Colisiones | No sobreescribe la plantilla activa; nombra/versiona la importada |

---

## Clúster — Page Builder MVP (go-live) · E3

> **Objetivo:** que un cliente construya las páginas de su tienda, las guarde/exporte, y que al **seleccionar/aplicar** una plantilla o preset se "vista" la web; sirviendo también para construir templates/presets. Lo más **generalizado** posible **sobre el frame CMS robusto ya existente** (schema-driven: `pages` → `page_sections` → `section_items`, validación por contrato, borrador en caliente HU-128 v2/v2b, preview por token, variantes HU-122, temas/tokens HU-247, plantilla unificada HU-121, export/import de plantilla HU-129). El plan **no reescribe el motor**: es front + adiciones medidas al catálogo + un empaquetado de página espejo de HU-129.
>
> **Análisis de referencia (Foxify):** builder de *lienzo libre a nivel de elemento*; Merkiai es *schema-driven a nivel de sección*. Se rescata la **galería de plantillas con filtros + preview + aplicar**, el **selector por tipo de página**, la **barra inline por elemento** y el **preview por dispositivo**. **No** se adopta el canvas freeform, Shape/Hotspot/G-map/Code, edición total de PDP/Collection (las variantes bastan) ni el marketplace de extensiones.
>
> **Olas:** **1 (MVP core, bloquea go-live):** HU-252, HU-253, HU-254, HU-250. **2 (guardar/exportar + productividad):** HU-255, HU-251, HU-257. **3 (cerrar bucle + pulido):** HU-256, HU-258.

### HU-250 — Galería de plantillas/presets + "Aplicar" · E3

> Como comerciante, quiero una galería de plantillas/presets con filtros, vista previa y un botón para aplicarla, para vestir mi tienda sin construir desde cero.

**Estimación:** M (5 puntos) · **Track:** solo-front
**Módulo:** `apps/admin` `/plantillas` (`PlantillasGallery`), reusa `getOnboardingOptions` (control plane) + `applyPresetAction`/`applyPresetToStore` (HU-235)
**Estado:** ✅ **Implementada (MVP).** Pantalla `/plantillas` (enlace en el sidebar, bajo Apariencia): rejilla de presets del plan del tenant con **búsqueda** + **filtro por industria (nicho)**; **miniatura** curada o placeholder determinista por nicho (HU-257); botón **"Aplicar a mi tienda"** (confirmación + orquestador, respeta plan/topes) con feedback. Gated por rol (`configuracion`) + plan. **Decisión de diseño (acordada):** la **vista previa es la miniatura** (MVP); el contenido del preset no existe en la tienda hasta aplicarlo, así que el preview por dispositivo de un preset *sin aplicar* queda **fuera del MVP** (requeriría render en sandbox); tras aplicar, el comerciante previsualiza su tienda real con "Vista previa" del Constructor (HU-128).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Filtros | ✅ Búsqueda + filtro por **industria/nicho**. *(Filtro por "page type" N/A: los presets son bundles de home, no plantillas por tipo de página.)* |
| AC-2 | Preview | 🔶 **Miniatura como preview (MVP).** Preview en vivo por dispositivo de un preset sin aplicar = post-MVP (sandbox). |
| AC-3 | Aplicar | ✅ "Aplicar a mi tienda" ejecuta el orquestador (Tema+layout+contenido), respetando límites de plan (HU-235/239) |
| AC-4 | Importar | ⏳ Pendiente: cargar un paquete de plantilla (HU-129) a la galería; hoy el import está en Temas |

### HU-251 — Constructor UX: DnD, duplicar y controles inline · E3

> Como comerciante, quiero reordenar arrastrando, duplicar y operar los bloques desde una barra inline, para construir más rápido.

**Estimación:** M (5 puntos) · **Track:** front (+API mínima de clonado)
**Módulo:** `apps/admin` Constructor (`ConstructorClient`/`ItemsEditor`), endpoint `POST /api/admin/cms/duplicate`
**Estado:** ✅ **Implementada.** **Duplicar** sección (con sus ítems) e ítem vía endpoint de clonado (copia columnas, regenera `section_key`/ids, append al final). **Reordenar** con **drag-and-drop nativo** (handle ⠿, `draggable`/`onDrop`, persiste `order_index`) manteniendo los ▲▼ como fallback accesible por teclado. **Toggle de dispositivo** (Escritorio/Tablet 768px/Móvil 390px) que ajusta el ancho del iframe de preview, centrado. Reusa el CRUD + borrador (HU-128 v2/v2b) + validación (HU-218). *Nota:* la **barra inline superpuesta sobre el preview** no aplica (el iframe del storefront es cross-origin); los controles por bloque viven en la fila de cada sección/ítem (mover/duplicar/ocultar/editar/eliminar).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Reordenar | ✅ Drag-and-drop nativo de secciones; ▲▼ como fallback de teclado |
| AC-2 | Duplicar | ✅ Clona una sección (con sus ítems) o un ítem, preservando campos/estilo |
| AC-3 | Controles | ✅ Mover/duplicar/ocultar/editar/eliminar por fila. *(Overlay sobre el preview N/A: iframe cross-origin.)* |
| AC-4 | Dispositivo | ✅ Toggle Escritorio/Tablet/Móvil en el preview del Constructor |

### HU-252 — Bloques genéricos de layout · E3

> Como comerciante, quiero bloques de composición libres (sección de contenido, columnas/grid, banner, separador), para armar secciones a medida sin estar atado al catálogo fijo.

**Estimación:** L (8 puntos) · **Track:** esquema + renderer — **base del "no limitar el diseño"**
**Módulo:** `packages/database/blocks/schema.ts` (nuevos `blockSchemas`) + componentes React en `apps/web`
**Estado:** ✅ **Implementada.** 4 tipos nuevos en `blockSchemas` (migración `e17/18` amplía el CHECK de `section_type`): `content_section` (encabezado+texto+imagen+botón, disposición imagen-izq/der/arriba/solo-texto), `columns` (2/3/4 columnas + alineación, ítem `column` {icono/imagen,título,texto,enlace}), `media_banner` (imagen/video full-bleed + overlay + altura + CTA), `spacer` (tamaño + divisor). Componentes `ContentSection`/`ColumnsSection`/`MediaBanner`/`SpacerSection` registrados en **ambos** caminos de render: `SectionRenderer` (páginas CMS) y el registry de `home-blocks`. Reusan el contrato de bloque (validación + editor auto-generado) y aparecen solos en "Agregar bloque" del Constructor. 5 tests nuevos. *Nota:* en home el render sigue siendo por layout de plantilla (un bloque por tipo); en páginas CMS/landing se listan en orden libre (HU-254 generaliza el home si hace falta).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Sección de contenido | ✅ Encabezado + texto rico + imagen + botón + disposición (imagen izq/der/arriba/solo texto) |
| AC-2 | Columnas/Grid | ✅ 2/3/4 columnas + alineación con ítems {icono/imagen, título, texto, enlace}; generaliza `cards`/`services` |
| AC-3 | Banner/Media | ✅ Imagen/video full-bleed + overlay + altura + CTA |
| AC-4 | Utilidades | ✅ Spacer/Divider; todos reusan el contrato de bloque (validación + editor auto-generado) |

### HU-253 — Grupo de estilo compartido por sección · E3

> Como comerciante, quiero controles de estilo consistentes en cualquier sección (fondo, espaciado, ancho, alineación), para dar personalidad sin romper la coherencia del tema.

**Estimación:** M (5 puntos) · **Track:** esquema + renderer + editor
**Módulo:** `blocks/section-style.ts` (claves `style_*` en `settings` + `resolveSectionStyle` puro), renderer `SectionShell` (`apps/web`), panel "Estilo" en `SectionEditor` (`apps/admin`)
**Estado:** ✅ **Implementada.** `STYLE_FIELDS` (fondo por **token del tema** `style_bg` + imagen `style_bg_image` + espaciado superior/inferior por escala `style_pad_*`) persistidos en `settings`; `resolveSectionStyle` (puro, tolerante, defaults "sin efecto" → cero regresión). `SectionShell` envuelve **todas** las secciones en los dos caminos de render (CMS + home) aplicando fondo/espaciado; `SectionEditor` muestra un `<details>` "Estilo de la sección" que fusiona en `settings` (validación ignora claves `style_*`). Safelist en Tailwind de web para las clases dinámicas. 7 tests. *Nota:* ancho de contenedor y alineación quedan dentro de los bloques que lo soportan (p. ej. `columns`/`content_section`), no en el shell, para no chocar con el layout propio de cada sección.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Fondo | ✅ Color (token de la paleta del tema) o imagen por sección |
| AC-2 | Espaciado | ✅ Padding superior/inferior por **escala** (none/small/medium/large) |
| AC-3 | Coherencia | ✅ Fondo limitado a tokens `--brand-*` (no colores sueltos); alineación dentro de los bloques que la ofrecen |
| AC-4 | Transversal | ✅ Aplica a **todos** los bloques vía `SectionShell`, incluidos los genéricos (HU-252) |

### HU-254 — Renderer + Constructor agnósticos al tipo de página · E3

> Como comerciante, quiero construir con los mismos bloques en home, landings y páginas CMS, para no depender de plantillas fijas por tipo.

**Estimación:** M (5 puntos) · **Track:** renderer
**Módulo:** `apps/web` (home) + `home-blocks` registry; `pages.page_type` ya admite 'landing' (sin CHECK)
**Estado:** ✅ **Implementada.** El **home** pasa a render **agnóstico**: si la tienda tiene secciones propias las recorre **en orden** (`order_index`) permitiendo composición libre (varias secciones y de cualquier tipo); si no hay ninguna, cae al layout del template (fallback, cero regresión para tiendas nuevas). El registry del home se **completó** con los tipos que antes solo existían en CMS (`text`, `cards`, `faq`, `cta`, `testimonials`) además de los genéricos (HU-252), así cualquier `section_type` renderiza en el home. **Landing:** `pages.page_type='landing'` ya existía en el selector del gestor de contenido y las landings renderizan por la ruta `[slug]` (CMS) con bloques genéricos + estilo (HU-253) + preview/borrador (HU-128) — sin migración. `SectionShell` (HU-253) y el banner de preview aplican en ambos caminos.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Multi-tipo | ✅ Los bloques genéricos (HU-252) y los CMS renderizan en home, páginas CMS y landing |
| AC-2 | Landing | ✅ `page_type='landing'` construible desde el gestor de contenido; render por `[slug]` |
| AC-3 | Paridad | ✅ Preview, borrador (HU-128 v2) y publicación funcionan en cualquier `page_key` |

### HU-255 — Paquete de página export/import · E3

> Como comerciante, quiero exportar/guardar una página completa y volver a importarla, para reutilizarla o moverla entre tiendas.

**Estimación:** M (5 puntos) · **Track:** packaging — **espejo de HU-129**
**Módulo:** `packages/database` (`page-package.ts`: `buildPagePackage`/`parsePagePackage`/`exportPage`/`importPagePackage`), endpoints `GET /api/admin/cms/page-export` + `POST /api/admin/cms/page-import`, botones en el Constructor
**Estado:** ✅ **Implementada.** Paquete JSON versionado (`kind: 'merkiai.page'`, v1) con los campos de la página (label/page_type/show_in_footer/meta_*) + `page_sections` (incluye `settings`, y por tanto el **estilo** de HU-253) + `section_items`; **puro y tolerante** (ignora claves desconocidas, defaults, rechaza versiones futuras, descarta secciones sin `section_type`). `exportPage` lee página+secciones+ítems; `importPagePackage` crea una **página nueva en borrador** (`enabled=false`) regenerando `section_key`/ids (sin colisiones) y conservando el `enabled`/orden de cada sección/ítem. Endpoints acotados por rol (`contenido`) + RLS; validación de key/slug + 409 en colisión. En el Constructor: botones **"Exportar página"** (descarga) e **"Importar página"** (file picker + key/slug/label). 6 tests.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar | ✅ Paquete JSON versionado con `page_sections`+`section_items` (incluye el estilo en `settings`) |
| AC-2 | Importar | ✅ Crea una página nueva en **borrador**; tolerante a versiones (defaults, ignora claves desconocidas, rechaza versiones futuras) |
| AC-3 | Base de templates | ✅ `parsePagePackage` normaliza el contenido reutilizable para HU-256 |

### HU-256 — "Guardar como preset/plantilla" desde una tienda construida · E3

> Como operador, quiero empaquetar el estado actual de una tienda (tema + layout + contenido de ejemplo) como preset, para ofrecerlo en la galería.

**Estimación:** M/L (8 puntos) · **Track:** packaging + consola
**Módulo:** `packages/database` (`store-to-preset.ts`: `buildStorePresetPayload` — orquestador inverso), admin (`/api/admin/preset-export`), consola (`PresetImport` → `savePreset`)
**Estado:** ✅ **Implementada (MVP sin cross-plane write).** `buildStorePresetPayload` (puro) toma el **Tema activo** (solo los campos del preset, HU-121/247) + las **secciones del home** (ordenadas, con ítems y estilo en `settings`) + el modelo de inventario y produce un `PresetPayload` **re-aplicable** (catálogo de ejemplo vacío por defecto, para no arrastrar inventario real). `StarterSection` se extendió con `image_url/cta_label/cta_url/enabled` (+ `seedHomeSections`) para que los bloques genéricos viajen fieles. **Admin:** botón "Exportar como preset" en el Constructor → `GET /api/admin/preset-export` descarga el JSON (`kind: 'merkiai.preset-payload'`). **Consola:** `PresetImport` (operador) sube ese JSON, elige key/name/niche y **publica** el preset reutilizando `savePreset` + su validación → queda en la galería (HU-250). *Diseño:* el comerciante **no** escribe en el catálogo compartido; el operador cura (sin endpoint de escritura cross-plane desde el tenant). 4 tests.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Capturar | ✅ Tema + layout + secciones/ítems del home → `PresetPayload` re-aplicable |
| AC-2 | Publicar | ✅ El operador lo publica como preset (HU-233) desde la consola; aparece en la galería (HU-250) |
| AC-3 | Fiel | ✅ Reusa el contrato de `applyPresetToStore`; `StarterSection` ampliado para no perder image/cta de los bloques genéricos |

### HU-257 — Miniaturas/preview de plantillas y presets · E3

> Como comerciante, quiero ver miniaturas representativas en la galería, para elegir con criterio.

**Estimación:** S/M (3 puntos) · **Track:** front/infra
**Módulo:** `presets.thumbnail_url` (plataforma) + consola (lib/form) + endpoint interno + admin (tipo + galería)
**Estado:** ✅ **Implementada (imagen curada).** `presets.thumbnail_url` (migración plataforma `platform/06_preset_thumbnail.sql`); expuesto en `PresetRow`/`PresetInput` + input "Miniatura (URL)" en el `PresetForm` de la consola; fluye al admin por el endpoint interno de presets (`OnboardingPreset.thumbnail_url`). La galería (HU-250) usa la imagen curada si existe, o un **placeholder gradiente determinista por nicho** si falta. Screenshots automáticos quedan como camino futuro.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Miniatura | ✅ Cada preset expone `thumbnail_url` (opcional) en la galería |
| AC-2 | Enfoque | ✅ MVP con imagen curada + placeholder por nicho; camino a screenshots documentado |

### HU-258 — Accesibilidad v2 del Constructor/galería · E3

> Como usuario de teclado/lector de pantalla, quiero operar el builder con foco atrapado y anuncios claros, para construir sin barreras.

**Estimación:** S/M (3 puntos) · **Track:** front — **cierra HU-248**
**Módulo:** `apps/admin` Constructor/galería/editores
**Estado:** ✅ **Implementada.** Regiones `role="status" aria-live="polite"` en el feedback del Constructor (tplMsg), la galería (aplicar), `SectionEditor` e `ItemsEditor` (guardado/borrador), con `role="alert"` en errores. El **reorden por teclado** (▲▼, ya accesible desde HU-251) y el **duplicar/mover** anuncian el resultado ("Bloque movido a la posición N de M", "…duplicado"). Sobre la base a11y v1 (HU-248: `:focus-visible` global, modal de Temas con dialog/Escape/foco, aria-labels en iconos).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Modales | ✅ Cubierto en HU-248 (modal de Temas: dialog + Escape + foco). El Constructor/galería no usan modales. |
| AC-2 | Reorden | ✅ Reorden por teclado (▲▼) + **anuncio aria-live** de la nueva posición |
| AC-3 | Feedback | ✅ `aria-live` al aplicar/guardar/publicar/duplicar/mover |

## Clúster — Usabilidad del Constructor (usuarios finales) · E3

> Objetivo: que el Constructor sea **intuitivo y fácil de usar por no-técnicos** — nada de URLs/códigos crudos, jerarquía clara entre "bloque" y "contenido", y un catálogo visual para agregar.

### HU-265 — Campos de imagen con subida real · E3

> Como comerciante, quiero subir una imagen directamente desde el editor de un bloque, para no pegar URLs a mano.

**Estimación:** S (2 puntos) · **Track:** front Constructor
**Módulo:** `apps/admin` `FieldInput` (reusa `ImageUpload` + `/api/admin/upload`)
**Estado:** ✅ **Implementada.** El tipo de campo `image` del contrato de bloques ahora renderiza el widget `ImageUpload` (arrastrar/soltar, preview, cambiar/eliminar; bucket `content`) en vez de un `<input type=text>` con URL cruda. Comparten editor sección e ítems (Hero/Tarjetas/Servicios).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Subir | ✅ Arrastrar/seleccionar archivo → sube y muestra preview |
| AC-2 | Reemplazar/quitar | ✅ Botones Cambiar/Eliminar sobre el preview |

### HU-266 — Selectores visuales de color e icono · E3

> Como comerciante, quiero elegir color con una paleta y un icono de una lista, en vez de escribir hex o nombres.

**Estimación:** S (2 puntos) · **Track:** front Constructor
**Módulo:** `apps/admin` `FieldInput`; `packages/ui/src/icon.tsx` (`ICON_NAMES` exportado)
**Estado:** ✅ **Implementada.** Campo `color` → `<input type=color>` nativo + hex editable (sincronizados). Campo `icon` → **picker visual** desplegable con toda la familia de iconos del panel (`ICON_NAMES`), con opción "sin icono" y resaltado del seleccionado.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Color | ✅ Selector nativo + hex; swatch refleja el valor |
| AC-2 | Icono | ✅ Rejilla visual de iconos; clic elige, no hay que teclear nombres |

### HU-267 — Jerarquía Sección → Contenido clara · E3

> Como comerciante, quiero distinguir de un vistazo los ajustes del bloque de sus elementos de contenido, para no confundirme entre formularios iguales.

**Estimación:** S/M (3 puntos) · **Track:** front Constructor
**Módulo:** `apps/admin` `SectionEditor`/`ItemsEditor`/`ConstructorClient`
**Estado:** ✅ **Implementada.** `SectionEditor` separa "Ajustes del bloque" (encabezado con icono) del "Contenido" (ítems tras un divisor punteado). `ItemsEditor` rotula el grupo como "Contenido · {plural}" con contador, y cada ítem es una **tarjeta blanca con cabecera "{singular} #n"** (ya no un formulario anidado plano). Los glifos unicode (▲▼⧉✕⠿) se reemplazan por iconos de la familia del panel en el Constructor y el editor de ítems.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Distinción | ✅ Ajustes del bloque vs. contenido/ítems visualmente separados |
| AC-2 | Vocabulario | ✅ "Bloque", "Ajustes", "Contenido", "{singular} #n" consistentes |
| AC-3 | Tarjetas | ✅ Cada ítem con cabecera e identidad propia, no un form plano |

### HU-268 — Catálogo visual "Agregar bloque" · E3

> Como comerciante, quiero ver qué es cada bloque antes de agregarlo, para elegir con criterio.

**Estimación:** S (2 puntos) · **Track:** front Constructor
**Módulo:** `apps/admin` `AddBlockCatalog` (reemplaza el `<select>`)
**Estado:** ✅ **Implementada.** Botón "Agregar bloque" que abre una **galería desplegable** con icono + nombre + descripción de cada bloque, **agrupada por categoría** (Contenido/Comercio/Interacción). Cierra al clic fuera; un clic en la tarjeta agrega el bloque.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Catálogo | ✅ Galería con icono/descr. por bloque, agrupada por categoría |
| AC-2 | Agregar | ✅ Un clic agrega; reemplaza el `<select>` opaco |

---

### HU-130 — Exportar productos a CSV · E13

> Como operador, quiero exportar el catálogo (o una selección filtrada) a `.CSV`, como contraparte de la carga masiva, para editar en hoja de cálculo y reimportar.

**Estimación:** S (3 puntos)
**Módulo:** `packages/database` (`productsToCsv` en `lib/product-import.ts`), admin (`GET /api/admin/products/export`, botón en `/productos`)
**Estado:** ✅ **Implementada.** `productsToCsv` (puro) serializa el catálogo a CSV **con el mismo header que el importador** (HU-124): una fila por variante, agrupadas por `slug`, con los campos de producto solo en la primera fila; `options` se reconstruye en el orden de `variant_options`, `images` con `|`, celdas escapadas RFC4180. **Endpoint** `GET /api/admin/products/export` acotado por tenant (RLS) lee productos + variantes + nombre de categoría y descarga `productos-YYYY-MM-DD.csv`. Botón "Exportar CSV" en `/productos`. Tests: database +3 (incluye **ida y vuelta** export→import sin pérdida). **Ciclo redondo garantizado** con HU-124.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar desde el listado | ✅ Descarga CSV con columnas idénticas al importador (HU-124) |
| AC-2 | Respeta filtros | ◻️ v1 exporta todo el catálogo del tenant (filtros/selección → v2) |
| AC-3 | Ciclo redondo | ✅ Test de ida y vuelta: el CSV exportado se reimporta sin transformación manual |

---

### HU-131 — Acciones masivas / edición por lote en listas del admin · E13

> Como operador, quiero seleccionar varios registros y aplicar acciones en lote (cambiar precio, categoría, stock, publicar/despublicar), para administrar el catálogo con eficiencia.

**Estimación:** M (5 puntos)
**Módulo:** `apps/admin` (`ProductsTable` cliente con selección), `POST /api/admin/products/batch`
**Estado:** ✅ **Implementada (productos).** Listado `/productos` con **selección múltiple** (checkbox por fila + seleccionar todos) y **barra flotante** de acciones: Publicar/Despublicar (`active`), Destacar/Quitar destacado (`featured`), **Cambiar categoría** (menú con categorías + "sin categoría") y **Eliminar**. Endpoint `POST /api/admin/products/batch` acotado por tenant vía RLS (`.in('id', ids)` solo toca productos del tenant); `delete` elimina variantes primero (FK). Confirmación en el borrado. Tests: admin +7. **Pendiente:** extender el patrón a pedidos/clientes/categorías si se requiere; edición de precio/stock en lote (hoy a nivel producto: estado/destacado/categoría).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección múltiple en el listado | ✅ Checkbox por fila + "seleccionar todos"; barra flotante con las acciones |
| AC-2 | Aplicar cambio en lote | ✅ Una llamada `batch` actualiza/elimina todos los seleccionados; refresca el listado |
| AC-3 | Seguridad y confirmación | ✅ Confirmación en Eliminar; RLS por tenant acota el alcance (no cruza tiendas) |

---

### HU-132 — Importadores CSV para otras entidades · E13

> Como operador, quiero importar por CSV también clientes, cupones, categorías y posts del blog, con el mismo flujo de la carga de productos.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`parseCategoriesCsv`), admin (`/api/admin/categories/import`, `CsvImportModal` genérico)
**Estado:** ✅ **Implementada.** Motor compartido con HU-124: `parseCsv` + `CsvImportModal` genérico (cualquier endpoint que acepte `{csv,mode,preview}`; prop `idLabel`). **Categorías ✅:** `parseCategoriesCsv` (jerarquía por `parent_slug`, sinónimos ES) + `/api/admin/categories/import` (preview, upsert por slug, resolución madre→id en 2ª pasada). **Cupones ✅:** `parseCouponsCsv` (identidad por `code`, tipo percentage/fixed con sinónimos, %≤100) + `/api/admin/coupons/import` (preview, upsert reusando `createCoupon`/`updateCoupon`). **Clientes ✅:** `parseCustomersCsv` (identidad por `email` validado) + `/api/admin/customers/import` (crea contactos con `stack_id=NULL`, sin tocar Stack Auth). **Blog ✅:** `parseBlogPostsCsv` (identidad por `slug`; publicar sin fecha → fecha actual) + `/api/admin/blog/import`. Todas: preview + `mode create|upsert`, RLS por tenant, gating por rol. Tests: database +23, admin +16.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección de entidad + CSV + plantilla | 🔶 Categorías: plantilla `GET` + mapeo de columnas. Otras entidades pendientes |
| AC-2 | Validación previa | ✅ `CsvImportModal` previsualiza válidas/omitidas/errores antes de confirmar |
| AC-3 | Upsert e informe | ✅ `mode create\|upsert` por `slug`; informa creadas/actualizadas/errores |
| AC-4 | Reutilización | ✅ Comparte motor (`parseCsv`) + UI (`CsvImportModal`) con HU-124 |

---

### HU-133 — Restauración desde respaldo + respaldos programados · E14

> Como administrador, quiero restaurar datos a partir de un respaldo y programar respaldos automáticos periódicos, para recuperación ante desastres, no solo generación manual.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (restore), tarea programada, admin
**Estado:** 🔶 **Restauración manual cubierta (vía export↔import).** Cada entidad importable (productos, categorías, cupones, clientes, blog) tiene **export CSV simétrico** con el mismo header que su importador, así un respaldo CSV se **restaura reimportándolo con "Actualizar existentes"** (upsert por clave estable), con previsualización. **Pendiente (roadmap v17):** restauración de respaldos **JSON** (HU-125) con validación de versión, estrategia de colisión transaccional, y **respaldos programados** (diario/semanal + retención) — requiere infra de cron/almacenamiento.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cargar un respaldo (HU-125) | 🔶 CSV: previsualización + reimport (upsert). JSON con validación de versión → v2 |
| AC-2 | Restaurar | 🔶 Vía reimport con upsert por clave estable (previsualizado). Transaccional → v2 |
| AC-3 | Programación | ◻️ Respaldos automáticos periódicos + retención → v2 (infra cron/almacenamiento) |
| AC-4 | Seguridad | ✅ Gating por rol + RLS por tenant; auditoría → con HU-117/134 |

---

### HU-134 — Control de acceso por rol para importar/exportar/respaldar · E14 (toca E13)

> Como responsable, quiero controlar por rol quién puede importar, exportar y respaldar datos, porque estas operaciones mueven información sensible en volumen.

**Estimación:** S (3 puntos)
**Módulo:** `roles.ts`, guards de las rutas de import/export/backup, admin
**Estado:** ✅ **Implementada (AC-1/AC-2).** Nueva capacidad por rol `canManageData` en `ROLE_CONFIG` (super_admin/admin **sí**; vendedor/gestor_tienda **no**) + helper `userCanManageData`. **Guard server-side** (403) en las operaciones de datos en volumen: **respaldo** (`/api/admin/backup`), **import** (products/categories/customers/blog — cupones y los genéricos ya restringían a admin) y **export/borrado masivo** (products export + `/products/batch`); los genéricos `/api/admin/{import,export}` ya exigían admin. **UI** oculta el widget de Respaldos y los botones Importar/Exportar de Productos para roles sin permiso. Tests: admin +4. **AC-3 (auditoría)** ✅ cubierto por **HU-146**: cada export/import/backup/acción-masiva queda registrado (actor/entidad/fecha).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Rol sin permiso | No ve ni puede invocar import/export/backup (server-side) |
| AC-2 | Configuración de permisos | Los permisos de estas operaciones se definen por rol |
| AC-3 | Auditoría | Cada import/export/backup queda registrado (actor, entidad, fecha) |

---

## Detalle · E16 (v2) — Aplicación inteligente: HU-135…143

> **Visión ampliada:** E16 evoluciona de "componentes de IA" sueltos a una **capa de inteligencia** transversal de la plataforma. Se construye en dos niveles: **(A) cimientos** —proveedor de IA intercambiable, captura de eventos de comportamiento y almacén de vectores— y **(B) features** que los consumen (asistente de compra, búsqueda visual, personalización, clustering, patrones de compra y personalización de apariencia por chat). Regla de oro: la IA se **cimienta en datos reales del catálogo/tienda** (RAG/grounding), nunca inventa productos, precios ni stock, y respeta la misma seguridad server-side del checkout (HU-092). Todo **🔲 (roadmap)**.
>
> **Amplía** IA-01/02/03 y HU-118/119 (ya definidas): IA-02 → HU-140 (personalización por comportamiento) · IA-03 → HU-138 (asistente transaccional) · HU-119 (búsqueda semántica) ↔ HU-139 (búsqueda visual, mismo vector store).

### Cimientos (habilitadores)

### HU-135 — Capa de proveedor de IA configurable (swappable) · E16

> Como plataforma, quiero una abstracción de proveedor de IA (igual patrón que pagos/envíos/email), para conectar distintos modelos (LLM, embeddings, visión) sin acoplar las features.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database/src/providers/ai/*` (interfaz + factory), config admin, fail-safe
**Estado:** 🔲 Pendiente (roadmap v18) — **base de todo E16**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interfaz `AIProvider` (chat, embeddings, visión) | Implementaciones intercambiables registradas en un factory |
| AC-2 | Configuración en el admin | Proveedor activo + credenciales + modelo por tarea; una sola llave sensible vía service_role |
| AC-3 | Resiliencia | Si el proveedor falla/está caído, las features degradan con fallback (no rompen la tienda) |
| AC-4 | Coste/latencia | Respuestas cacheables; llamadas asíncronas donde aplique |

---

### HU-136 — Captura de eventos de comportamiento (telemetría de tienda) · E16

> Como plataforma, quiero registrar eventos (vistas de producto, búsquedas, add-to-cart, compras) asociados a sesión/usuario, para alimentar personalización, clustering y análisis de patrones.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`events`/`interactions`), captura en web, consentimiento
**Estado:** 🔲 Pendiente (roadmap v18) — **dato base de HU-140/141/142**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Interacción del usuario (view, search, add-to-cart, purchase) | Se registra el evento con timestamp, producto/categoría y sesión/usuario |
| AC-2 | Consentimiento y privacidad | Respeta consentimiento; datos personales minimizados y con retención configurable |
| AC-3 | Invitados y autenticados | Eventos anónimos se fusionan al perfil al iniciar sesión |
| AC-4 | Valor inmediato | Empieza a capturar desde ya, aunque las features de IA lleguen después (dato acumulativo) |

---

### HU-137 — Infraestructura de embeddings / vector store · E16

> Como plataforma, quiero indexar productos (texto e imagen) como vectores en Postgres (`pgvector`), para habilitar búsqueda semántica y visual y recomendaciones por similitud.

**Estimación:** M (5 puntos)
**Módulo:** `pgvector`, pipeline de indexación al crear/editar productos, servicio de similitud
**Estado:** 🔲 Pendiente (roadmap v18) — **base de HU-119/139/140**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Crear/editar producto | Se generan/actualizan embeddings de texto (y de imagen si aplica) |
| AC-2 | Consulta por similitud | Búsqueda vectorial eficiente (índice) con umbral configurable |
| AC-3 | Reindexado | Job para regenerar embeddings ante cambio de modelo/proveedor |
| AC-4 | Fallback | Sin vectores disponibles, las features degradan a full-text (HU-102) |

---

### Features inteligentes

### HU-138 — Asistente virtual de compra · E16  *(dividida en 138a/138b)*

> **XL dividida** por nivel de riesgo: primero conversar/recomendar (solo-lectura), luego ejecutar acciones (transaccional).

#### HU-138a — Asistente conversacional (RAG, solo lectura) · E16

> Como comprador, quiero un asistente que entienda lo que busco y me recomiende y compare productos del catálogo, para decidir más fácil.

**Estimación:** L (8 puntos)
**Módulo:** chat sobre RAG del catálogo/CMS (HU-135/137)
**Estado:** 🔲 Pendiente (roadmap v18) — evoluciona IA-03

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pregunta en lenguaje natural | Responde con productos reales del catálogo (grounding); nunca inventa productos/precios/stock |
| AC-2 | Comparar/recomendar | Sugiere y compara productos existentes; enlaza a la PDP |
| AC-3 | Continuidad | Usa historial de sesión y, si hay, perfil del usuario (HU-136/140) |
| AC-4 | Fallback | Si la IA no está disponible, ofrece búsqueda/navegación estándar |

#### HU-138b — Acciones transaccionales del asistente · E16

> Como comprador, quiero que el asistente ejecute acciones (agregar al carrito, guiarme al checkout), para avanzar la compra desde el chat.

**Estimación:** L (8 puntos)
**Módulo:** capa de acciones acotadas sobre HU-138a, integración con carrito/checkout
**Estado:** 🔲 Pendiente (roadmap v18) — depende de HU-138a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | "Agregar al carrito" desde el chat | Ejecuta la acción y **confirma** antes de acciones sensibles; respeta stock (HU-098/100) |
| AC-2 | Guiar al pago | Conduce al checkout seguro; cualquier paso de pago pasa por el flujo del servidor (HU-092), el asistente no lo elude |
| AC-3 | Límites | Acciones acotadas y auditables (HU-146); nunca modifica precios ni datos de otros usuarios |

---

### HU-139 — Búsqueda visual de productos (por imagen) · E16

> Como comprador, quiero subir o tomar una foto y encontrar productos iguales o similares del catálogo, para buscar por imagen en vez de palabras.

**Estimación:** L (8 puntos)
**Módulo:** embeddings de imagen (HU-135/137), UI de carga/cámara, resultados por similitud
**Estado:** 🔲 Pendiente (roadmap v18) — comparte vector store con HU-119

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Subir/capturar una imagen | Devuelve productos visualmente similares ordenados por afinidad |
| AC-2 | Sin coincidencias claras | Estado vacío con sugerencias o búsqueda textual alternativa |
| AC-3 | Privacidad | La imagen se procesa de forma efímera; no se almacena sin consentimiento |
| AC-4 | Rendimiento | Reusa el índice vectorial (HU-137); respuesta acotada |

---

### HU-140 — Sugerencias personalizadas por usuario · E16

> Como comprador, quiero recomendaciones adaptadas a mi comportamiento y gustos (no solo "relacionados"), para descubrir productos relevantes para mí.

**Estimación:** L (8 puntos)
**Módulo:** perfil de usuario + eventos (HU-136), similitud (HU-137), motor híbrido
**Estado:** 🔲 Pendiente (roadmap v18) — profundiza IA-02

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario con historial | Home/PDP muestran recomendaciones personalizadas por su comportamiento |
| AC-2 | Cold-start (sin historial) | Fallback a contenido/similitud (HU-137) y populares, sin degradar la UX |
| AC-3 | Explicabilidad | Se indica el porqué ("porque viste…", "afín a tus gustos") |
| AC-4 | Medición | Se puede A/B testear el lift (CTR/conversión/AOV) |

---

### HU-141 — Segmentación por clustering de afinidad/gustos · E16

> Como negocio, quiero agrupar clientes por afinidad y gustos (clustering) para dirigir campañas, recomendaciones y contenido a cada segmento.

**Estimación:** L (8 puntos)
**Módulo:** clustering sobre eventos/embeddings (HU-136/137), segmentos en admin
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Datos suficientes | Se generan segmentos de clientes con características legibles |
| AC-2 | Uso de segmentos | Alimentan personalización (HU-140), newsletter y campañas |
| AC-3 | Admin | El operador ve, nombra y ajusta segmentos; tamaño y rasgos por segmento |
| AC-4 | Privacidad | Segmentación agregada; respeta consentimiento y retención (HU-136) |

---

### HU-142 — Análisis de patrones de comportamiento de compra · E16

> Como administrador, quiero insights sobre patrones de compra (secuencias, productos que se compran juntos, estacionalidad, abandono), para tomar decisiones de catálogo y marketing.

**Estimación:** M (5 puntos)
**Módulo:** analítica sobre eventos/pedidos (HU-136), panel de insights (± resumen con LLM)
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Panel de patrones | Productos comprados juntos, secuencias frecuentes, tendencias temporales |
| AC-2 | Resumen accionable | Opción de resumen en lenguaje natural con recomendaciones (grounded en los datos) |
| AC-3 | Export | Los insights se pueden exportar (compatible con HU-116) |
| AC-4 | Alcance | Solo roles con acceso a analítica |

---

### HU-143 — Personalización de apariencia por chat/LLM · E16

> Como administrador, quiero describir en lenguaje natural cómo quiero que se vea el sitio ("hazlo más minimalista y en tonos verdes") y que la IA lo traduzca en cambios de plantilla, para personalizar la apariencia sin tocar controles uno por uno.

**Estimación:** L (8 puntos)
**Módulo:** LLM (HU-135) → cambios sobre el sistema de plantillas (HU-121/122), como borrador
**Estado:** 🔲 Pendiente (roadmap v18) — depende de HU-121/122/128 y HU-135

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Instrucción en lenguaje natural | La IA propone cambios de colores, tipografía y variantes de disposición dentro del esquema de plantillas |
| AC-2 | Nunca auto-publica | Los cambios se aplican como **borrador** para previsualizar (HU-128) antes de publicar |
| AC-3 | Validación | Los cambios se validan contra el esquema de plantilla (no rompe el layout) |
| AC-4 | Reversible | Se puede descartar y volver a la plantilla activa sin efectos |

---

### HU-144 — Generación de imágenes y variantes visuales de producto con IA · E16

> Como operador de catálogo, quiero generar o mejorar imágenes de producto con IA (fotos de estudio, fondos limpios, variantes por color/ambiente), para publicar catálogo visual de calidad sin sesión fotográfica por cada producto.

**Estimación:** L (8 puntos)
**Módulo:** proveedor de IA de imagen (HU-135), admin (editor de producto), Storage + biblioteca de medios (HU-115)
**Estado:** 🔲 Pendiente (roadmap v18)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Imagen base o descripción del producto | La IA genera opciones (fondo limpio, ambientada, variantes por color) para elegir |
| AC-2 | Revisión humana | Las imágenes generadas quedan como propuestas; el operador aprueba antes de publicarlas |
| AC-3 | Almacenamiento | Las aprobadas se guardan en Storage y en la biblioteca de medios (HU-115) |
| AC-4 | Trazabilidad y derechos | Se marca la imagen como generada por IA; proveedor configurable (HU-135) |
| AC-5 | Fallback | Si el proveedor no está disponible, la carga manual de imágenes sigue funcionando |

---

### HU-145 — Detección de fraude y anomalías en pedidos · E16

> Como operador, quiero que la plataforma señale pedidos con patrones sospechosos (montos atípicos, velocidad anormal, datos inconsistentes), para revisarlos antes de despachar y reducir contracargos.

**Estimación:** L (8 puntos)
**Módulo:** scoring sobre eventos/pedidos (HU-136), señal en el panel de pedidos, reglas + modelo
**Estado:** 🔲 Pendiente (roadmap v18) — se apoya en HU-136

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pedido con patrón atípico | Recibe un score de riesgo y se resalta en el listado de pedidos para revisión |
| AC-2 | Explicabilidad | Se indica el motivo del riesgo (regla/señal disparada), no solo un número |
| AC-3 | Acción del operador | Puede marcar como revisado/legítimo o retener; queda auditado (HU-117) |
| AC-4 | No bloqueante | Nunca cancela pedidos de forma automática; solo señala para decisión humana |
| AC-5 | Privacidad | Usa datos mínimos necesarios; respeta consentimiento y retención (HU-136) |

---

## Detalle · v18 — Nuevas HU (HU-146…155) y Épica E17

> Nuevas historias derivadas de la revisión del roadmap. Incluyen el **registro de auditoría** extraído de HU-117 (enabler de HU-133/134/145/107b) y capacidades de comercio, privacidad y operación. Todas **🔲 (roadmap)**.

### HU-146 — Registro de auditoría (enabler) · E14

> Como responsable, quiero un registro central de acciones sensibles del panel (quién, qué, cuándo, sobre qué), para trazabilidad, seguridad y cumplimiento.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`audit_log`), hooks en acciones sensibles, vista en admin
**Estado:** ✅ **Implementada (v1).** Tabla `audit_log` (migración `e17/39`, RLS solo panel is_admin, **append-only** — sin update/delete; índices por tenant+fecha y por acción). Helper `logAudit` (best-effort, nunca lanza) + `listAudit` (paginado, filtro por acción/entidad). **Instrumentadas:** respaldo, export/import de productos, import de categorías/clientes/blog, acción masiva de productos (cierra **AC-3 de HU-134**), cambio de estado de pedido, validación manual de pago y **crear/resolver devolución (cierra AC-3 de HU-107a)**. **Vista admin** `/auditoria` (tabla fecha/acción/entidad/detalle/usuario + paginación), en el menú **Sistema**, gated por el permiso de datos (admin/super_admin). Tests: database +3. **Pendiente v2:** filtros por actor/fecha en la UI; retención configurable; ampliar a cambios de config/rol/precio.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Acción sensible (config, rol, precio, pago, import/export, backup) | Registra actor, acción, entidad, valores y timestamp |
| AC-2 | Consulta | Filtrable por actor/fecha/tipo/entidad; solo `super_admin` |
| AC-3 | Integridad | Registro append-only (no editable); retención configurable |

---

### HU-147 — Motor de descuentos y promociones · E5 (toca E4/E6)

> Como negocio, quiero reglas de promoción más allá de cupones (2x1/BOGO, escalonado por volumen, por categoría o por carrito), para ejecutar campañas comerciales.

**Estimación:** L (8 puntos)
**Módulo:** motor de reglas de promoción, aplicación en carrito/checkout, admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Definir promoción | Tipos: BOGO, descuento escalonado, por categoría, por monto de carrito, con vigencia |
| AC-2 | Aplicación | Se aplica automáticamente en el carrito; combinable/excluyente según configuración |
| AC-3 | Coexistencia con cupones | Reglas claras de acumulación con los cupones existentes |
| AC-4 | Seguridad | El cálculo del total es autoridad del servidor (consistente con el checkout) |

---

### HU-148 — Gift cards / saldo a favor (store credit) · E6

> Como negocio, quiero emitir gift cards y saldo a favor que el cliente use como medio de pago, para fidelizar y para resolver reembolsos como crédito.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`gift_cards`/`store_credit`), checkout (medio de pago), admin
**Estado:** 🔲 Pendiente (roadmap v17) — soporta reembolso como crédito (HU-107b)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Emitir/canjear gift card | Código con saldo aplicable en el checkout (validación server-side) |
| AC-2 | Saldo a favor por cuenta | El cliente ve y usa su store credit en la compra |
| AC-3 | Reembolso como crédito | Una devolución (HU-107) puede acreditarse como saldo |
| AC-4 | Integridad | Movimientos de saldo auditados (HU-146); sin doble gasto |

---

### HU-149 — Motor de impuestos multi-región · E6 (toca E7)

> Como negocio que vende en varias regiones, quiero calcular impuestos según reglas por región/producto, para cumplir y mostrar precios correctos.

**Estimación:** L (8 puntos)
**Módulo:** reglas de impuesto por región/categoría, cálculo en checkout, admin
**Estado:** 🔲 Pendiente (roadmap v17) — se conecta con HU-108 (internacional) y HU-114 (i18n)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Reglas configurables | Tasa por región y categoría (incluido/excluido en precio) |
| AC-2 | Checkout | El impuesto se calcula por la dirección/región y se muestra desglosado |
| AC-3 | Reportes | Los impuestos recaudados aparecen en reportes (HU-116) |

---

### HU-150 — Consulta de pedido como invitado · E12

> Como comprador sin cuenta, quiero consultar el estado de mi pedido con su número y correo, para hacer seguimiento sin registrarme.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web` (búsqueda de pedido), verificación por número + email
**Estado:** ✅ **Implementada.** Página pública `/pedido` (formulario número + correo) → `POST /api/orders/lookup`. `getOrderForGuest` verifica **server-side** que número + email + tenant coinciden (lectura con machine-db) y devuelve un **subconjunto seguro** (estado, pago, fecha, tracking/carrier, ítems [nombre/variante/cantidad] y total) — **sin** dirección, teléfono, correo ni precios por ítem. Si no coincide, mensaje **neutro** (no revela si el número existe). Tests: database +3.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Número de pedido + email | Muestra estado y tracking si coinciden (verificación server-side) |
| AC-2 | Datos que no coinciden | No revela información; mensaje neutro |
| AC-3 | Privacidad | Solo expone lo necesario del pedido; sin datos sensibles |

---

### HU-151 — Portabilidad y borrado de datos del cliente · E12 (toca E14)

> Como cliente, quiero exportar o eliminar mis datos personales, para ejercer mis derechos de privacidad (derecho al olvido).

**Estimación:** M (5 puntos)
**Módulo:** `/account` (solicitud), proceso server-side, anonimización de histórico
**Estado:** 🔲 Pendiente (roadmap v17) — requerido si se captura comportamiento (HU-136)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Solicitud de exportación | El cliente descarga sus datos (perfil, pedidos, direcciones) |
| AC-2 | Solicitud de borrado | Se elimina/anonimiza su información conservando lo legalmente requerido (p. ej. facturación) |
| AC-3 | Auditoría | La operación queda registrada (HU-146) |

---

### HU-152 — Consentimiento y gestión de cookies · E14 (toca E2/E16)

> Como visitante, quiero controlar qué cookies/telemetría acepto, para navegar respetando mi privacidad; y como plataforma, para habilitar legalmente la analítica.

**Estimación:** M (5 puntos)
**Módulo:** banner/preferencias de consentimiento, gating de telemetría (HU-136)
**Estado:** 🔲 Pendiente (roadmap v17) — **desbloquea legalmente HU-136**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Primera visita | Banner con aceptar/rechazar/preferencias por categoría |
| AC-2 | Sin consentimiento | La telemetría de comportamiento (HU-136) no se activa |
| AC-3 | Persistencia | La preferencia se recuerda y es revocable en cualquier momento |

---

### HU-153 — Notificaciones multicanal (WhatsApp / SMS) · E8

> Como negocio, quiero enviar notificaciones transaccionales también por WhatsApp/SMS además de email, para llegar mejor al cliente.

**Estimación:** L (8 puntos)
**Módulo:** proveedor de mensajería intercambiable (patrón swappable), plantillas, config admin
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Evento transaccional (pago, envío) | Se puede notificar por el/los canales configurados |
| AC-2 | Proveedor configurable | Canal y credenciales gestionables desde el admin (mismo patrón que email/pagos) |
| AC-3 | Preferencias y consentimiento | Respeta opt-in del cliente y el canal elegido |

---

### HU-154 — Accesibilidad (a11y / WCAG) · E3 (transversal)

> Como usuario con discapacidad, quiero que el sitio cumpla criterios de accesibilidad, para navegar y comprar sin barreras.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` + `packages/ui` (semántica, foco, contraste, teclado, ARIA)
**Estado:** 🔲 Pendiente (roadmap v17) — transversal a todo el sitio público

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Navegación por teclado | Todos los flujos clave (catálogo, carrito, checkout) operables por teclado con foco visible |
| AC-2 | Lectores de pantalla | Semántica y ARIA correctos; imágenes con `alt` |
| AC-3 | Contraste y objetivos | Cumple contraste AA y tamaños mínimos táctiles |
| AC-4 | Verificación | Auditoría automatizada (axe) en CI como criterio |

---

### HU-155 — Monitoreo de rendimiento / Core Web Vitals · E15

> Como responsable, quiero monitorear Core Web Vitals y presupuesto de rendimiento, para mantener rápida la tienda (impacto directo en conversión y SEO).

**Estimación:** M (5 puntos)
**Módulo:** captura de Web Vitals, reporte, presupuesto en CI
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Métricas reales de usuario | Se capturan LCP/INP/CLS y se reportan por página |
| AC-2 | Presupuesto | Umbrales de rendimiento verificables (alerta si se degradan) |
| AC-3 | Acción | Panel/reporte que prioriza las páginas más lentas |

---

## 🛒 Ola PDP — mejoras de la vista de producto (HU-283…287) · E4/E3

> **Principio transversal (multi-tenant / "vestir en otras tiendas").** Toda HU de esta ola es **reutilizable y configurable por tienda**, nunca cableada a un nicho ni a un cliente. En concreto: **(a) lógica** gobernada por flags en `store_config` (por tenant, con default seguro y gating por plan vía entitlements); **(b) visual** con **tokens de tema** (HU-247, sin colores/tipografías fijos) y, cuando aplica, **variante por superficie** sobre el framework de HU-122a (`Template.variants` + `getTemplateVariant`), para que cada plantilla/preset "vista" la PDP distinto; **(c) portabilidad**: cualquier ajuste nuevo viaja en los paquetes de **Plantilla/Preset/Sitio** (HU-129/256/123) para re-aplicarse en otra tienda. Los bloques se montan sobre el motor CMS existente (`page_sections`/`section_items`, schema-driven) siempre que sea posible, no como componentes a medida. **Prioridad de la ola:** P1 = HU-283, HU-284, HU-105 (ya existía, se sube a esta ola); P2 = HU-285, HU-286, HU-287.

---

### HU-283 — Galería de producto avanzada: zoom/lightbox + miniatura de variante · E4 (toca E3)  · **P1**

> Como comprador, quiero ampliar las fotos del producto y volver fácilmente a la imagen de la variante que elegí, para ver el detalle antes de comprar.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (`ProductDetail` galería), framework de variantes de superficie (HU-122a), tokens de tema (HU-247)
**Estado:** ✅ **Implementada.** Superficie `product_gallery` (`lightbox` default / `inline-zoom` / `off`) en `SURFACE_VARIANTS`, resuelta por la plantilla activa (`getTemplateVariant`) y pasada a `ProductDetail`. **Lightbox** accesible (role dialog, Escape, click-fuera, foco al cerrar, bloqueo de scroll, `motion-reduce`); **inline-zoom** por `group-hover:scale-150`. **Galería unificada:** `thumbs` = imágenes del producto + imágenes de variante distintas → la variante aparece como **miniatura real** y elegirla salta a su thumbnail (fin del doble estado `imgSource`). Estilos solo con tokens de tema. Tests: database +1 (registro superficie). tsc/web OK.
**Reutilización / builder:** la imagen de variante se expone como **miniatura seleccionable** en la tira (cierra el fix de `imgSource` ya aplicado). El **zoom** se ofrece como **variante de superficie** `product_gallery` (`inline-zoom` hover / `lightbox` modal / `off`) resuelta por la plantilla activa, estilable solo con tokens de tema; el gesto en móvil es pinch/tap. Nada específico de café: sirve para ropa, joyería, etc. Viaja en el paquete de plantilla.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Clic/tap en la imagen principal | Se amplía según la variante de plantilla (`lightbox` o `inline-zoom`); cerrable por teclado/gesto, con foco atrapado y `alt` correcto |
| AC-2 | Variante con imagen propia | Aparece como miniatura; al elegir variante se muestra su imagen y la miniatura queda activa; se puede volver a la galería |
| AC-3 | Plantilla sin zoom | Con `off` la galería funciona sin ampliar (cero regresión); el ajuste viaja en el paquete de plantilla/preset |
| AC-4 | A11y | Operable por teclado, respeta `prefers-reduced-motion`, objetivos táctiles AA |

---

### HU-284 — Barra de compra pegajosa en móvil (sticky add-to-cart) · E3 (toca E4)  · **P1**

> Como comprador en móvil, quiero tener siempre a la vista el precio y "Agregar al carrito" mientras desplazo la ficha, para comprar sin volver arriba.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web` (`ProductDetail`), variante de superficie (HU-122a), tokens de tema, `store_config`
**Estado:** ✅ **Implementada.** Superficie `product_cta` (`sticky-mobile` default / `inline`) en `SURFACE_VARIANTS`, resuelta por la plantilla. Barra inferior fija **solo en móvil** (`lg:hidden`) que aparece cuando el CTA principal sale de vista (`IntersectionObserver` sobre su contenedor); muestra nombre + precio **reactivo a la variante** + botón que **reusa `handleAddToCart`** y el mismo estado deshabilitado (selección incompleta / agotado, lógica de HU-099/100). Estilos por tokens. *Nota:* control fino por `store_config` (apagar por tienda independiente de plantilla) queda para v2; hoy lo gobierna la variante de plantilla. Tests: database +1. tsc/web OK.
**Reutilización / builder:** barra inferior fija en móvil con nombre corto + precio (reactivo a la variante) + CTA, **activable por tienda** (`store_config.pdp_sticky_cta`, default on) y presentada como **variante de superficie** `product_cta` (`sticky-mobile` / `inline`). Estilos 100% por tokens; respeta estado agotado/selección incompleta (reusa la lógica de HU-099/100). Portátil a cualquier nicho; viaja en plantilla/preset.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Scroll en móvil | La barra aparece al salir de vista el CTA principal; muestra precio de la variante seleccionada |
| AC-2 | Selección incompleta / agotado | El CTA refleja el mismo estado que el botón principal (deshabilitado + motivo) |
| AC-3 | Config por tienda | Se puede desactivar por `store_config`; en escritorio no se muestra; el ajuste viaja en el paquete de plantilla |
| AC-4 | A11y | No tapa contenido crítico, foco y contraste AA, no duplica el anuncio para lectores de pantalla |

---

### HU-285 — Estimador de envío y tiempo de entrega en la PDP · E4 (toca E7 envíos)  · **P2**

> Como comprador, quiero estimar el costo y el tiempo de envío a mi ciudad desde la ficha, para decidir antes de llegar al checkout.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (`ProductDetail`), `lib/shipping` (reusa tarifas + handling fee), `store_config`, tokens de tema
**Estado:** ✅ **Implementada.** Componente `ShippingEstimator` que reusa `POST /api/shipping/rates` (mismo motor que el checkout: tarifa fija / transportadora activa + cargo adicional, agnóstico de proveedor). Input ciudad/depto/CP; muestra las 3 tarifas más baratas (carrier · servicio · días · precio) o "Sin cobertura"/error legible. **Activable por tienda** (`store_config.pdp_shipping_estimator`, **default off**) + toggle en admin → Configuración. Estilos por tokens. Tests: web/db OK.
**Reutilización / builder:** widget opcional (`store_config.pdp_shipping_estimator`, gating por plan) que **reutiliza el motor de tarifas ya existente** (tarifa fija / transportadora activa + cargo adicional, HU-280/handling) sin lógica nueva de proveedor — agnóstico a Skydropx u otra. Input de ciudad/código postal, resultado estilado por tokens. Default off para no exponer costos donde el comerciante no lo desee. Viaja en el paquete de plantilla/preset.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Ingresar destino | Devuelve costo estimado y rango de entrega usando el método de envío activo de la tienda |
| AC-2 | Tarifa fija / sin cobertura | Muestra el valor fijo o un estado "sin cobertura" claro, sin romper la ficha |
| AC-3 | Config por tienda/plan | Activable por `store_config` y gated por plan; oculto si está apagado |
| AC-4 | Consistencia | El estimado coincide con lo que calcula el checkout para el mismo destino |

---

### HU-286 — Bloques de recomendación: "vistos recientemente" + cross-sell · E4  · **P2**

> Como comprador, quiero ver productos relacionados y los que vi hace poco, para descubrir más y comprar en conjunto.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (bloque reutilizable sobre el registry CMS), `store/recentlyViewed` (localStorage por origen), tokens de tema
**Estado:** ✅ **Implementada (v1 + v2).** **v1 vistos recientemente:** `useRecentlyViewedStore` (zustand + persist por origen, sin PII, máx. 12, dedup) + `RecentlyViewed` en la PDP (activable por `store_config.pdp_recommendations`, default on). **v2 cross-sell como bloque CMS:** nuevo `section_type` **`product_carousel`** en el registry (`blockSchemas`, migración `e17/34` amplía el CHECK), **insertable por el Constructor en cualquier página** (aparece solo en el catálogo "Agregar bloque" al estar registrado). **Fuente configurable** por tienda: destacados / más vendidos / nuevos / **una categoría** (slug) / **manual** (slugs en orden) + límite. Resolución server-side `getCarouselProducts` (RLS por tenant, tarjetas ligeras) + componente async `ProductCarousel` registrado en los dos renderers (home-blocks y SectionRenderer/CMS). Estilos por tokens de tema → se "viste" por plantilla; viaja en los paquetes de página/preset. Base para bundles/kits. Tests: database +8 (helpers + `getCarouselProducts`). **Ops:** aplicar `e17/34`.
**Reutilización / builder:** "Vistos recientemente" por `localStorage` (por origen = por tenant, sin PII). "También te puede gustar" se generaliza a un **bloque del registro CMS** (`section_type: 'product_carousel'`) con fuente configurable (misma categoría / manuales / mejor valorados), insertable por el Constructor en PDP u otras páginas y estilado por tokens/variante de densidad (HU-122). Base para bundles/kits (roadmap E4). Viaja como sección en el paquete de página/preset.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Visitar productos | Se registran los últimos vistos (por origen) y se muestran en un carrusel, excluyendo el actual |
| AC-2 | Relacionados configurables | El comerciante elige la fuente (categoría / manual / top-rated) desde el Constructor; sin datos → se oculta |
| AC-3 | Reutilizable | El mismo bloque se puede colocar en home/landing; estilo por tokens y variante de densidad |
| AC-4 | Privacidad/SSR | Sin PII; guard de hidratación para no desajustar el SSR |

---

### HU-287 — Compartir producto (Web Share + enlaces) · E4  · **P2**

> Como comprador, quiero compartir un producto por WhatsApp o copiando el enlace, para enviárselo a alguien o guardarlo.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web` (`ProductDetail`), `store_config`, tokens de tema
**Estado:** ✅ **Implementada.** Componente `ShareButton`: **Web Share API** nativa cuando existe; fallback a menú con **WhatsApp** (`wa.me` con título + enlace) y **copiar enlace** (clipboard, con feedback). Usa la URL actual (canónica), sin datos del comprador. **Activable por tienda** (`store_config.pdp_share_enabled`, default on) + toggle en admin. Estilos por tokens. Tests: web OK.
**Reutilización / builder:** botón "Compartir" con **Web Share API** nativa (móvil) y fallback a copiar enlace + WhatsApp en escritorio. Canales activables por `store_config.pdp_share_channels` (lista), icono/estilo por tokens de tema. Reutiliza los metadatos OG/JSON-LD que la PDP ya genera. Agnóstico de nicho; viaja en el paquete de plantilla.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Móvil con Web Share | Abre la hoja nativa con título + URL canónica del producto |
| AC-2 | Escritorio | Copiar enlace (feedback) + abrir WhatsApp con el enlace prellenado |
| AC-3 | Config por tienda | Los canales se activan/ordenan por `store_config`; sin canales → botón oculto |
| AC-4 | Metadatos | El enlace compartido muestra OG correcto (reusa metadatos de la PDP) |

---

## 🏆 E19 · Marketing, fidelización y ventas exclusivas — Club VIP / Early Access (HU-288…296)

> **Concepto.** "Compra VIP por horas": las mejores ofertas o los lanzamientos se abren **solo durante una ventana de tiempo reducida** (p. ej. 24 h antes) para **clientes de alto valor** o del **Club VIP**. Claves: **acceso anticipado** (early access), **segmentación** de clientes (volumen/frecuencia/ticket o manual), **canales directos** (correo/WhatsApp) y **urgencia/escasez** (countdown, cupo) para acelerar la decisión y subir el LTV.
>
> **Cómo se agrega como OPCIÓN (patrón del repo).** (a) **Entitlement por plan** (`@merkiai/tenancy`, feature `vip_early_access`): la sección solo aparece/activa en los planes que lo incluyan (gating transversal como HU-239/173). (b) **Config por tienda** (tabla propia + flags): nace **apagada**; el comerciante crea y enciende sus campañas. (c) **Builder-aware**: los componentes del storefront (banner de countdown, badge "VIP", estado "disponible pronto") usan **tokens de tema** y una **variante de superficie** (framework HU-122a), así se "visten" por plantilla y viajan en los paquetes de plantilla/preset. (d) **Sección admin dedicada** ("Ventas VIP") gated por rol + plan.
>
> **Dependencias / reutilización.** Comprador autenticado (Stack Auth, ya en storefront) + membresía por segmento; **E8** para avisos (correo HU-159/160, **WhatsApp/multicanal HU-153**); **E5** motor de descuentos (HU-147) para el precio de campaña; **E13** reportes (HU-116); **E16** (opcional) para segmentación automática. **MVP** sin WhatsApp (empieza por correo); HU-153 habilita el canal directo.
>
> **Modelo de datos (conceptual).** `customer_segments` (reglas + manual) + `customer_segment_members`; `vip_campaigns` (ventana inicio/fin, audiencia=segmento, estado) + `vip_campaign_scope` (productos/categorías) + oferta/cupo opcionales. RLS por tenant en todas.
>
> **Olas.** MVP = HU-288→289→290→291 (segmento + campaña + gating + countdown, ya demostrable). Luego HU-292→294 (activación + medición). HU-295/296 = roadmap avanzado.

---

### HU-288 — Segmentos de clientes (Club VIP) · E19 (toca E12)

> Como comerciante, quiero agrupar a mis clientes en segmentos (manuales y por reglas de compra) para dirigirles ventas y comunicaciones exclusivas.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`customer_segments`, `customer_segment_members`), admin (CRUD de segmentos), reusa `customers`+histórico de pedidos
**Estado:** ✅ Hecho (v139) — tablas `customer_segments`/`customer_segment_members` (`e17/42`, RLS is_admin), segmentos manuales y por reglas (min_orders/min_total/within_days) con recálculo idempotente; admin en `/ventas-vip`.
**Opción/builder:** sección gated por plan (`vip_early_access`) + rol. RLS por tenant.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Segmento manual | El admin crea un segmento y agrega/quita clientes a mano |
| AC-2 | Segmento por reglas | Reglas simples sobre histórico: nº de pedidos ≥ N, ticket ≥ X, última compra ≤ D días; vista de miembros resultante |
| AC-3 | Recálculo | Los segmentos por reglas se recalculan (bajo demanda o programado) sin duplicar miembros |
| AC-4 | Aislamiento | Segmentos y miembros acotados por tenant (RLS); nunca cruzan tiendas |

---

### HU-289 — Campaña de acceso anticipado (VIP) · E19

> Como comerciante, quiero programar una campaña con una ventana horaria y un alcance de productos/categorías, dirigida a un segmento, para abrir ofertas o lanzamientos solo a mis clientes VIP durante unas horas.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (`vip_campaigns`, `vip_campaign_scope`), admin (CRUD + estados)
**Estado:** ✅ Hecho (v139) — `vip_campaigns`+`vip_campaign_scope` (`e17/42`), ventana inicio/fin + audiencia (segmento) + alcance productos/categorías + oferta/cupo; estado derivado de la ventana con pausa/cancelación manual; admin CRUD.
**Opción/builder:** gated por plan/rol. Estados: `scheduled` → `active` → `ended` (derivados de la ventana, con control manual de pausa/cancelar).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Crear campaña | Ventana inicio/fin, audiencia (segmento), alcance (productos y/o categorías), oferta y cupo opcionales |
| AC-2 | Estado por ventana | La campaña pasa a activa/finalizada según la hora; el admin puede pausar/cancelar |
| AC-3 | Validación | No se solapan ventanas conflictivas sobre el mismo producto de forma ambigua; fechas coherentes |
| AC-4 | Aislamiento | Campañas acotadas por tenant (RLS) |

---

### HU-290 — Gating de acceso anticipado en el storefront · E19 (toca E4)

> Como cliente VIP, quiero poder comprar los productos de la campaña antes que el público general; como público general, quiero ver que estará "disponible pronto".

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (resolución de acceso en catálogo/PDP/checkout), `packages/database` (membresía + ventana)
**Estado:** ✅ Hecho (v139) — resolución **server-side** (`resolveProductGate` + `listLiveVipGates` + membresía por sesión): PDP muestra 'disponible pronto' a no-miembros y permite comprar a miembros; checkout **revalida** (403 si bloqueado) → no saltable por API.
**Opción/builder:** requiere comprador autenticado; la verificación es **server-side** (no basta ocultar en UI). Fuera de la ventana VIP, se abre a todos o termina, según la campaña.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Miembro del segmento dentro de la ventana | Ve y puede comprar los ítems de la campaña (precio de campaña si aplica) |
| AC-2 | No miembro / sin sesión dentro de la ventana | Ve "disponible pronto" + countdown; no puede agregar al carrito ni forzar checkout (control server-side) |
| AC-3 | Cierre de ventana | Al terminar, el producto se abre al público (o la oferta desaparece) sin intervención manual |
| AC-4 | Seguridad | El checkout revalida acceso y ventana en el servidor (no se puede saltar el gating por URL/API) |

---

### HU-291 — Urgencia y escasez: countdown + badges VIP (UI) · E19 (toca E3)

> Como comerciante, quiero mostrar un contador y distintivos "VIP" para generar urgencia durante la ventana.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (banner/countdown + badges), tokens de tema, variante de superficie (HU-122a)
**Estado:** ✅ Hecho (v139) — `VipCountdown` (tokens de tema, `aria-live`/`role=timer`) con panel 'disponible pronto' para no-miembros y cinta 'Acceso VIP activo' para miembros.
**Opción/builder:** 100% tokens de tema + variante por plantilla; cupo/stock limitado opcional. Viaja en el paquete de plantilla/preset.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Campaña activa | Countdown al cierre de la ventana + badge "VIP" en la PDP/tarjetas de la campaña |
| AC-2 | Cupo limitado | Si hay cupo/stock de campaña, se muestra el restante y se bloquea al agotarse |
| AC-3 | Estilo por tienda | El diseño usa tokens de tema (sin colores fijos); variante de superficie por plantilla |
| AC-4 | A11y | Countdown accesible (texto + `aria-live` en hitos), respeta `prefers-reduced-motion` |

---

### HU-292 — Avisos directos de campaña (correo / WhatsApp) · E19 (toca E8)

> Como comerciante, quiero avisar a los miembros del segmento del inicio de la venta VIP por correo y/o WhatsApp con un enlace de acceso.

**Estimación:** M (5 puntos)
**Módulo:** reusa envío de correo (HU-159/160) y **multicanal WhatsApp (HU-153)**; disparo al activar la campaña
**Estado:** ✅ Hecho (v141, solo correo) — `notifyCampaignMembers` + `sendVipCampaignInvite`; acción 'Avisar' por campaña en `/ventas-vip` envía el correo a los miembros del segmento con enlace de acceso. **Idempotente** (`vip_campaign_notifications` `e17/43`, único por campaña+cliente+canal): no reenvía a quien ya fue avisado. WhatsApp queda para cuando exista HU-153.
**Opción/builder:** plantilla del aviso estilable; se envía solo a miembros con consentimiento del canal.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Activación de campaña | Se notifica a los miembros del segmento por los canales activos con enlace de acceso |
| AC-2 | Idempotencia | Cada miembro recibe el aviso una sola vez por campaña/evento |
| AC-3 | Canales | Correo disponible en MVP; WhatsApp cuando exista HU-153; respeta preferencias/consentimiento |

---

### HU-293 — Precio / oferta de campaña · E19 (toca E5)

> Como comerciante, quiero aplicar un precio u oferta especial solo durante la ventana VIP.

**Estimación:** M (5 puntos)
**Módulo:** se integra con el **motor de descuentos (HU-147)**; aplica solo dentro de la ventana y al público elegible
**Estado:** 🔲 Pendiente (roadmap · E19 Fase 2) — depende de HU-147
**Opción/builder:** el precio de campaña convive con `compare_at_price` (HU-261) para mostrar "antes/ahora".

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Dentro de la ventana + elegible | Se aplica el precio/oferta de campaña en PDP, carrito y checkout |
| AC-2 | Fuera de ventana / no elegible | Precio normal; sin fugas del precio VIP |
| AC-3 | Consistencia | El total del checkout coincide con el precio mostrado; auditable |

---

### HU-294 — Reporte de campaña VIP · E19 (toca E13)

> Como comerciante, quiero medir el resultado de cada campaña (participación, conversión, ingresos) para decidir repetirla.

**Estimación:** S (3 puntos)
**Módulo:** reusa `getSalesReport`/infra de reportes (HU-116), acotado a la campaña/segmento
**Estado:** ✅ Hecho (v140) — `getVipCampaignReport` + `computeVipReport` (puro, testeado): miembros, participantes, participación %, pedidos e ingresos de los miembros del segmento (pago aprobado) dentro de la ventana. `GET /api/admin/vip-campaigns/[id]/report` + panel 'Reporte' por campaña en `/ventas-vip`.

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Resumen de campaña | Ingresos, pedidos, ticket y % de participación del segmento en la ventana |
| AC-2 | Exportar | CSV del período/campaña |
| AC-3 | Permisos | Visible según acceso a reportes/Pedidos |

---

### HU-295 — Segmentación automática por IA · E19 (toca E16)

> Como comerciante, quiero que el sistema sugiera o arme segmentos VIP a partir de patrones de compra, para no definir reglas a mano.

**Estimación:** L (8 puntos)
**Módulo:** capa de IA (HU-135/137 patrones de compra) → propone segmentos
**Estado:** 🔲 Pendiente (roadmap · E19 avanzado) — depende de los cimientos de IA (E16)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Sugerencia | El sistema propone segmentos (p. ej. "clientes recurrentes de alto ticket") con su tamaño estimado |
| AC-2 | Control humano | El comerciante revisa y confirma antes de usarlos; nunca se envían comunicaciones automáticas sin aprobación |

---

### HU-296 — Campañas recurrentes + plantillas · E19

> Como comerciante, quiero programar campañas recurrentes (Black Friday, Buen Fin, lanzamientos) y reutilizar plantillas de campaña.

**Estimación:** M (5 puntos)
**Módulo:** programación (cron/scheduler) + plantillas de campaña reutilizables
**Estado:** 🔲 Pendiente (roadmap · E19 avanzado) — requiere infra de scheduling

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Recurrencia | Se programa una campaña que se repite en fechas/eventos definidos |
| AC-2 | Plantilla | Guardar una campaña como plantilla y crear nuevas a partir de ella |

---

