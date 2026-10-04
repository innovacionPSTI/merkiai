import Link from 'next/link'
import type { PageSection } from '@merkiai/database'

interface Props {
  section: PageSection
}

const HEIGHTS: Record<string, string> = {
  small:  'min-h-[280px]',
  medium: 'min-h-[420px]',
  large:  'min-h-[560px]',
  full:   'min-h-screen',
}

/** HU-252 · Banner de medios: imagen o video full-bleed + overlay + texto + CTA. */
export default function MediaBanner({ section }: Props) {
  const settings = (section.settings ?? {}) as Record<string, unknown>
  const height = HEIGHTS[(settings.height as string) ?? 'medium'] ?? HEIGHTS.medium
  const overlay = settings.overlay !== false
  const videoUrl = settings.video_url as string | undefined

  return (
    <section className={`relative ${height} flex items-center justify-center overflow-hidden`}>
      {videoUrl ? (
        <video className="absolute inset-0 w-full h-full object-cover" src={videoUrl} autoPlay muted loop playsInline aria-hidden="true" />
      ) : section.image_url ? (
        <img className="absolute inset-0 w-full h-full object-cover" src={section.image_url} alt={section.title ?? ''} />
      ) : (
        <div className="absolute inset-0 bg-brand-dark" />
      )}
      {overlay && <div className="absolute inset-0 bg-brand-text/50" />}

      <div className="relative z-10 text-center px-6 max-w-3xl">
        {section.title && (
          <h2 className="font-display text-brand-cream leading-none mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}>{section.title}</h2>
        )}
        {section.subtitle && <p className="font-brand text-brand-cream/80 text-lg mb-8 max-w-xl mx-auto">{section.subtitle}</p>}
        {section.cta_label && section.cta_url && (
          <Link href={section.cta_url} className="inline-block bg-brand-cream text-brand-primary rounded-full px-8 py-3 font-brand font-medium hover:bg-brand-cream/90 transition-colors">
            {section.cta_label}
          </Link>
        )}
      </div>
    </section>
  )
}
