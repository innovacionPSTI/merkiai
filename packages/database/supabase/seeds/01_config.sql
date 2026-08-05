-- ============================================================
-- seeds/01_config.sql — Datos de configuración base
-- ============================================================
-- Ejecutar DESPUÉS de 01_schema.sql.
-- Solo contiene la fila inicial de configuración.
-- Personalizar antes del primer despliegue.
-- ============================================================

-- ── Tema por defecto (paleta neutra) ─────────────────────────────────────────
-- Debe existir un tema activo. La paleta es un punto de partida neutro;
-- personalízala desde el panel de administración.
INSERT INTO themes (
  name, is_active, is_default,
  color_primary, color_dark, color_cream, color_cream_warm,
  color_yellow, color_yellow_pale, color_text,
  font_display, font_body
) VALUES (
  'Tema base', true, true,
  '#334155', '#1E293B', '#F8FAFC', '#F1F5F9',
  '#6366F1', '#E0E7FF', '#0F172A',
  'cormorant', 'dm-sans'
) ON CONFLICT DO NOTHING;

-- ── Tipos de variante ────────────────────────────────────────────────────────
-- Sin ejemplos: crea los tipos de variante de tu catálogo desde el admin.

-- ── Categorías de producto ───────────────────────────────────────────────────
-- Sin ejemplos: crea tus categorías desde el admin.

-- ── Nav items base ───────────────────────────────────────────────────────────
-- Menú mínimo. Añade, reordena o vincula páginas CMS desde el admin.
INSERT INTO nav_items (nav_key, label, href, enabled, order_index) VALUES
  ('home-1',  'Inicio',  '/',     true, 1),
  ('shop-2',  'Tienda',  '/shop', true, 2),
  ('blog-3',  'Blog',    '/blog', true, 3)
ON CONFLICT (nav_key) DO NOTHING;

-- ── Configuración visual del panel de administración ────────────────────────
-- Paleta corporativa slate/indigo — independiente del tema del sitio web.
INSERT INTO admin_config (id, accent_color, sidebar_color)
VALUES (1, '#4F46E5', '#0F172A')
ON CONFLICT DO NOTHING;
