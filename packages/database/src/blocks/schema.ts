/**
 * blocks/schema.ts — Contrato único de bloques (HU-218 · paso 1).
 *
 * Fuente de verdad **declarativa** de qué es configurable en cada tipo de
 * sección (`page_sections.section_type`). Una sola definición por tipo que
 * alimenta las tres capas que hoy están sueltas:
 *   · render web  — el bloque lee de un `section` con esta forma;
 *   · editor admin — `<SectionEditor>` genera el formulario desde el schema;
 *   · validación   — zod se deriva de este mismo schema.
 *
 * Regla de consistencia (dónde vive cada campo):
 *   · `storage: 'column'`   → columna tipada de `page_sections`
 *                             (title/subtitle/body/image_url/cta_label/cta_url).
 *                             Base COMÚN que cualquier bloque puede reutilizar.
 *   · `storage: 'settings'` → dentro de `page_sections.settings` (JSONB).
 *                             Todo lo específico del tipo va aquí, DECLARADO.
 *   · `storage: 'metadata'` → dentro de `section_items.metadata` (JSONB),
 *                             solo para campos de ítems repetibles.
 *
 * Módulo puro (sin React): vive en @merkiai/database para que web y admin lo
 * compartan. La correspondencia `section_type → componente React` (registry de
 * presentación) vive en el storefront; aquí solo está el CONTRATO de datos.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type BlockFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'image'
  | 'url'
  | 'boolean'
  | 'number'
  | 'select'
  | 'icon'
  | 'color'

export interface BlockField {
  /** Etiqueta visible en el editor admin. */
  label: string
  type: BlockFieldType
  /** Dónde se persiste el valor. */
  storage: 'column' | 'settings' | 'metadata'
  /** Nombre real de la columna/clave cuando difiere del key del campo. */
  key?: string
  /** Opciones para `type: 'select'`. */
  options?: readonly { value: string; label: string }[]
  placeholder?: string
  /** Texto de ayuda bajo el campo. */
  help?: string
  /** Valor por defecto (fallback de render y del formulario). */
  default?: string | number | boolean
  required?: boolean
}

export interface BlockItemSchema {
  /** `section_items.item_type` que agrupa estos ítems. */
  itemType: string
  label: string
  labelPlural: string
  /** Campos de cada ítem (storage 'column' = columna de section_items). */
  fields: Record<string, BlockField>
}

export interface BlockDataSource {
  /** Datos dinámicos que el bloque consume del repositorio/contexto. */
  kind:
    | 'products.featured'
    | 'products.bestSellers'
    | 'products.categories'
    | 'blog.recent'
  /** Parámetros de la fuente editables (p. ej. cuántos ítems). */
  params?: Record<string, BlockField>
}

export interface BlockSchema {
  /** `page_sections.section_type`. */
  type: string
  label: string
  description: string
  category: 'content' | 'commerce' | 'engagement'
  /** Campos configurables (además de la base común de columnas). */
  fields: Record<string, BlockField>
  /** Ítems repetibles (hero slides, servicios, cards, faqs…). */
  items?: BlockItemSchema
  /** Fuente de datos dinámica (productos/blog); su copy sí se edita aquí. */
  source?: BlockDataSource
  /**
   * Función de sistema asociada: su CONFIG (llaves, suscriptores, envío) vive
   * FUERA del bloque, en su área de Funciones. El bloque solo lleva copy.
   */
  feature?: 'newsletter'
}

// ── Campos comunes reutilizables (columnas de page_sections) ─────────────────

const F = {
  title:    (label = 'Título'):    BlockField => ({ label, type: 'text',     storage: 'column' }),
  subtitle: (label = 'Subtítulo'): BlockField => ({ label, type: 'textarea', storage: 'column' }),
  body:     (label = 'Contenido'): BlockField => ({ label, type: 'richtext', storage: 'column' }),
  image:    (label = 'Imagen'):    BlockField => ({ label, type: 'image',    storage: 'column' }),
  ctaLabel: (label = 'Texto del botón'): BlockField => ({ label, type: 'text', storage: 'column', key: 'cta_label' }),
  ctaUrl:   (label = 'Enlace del botón'): BlockField => ({ label, type: 'url', storage: 'column', key: 'cta_url' }),
} as const

// ── Ítems reutilizables ──────────────────────────────────────────────────────

const SLIDE_ITEM: BlockItemSchema = {
  itemType: 'slide',
  label: 'Slide',
  labelPlural: 'Slides',
  fields: {
    title:            { label: 'Título',            type: 'text',  storage: 'column' },
    description:      { label: 'Texto',             type: 'textarea', storage: 'column' },
    image_url:        { label: 'Imagen (desktop)',  type: 'image', storage: 'column' },
    image_url_mobile: { label: 'Imagen (móvil)',    type: 'image', storage: 'column' },
    cta_text:         { label: 'Texto del botón',   type: 'text',  storage: 'column' },
    link_url:         { label: 'Enlace',            type: 'url',   storage: 'column' },
    bg_color:         { label: 'Color de fondo',    type: 'color', storage: 'metadata' },
  },
}

const SERVICE_ITEM: BlockItemSchema = {
  itemType: 'service',
  label: 'Servicio',
  labelPlural: 'Servicios',
  fields: {
    icon:        { label: 'Ícono',           type: 'icon',     storage: 'column' },
    title:       { label: 'Título',          type: 'text',     storage: 'column' },
    description: { label: 'Descripción',      type: 'textarea', storage: 'column' },
    cta_text:    { label: 'Texto del botón',  type: 'text',     storage: 'column' },
    link_url:    { label: 'Enlace',           type: 'url',      storage: 'column' },
    bg_color:    { label: 'Color de fondo',   type: 'color',    storage: 'metadata' },
  },
}

const CARD_ITEM: BlockItemSchema = {
  itemType: 'card',
  label: 'Tarjeta',
  labelPlural: 'Tarjetas',
  fields: {
    icon:        { label: 'Ícono',       type: 'icon',     storage: 'column' },
    title:       { label: 'Título',      type: 'text',     storage: 'column' },
    description: { label: 'Descripción', type: 'textarea', storage: 'column' },
    image_url:   { label: 'Imagen',      type: 'image',    storage: 'column' },
    link_url:    { label: 'Enlace',      type: 'url',      storage: 'column' },
  },
}

const FAQ_ITEM: BlockItemSchema = {
  itemType: 'faq',
  label: 'Pregunta',
  labelPlural: 'Preguntas',
  fields: {
    question: { label: 'Pregunta',  type: 'text',     storage: 'column' },
    answer:   { label: 'Respuesta', type: 'textarea', storage: 'column' },
  },
}

// ── Registro de esquemas por tipo de sección ─────────────────────────────────
// Cubre los 13 `section_type` permitidos por el CHECK de page_sections.

export const blockSchemas: Record<string, BlockSchema> = {
  hero: {
    type: 'hero',
    label: 'Carrusel principal',
    description: 'Slides a pantalla completa en la cabecera de la página.',
    category: 'content',
    fields: {},
    items: SLIDE_ITEM,
  },

  featured_products: {
    type: 'featured_products',
    label: 'Productos destacados',
    description: 'Muestra los productos marcados como destacados.',
    category: 'commerce',
    fields: { title: F.title('Título de la sección') },
    source: {
      kind: 'products.featured',
      params: { limit: { label: 'Cantidad', type: 'number', storage: 'settings', default: 3 } },
    },
  },

  services: {
    type: 'services',
    label: 'Servicios',
    description: 'Fila de servicios o beneficios con ícono.',
    category: 'content',
    fields: {},
    items: SERVICE_ITEM,
  },

  best_sellers: {
    type: 'best_sellers',
    label: 'Más vendidos + categorías',
    description: 'Grid de productos más vendidos junto al listado de categorías.',
    category: 'commerce',
    fields: { title: { label: 'Título', type: 'text', storage: 'settings', default: 'Tienda' } },
    source: {
      kind: 'products.bestSellers',
      params: { limit: { label: 'Cantidad', type: 'number', storage: 'settings', default: 4 } },
    },
  },

  historia: {
    type: 'historia',
    label: 'Bloque de historia',
    description: 'Banner con imagen de fondo, título, subtítulo y botón.',
    category: 'content',
    fields: {
      title:    { label: 'Título',   type: 'text',     storage: 'settings', default: 'Vivir para Servir' },
      subtitle: { label: 'Subtítulo', type: 'textarea', storage: 'settings' },
      cta_text: { label: 'Texto del botón', type: 'text', storage: 'settings', default: 'Conoce nuestra historia →' },
      cta_url:  { label: 'Enlace del botón', type: 'url', storage: 'settings', default: '/nosotros' },
    },
  },

  blog_preview: {
    type: 'blog_preview',
    label: 'Avance del blog',
    description: 'Muestra los artículos más recientes del blog.',
    category: 'content',
    fields: { title: { label: 'Título', type: 'text', storage: 'settings', default: 'Notas de Café' } },
    source: {
      kind: 'blog.recent',
      params: { limit: { label: 'Cantidad de artículos', type: 'number', storage: 'settings', default: 2 } },
    },
  },

  newsletter: {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Formulario de suscripción. La configuración de envío vive en Funciones › Emails.',
    category: 'engagement',
    feature: 'newsletter',
    fields: {
      title:     { label: 'Título',    type: 'text',     storage: 'settings' },
      subtitle:  { label: 'Subtítulo', type: 'textarea', storage: 'settings' },
      cta_label: { label: 'Texto del botón', type: 'text', storage: 'settings' },
    },
  },

  // ── Bloques genéricos de página (about/custom/services pages) ───────────────
  text: {
    type: 'text',
    label: 'Texto',
    description: 'Bloque de contenido de texto enriquecido.',
    category: 'content',
    fields: { title: F.title(), subtitle: F.subtitle(), body: F.body() },
  },

  cards: {
    type: 'cards',
    label: 'Tarjetas',
    description: 'Grid de tarjetas con ícono/imagen, título y descripción.',
    category: 'content',
    fields: { title: F.title('Título de la sección'), subtitle: F.subtitle() },
    items: CARD_ITEM,
  },

  faq: {
    type: 'faq',
    label: 'Preguntas frecuentes',
    description: 'Acordeón de preguntas y respuestas.',
    category: 'content',
    fields: { title: F.title('Título de la sección') },
    items: FAQ_ITEM,
  },

  cta: {
    type: 'cta',
    label: 'Llamado a la acción',
    description: 'Banner con título, texto y un botón.',
    category: 'engagement',
    fields: {
      title: F.title(),
      subtitle: F.subtitle(),
      cta_label: F.ctaLabel(),
      cta_url: F.ctaUrl(),
      image_url: F.image('Imagen de fondo'),
    },
  },

  testimonials: {
    type: 'testimonials',
    label: 'Testimonios',
    description: 'Opiniones de clientes.',
    category: 'engagement',
    fields: {
      title: F.title('Título de la sección'),
      filter_by_page: { label: 'Filtrar por página', type: 'boolean', storage: 'settings', default: false },
    },
    items: {
      itemType: 'testimonial',
      label: 'Testimonio',
      labelPlural: 'Testimonios',
      fields: {
        title:       { label: 'Nombre',   type: 'text',     storage: 'column' },
        description: { label: 'Opinión',  type: 'textarea', storage: 'column' },
        image_url:   { label: 'Foto',     type: 'image',    storage: 'column' },
        rating:      { label: 'Calificación (1-5)', type: 'number', storage: 'metadata', default: 5 },
        role:        { label: 'Rol/Cargo', type: 'text',    storage: 'metadata' },
      },
    },
  },

  whatsapp: {
    type: 'whatsapp',
    label: 'Botón de WhatsApp',
    description: 'CTA flotante o en sección hacia WhatsApp.',
    category: 'engagement',
    fields: {
      title: F.title(),
      subtitle: F.subtitle(),
      message_type: {
        label: 'Tipo de mensaje',
        type: 'select',
        storage: 'settings',
        default: 'general',
        options: [
          { value: 'ventas',   label: 'Ventas' },
          { value: 'soporte',  label: 'Soporte' },
          { value: 'general',  label: 'General' },
        ],
      },
    },
  },
}

// ── Templates ────────────────────────────────────────────────────────────────
// Un Template define el **layout** de la home (orden de tipos de bloque) y,
// opcionalmente, **defaults por bloque** que sobreescriben el default genérico
// del schema cuando la sección no trae valor. Agregar un template = nueva
// entrada aquí (+ variantes de componente en el registry del storefront). Base
// del selector del admin (HU-218.5) y de los templates por nicho (HU-220/221).

export interface Template {
  name: string
  label: string
  description?: string
  /** Orden de tipos de bloque que compone la home. */
  layout: readonly string[]
  /** Defaults por tipo de bloque: `{ [section_type]: { [campo]: valor } }`. */
  blockDefaults?: Record<string, Record<string, unknown>>
}

export const templates: Record<string, Template> = {
  default: {
    name: 'default',
    label: 'Predeterminado',
    description: 'Diseño completo: héroe, destacados, servicios, más vendidos, historia, blog y newsletter.',
    layout: ['hero', 'featured_products', 'services', 'best_sellers', 'historia', 'blog_preview', 'newsletter'],
  },
  esencial: {
    name: 'esencial',
    label: 'Esencial',
    description: 'Portada mínima: héroe, productos destacados y newsletter. Ideal para lanzar rápido.',
    layout: ['hero', 'featured_products', 'newsletter'],
    blockDefaults: {
      featured_products: { title: 'Lo nuevo' },
    },
  },
}

/** Presets de layout por template (derivado de `templates`; compat). */
export const TEMPLATE_HOME_LAYOUTS: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(templates).map(([k, t]) => [k, t.layout]),
)

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getBlockSchema(type: string): BlockSchema | undefined {
  return blockSchemas[type]
}

/** Forma mínima de una fila de `page_sections` para resolver campos. */
export interface SectionLike {
  title?: string | null
  subtitle?: string | null
  body?: string | null
  image_url?: string | null
  cta_label?: string | null
  cta_url?: string | null
  settings?: unknown
  [k: string]: unknown
}

/**
 * Resuelve los campos configurables de una sección **según el contrato** del
 * schema: cada campo se lee de su `storage` (columna o `settings`) y cae a su
 * `default`. Es la lectura ÚNICA que comparten render web y editor admin — así
 * un bloque nunca vuelve a leer `settings`/columnas de forma ad-hoc.
 */
export function resolveBlockFields(
  type: string,
  section?: SectionLike | null,
  template?: string,
): Record<string, unknown> {
  const schema = blockSchemas[type]
  if (!schema) return {}
  const settings = (section?.settings ?? {}) as Record<string, unknown>
  // Defaults del template (si hay) tienen prioridad sobre el default genérico
  // del schema, pero NUNCA sobre un valor real de la sección.
  const overrides = (template ? templates[template]?.blockDefaults?.[type] : undefined) ?? {}
  const out: Record<string, unknown> = {}
  for (const [key, f] of Object.entries(schema.fields)) {
    let v: unknown
    if (f.storage === 'column') v = section ? section[f.key ?? key] : undefined
    else if (f.storage === 'settings') v = settings[key]
    if (v === undefined || v === null || v === '') v = overrides[key] ?? f.default
    out[key] = v
  }
  return out
}

/** Orden de bloques de la home para un template (fallback a 'default'). */
export function getTemplateHomeLayout(template = 'default'): readonly string[] {
  return templates[template]?.layout ?? templates.default.layout
}

/** Templates disponibles (para el selector del admin). */
export function listTemplates(): Template[] {
  return Object.values(templates)
}

export function getTemplate(name = 'default'): Template {
  return templates[name] ?? templates.default
}

/** Tipos de sección disponibles para el constructor de páginas. */
export function listBlockTypes(): BlockSchema[] {
  return Object.values(blockSchemas)
}
