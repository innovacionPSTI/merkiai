## 3. Historias de Usuario

Las historias siguen el formato: **"Como [rol], quiero [acción] para [beneficio]."**  
Cada historia incluye sus criterios de aceptación y el estado de implementación.

---

### Módulo: Navegación y Experiencia General

---

**HU-001 — Navbar global**
> Como visitante del sitio, quiero ver una barra de navegación clara en todas las páginas para encontrar rápidamente cualquier sección del sitio.

**Criterios de aceptación:**
- La navbar contiene el logo VPS, los links principales y los iconos de cuenta y carrito.
- Al hacer scroll más de 20px, la navbar cambia de transparente a fondo `#FFF0D1` con sombra.
- El ícono del carrito muestra un badge numérico con la cantidad de ítems.
- En móvil, los links se ocultan y aparece un botón hamburger que despliega un drawer lateral.

**Estado:** ✅ Implementado

---

**HU-002 — Carrito desde cualquier página**
> Como comprador, quiero acceder a mi carrito desde cualquier página del sitio sin perder mi posición de navegación, para revisar mis productos sin interrumpir mi experiencia.

**Criterios de aceptación:**
- Al hacer clic en el ícono del carrito se abre un drawer lateral con todos los ítems.
- El drawer se puede cerrar haciendo clic en el overlay, con el botón X o presionando Escape.
- El scroll del body se bloquea mientras el drawer está abierto.
- Desde el drawer se puede modificar cantidad, eliminar ítems y proceder al checkout.

**Estado:** ✅ Implementado

---

### Módulo: Home

---

**HU-003 — Hero carrusel**
> Como visitante, quiero ver un hero visual impactante al ingresar al sitio para entender rápidamente quién es Merkiai y qué ofrece.

**Criterios de aceptación:**
- El hero ocupa el 100% del viewport en desktop y 70% en móvil.
- Los slides hacen transición con fade cada 5 segundos de forma automática.
- Existen controles de navegación (flechas y dots) para moverse manualmente entre slides.
- Cada slide puede tener título, subtítulo, un CTA principal y una imagen o color de fondo.
- El contenido de los slides se gestiona desde el panel de administración.

**Estado:** ✅ Implementado

---

**HU-004 — Servicios en home**
> Como potencial cliente B2B, quiero ver los servicios de Maquila y Asesorías en la página principal para contactar fácilmente a Merkiai sin buscar en el menú.

**Criterios de aceptación:**
- La sección muestra dos bloques lado a lado: Maquila y Asesorías.
- Cada bloque tiene un título en Ahsing, una descripción breve y un botón de WhatsApp.
- El botón abre WhatsApp con un mensaje pre-cargado específico para cada servicio.
- En móvil los bloques se apilan verticalmente.

**Estado:** ✅ Implementado

---

**HU-005 — Suscripción al newsletter**
> Como visitante interesado en café, quiero suscribirme al boletín de Merkiai para recibir recetas, orígenes y novedades en mi correo.

**Criterios de aceptación:**
- El formulario acepta un email y muestra un mensaje de confirmación al enviar.
- El email se guarda en la tabla `newsletter_subscribers` de Supabase.
- Si el email ya existe, se actualiza su estado a activo sin mostrar error al usuario.
- El formulario valida el formato del correo antes de enviar.

**Estado:** ✅ Implementado

---

### Módulo: Tienda

---

**HU-006 — Explorar el catálogo de café**
> Como comprador, quiero ver todos los cafés disponibles en una página de tienda organizada para comparar opciones y elegir la que más me guste.

**Criterios de aceptación:**
- Los productos se muestran en un grid de 3 columnas en desktop, 2 en tablet y 1 en móvil.
- Cada tarjeta muestra imagen, nombre, categoría, variante predeterminada y precio.
- Existe un botón "Agregar" que añade el producto al carrito directamente desde la tarjeta.
- La página carga con ISR y se revalida cada 60 segundos.

**Estado:** ✅ Implementado

---

**HU-007 — Filtrar el catálogo**
> Como comprador, quiero filtrar los cafés por tueste, peso y método de preparación para encontrar rápidamente el producto que se adapta a mi gusto.

**Criterios de aceptación:**
- Los filtros disponibles son: tueste (claro, medio, oscuro), peso (250g, 500g, 1kg) y método (espresso, filtrado, cold brew).
- Los filtros son acumulativos y se pueden combinar.
- El número de productos que coincide con los filtros se actualiza en tiempo real.
- Existe un botón "Limpiar filtros" cuando no hay resultados.
- Los filtros activos se reflejan en los parámetros de la URL.

**Estado:** ✅ Implementado

---

**HU-008 — Ver detalle de un producto**
> Como comprador, quiero ver toda la información de un café —imágenes, origen, notas de sabor, variantes disponibles y precio— en una página dedicada para tomar una decisión de compra informada.

**Criterios de aceptación:**
- La página muestra una galería con imagen principal y thumbnails navegables.
- Se muestran los atributos del café (origen, proceso, altitud si aplica) desde la descripción.
- El comprador puede seleccionar tueste, peso y molienda disponibles para ese producto.
- El precio se actualiza según la variante seleccionada.
- Existe selector de cantidad y botones "Agregar al carrito" y "Comprar ahora".
- Al pie se muestran hasta 3 productos relacionados de la misma categoría.
- La página tiene metadatos SEO dinámicos (título y descripción del producto).

**Estado:** ✅ Implementado

---

**HU-009 — Agregar al carrito**
> Como comprador, quiero agregar un producto con la variante y cantidad que elijo para acumular mis selecciones antes de pagar.

**Criterios de aceptación:**
- Al agregar un producto, si ya existe esa variante en el carrito se incrementa la cantidad.
- El carrito persiste en localStorage y sobrevive recargas de página.
- El badge del carrito en la navbar se actualiza inmediatamente.
- Se puede agregar desde la tarjeta del catálogo o desde el detalle del producto.

**Estado:** ✅ Implementado

---

### Módulo: Carrito y Checkout

---

**HU-010 — Revisar el carrito antes de pagar**
> Como comprador, quiero ver un resumen completo de mi carrito con totales y costos de envío antes de ingresar mis datos de pago.

**Criterios de aceptación:**
- La página de carrito lista todos los productos con imagen, variante, precio unitario y cantidad.
- Se puede modificar la cantidad o eliminar ítems desde esta página.
- Se muestra subtotal, costo de envío y total.
- Si el subtotal supera $100.000 COP, el envío es gratuito.
- Existe un botón para continuar al checkout y otro para seguir comprando.
- Hay un campo de cupón de descuento (UI implementada; validación pendiente).

**Estado:** ✅ Implementado

---

**HU-011 — Completar la compra**
> Como comprador, quiero ingresar mis datos de contacto, dirección de envío y método de pago en un proceso guiado y claro para finalizar mi compra con confianza.

**Criterios de aceptación:**
- El checkout tiene 3 pasos claramente diferenciados: Contacto, Envío y Pago.
- Los pasos se completan en secuencia y se puede regresar al paso anterior.
- El resumen del pedido es visible en todo momento en una columna lateral.
- Se puede elegir entre Wompi y MercadoPago como método de pago.
- Al confirmar, se crea la orden en Supabase con número correlativo (VPS-XXXX).
- El usuario es redirigido a una página de confirmación con el número de orden.

**Estado:** ✅ Implementado (Wompi hosted checkout + MercadoPago preference; usuario redirigido al gateway al confirmar)

---

**HU-012 — Confirmación de pedido**
> Como comprador, quiero recibir una confirmación clara de que mi pedido fue procesado para saber que la transacción fue exitosa y qué sucede a continuación.

**Criterios de aceptación:**
- La página muestra un ícono de éxito, el número de orden y un mensaje explicativo.
- Se indica que el cliente recibirá un email con los detalles y el número de tracking.
- Hay un enlace a "Ver mis pedidos" y otro a "Seguir comprando".
- Se muestra el número de WhatsApp de Merkiai para consultas.

**Estado:** ✅ Implementado

---

### Módulo: Servicios

---

**HU-013 — Conocer el servicio de Maquila**
> Como empresario o emprendedor cafetero, quiero conocer en detalle el servicio de tueste a maquila de Merkiai para evaluar si se adapta a mis necesidades y cotizar.

**Criterios de aceptación:**
- La página tiene un hero de impacto con título en Ahsing y CTA a WhatsApp.
- Se detallan los tres pasos del servicio: recepción, tueste y empaque.
- Existe una sección de preguntas frecuentes en formato acordeón.
- Todos los CTAs abren WhatsApp con mensaje pre-cargado sobre maquila.

**Estado:** ✅ Implementado

---

**HU-014 — Solicitar asesoría profesional**
> Como propietario de cafetería o marca de café, quiero conocer los servicios de asesoría de Merkiai y contactar a un experto para mejorar mi propuesta.

**Criterios de aceptación:**
- La página describe los cuatro tipos de asesoría: catación, perfiles, formación, consultoría.
- Existe un formulario de consulta inicial con campos de nombre, empresa y necesidad.
- El formulario redirige a WhatsApp con la información ingresada pre-cargada en el mensaje.
- El CTA de WhatsApp usa un mensaje diferenciado respecto al de Maquila.

**Estado:** ✅ Implementado

---

### Módulo: Blog

---

**HU-015 — Leer artículos sobre café**
> Como amante del café, quiero explorar el blog de Merkiai para aprender sobre orígenes, métodos de preparación y la cultura cafetera.

**Criterios de aceptación:**
- El listado muestra el artículo más reciente como destacado en formato horizontal.
- Los demás artículos se presentan en un grid de 3 columnas.
- Se puede filtrar por categoría (Orígenes, Preparación, Novedades, Cultura).
- Cada tarjeta muestra imagen, fecha y título.

**Estado:** ✅ Implementado

---

**HU-016 — Leer un artículo completo**
> Como lector, quiero abrir un artículo del blog y leerlo cómodamente con artículos relacionados al final para seguir explorando contenido.

**Criterios de aceptación:**
- El artículo tiene imagen hero, breadcrumb, fecha, título y cuerpo con buen espaciado.
- Hay un extracto destacado al inicio si el artículo lo tiene.
- Al pie se muestran hasta 2 artículos relacionados de la misma categoría.
- Existe un botón para compartir el artículo por WhatsApp.
- La URL es amigable: `/blog/[slug]`.

**Estado:** ✅ Implementado

---

### Módulo: Mi Cuenta

---

**HU-017 — Ver historial de pedidos**
> Como cliente registrado, quiero ver todos mis pedidos anteriores con su estado para saber en qué punto está cada uno de mis envíos.

**Criterios de aceptación:**
- La página lista todos los pedidos del cliente autenticado ordenados por fecha.
- Cada fila muestra número de orden, fecha, total, estado y número de tracking si aplica.
- Los estados tienen colores diferenciados (amarillo: pendiente, verde: entregado, etc.).
- Si no hay pedidos, se muestra un estado vacío con enlace a la tienda.

**Estado:** ✅ Implementado (requiere auth para mostrar datos reales)

---

**HU-018 — Ver mi dashboard de cuenta**
> Como cliente registrado, quiero tener un panel personal donde vea de un vistazo mis pedidos activos y mis datos personales.

**Criterios de aceptación:**
- El dashboard muestra tarjetas con número de pedidos activos y último pedido.
- Se muestran los datos personales (nombre, email, teléfono) con opción de editar.
- Existe un menú lateral para navegar entre secciones de la cuenta.
- La sección está protegida; los visitantes sin sesión son redirigidos al login.

**Estado:** ✅ Implementado (skeleton; datos reales requieren auth)

---

### Módulo: Panel de Administración

---

**HU-019 — Dashboard de métricas**
> Como administrador, quiero ver en un dashboard las métricas más importantes del negocio al iniciar mi jornada para tener contexto antes de operar.

**Criterios de aceptación:**
- El dashboard muestra ventas del día (suma total de órdenes creadas hoy).
- Muestra número de pedidos pendientes y productos activos publicados.
- Lista los 5 pedidos más recientes con estado y total.
- Los datos se cargan en tiempo real desde Supabase (force-dynamic).

**Estado:** ✅ Implementado

---

**HU-020 — Gestionar productos del catálogo**
> Como administrador, quiero ver, crear, editar y despublicar productos del catálogo para mantener la tienda actualizada con información precisa.

**Criterios de aceptación:**
- La tabla muestra imagen, nombre, slug, categoría, rango de precios, stock total y estado.
- El stock total suma todas las variantes activas del producto.
- Se puede buscar productos por nombre.
- Hay botones de "Editar" por producto que abren el formulario de edición.
- El formulario permite subir imágenes, definir variantes con precio y stock individual.

**Estado:** ✅ Implementado (formulario con imágenes, variantes, validación cliente, bloqueo durante uploads)

---

**HU-021 — Gestionar pedidos**
> Como operador de Merkiai, quiero ver todos los pedidos, filtrarlos por estado y actualizar su estado para coordinar el proceso de despacho.

**Criterios de aceptación:**
- La tabla muestra número de orden, cliente, fecha, total, estado y tracking.
- Se puede filtrar por todos los estados disponibles.
- Al entrar al detalle del pedido se ve el timeline visual de estados.
- Se puede cambiar el estado del pedido mediante un selector y un botón de guardado.
- Si el pedido tiene número de tracking, se muestra el botón para descargar la guía PDF.

**Estado:** ✅ Implementado

---

**HU-022 — Gestionar banners del hero**
> Como administrador de contenido, quiero agregar, editar, reordenar y desactivar los slides del carrusel hero sin tocar código para mantener las campañas actualizadas.

**Criterios de aceptación:**
- Se puede previsualizar cada slide con su imagen o color de fondo.
- Se puede activar o desactivar un slide sin eliminarlo.
- Los slides tienen campos editables: imagen, título, subtítulo, texto CTA y URL CTA.
- El orden de los slides es arrastrable.

**Estado:** ✅ Implementado (listado, preview, formulario de edición con imagen web + imagen mobile por slide)

---

**HU-023 — Gestionar artículos del blog**
> Como editor de Merkiai, quiero crear, editar y publicar artículos del blog desde el panel admin para publicar contenido sin depender de un desarrollador.

**Criterios de aceptación:**
- La tabla muestra título, slug, categoría, fecha de publicación y estado (publicado/borrador).
- Existe un botón "Vista previa" que abre el artículo en el sitio público sin publicarlo.
- El formulario tiene campos para título, slug, extracto, contenido (rich text), imagen de portada y categoría.
- Los artículos en borrador no son visibles en el sitio público.

**Estado:** ✅ Implementado (listado, formulario con Markdown, imagen de portada, SEO, toggle publicado/borrador, slug auto-generado, botón "Vista previa ↗")

---

**HU-024 — Controlar accesos por rol**
> Como super administrador, quiero invitar usuarios al panel, asignarles roles y revocarlos para que cada miembro del equipo solo acceda a las secciones que le corresponden.

**Criterios de aceptación:**
- Los roles del panel son: `super_admin`, `admin`, `vendedor`, `gestor_tienda`. El rol `miembro` existe pero sin acceso al panel (estado de invitación pendiente de asignación).
- Al invitar, el usuario se crea en Stack Auth con rol `miembro` y recibe un email "Establece tu contraseña".
- El super_admin puede elevar o reducir el rol de cualquier usuario desde `/usuarios`.
- Las secciones del sidebar se filtran según el rol (`ROLE_CONFIG` en `lib/roles.ts`).
- Las políticas RLS en Supabase bloquean el acceso a nivel de base de datos; el service role lo bypasea.
- Un usuario con rol `miembro` que intente acceder al panel es redirigido al sign-in.

**Estado:** ✅ Implementado

---

**HU-025 — Gestionar identidad y contacto de la tienda desde admin**
> Como administrador, quiero configurar el logo, el número de WhatsApp y los datos de la tienda desde el panel admin, sin tocar el código ni redesplegar, para mantener la identidad de la marca actualizada.

**Criterios de aceptación:**
- La sección Configuración tiene un formulario de "Identidad de la tienda" con campos: logo (imagen), nombre, email y WhatsApp.
- El logo se sube al bucket `logos` de Supabase Storage y la URL se guarda en `store_config.logo_url`.
- El número de WhatsApp acepta solo dígitos (10–15); se muestra un error si no cumple el formato.
- Al guardar, los cambios se aplican inmediatamente sin recargar toda la app.
- El logo aparece en el Navbar y Footer del sitio público.
- El número de WhatsApp se usa en los CTAs de maquila, asesorías, footer y confirmación de pedido.

**Estado:** ✅ Implementado

---

**HU-026 — Configurar redes sociales desde admin**
> Como administrador, quiero poder configurar los enlaces de Instagram, Facebook y TikTok de la tienda desde el panel, y habilitar o deshabilitar cada red de forma independiente, para mantener el footer actualizado sin tocar código.

**Criterios de aceptación:**
- En Configuración → Configuración general aparece una sección "Redes sociales" con tres filas: Instagram, Facebook y TikTok.
- Cada fila tiene un toggle de habilitado y un campo de URL.
- El campo de URL se deshabilita visualmente cuando el toggle está apagado.
- En el footer del sitio público, solo aparecen los iconos de redes que tienen `enabled: true` y URL no vacía.
- Los iconos son los SVG oficiales de cada red.
- Los cambios se aplican en la siguiente carga del sitio (SSR `force-dynamic` en el layout).

**Estado:** ✅ Implementado

---

**HU-027 — Editar términos y política de privacidad desde admin**
> Como administrador, quiero editar el contenido de los Términos y condiciones y la Política de privacidad desde el panel, usando Markdown, para mantener el contenido legal actualizado sin redeploys.

**Criterios de aceptación:**
- En Configuración → Contenido legal hay dos tabs: "Términos y condiciones" y "Política de privacidad".
- El editor es un textarea con sintaxis Markdown; muestra un contador de caracteres y un hint de formato.
- Hay un botón "Guardar contenido legal" que persiste ambos textos en `store_config`.
- El enlace "Ver en sitio ↗" lleva a `/terms` o `/privacy` según el tab activo.
- Las páginas `/terms` y `/privacy` renderizan el Markdown almacenado (h1/h2/h3, bold, italic, listas, links).
- Si el contenido está vacío, las páginas muestran un aviso en lugar de una página en blanco.

**Estado:** ✅ Implementado

---

**HU-028 — Envío gratis configurable desde admin**
> Como administrador, quiero poder habilitar o deshabilitar la promoción de envío gratis y definir el monto mínimo del pedido desde el panel admin, para gestionar incentivos de compra sin cambios de código.

**Criterios de aceptación:**
- En Configuración → Proveedor de envíos existe un toggle "Envío gratis" (habilitado/deshabilitado).
- Cuando está habilitado, se muestra un campo editable con el monto mínimo en COP.
- El campo muestra una vista previa del umbral formateado (ej. "$100.000").
- En el carrito, si el toggle está activo, aparece una barra de progreso que muestra cuánto falta para el envío gratis.
- Si el subtotal supera el umbral, el costo de envío se muestra como "Gratis" (en carrito y en checkout).
- El fallback es tarifa fija si la BD no responde.

**Estado:** ✅ Implementado

---

**HU-029 — Ver todos los clientes en un solo lugar**
> Como administrador, quiero ver en un panel la lista completa de personas que han interactuado con la tienda —tanto las que tienen cuenta registrada como las que compraron como invitados— para llevar un control total y planificar campañas.

**Criterios de aceptación:**
- La tabla muestra clientes con cuenta (Stack Auth) y compradores sin cuenta (solo en `orders`), diferenciados por badge "Con cuenta" / "Sin cuenta".
- Cada fila incluye: nombre, email, teléfono (si está disponible), número de pedidos, total gastado y fecha de último pedido.
- Los administradores del panel (tabla `profiles`) son excluidos de la lista.
- Existe búsqueda por nombre, email o teléfono y filtro por tipo de cliente.
- Los datos se ordenan por actividad más reciente (último pedido o fecha de registro).

**Estado:** ✅ Implementado

---

---

**HU-030 — Controlar qué secciones aparecen en el sitio**
> Como gestor de tienda, quiero habilitar o deshabilitar secciones del home desde el panel para ajustar el contenido sin tocar código.

**Criterios de aceptación:**
- La página `/secciones` lista todas las secciones configurables con su estado actual.
- Cada sección tiene un toggle que persiste en `section_settings`.
- El sitio público respeta los flags: si una sección está deshabilitada, no se renderiza.
- Si la tabla no existe aún, el sitio muestra todas las secciones (fail-open).
- Los servicios dinámicos se gestionan con CRUD inline en la misma página.

**Estado:** ✅ Implementado

---

**HU-031 — Dashboard adaptado a mi rol**
> Como usuario del panel, quiero ver en el dashboard solo la información relevante para mi función para no distraerme con datos que no gestiono.

**Criterios de aceptación:**
- `admin`/`super_admin`: ve ventas hoy/semana/mes, stock crítico, pedidos recientes y top productos.
- `vendedor`: ve conteo de órdenes por estado, pedidos urgentes (resaltados si llevan >2 días pendientes) y productos con stock bajo.
- `gestor_tienda`: ve secciones activas, artículos en borrador, banners hero y cupones próximos a vencer.
- El rol se lee del usuario autenticado; no hay lógica manual de selección.

**Estado:** ✅ Implementado

---

**HU-032 — Crear y activar temas de marca**
> Como administrador, quiero crear perfiles de colores y fuentes y activar el que quiero usar en el sitio, para mantener coherencia visual y probar variaciones de paleta sin redesplegar.

**Criterios de aceptación:**
- Se pueden crear múltiples temas con nombres descriptivos.
- Cada tema configura 7 colores (primary, dark, cream, cream-warm, yellow, yellow-pale, text) y 2 fuentes (display, body).
- Un preview en tiempo real muestra cómo se verá el tema antes de guardarlo.
- Al activar un tema, el sitio público lo refleja en la siguiente carga sin redeploy.
- Solo puede haber un tema activo; activar uno desactiva automáticamente el anterior.
- El tema "Merkiai (Por defecto)" no se puede eliminar.
- Los colores se almacenan en hex; el sitio los convierte a canales RGB para soporte de opacidad de Tailwind.

**Estado:** ✅ Implementado

---

**HU-033 — Gestionar suscriptores y enviar campañas de newsletter**
> Como gestor de tienda, quiero ver la lista de personas suscritas al newsletter y enviarles un correo desde el panel admin para comunicarme con mi audiencia sin herramientas externas.

**Criterios de aceptación:**
- La página `/newsletter` es accesible para `gestor_tienda`, `admin` y `super_admin`.
- La pestaña "Suscriptores" muestra una tabla con email, fecha de suscripción y estado (Activo / Inactivo).
- Las tarjetas de estadísticas muestran el total, cantidad de activos e inactivos.
- El botón "Exportar CSV" descarga un archivo con todos los suscriptores.
- La pestaña "Enviar campaña" tiene campos de asunto y cuerpo en Markdown.
- El sistema indica cuántos destinatarios activos recibirán el correo antes de enviar.
- Al pulsar "Enviar campaña" aparece un diálogo de confirmación antes de ejecutar el envío.
- El envío usa las credenciales Resend guardadas en `store_config`; si no están configuradas, muestra error claro.
- Se envía en lotes de 50 para respetar los límites de Resend.
- Tras enviar, se muestra el resultado: cuántos recibieron el email y cuántos fallaron.
- El formulario acepta Markdown básico (##, **negrita**, *cursiva*, listas) convertido a HTML en el email.

**Estado:** ✅ Implementado

---

## 4. Historias de Usuario — Versión Refinada (con edge cases y story points)

> Esta sección refina las historias más críticas para el negocio agregando: escenarios de borde, criterios de rechazo, estimación de esfuerzo y cobertura de testing.  
> **Escala de estimación:** S = 1–2 pts | M = 3–5 pts | L = 8 pts | XL = 13 pts

---

### HU-R01 — Agregar al carrito (refinada)

> Como comprador, quiero agregar un café con la variante y cantidad que elijo, para que mis selecciones queden guardadas aunque salga del sitio.

**Estimación:** M (3 puntos)  
**Módulo:** Carrito · `store/cart.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Comprador agrega variante nueva | Item aparece en el carrito con qty = cantidad ingresada |
| AC-2 | Comprador agrega la misma variante dos veces | La qty se acumula (no se crea un item duplicado) |
| AC-3 | Comprador agrega desde la tarjeta del catálogo | Qty predeterminada = 1 |
| AC-4 | Comprador agrega desde el detalle de producto | Qty = la elegida en el selector |
| AC-5 | Comprador recarga la página | El carrito persiste (localStorage key `vps-cart`) |
| AC-6 | Comprador abre el sitio en otra pestaña | Ambas pestañas muestran el mismo carrito |

**Escenarios de borde:**

- Si la variante seleccionada tiene `stock = 0`, el botón "Agregar" está deshabilitado y se muestra "Sin stock".
- Si el usuario intenta agregar qty = 0 o qty negativa vía manipulación directa del DOM, el store ignora la operación.
- El `variantId` es el identificador único; dos productos distintos con el mismo `variantId` serían imposibles por diseño del esquema.

**Criterios de rechazo (la historia NO pasa si...):**

- El badge de la navbar no se actualiza inmediatamente tras agregar.
- Agregar el mismo producto dos veces crea dos filas en lugar de sumar la cantidad.
- El carrito desaparece al recargar la página.

**Cobertura de tests:** `src/store/__tests__/cart.test.ts` — 18 casos

---

### HU-R02 — Proceso de checkout (refinada)

> Como comprador con ítems en el carrito, quiero completar mi compra en tres pasos claros para pagar con confianza sin distracciones.

**Estimación:** XL (13 puntos)  
**Módulo:** Checkout · `app/checkout/page.tsx` + `api/checkout/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Paso 1: email vacío al continuar | Mensaje de validación inline; no avanza al paso 2 |
| AC-2 | Paso 1: email inválido (sin @) | Mensaje de validación inline |
| AC-3 | Paso 2: dirección completa | Avanza al paso 3 |
| AC-4 | Paso 2: código postal vacío | Se usa `000000` como fallback para la cotización de Skydropx |
| AC-5 | Paso 3: se confirma el pedido | Se crea la orden en Supabase y se redirige a `/checkout/confirmation?order=VPS-XXXX` |
| AC-6 | Carrito vacío al llegar al checkout | Se redirige a `/cart` con mensaje de carrito vacío |
| AC-7 | Error de red al crear la orden | Se muestra toast de error genérico; el usuario puede reintentar |
| AC-8 | Regresión de paso 3 a paso 2 | Se conservan los datos del formulario previo (no se borran) |

**Escenarios de borde:**

- Si el usuario llega a `/checkout/confirmation` sin haber pasado por el checkout (sin `order` en query), se redirige a `/`.
- El número de orden usa padding cero hasta 4 dígitos (`ORD-0001`); a partir de 9999 sigue incrementando sin padding.
- `shipping_cost` es `0` si el subtotal supera $100.000 COP, independientemente de lo que devuelva Skydropx.

**Criterios de rechazo:**

- El formulario permite avanzar sin email.
- Doble-clic en "Confirmar" crea dos órdenes (debe deshabilitarse el botón durante el fetch).
- Los datos del paso 1 desaparecen al retroceder desde el paso 2.

**Cobertura de tests:** `api/__tests__/checkout.integration.test.ts` — 10 casos

---

### HU-R03 — Configuración del proveedor de envíos desde el admin (nueva)

> Como administrador, quiero seleccionar y configurar el proveedor de envíos desde el panel de administración, sin tocar el código ni redesplegar la aplicación, para poder cambiar o actualizar las credenciales cuando sea necesario.

**Estimación:** M (5 puntos)  
**Módulo:** Admin · `app/configuracion/` + `api/admin/shipping/`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Admin abre Configuración → sección Envíos | Muestra el proveedor activo y la tarifa fija actual |
| AC-2 | Admin selecciona "Tarifa fija" y guarda | `shipping_config.provider = 'fixed'`; todos los checkouts usan esa tarifa |
| AC-3 | Admin selecciona "Skydropx" sin credenciales y guarda | Error 400 con lista de campos faltantes |
| AC-4 | Admin ingresa Client ID, Client Secret y Address From ID y guarda | Provider = skydropx, credenciales guardadas en BD |
| AC-5 | Admin recarga la página de configuración | Los campos se pre-rellenan con los valores guardados |
| AC-6 | Client Secret se muestra enmascarado (••••1234) | El secret original nunca se expone en la UI |
| AC-7 | Admin deja el campo Client Secret vacío al guardar | El secret existente no se sobreescribe |
| AC-8 | Admin cambia solo la tarifa fija | Solo ese campo se actualiza; el proveedor activo no cambia |

**Escenarios de borde:**

- Si el administrador cambia a Skydropx pero la API está caída al momento de la siguiente compra, el sistema hace fallback automático a la tarifa fija configurada.
- Los cambios surten efecto en el siguiente request (no hay caché de la config entre requests).

**Criterios de rechazo:**

- El Client Secret se devuelve en texto plano en la respuesta GET.
- Cambiar el proveedor requiere modificar `.env.local` y redesplegar.
- Al activar Skydropx con credenciales vacías, el checkout falla con un error de autenticación en producción.

**Cobertura de tests:** `apps/admin/api/admin/shipping/__tests__/shipping-config.integration.test.ts` — 14 casos

---

### HU-R04 — Cotización de envío multi-proveedor (refinada)

> Como comprador, quiero ver el costo y el tiempo estimado de envío después de ingresar mi dirección para decidir qué transportadora usar, independientemente del proveedor que tenga configurado Merkiai.

**Estimación:** L (8 puntos)  
**Módulo:** `lib/shipping/` + `api/shipping/rates/route.ts`  
**Estado:** ✅ Implementado (arquitectura multi-proveedor)

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Proveedor = "fixed", dirección cualquiera | Se devuelve la tarifa fija configurada en el admin |
| AC-2 | Proveedor = "skydropx", dirección válida | Se devuelven 2–4 tarifas reales con precio y días |
| AC-3 | Código postal no provisto | Se usa `000000`; la cotización continúa |
| AC-4 | 1 ítem de 250g | Parcel: 20×15×8 cm, 0.3 kg |
| AC-5 | 2 ítems de 500g | Parcel: 25×20×10 cm, 1.2 kg |
| AC-6 | 3+ ítems de 1kg | Parcel: 35×25×15 cm, ≥3.3 kg |
| AC-7 | Skydropx responde `is_completed: false` | Polling hasta 10 reintentos × 500ms |
| AC-8 | Polling agota los reintentos | SkydropxProvider devuelve `[]`; la API responde con tarifa fija como fallback |
| AC-9 | Token OAuth próximo a expirar (< 60s) | Se renueva automáticamente antes de la petición |
| AC-10 | Skydropx falla con HTTP 503 | SkydropxProvider devuelve `[]` (no lanza); la API responde 500 |
| AC-11 | La respuesta incluye el nombre del proveedor | `{ provider: 'fixed' | 'skydropx', rates: [...] }` |

**Arquitectura de proveedores:**

```
lib/shipping/
├── types.ts                   ← ShippingProvider interface + calculateParcel
├── index.ts                   ← getShippingProvider() factory (lee shipping_config de BD)
└── providers/
    ├── fixed-rate.ts          ← FixedRateProvider (tarifa plana, sin API externa)
    └── skydropx/
        ├── auth.ts            ← OAuth 2.0 con cache por clientId
        └── index.ts           ← SkydropxProvider (polling de cotizaciones)
```

Para agregar un nuevo proveedor (ej. FedEx): crear `providers/fedex/index.ts`, agregar el caso al switch en `index.ts`, y una nueva columna en `shipping_config`.

**Criterios de rechazo:**

- El código del checkout importa `SkydropxProvider` directamente (en lugar de usar la factory).
- Las credenciales del proveedor se leen de `.env` en lugar de la BD.
- El fallo de Skydropx bloquea el checkout con un error visible al comprador.

**Cobertura de tests:** 
- `lib/shipping/__tests__/types.test.ts` — 10 casos (calculateParcel)  
- `lib/shipping/__tests__/fixed-rate.test.ts` — 10 casos  
- `lib/shipping/__tests__/skydropx-auth.test.ts` — 7 casos  
- `lib/shipping/__tests__/skydropx-provider.test.ts` — 9 casos  
- `lib/shipping/__tests__/factory.test.ts` — 8 casos  
- `api/__tests__/shipping-rates.integration.test.ts` — 9 casos

---

### HU-R04 — Actualización de estado de pedido por webhook (refinada)

> Como sistema de logística (Skydropx), necesito notificar a Merkiai sobre cambios en el estado del envío para que los pedidos se actualicen automáticamente sin intervención manual.

**Estimación:** M (5 puntos)  
**Módulo:** Webhooks · `api/webhooks/skydropx/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Evento `shipment.in_transit` | Orden actualizada a `status: 'shipped'` |
| AC-2 | Evento `shipment.out_for_delivery` | Orden actualizada a `status: 'shipped'` |
| AC-3 | Evento `shipment.delivered` | Orden actualizada a `status: 'delivered'` |
| AC-4 | Evento `shipment.exception` | Orden actualizada a `status: 'exception'` |
| AC-5 | Evento desconocido | Responde `{ ok: true }` sin modificar la BD |
| AC-6 | `tracking_number` no existe en ninguna orden | Supabase no falla (no hay fila que actualizar); responde `{ ok: true }` |
| AC-7 | Body JSON malformado | Responde 500 |
| AC-8 | Actualización exitosa | Siempre incluye `updated_at` con timestamp ISO |

**Escenarios de borde:**

- Si Skydropx reenvía el mismo evento dos veces (retry), la actualización es idempotente (misma orden, mismo status).
- El endpoint no valida una firma HMAC en esta versión; en producción se debe agregar validación de `X-Skydropx-Signature` para evitar llamadas fraudulentas.

**Criterios de rechazo:**

- El endpoint retorna 4xx en lugar de 200 para eventos desconocidos (Skydropx dejaría de enviar notificaciones).
- El `updated_at` no se actualiza junto con el `status`.

**Cobertura de tests:** `api/__tests__/webhook-skydropx.integration.test.ts` — 9 casos

---

### HU-R05 — Gestión de estado de pedido desde admin (refinada)

> Como operador de Merkiai, quiero cambiar el estado de un pedido (Pendiente → Procesando → Enviado → Entregado) desde el panel para comunicar el avance al cliente.

**Estimación:** S (2 puntos)  
**Módulo:** Admin · `app/pedidos/[id]/` + `api/admin/orders/[id]/status/route.ts`

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cambio de Pendiente a Procesando | Status actualizado; timeline resalta el nuevo paso |
| AC-2 | Cambio a Enviado | Status actualizado; campo tracking editable visible |
| AC-3 | Cambio a Entregado | Status actualizado; timeline completo |
| AC-4 | ID de orden inexistente | Responde 500 con mensaje de error |
| AC-5 | Todos los estados válidos del flujo | La API acepta y persiste cualquier estado definido |
| AC-6 | `updated_at` siempre se actualiza | El campo `updated_at` tiene el timestamp del cambio |

**Escenarios de borde:**

- Un editor (rol `editor`) no tiene acceso al cambio de estado — el RLS de Supabase bloquea la mutación.
- La regresión de estado (Entregado → Procesando) es posible desde el admin para corrección de errores operativos.

**Criterios de rechazo:**

- El cambio de estado no persiste en la BD (solo actualiza el estado visual).
- No se registra `updated_at` en el cambio.

**Cobertura de tests:** `apps/admin/api/admin/orders/__tests__/order-status.integration.test.ts` — 9 casos

---

### HU-R06 — Generación automática de guía de envío post-pago (nueva)

> Como sistema de pagos, tras confirmar un pago quiero que se genere automáticamente la guía de envío en Skydropx para que el equipo de Merkiai pueda despachar sin intervención manual.

**Estimación:** L (8 puntos)  
**Módulo:** `lib/shipping/shipments.ts` + webhooks Wompi/MercadoPago  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Pago Wompi aprobado | `createShipmentForOrder()` ejecutado; `skydropx_shipment_id`, `tracking_number` y `label_url` guardados en la orden |
| AC-2 | Pago MercadoPago aprobado | Ídem AC-1 |
| AC-3 | Skydropx falla | El webhook responde 200 de todas formas; fallo solo loguea en consola |
| AC-4 | Webhook recibido dos veces (retry) | Segunda llamada detecta `skydropx_shipment_id` existente y no crea guía duplicada |
| AC-5 | Provider = 'fixed' | `createShipmentForOrder` retorna `null` sin error |
| AC-6 | Guía creada | Se envía email de tracking al cliente |
| AC-7 | Email de tracking falla | La guía ya está guardada; el fallo de email no revierte nada |

**Criterios de rechazo:**

- El webhook retorna 500 si Skydropx falla (impediría reintentos de pago).
- Se crean guías duplicadas si el webhook se dispara dos veces.
- El `tracking_number` no se guarda en la orden.

**Cobertura de tests:** `lib/shipping/__tests__/shipments.test.ts`

---

### HU-R07 — Previsualización de artículos borrador (nueva)

> Como editor del blog, quiero poder previsualizar un artículo antes de publicarlo para verificar el formato y el contenido sin que sea visible para el público.

**Estimación:** S (2 puntos)  
**Módulo:** `api/draft/enable/route.ts` + `app/(public)/blog/[slug]/page.tsx`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Editor hace clic en "Previsualizar ↗" en un artículo borrador | Se abre `/blog/[slug]?draft=1` con banner amarillo de "modo borrador" |
| AC-2 | Artículo borrador sin cookie de draft | `notFound()` — el artículo no es accesible públicamente |
| AC-3 | URL con `?draft=1` y cookie activa | Artículo renderiza aunque `published = false` |
| AC-4 | Cookie expira después de 1 hora | El artículo vuelve a ser inaccesible |
| AC-5 | Artículo ya publicado + draft mode | Renderiza normalmente sin banner (pues `!post.published` es false) |
| AC-6 | Secret inválido en `/api/draft/enable` | Responde 401 |

**Criterios de rechazo:**

- Un visitante sin cookie puede ver artículos no publicados directamente.
- El banner de borrador aparece en artículos publicados.

---

### HU-R08 — Edición de perfil en Mi Cuenta (nueva)

> Como cliente registrado, quiero poder actualizar mi nombre y teléfono desde Mi Cuenta para que mis datos estén al día y el checkout se pre-llene correctamente.

**Estimación:** S (2 puntos)  
**Módulo:** `api/account/profile/route.ts` + `components/account/ProfileForm`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente cambia su nombre y guarda | `customers.name` y `user.displayName` actualizados |
| AC-2 | Cliente cambia su teléfono y guarda | `customers.phone` actualizado |
| AC-3 | Campo email deshabilitado | No se puede cambiar el email desde este formulario |
| AC-4 | Usuario no autenticado llama PATCH | Responde 401 |
| AC-5 | Cliente agrega una nueva dirección | Dirección guardada en `customer_addresses`; disponible en el próximo checkout |
| AC-6 | Cliente marca dirección como predeterminada | La dirección previa deja de ser predeterminada |

---

### HU-R09 — Programar recolección masiva Skydropx desde admin (nueva)

> Como operador de bodega, quiero seleccionar varios pedidos enviados y programar una recolección con Skydropx para que el transportista pase a recoger todos los paquetes en una sola visita.

**Estimación:** M (3 puntos)  
**Módulo:** `api/admin/pickups/route.ts` + `components/pedidos/PickupModal`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | No hay pedidos con guía Skydropx | Botón "Programar recolección" deshabilitado con tooltip |
| AC-2 | Operador selecciona pedidos, fecha y ventana horaria | POST a `/api/admin/pickups`; pantalla de éxito |
| AC-3 | Skydropx devuelve error | Se muestra el mensaje de error en el modal |
| AC-4 | Skydropx no está configurado | API responde 503; modal muestra error |
| AC-5 | Modal cerrado antes de enviar | Estado se resetea; no se hace ningún request |

---

### HU-R10 — Variantes genéricas (colores, tallas y otros atributos)

> Como administrador de productos, quiero definir atributos libres para las variantes (color, talla, material, etc.) para que la tienda muestre swatches visuales y filtros adecuados sin estar restringida a café.

**Estimación:** L (5 puntos)  
**Módulo:** `lib/variant-utils.ts` · `components/shop/ShopClient.tsx` · `components/shop/ProductDetail.tsx` · `admin/productos/ProductForm.tsx` · migración `14_product_variants_extended.sql`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Producto tiene `variant_options: ["Color","Talla"]` | Tienda muestra selectores de color y talla |
| AC-2 | Valor de variante es un color (ej. "Rojo") | Se renderiza un swatch con el hex correspondiente |
| AC-3 | Producto tiene múltiples precios | Tarjeta muestra "Desde $X" en lugar de precio único |
| AC-4 | Producto sin `variant_options` JSONB | Sistema usa campos legacy `roast`/`weight`/`grind` sin cambios |
| AC-5 | Variante no disponible para combinación seleccionada | Opción aparece tachada y no puede añadirse al carrito |
| AC-6 | Admin define opciones en ProductForm | `variant_options` y `attributes` se guardan correctamente |

---

### HU-R11 — Selector de transportadora en checkout

> Como cliente, quiero ver las opciones de envío disponibles con su precio y tiempo de entrega para elegir la que prefiero antes de pagar.

**Estimación:** M (3 puntos)  
**Módulo:** `components/checkout/CheckoutClient.tsx` · `api/checkout/route.ts` · `packages/database/src/queries/orders.ts`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente completa datos de envío y pulsa "Ver opciones de envío →" | Se muestran tarifas con carrier, servicio, días y precio |
| AC-2 | Se muestra spinner mientras se calculan las tarifas | Botón deshabilitado; texto "Calculando opciones de envío…" |
| AC-3 | No hay tarifas disponibles | Mensaje ámbar; puede continuar con tarifa fija de respaldo |
| AC-4 | Cliente cambia ciudad o departamento | Tarifas se resetean; debe recalcular antes de continuar |
| AC-5 | Cliente selecciona una tarifa y confirma pedido | `carrier_name` y `skydropx_rate_id` quedan en la orden de BD |
| AC-6 | Proveedor configurado es tarifa fija | No aparece el paso de "Ver opciones"; continúa directo al pago |

---

### HU-R12 — Comboboxes de departamento/ciudad Colombia

> Como cliente, quiero elegir mi departamento y ciudad desde listas con búsqueda filtrada para reducir errores tipográficos en la dirección de envío.

**Estimación:** S (2 puntos)  
**Módulo:** `lib/colombia-locations.ts` · `components/ui/SearchableSelect.tsx` · `CheckoutClient.tsx` · `AddressesForm.tsx` · `ShippingConfigForm.tsx` (admin)  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente abre combobox de departamento | Lista de 33 departamentos ordenada alfabéticamente con filtro |
| AC-2 | Cliente selecciona departamento | Ciudad se limpia y se carga la lista del departamento elegido |
| AC-3 | Ciudad deshabilitada sin departamento | Placeholder "Elige departamento primero"; no es clickeable |
| AC-4 | Ciudad aparece en múltiples departamentos (ej. "Buenaventura") | No hay error de clave duplicada en React |
| AC-5 | Navegación por teclado (↑↓ Enter Escape) | El combobox responde correctamente a todas las teclas |

---

### HU-R13 — Editar y eliminar direcciones en Mi Cuenta

> Como cliente, quiero poder corregir o eliminar mis direcciones guardadas para mantener mi libreta de direcciones actualizada.

**Estimación:** S (2 puntos)  
**Módulo:** `api/account/addresses/[id]/route.ts` · `components/account/AddressesForm.tsx`  
**Estado:** ✅ Implementado

**Criterios de aceptación:**

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| AC-1 | Cliente pulsa "Editar" en una dirección | Aparece formulario inline con datos precargados |
| AC-2 | Cliente guarda cambios | Se llama PATCH; datos actualizados en BD y UI |
| AC-3 | Cliente marca como predeterminada | La anterior predeterminada deja de serlo |
| AC-4 | Cliente elimina una dirección (con confirmación) | Dirección eliminada de BD y desaparece de la lista |
| AC-5 | Usuario no autenticado llama PATCH/DELETE | API responde 401 |
| AC-6 | Intento de editar/eliminar dirección de otro cliente | API responde 404 |

---

---

