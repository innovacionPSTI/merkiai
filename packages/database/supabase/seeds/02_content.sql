-- ============================================================
-- seeds/02_content.sql — Contenido CMS base (neutro)
-- ============================================================
-- Ejecutar DESPUÉS de 01_schema.sql y 01_config.sql.
-- Crea la estructura mínima del sitio: layout del home + páginas legales.
-- Idempotente: usa ON CONFLICT DO NOTHING / WHERE NOT EXISTS.
--
-- Este seed NO incluye contenido de ejemplo de ningún vertical.
-- Es un punto de partida limpio: personalízalo desde el panel de administración
-- (páginas, secciones, textos e imágenes son totalmente configurables).
-- ============================================================

-- ── Páginas ──────────────────────────────────────────────────────────────────
-- Solo las páginas estructurales/legales. Crea el resto desde el admin.

INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index) VALUES
  ('privacy', 'Política de privacidad', 'privacy', 'custom', true, false, 90),
  ('terms',   'Términos y condiciones', 'terms',   'custom', true, false, 91)
ON CONFLICT (key) DO NOTHING;

-- ── HOME — layout base ────────────────────────────────────────────────────────
-- Secciones estructurales del home. Los productos y posts se cargan dinámicamente.

INSERT INTO page_sections (page_key, section_type, title, enabled, order_index, settings) VALUES
  ('home', 'hero',              'Carrusel principal',   true,  0, '{}'),
  ('home', 'featured_products', 'Productos destacados',  true, 10, '{}'),
  ('home', 'best_sellers',      'Más vendidos',          true, 20, '{}'),
  ('home', 'blog_preview',      'Del blog',              true, 30, '{}'),
  ('home', 'newsletter',        'Newsletter',            true, 40, '{}')
ON CONFLICT DO NOTHING;

-- Hero: un slide de bienvenida genérico (edítalo o añade más desde el admin)
WITH sec AS (SELECT id FROM page_sections WHERE page_key='home' AND section_type='hero' LIMIT 1)
INSERT INTO section_items
  (section_id, item_type, title, description, cta_text, link_url, enabled, order_index, metadata)
SELECT sec.id,'slide','Bienvenido a tu tienda',
  'Configura este mensaje, las imágenes y los productos desde el panel de administración.',
  'Ver productos','/shop',true,1,
  '{"bg_color":"#1E293B"}'::jsonb FROM sec
ON CONFLICT DO NOTHING;

-- ── PÁGINAS LEGALES ───────────────────────────────────────────────────────────
-- Plantillas genéricas de e-commerce. Revísalas y ajústalas a tu operación.

INSERT INTO page_sections (page_key, section_type, title, body, enabled, order_index)
SELECT 'privacy','text','Política de privacidad',
$$## Política de privacidad

Esta política describe cómo recopilamos, usamos y protegemos tu información personal.

### Información que recopilamos
Recopilamos la información que nos proporcionas al realizar una compra, registrarte o suscribirte a nuestro boletín: nombre, correo electrónico, dirección de envío y datos de pago.

### Uso de la información
- Procesar y enviar tus pedidos.
- Comunicarnos sobre el estado de tu pedido.
- Enviarte ofertas si te suscribiste al boletín.
- Mejorar nuestros productos y atención al cliente.

### Compartir información
No vendemos ni cedemos tu información personal a terceros, salvo a los proveedores necesarios para procesar pagos y realizar envíos.

### Seguridad
Tomamos medidas razonables para proteger tu información personal contra accesos no autorizados.

### Contacto
Si tienes preguntas, contáctanos a través de los canales indicados en el sitio.$$,
true,1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_key='privacy');

INSERT INTO page_sections (page_key, section_type, title, body, enabled, order_index)
SELECT 'terms','text','Términos y condiciones',
$$## Términos y condiciones

Al acceder y usar este sitio, aceptas los siguientes términos y condiciones.

### Productos y precios
Los precios están expresados en la moneda indicada e incluyen impuestos cuando aplica. Nos reservamos el derecho de modificar precios sin previo aviso.

### Pedidos y pagos
Al realizar un pedido, garantizas que la información proporcionada es verídica y que estás autorizado a usar el método de pago seleccionado.

### Envíos
Los tiempos de entrega son estimados y pueden variar según la zona de destino y disponibilidad del transportador.

### Devoluciones
Aceptamos devoluciones dentro de los primeros 15 días calendario desde la recepción del producto, en su estado original.

### Propiedad intelectual
Todo el contenido de este sitio (imágenes, textos, logotipos) es propiedad de la empresa.

### Contacto
Para consultas sobre estos términos, contáctanos a través de los canales indicados en el sitio.$$,
true,1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_key='terms');
