import Link from 'next/link'
import type { PageSection } from '@merkiai/database'

interface Props {
  section: PageSection
}

/** HU-252 · Sección de contenido genérica: encabezado + texto + imagen + botón,
 *  con disposición configurable (imagen izq/der/arriba / solo texto). */
export default function ContentSection({ section }: Props) {
  const settings = (section.settings ?? {}) as Record<string, unknown>
  const layout = (settings.layout as string) || 'image-right'
  const hasImage = !!section.image_url && layout !== 'text-only'

  const text = (
    <div className={layout === 'image-top' ? 'text-center max-w-3xl mx-auto' : 'flex-1'}>
      {section.title && (
        <h2 className="font-display text-brand-primary leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 3rem)' }}>
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p className="font-brand text-brand-primary/70 text-lg mb-5 leading-relaxed">{section.subtitle}</p>
      )}
      {section.body && (
        <div className="space-y-4 font-brand text-brand-primary/70 leading-relaxed">
          {section.body.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
      {section.cta_label && section.cta_url && (
        <Link href={section.cta_url} className="inline-block mt-6 bg-brand-primary text-brand-cream rounded-full px-7 py-3 font-brand font-medium hover:bg-brand-dark transition-colors">
          {section.cta_label}
        </Link>
      )}
    </div>
  )

  const media = hasImage && (
    <div className={layout === 'image-top' ? 'mb-10' : 'flex-1'}>
      <img src={section.image_url!} alt={section.title ?? ''} className="w-full rounded-3xl object-cover shadow-card" />
    </div>
  )

  if (!section.title && !section.body && !hasImage) return null

  if (layout === 'image-top' || layout === 'text-only') {
    return (
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {media}
          {text}
        </div>
      </section>
    )
  }

  return (
    <section className="py-20">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 lg:gap-16 items-center ${layout === 'image-left' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        {text}
        {media}
      </div>
    </section>
  )
}
