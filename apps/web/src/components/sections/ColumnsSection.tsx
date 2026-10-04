import Link from 'next/link'
import type { PageSection, SectionItem } from '@merkiai/database'

interface Props {
  section: PageSection
  items: SectionItem[]
}

const COLS: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

/** HU-252 · Rejilla de columnas con ícono/imagen, título, texto y enlace. */
export default function ColumnsSection({ section, items }: Props) {
  const enabled = items.filter((i) => i.enabled)
  if (enabled.length === 0 && !section.title) return null

  const settings = (section.settings ?? {}) as Record<string, unknown>
  const cols = COLS[(settings.columns as string) ?? '3'] ?? COLS['3']
  const align = (settings.align as string) === 'left' ? 'text-left items-start' : 'text-center items-center'

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="font-display text-brand-primary text-section text-center mb-4">{section.title}</h2>
        )}
        {section.subtitle && (
          <p className="font-brand text-brand-primary/60 text-center mb-12 max-w-xl mx-auto">{section.subtitle}</p>
        )}
        {!section.subtitle && section.title && <div className="mb-12" />}

        {enabled.length > 0 && (
          <div className={`grid ${cols} gap-8`}>
            {enabled.map((item) => (
              <div key={item.id} className={`flex flex-col ${align}`}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title ?? ''} className="w-full h-44 object-cover rounded-2xl mb-4" />
                ) : item.icon ? (
                  <div className="text-4xl mb-4">{item.icon}</div>
                ) : null}
                {item.title && <h3 className="font-brand font-semibold text-brand-primary text-lg mb-2">{item.title}</h3>}
                {item.description && <p className="font-brand text-brand-primary/60 text-sm leading-relaxed">{item.description}</p>}
                {item.cta_text && item.link_url && (
                  <Link href={item.link_url} className="font-brand text-sm text-brand-primary underline hover:no-underline mt-3">{item.cta_text}</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
