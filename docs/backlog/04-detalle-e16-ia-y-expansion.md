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
**Módulo:** `packages/database` (tabla `product_reviews`), PDP, grid, admin (moderación)
**Estado:** 🔲 Pendiente (roadmap v17)

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
**Módulo:** `apps/web` (Navbar search + `/api/search`), índice full-text en Postgres
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Escribir en el buscador del navbar | Autocompletado con nombre + thumbnail (debounce); busca en nombre, descripción y categoría |
| AC-2 | Enviar la búsqueda | Página de resultados reutilizando el grid de `/shop` con el término aplicado |
| AC-3 | Sin resultados | Estado vacío con sugerencias o CTA a catálogo |
| AC-4 | Rendimiento | Índice `tsvector`/`pg_trgm`; respuesta < 300 ms en catálogos medianos |

---

### HU-103 — Lista de deseos / favoritos · E4

> Como comprador, quiero guardar productos como favoritos para comprarlos después.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`wishlists`), PDP/grid (corazón), `/account`
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Usuario autenticado marca un favorito | Persiste por cuenta; visible en `/account` |
| AC-2 | Invitado marca un favorito | Persiste en localStorage y se fusiona al iniciar sesión |
| AC-3 | Producto sin stock en la wishlist | Se indica el estado; enlaza a "avísame cuando vuelva" (HU-105) |

---

### HU-104 — Filtro por rango de precio · E4

> Como comprador, quiero filtrar el catálogo por rango de precio para ajustar la búsqueda a mi presupuesto.

**Estimación:** S (3 puntos)
**Módulo:** `apps/web/src/components/shop/ShopClient.tsx`, query de productos
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Control de rango (slider o min/max) | Filtra el grid; combinable con los filtros de variante existentes |
| AC-2 | Estado en la URL | El rango se refleja en query params (compartible, SSR-friendly) |
| AC-3 | Rango sin coincidencias | Estado vacío consistente con los demás filtros |

---

### HU-105 — Avísame cuando vuelva (back-in-stock) · E9

> Como comprador interesado en un producto agotado, quiero dejar mi correo para que me avisen cuando vuelva a haber stock.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`stock_notifications`), PDP, hook de reposición de stock, email
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Producto/variante agotado sin backorder | Se muestra formulario "Avísame cuando vuelva" en la PDP |
| AC-2 | Reposición de stock (RPC/edición admin) | Se envía email a los suscriptores de esa variante y se marca como notificado |
| AC-3 | Idempotencia | Cada suscriptor recibe un solo aviso por evento de reposición |

---

### HU-106 — Alertas de stock bajo para el admin · E9

> Como operador, quiero que el panel me avise cuando un producto cae por debajo de un umbral, para reponer a tiempo.

**Estimación:** S (3 puntos)
**Módulo:** admin (dashboard/badge), `products.low_stock_threshold`
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Umbral configurable por producto (o global) | Se guarda en BD |
| AC-2 | Stock ≤ umbral | Badge/indicador en el dashboard y en el listado de productos |
| AC-3 | Filtro "stock bajo" | El admin puede listar solo los productos por debajo del umbral |

---

### HU-107 — Devoluciones y reembolsos (RMA) · E6  *(dividida en 107a/107b)*

> **L dividida:** el flujo de devolución y el reembolso vía pasarela tienen complejidad y dependencias distintas.

#### HU-107a — Workflow de devolución (RMA) · E6

> Como operador, quiero gestionar solicitudes de devolución (solicitud → aprobación → estado) desde el panel, para ordenar el postventa.

**Estimación:** M (5 puntos)
**Módulo:** `packages/database` (`returns`), admin (pedido → devolución), inventario
**Estado:** 🔲 Pendiente (roadmap v17)

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
**Estado:** 🔲 Pendiente (roadmap v17)

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
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin crea una regla `origen → destino` | Se persiste y valida (evita loops/duplicados) |
| AC-2 | Visita a una URL con regla | El middleware responde 301 al destino |
| AC-3 | Cambio de slug de producto/página | Se sugiere crear el redirect automáticamente |

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
**Estado:** 🔲 Pendiente (roadmap v17)

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
**Estado:** 🔲 Pendiente (roadmap v17)

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
**Estado:** 🔲 Pendiente (roadmap v17) — *base del sistema; el render por componente va en HU-122*
> **Nota de independencia:** este es el theming del **storefront** (tokens `--brand-*`/`--theme-*`, por-tenant, editable por el comerciante) — **independiente** del design system de paneles (HU-210, `--mk-*`). En E17 pasa a fila-por-tenant vía **HU-207**. No debe acoplarse al preset de panel (HU-213).

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Estado inicial | El theme actual (colores + tipografía) queda registrado como **plantilla por defecto**, sin cambios visibles |
| AC-2 | Crear plantilla | El admin crea una plantilla nueva a partir de la actual (colores, tipografía y variantes de disposición) |
| AC-3 | Activar plantilla | Solo una activa a la vez (mismo patrón que el theme actual); la selección se persiste |
| AC-4 | Resolución | La web pública lee la plantilla activa en el servidor e inyecta sus tokens/variantes |

---

### HU-122 — Variantes de disposición por plantilla · E3  *(dividida en 122a/122b/122c)*

> **XL dividida** por superficie, para entregar valor incremental (no todo-o-nada). Todas dependen de HU-121.

#### HU-122a — Framework de variantes + navbar y home · E3 (toca E2)

> Como administrador, quiero el mecanismo de variantes de disposición y aplicarlo a navbar y home, para empezar a personalizar la estructura visual.

**Estimación:** L (8 puntos)
**Módulo:** `apps/web` (registro de variantes por superficie), `packages/ui`, render por plantilla activa
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-121

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
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-122a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Grid de tienda | ≥2 variantes (p. ej. columnas/densidad/tarjeta) seleccionables por plantilla |
| AC-2 | PDP | ≥2 variantes de layout de producto |
| AC-3 | Consistencia | Reusa el framework y el fallback de HU-122a |

#### HU-122c — Variante de carrito · E3

> Como administrador, quiero variantes de disposición del carrito (drawer/página), para cerrar la personalización de las superficies clave.

**Estimación:** M (5 puntos)
**Módulo:** `apps/web` (carrito/drawer), sobre el framework de HU-122a
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-122a

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Carrito | ≥2 variantes de disposición seleccionables por plantilla |
| AC-2 | Consistencia | Reusa framework/fallback de HU-122a; respeta la lógica de carrito existente |

---

### HU-123 — Import/Export extensible y versionado · E2

> Como administrador, quiero exportar e importar toda la configuración y el contenido del sitio en un paquete versionado que incluya los cambios actuales y tolere futuras adiciones, para clonar, respaldar o migrar una instancia.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (export/import), admin, esquema de paquete con versión
**Estado:** 🔲 Pendiente (roadmap v17) — evoluciona el export/import actual

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar | Genera un paquete con páginas, secciones, ítems, nav, **plantillas de diseño (HU-121/122)**, productos, categorías, variantes y configuración; con número de versión de esquema |
| AC-2 | Importar una versión anterior | Migración tolerante: campos nuevos toman valores por defecto; no falla por claves desconocidas |
| AC-3 | Colisiones | Estrategia clara (omitir/actualizar) por clave estable (`key`/`slug`/`nav_key`) |
| AC-4 | Extensibilidad | Añadir una entidad futura al export solo requiere registrarla en el manifiesto, sin reescribir el importador |

---

### HU-124 — Carga masiva de productos por CSV · E13 (toca E4/E9)

> Como operador, quiero subir un archivo `.CSV` para crear o actualizar muchos productos y su inventario de una vez, en lugar de cargarlos uno por uno.

**Estimación:** L (8 puntos)
**Módulo:** admin (importador CSV), validación + mapeo de columnas, upsert de productos/variantes/stock
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Subida de CSV + plantilla descargable | El admin mapea columnas a campos (nombre, slug, precio, categoría, stock, variantes…) |
| AC-2 | Previsualización y validación | Muestra filas válidas/erróneas antes de confirmar; no importa nada si el usuario cancela |
| AC-3 | Importación | Crea o actualiza (upsert por `slug`/SKU); reporta creados, actualizados y errores por fila |
| AC-4 | Inventario | El stock de cada variante se establece/ajusta respetando el modelo de inventario existente |
| AC-5 | Idempotencia | Reimportar el mismo archivo no duplica productos |

---

### HU-125 — Respaldo (backup) de productos, pedidos y clientes · E14 (toca E13)

> Como administrador, quiero generar respaldos de productos, pedidos y clientes, para proteger los datos y poder restaurarlos o auditarlos.

**Estimación:** M (5 puntos)
**Módulo:** admin (exportación de respaldo), `packages/database`, opcional tarea programada
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Generar respaldo | Descarga un archivo (CSV/JSON) por dominio: productos, pedidos y clientes |
| AC-2 | Alcance y permisos | Solo roles autorizados; los datos sensibles se manejan con service_role del lado servidor |
| AC-3 | Programación (opcional) | Se puede agendar un respaldo periódico automático |
| AC-4 | Integridad | El respaldo es consistente (snapshot) y documenta fecha/versión para restauración |

---

### HU-126 — Reordenamiento drag-and-drop generalizado · E13

> Como editor/operador, quiero arrastrar para reordenar también los ítems del menú, las imágenes de un producto y las categorías, con la misma interacción que las secciones de página (HU-120).

**Estimación:** M (5 puntos)
**Módulo:** admin (nav, galería de producto, categorías), utilidad de reordenamiento reutilizable
**Estado:** 🔲 Pendiente (roadmap v17) — generaliza HU-120

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
**Estado:** 🔲 Pendiente (roadmap v17) — depende de HU-121/122

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
**Estado:** 🔲 Pendiente (roadmap v17) — se apoya en HU-121/122/123

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar plantilla | Genera un paquete versionado con theme + variantes de disposición (± contenido de ejemplo) |
| AC-2 | Importar plantilla | Crea la plantilla como borrador (no activa), lista para previsualizar (HU-128) |
| AC-3 | Compatibilidad | Tolerante a versiones (reusa el esquema versionado de HU-123) |
| AC-4 | Colisiones | No sobreescribe la plantilla activa; nombra/versiona la importada |

---

### HU-130 — Exportar productos a CSV · E13

> Como operador, quiero exportar el catálogo (o una selección filtrada) a `.CSV`, como contraparte de la carga masiva, para editar en hoja de cálculo y reimportar.

**Estimación:** S (3 puntos)
**Módulo:** admin (listado de productos), exportador CSV
**Estado:** 🔲 Pendiente (roadmap v17) — simétrico de HU-124

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Exportar desde el listado | Descarga CSV con columnas compatibles con el importador (HU-124) |
| AC-2 | Respeta filtros | Exporta solo lo filtrado/seleccionado si aplica |
| AC-3 | Ciclo redondo | El CSV exportado puede reimportarse sin transformación manual |

---

### HU-131 — Acciones masivas / edición por lote en listas del admin · E13

> Como operador, quiero seleccionar varios registros y aplicar acciones en lote (cambiar precio, categoría, stock, publicar/despublicar), para administrar el catálogo con eficiencia.

**Estimación:** M (5 puntos)
**Módulo:** admin (listas con selección múltiple), endpoints de actualización por lote
**Estado:** 🔲 Pendiente (roadmap v17)

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección múltiple en el listado | Barra de acciones masivas con las operaciones disponibles |
| AC-2 | Aplicar cambio en lote | Actualiza todos los seleccionados en una operación; reporta resultado |
| AC-3 | Seguridad y confirmación | Requiere confirmación en acciones destructivas; respeta permisos por rol |

---

### HU-132 — Importadores CSV para otras entidades · E13

> Como operador, quiero importar por CSV también clientes, cupones, categorías y posts del blog, con el mismo flujo de la carga de productos.

**Estimación:** M (5 puntos)
**Módulo:** admin (importador genérico reutilizable), validación/mapeo por entidad
**Estado:** 🔲 Pendiente (roadmap v17) — generaliza HU-124

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Selección de entidad + CSV + plantilla | Mapeo de columnas por entidad (clientes, cupones, categorías, posts) |
| AC-2 | Validación previa | Previsualización con filas válidas/erróneas antes de confirmar |
| AC-3 | Upsert e informe | Crea/actualiza por clave estable y reporta creados/actualizados/errores |
| AC-4 | Reutilización | Comparte el motor de importación con HU-124 (una sola base) |

---

### HU-133 — Restauración desde respaldo + respaldos programados · E14

> Como administrador, quiero restaurar datos a partir de un respaldo y programar respaldos automáticos periódicos, para recuperación ante desastres, no solo generación manual.

**Estimación:** L (8 puntos)
**Módulo:** `packages/database` (restore), tarea programada, admin
**Estado:** 🔲 Pendiente (roadmap v17) — extiende HU-125

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cargar un respaldo (HU-125) | Previsualiza el contenido y valida versión/integridad antes de restaurar |
| AC-2 | Restaurar | Aplica el respaldo (con estrategia clara de colisión) de forma transaccional |
| AC-3 | Programación | Respaldos automáticos periódicos (diario/semanal) con retención configurable |
| AC-4 | Seguridad | Solo `super_admin`; operación auditada (compatible con HU-117/134) |

---

### HU-134 — Control de acceso por rol para importar/exportar/respaldar · E14 (toca E13)

> Como responsable, quiero controlar por rol quién puede importar, exportar y respaldar datos, porque estas operaciones mueven información sensible en volumen.

**Estimación:** S (3 puntos)
**Módulo:** `roles.ts`, guards de las rutas de import/export/backup, admin
**Estado:** 🔲 Pendiente (roadmap v17)

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
**Estado:** 🔲 Pendiente (roadmap v17) — extraída de HU-117; la consumen HU-133/134/145/107b

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
**Estado:** 🔲 Pendiente (roadmap v17)

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

