/**
 * SectionRenderer
 *
 * Componente de servidor que despacha una page_section al componente
 * visual correcto según su section_type.
 *
 * Tipos soportados:
 *   hero         → HeroSection      (imagen, título, subtítulo, CTA)
 *   text         → TextSection      (título + cuerpo de texto)
 *   cards        → CardsSection     (grid de tarjetas con ítems)
 *   faq          → FaqSection       (acordeón de preguntas/respuestas)
 *   cta          → CtaSection       (llamada a acción centrada)
 *   testimonials → TestimonialsSection (carrusel de testimonios)
 *   whatsapp     → WhatsAppSection  (botón/formulario de WhatsApp)
 */
import type { PageSection, SectionItem } from '@merkiai/database'

import HeroSection         from './HeroSection'
import TextSection         from './TextSection'
import CardsSection        from './CardsSection'
import FaqSection          from './FaqSection'
import CtaSection          from './CtaSection'
import TestimonialsSection from './TestimonialsSection'
import WhatsAppSection     from './WhatsAppSection'
import ContentSection      from './ContentSection'
import ColumnsSection      from './ColumnsSection'
import MediaBanner         from './MediaBanner'
import SpacerSection       from './SpacerSection'
import SectionShell        from './SectionShell'

interface Props {
  section: PageSection & { items: SectionItem[] }
  pageKey: string
  whatsappNumber?: string | null
}

export default function SectionRenderer({ section, pageKey, whatsappNumber }: Props) {
  if (!section.enabled) return null
  // HU-253 · estilo compartido (fondo/espaciado) desde settings.style_*.
  return <SectionShell settings={section.settings}>{renderSection(section, pageKey, whatsappNumber)}</SectionShell>
}

function renderSection(
  section: PageSection & { items: SectionItem[] },
  _pageKey: string,
  whatsappNumber?: string | null,
) {
  switch (section.section_type) {
    case 'hero':
      return <HeroSection section={section} />

    case 'text':
      return <TextSection section={section} />

    case 'cards':
      return <CardsSection section={section} items={section.items} />

    case 'faq':
      return <FaqSection section={section} items={section.items} />

    case 'cta':
      return <CtaSection section={section} />

    case 'testimonials':
      // Los testimonios ahora son section_items — sin fetch adicional
      return <TestimonialsSection section={section} items={section.items} />

    case 'whatsapp':
      return <WhatsAppSection section={section} whatsappNumber={whatsappNumber} />

    // HU-252 · bloques genéricos de layout
    case 'content_section':
      return <ContentSection section={section} />

    case 'columns':
      return <ColumnsSection section={section} items={section.items} />

    case 'media_banner':
      return <MediaBanner section={section} />

    case 'spacer':
      return <SpacerSection section={section} />

    default:
      // Tipo desconocido: renderizar como texto plano para no perder contenido
      return <TextSection section={section} />
  }
}
