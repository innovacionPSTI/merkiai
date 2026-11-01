# Merkiai — Resumen Ejecutivo

> **Propiedad y comercialización.** Merkiai es un producto de **Néstor Cardona**,
> comercializado **exclusivamente a través de los canales de ParqueSoft TI**. La
> marca es **Merkiai** con la referencia **«Powered by ParqueSoft TI»** en la
> consola, el panel de administración y la futura página comercial.

## Qué es
Merkiai es una **plataforma SaaS multi-tienda white-label**: desde un mismo
despliegue, muchos negocios tienen su sitio y venden en línea, gestionan su
contenido y administran su operación, cada uno con su marca y sus datos
**aislados por frontera dura**. Su diferenciador es que **el producto se arma por
plan**: el cliente activa solo los módulos que necesita —desde una página de
presencia hasta una tienda, un punto de venta o un portal— sobre un mismo núcleo,
sin desarrollos a la medida por cada caso.

## Estado hoy (listo para producción)
El **núcleo de comercio electrónico está completo y probado**:
- Tienda en línea completa (catálogo, página de producto, carrito, checkout).
- **Pagos, envíos y correo intercambiables** sin código, con cobros seguros
  (confirmación por estado real, anti-fraude de precio, idempotencia).
- **Constructor de sitios** visual completo (páginas, navegación, estilos,
  contenido dirigido por datos, estructuras de sitio por plan).
- **Panel de administración** (catálogo, pedidos, reportes, roles, respaldos,
  importación/exportación, auditoría).
- **Plataforma multi-tienda** con aislamiento por tenant, planes y entitlements,
  presets de arranque y dominios propios.
- **Marketing y fidelización** (promociones, cupones, club de acceso anticipado).

Respaldo de calidad: **~1.180 pruebas automatizadas en verde** y verificación de
tipos limpia en las tres aplicaciones.

## Capacidades por plan
| Peldaño | Para quién | Disponibilidad |
|---|---|---|
| Presencia (landing) | Sitio informativo | ✅ Hoy |
| Vitrina (catálogo) | Consulta/cotización | ✅ Hoy |
| Comercio electrónico | Venta en línea | ✅ Hoy |
| Punto de venta / operación | Retail, local físico | 🔜 Roadmap |
| Servicio en sala | Restaurante/cafetería | 🔜 Roadmap |
| Manufactura/transformación | Producción con materia prima | 🔜 Roadmap |
| Institucional / servicios | Portal, cobros recurrentes | 🔜 Roadmap |

## Hoja de ruta de liberación (alto nivel)
1. **SaaS comercial productivo** — cerrar el cobro por suscripción y el
   aprovisionamiento comercial para **vender la plataforma a múltiples clientes**.
2. **Fundación de operaciones e inventario** — libro de movimientos de inventario,
   multi-ubicación, compras, recetas y costeo (base para punto de venta y
   manufactura).
3. **Punto de venta offline-first** — venta presencial que **no se detiene sin
   conexión** y sincroniza al reconectar.
4. **Servicio en sala y manufactura** — restaurante/cafetería y producción.
5. **Vertical servicios/educación e institucional** — cobros recurrentes, trámites
   y portales.

*Transversal:* capa de inteligencia artificial, conectores de facturación/contable
(solo integración) y endurecimiento de seguridad se incorporan de forma progresiva.
Las ventanas de tiempo dependen de la capacidad y la priorización comercial.

## Principios de diseño (por qué escala)
- **Un solo núcleo, revelado por plan:** sin bifurcaciones por vertical ni lógica
  atada a un cliente; cada negocio es una configuración de datos.
- **Integraciones intercambiables:** proveedores de pago/envío/correo (y a futuro,
  facturación y contable) entran sin tocar el núcleo.
- **Anti-ERP por decisión:** lo fiscal y contable se resuelve **por integración**,
  no reconstruyendo un ERP.
- **Cero regresión:** cada avance es opt-in y no afecta a lo ya operativo.

## Conclusión
Merkiai está **listo para comercializarse como plataforma de comercio electrónico
multi-tienda hoy**, y tiene una hoja de ruta clara y modular para crecer hacia
**operaciones, punto de venta y verticales**, manteniendo un único producto que se
adapta por plan a cada necesidad.
